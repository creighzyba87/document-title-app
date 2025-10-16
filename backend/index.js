// backend/index.js
// Document Extraction API (PDF, DOCX, TXT/CSV, Images via OCR)
//
// Replaces textract with safer libs: pdf-parse, mammoth, fs, tesseract.js
// Ensure you have installed: npm i pdf-parse mammoth tesseract.js multer cors dotenv

import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import mammoth from "mammoth";
import Tesseract from "tesseract.js";
import pdfImport from "pdf-parse";

dotenv.config();

// pdf-parse compatibility for ESM/CJS environments
const pdf = pdfImport.default || pdfImport;

const app = express();
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const upload = multer({ dest: UPLOAD_DIR });

// Helper: detect extension from filename or path
function getExt(filePath) {
  return String(path.extname(filePath || "")).replace(".", "").toLowerCase();
}

// Extract text by file type
async function extractText(filePath) {
  const ext = getExt(filePath);

  try {
    if (ext === "pdf") {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdf(dataBuffer);
      return pdfData?.text || "";

    } else if (ext === "docx") {
      const result = await mammoth.extractRawText({ path: filePath });
      return result?.value || "";

    } else if (ext === "txt" || ext === "csv") {
      return fs.readFileSync(filePath, "utf8");

    } else if (["jpg", "jpeg", "png", "bmp", "tiff"].includes(ext)) {
      // Use Tesseract to OCR the image file
      // Using the simple recognize() API — may be slower but works for most images.
      const result = await Tesseract.recognize(filePath, "eng");
      return result?.data?.text || "";

    } else {
      throw new Error(`Unsupported file type: ${ext}`);
    }
  } catch (err) {
    // Re-throw with context so caller can log properly
    err.message = `extractText error for "${filePath}" (${ext}): ${err.message}`;
    throw err;
  }
}

// POST /upload  - accepts multipart form with field "file"
app.post("/upload", upload.single("file"), async (req, res) => {
  console.log("📁 /upload called");

  if (!req.file) {
    console.warn("⚠️ No file found in request");
    return res.status(400).json({ error: "No file uploaded" });
  }

  const filePath = req.file.path;
  const originalName = req.file.originalname;
  console.log(`📥 Received file: ${originalName} -> ${filePath}`);

  try {
    const text = await extractText(filePath);

    // Basic post-processing: trim and collapse repeated whitespace
    const cleaned = (text || "").trim().replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n");

    console.log(`✅ Extraction success: ${Math.min(120, cleaned.length)} chars preview: "${cleaned.slice(0,120).replace(/\n/g, " ")}"`);

    // Remove uploaded file to avoid disk buildup
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.warn("⚠️ Failed to delete temp file:", filePath, e.message);
    }

    return res.json({ text: cleaned });
  } catch (err) {
    console.error("🔥 Processing failed:", err);
    // Attempt to remove file even on error
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (e) {
      console.warn("⚠️ Failed to delete temp file after error:", e.message);
    }
    return res.status(500).json({ error: err.message || "Failed to process file" });
  }
});

// Root route for quick health check
app.get("/", (req, res) => {
  res.send("✅ Document Extraction Backend Running!");
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});

