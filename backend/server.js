// Added child_process for running Python script
const { spawn } = require('child_process');

const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

// ✅ Secure CORS settings
const allowedOrigins = ['https://velora-jewlery-gdx4.vercel.app'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

app.use(express.json());

// 📸 Multer setup for file uploads
const upload = multer({ dest: "uploads/" });

// 📈 Cosine similarity helper
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

// 📤 API endpoint to handle upload and search
app.post("/search", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  const imagePath = req.file.path;

  try {
    // 🐍 Spawn Python process to extract features
    const pythonScriptPath = path.join(__dirname, 'python', 'ext_feat.py');
    const pythonProcess = spawn('python', [pythonScriptPath, imagePath]);

    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorString += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Python process exited with code ${code}: ${errorString}`);
        return res.status(500).send("Error processing image in feature extraction: " + errorString);
      }

      let result;
      try {
        result = JSON.parse(dataString);
      } catch (err) {
        console.error("Error parsing JSON from Python script:", err);
        return res.status(500).send("Error parsing feature extraction result: " + err.message);
      }

      if (result.error) {
        console.error("Error from Python script:", result.error);
        return res.status(500).send("Error in feature extraction: " + result.error);
      }

      const queryFeatures = result.features;
      console.log("Query features length:", queryFeatures.length);

      if (!queryFeatures || queryFeatures.length === 0) {
        return res.status(500).send("No features returned from feature extraction.");
      }

      // 🎯 Similarity threshold
      const threshold = 0.7;

      // 📚 Compare against catalog and filter by threshold
      const catalog = require("./catlog.json");

      const results = catalog
        .map(item => {
          if (!item.features) {
            console.warn(`Item ${item.id} does not have features.`);
            return null;
          }

          let similarity = cosineSimilarity(queryFeatures, item.features);
          similarity = similarity * 100; // convert to percentile
          console.log(`Similarity for item ${item.id} (${item.name}):`, similarity);

          return {
            ...item,
            similarity,
          };
        })
        .filter(item => item && item.similarity >= threshold * 100) // Filter valid items
        .sort((a, b) => b.similarity - a.similarity) // Sort highest similarity first
        .slice(0, 5); // Top 5

      // 🧹 Cleanup uploaded file
      fs.unlink(imagePath, (err) => {
        if (err) console.error("Error deleting uploaded file:", err);
      });

      // ✅ Return the results
      res.json({ results });
    });
  } catch (err) {
    console.error("Error in /search:", err);
    res.status(500).send("Error processing image");
  }
});

// 🌍 Serve static files (Optional)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 🚀 Start the server
app.listen(process.env.PORT || 5000, "0.0.0.0", () => {
  console.log("Node.js backend running on http://localhost:5000");
});
