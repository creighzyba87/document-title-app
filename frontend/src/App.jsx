import React, { useState } from "react";
import axios from "axios";

export default function App() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const backendURL = "https://document-title-backend.onrender.com"; // ✅ Your Render backend

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setText("");
    setError("");
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setError("");
      setText("");

      const res = await axios.post(`${backendURL}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setText(res.data.text || "No text extracted.");
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.response?.data?.error || "Error processing file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-4 text-blue-600">📄 Document Text Extractor</h1>
      <p className="mb-4 text-center text-gray-700">
        Upload a <b>PDF</b>, <b>DOCX</b>, <b>TXT</b>, <b>CSV</b>, or <b>image</b> to extract its text.
      </p>

      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg text-center">
        <input
          type="file"
          accept=".pdf,.docx,.txt,.csv,.jpg,.jpeg,.png,.bmp,.tiff"
          onChange={handleFileChange}
          className="block w-full text-sm mb-4 border border-gray-300 rounded-md p-2"
        />

        <button
          onClick={handleUpload}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {loading ? "Processing..." : "Upload & Extract Text"}
        </button>

        {error && <p className="mt-4 text-red-600">{error}</p>}

        {text && (
          <div className="mt-6 text-left bg-gray-50 p-4 rounded-md max-h-96 overflow-y-auto">
            <h2 className="text-lg font-semibold mb-2 text-gray-800">Extracted Text:</h2>
            <pre className="whitespace-pre-wrap text-gray-700 text-sm">{text}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
