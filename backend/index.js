import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import dotenv from "dotenv";
import mammoth from "mammoth";
import Tesseract from "tesseract.js";
import pdfImport from "pdf-parse";

dotenv.config();

const pdf = pdfImport.default || pdfImport;
const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

// Extract text depending on file type
async function extractText(filePath) {
  const ext = filePath.split(".").pop().toLowerCase();

  try {
    if (ext === "pdf") {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdf(dataBuffer);
      return pdfData.text;

    } else if (ext === "docx") {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;

    } else if (ext === "txt" || ext === "csv") {
      return fs.readFileSync(filePath, "utf8");

    } else if (["jpg", "jpeg", "png", "bmp", "tiff"].includes(ext)) {
      const result = await Tesseract.recognize(filePath, "eng");
      return result.data.text;

    } else {
      throw new Error(`Unsupported file type: ${ext}`);
    }
  } catch (err) {
    console.error(`Error processing file (${ext}):`, err);
    throw err;
  }
}

// Upload endpoint
app.post("/upload", upload.single("file"), async (req, res) => {
  const filePath = req.file?.path;

  if (!filePath) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const text = await extractText(filePath);
    fs.unlinkSync(filePath); // cleanup
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: err.message || "File processing failed" });
  }
});

// Root route
app.get("/", (req, res) => {
  res.send("✅ Document Extraction Backend Running!");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
