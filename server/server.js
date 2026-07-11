const express = require("express");
const multer = require("multer");
const axios = require("axios");
const path = require("path");
const cors = require("cors");

const app = express();      // ✅ create app FIRST
app.use(cors());            // ✅ THEN use it

// store files in uploads folder
const upload = multer({ dest: "uploads/" });

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    // ✅ check file exists
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // ✅ get real file path
    const filePath = path.resolve(req.file.path);
    console.log("File saved at:", filePath);

    // ✅ send to Python
    const response = await axios.post("http://localhost:5000/analyze", {
      file_path: filePath
    });

    res.json(response.data);

  } catch (error) {
    console.error("ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));