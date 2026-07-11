const express = require("express");
const multer = require("multer");
const axios = require("axios");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");

const dns = require("dns");

dns.setServers(["1.1.1.1", "8.8.8.8"]);

require("dotenv").config();



const authRoutes = require("./routes/auth");
const requireAuth = require("./middleware/auth");
const Analysis = require("./models/Analysis");

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Auth routes (register/login)
app.use("/auth", authRoutes);

const upload = multer({ dest: "uploads/" });

// 🔒 Protected upload route
app.post("/upload", requireAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = path.resolve(req.file.path);

    const response = await axios.post("http://localhost:5000/analyze", {
      file_path: filePath
    });

    // ✅ Save to history
    const analysis = await Analysis.create({
      user: req.userId,
      filename: req.file.originalname,
      result: response.data
    });

    res.json(response.data);

  } catch (error) {
    console.error("ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// 🔒 Get history
app.get("/history", requireAuth, async (req, res) => {
  try {
    const history = await Analysis.find({ user: req.userId })
      .select("filename createdAt")
      .sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔒 Get one past analysis
app.get("/history/:id", requireAuth, async (req, res) => {
  try {
    const analysis = await Analysis.findOne({ _id: req.params.id, user: req.userId });
    if (!analysis) return res.status(404).json({ error: "Not found" });
    res.json(analysis.result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));