// backend/index.js
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { extractTextFromBuffer } = require('./scripts/extract_text'); // helper
const axios = require('axios');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20*1024*1024 }});
const app = express();
app.use(express.json());

const MANUS_API_URL = process.env.MANUS_API_URL; // e.g. https://api.manus.ai/v1/generate
const MANUS_API_KEY = process.env.MANUS_API_KEY;
const ZAPIER_WEBHOOK = process.env.ZAPIER_WEBHOOK; // Zapier "Catch Hook" URL
const MCP_SERVER_URL = process.env.MCP_SERVER_URL; // your MCP endpoint

// Small local heuristic for title generation (first pass)
function heuristicTitle(text) {
  if (!text || !text.trim()) return 'Untitled Document';
  // find first prominent heading-like line
  const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  // 1) try first line if short
  if (lines[0] && lines[0].length <= 80) return lines[0];
  // 2) find a short line with title-case
  for (let i=0;i<Math.min(10, lines.length); i++) {
    const l = lines[i];
    if (l.length<=80 && /[A-Z]/.test(l[0])) return l;
  }
  // 3) fallback: first 6 words
  return lines.slice(0,1)[0].split(/\s+/).slice(0,6).join(' ') + (lines[0].split(/\s+/).length>6 ? '...' : '');
}

async function callManusShort(text) {
  if (!MANUS_API_URL || !MANUS_API_KEY) throw new Error('Missing MANUS_API_URL or MANUS_API_KEY');
  // Minimal prompt and parameters to keep credit usage low
  const payload = {
    model: "manus-small", // replace with the most cost-efficient model available
    input: `Create a concise, SEO-friendly title (6-10 words) for the following document. Keep it short and descriptive.\n\nDocument:\n${text.slice(0,5000)}`,
    max_tokens: 150
  };
  const res = await axios.post(MANUS_API_URL, payload, {
    headers: { Authorization: `Bearer ${MANUS_API_KEY}`, 'Content-Type': 'application/json' },
    timeout: 15000
  });
  // Adapt to Manus response schema:
  return (res.data && (res.data.title || res.data.output || res.data.text)) ? (res.data.title || res.data.output || res.data.text) : JSON.stringify(res.data).slice(0,200);
}

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // 1) Extract text (local)
    const text = await extractTextFromBuffer(req.file.buffer, req.file.mimetype);

    // 2) Heuristic first-pass
    const heuristic = heuristicTitle(text || '');

    // 3) Decide whether to call Manus: only call if heuristic is low-confidence
    let finalTitle = heuristic;
    const lowConfidence = heuristic.length > 75 || /Untitled|Document/i.test(heuristic) || (text||'').length < 30;
    if (lowConfidence) {
      try {
        finalTitle = await callManusShort(text);
      } catch (err) {
        console.error('Manus call failed', err.message);
        // keep heuristic fallback
      }
    }

    // 4) Post result to Zapier and MCP server in background (fire and forget)
    const payload = {
      filename: req.file.originalname,
      title: finalTitle,
      heuristicTitle: heuristic,
      timestamp: new Date().toISOString()
    };
    // Zapier
    if (ZAPIER_WEBHOOK) axios.post(ZAPIER_WEBHOOK, payload).catch(err=>console.error('Zapier webhook failed',err.message));
    // MCP server
    if (MCP_SERVER_URL) axios.post(MCP_SERVER_URL, payload, { headers: { 'x-api-key': process.env.MCP_API_KEY || '' }}).catch(err=>console.error('MCP post failed',err.message));

    return res.json({ title: finalTitle, heuristicTitle: heuristic });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log(`Listening on ${PORT}`));
