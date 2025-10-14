import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import textract from "textract";
import dotenv from "dotenv";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

dotenv.config();

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());

// Helper function to extract text from uploaded files
async function extractText(filePath, mimeType) {
  if (mimeType === "application/pdf") {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } else {
    return new Promise((resolve, reject) => {
      textract.fromFileWithPath(filePath, (error, text) => {
        if (error) reject(error);
        else resolve(text);
      });
    });
  }
}

// Simple title generator
function generateTitle(text) {
  if (!text) return "Untitled Document";
  const firstLine = text.split("\n")[0].trim();
  if (firstLine.length > 10 && firstLine.length < 100) return firstLine;
  return text.split(" ").slice(0, 6).join(" ") + "...";
}

// Upload route
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const mimeType = req.file.mimetype;

    const text = await extractText(filePath, mimeType);
    const title = generateTitle(text);

    // Delete uploaded file after reading
    fs.unlinkSync(filePath);

    res.json({ title });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process file" });
  }
});

// ✅ Root route to display friendly message
app.get("/", (req, res) => {
  res.send("✅ Document Title Generator Backend is Running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
