// backend/scripts/extract_text.js
const pdf = require('pdf-parse');
const docx = require('docx'); // optional - but we will use simple libraries below
const textract = require('textract'); // alternative if available
const util = require('util');
const textractFromBuffer = util.promisify(textract.fromBufferWithMime);

async function extractTextFromBuffer(buffer, mimetype) {
  mimetype = mimetype || '';
  try {
    if (mimetype.includes('pdf') || mimetype === 'application/pdf') {
      const data = await pdf(buffer);
      return data.text || '';
    }
    // try textract for other formats
    const text = await textractFromBuffer(buffer, mimetype);
    if (text) return text;
  } catch (err) {
    console.warn('extractTextFromBuffer fallback', err.message);
  }
  // fallback to binary->utf8
  try {
    return buffer.toString('utf8').slice(0, 20000);
  } catch (e) {
    return '';
  }
}

module.exports = { extractTextFromBuffer };
