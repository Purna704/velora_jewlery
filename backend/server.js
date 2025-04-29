const express = require("express");
const multer = require("multer");
const axios = require("axios");
const cors = require("cors");
const fs = require("fs");
const FormData = require("form-data");
const path = require("path");

const app = express();

// Explicitly allow CORS from frontend origin
const allowedOrigins = ["https://velora-jewlery.vercel.app"];
app.use(cors({
  origin: function(origin, callback){
    // allow requests with no origin (like mobile apps or curl requests)
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

app.use(express.json());

// Multer setup for file uploads
const upload = multer({ dest: "uploads/" });

// Cosine similarity helper
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) {
    console.error("Feature vectors are invalid or length mismatch");
    return 0;
  }
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  if (normA === 0 || normB === 0) {
    console.error("Zero norm detected in feature vectors");
    return 0;
  }
  return dot / (normA * normB);
}

// API endpoint to handle upload and search
app.post("/search", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  const imagePath = path.resolve(req.file.path);

  if (!fs.existsSync(imagePath)) {
    console.error("Uploaded file not found:", imagePath);
    return res.status(500).send("Uploaded file not found.");
  }

  const formData = new FormData();
  formData.append("image", fs.createReadStream(imagePath));

  try {
    const response = await axios.post(
      "https://velora-new-python.onrender.com/extract",
      formData,
      {
        headers: formData.getHeaders()
      }
    );

    const queryFeatures = response.data.features;
    if (!queryFeatures || queryFeatures.length === 0) {
      return res.status(500).send("No features returned from feature extraction.");
    }

    const catalog = require("./catlog.json");
    const threshold = 0.7;

    const results = catalog
      .map(item => {
        if (!item.features) return null;
        const similarity = cosineSimilarity(queryFeatures, item.features) * 100;
        return { ...item, similarity };
      })
      .filter(item => item && item.similarity >= threshold * 100)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);

    res.json({ results });

  } catch (err) {
    console.error("Error in /search:", err.message);
    res.status(500).send("Error processing image");
  } finally {
    // Clean up the uploaded image
    fs.unlink(imagePath, err => {
      if (err) console.warn("Failed to delete uploaded file:", err.message);
    });
  }
});

// Serve static files (Optional, if you want to serve the uploaded images)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Listen on all interfaces
app.listen(process.env.PORT || 5000, "0.0.0.0", () => {
  console.log("Node.js backend running on http://localhost:5000");
});
