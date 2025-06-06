const express = require("express");
const multer = require("multer");
const axios = require("axios");
const cors = require("cors");
const fs = require("fs");
const FormData = require("form-data");
const path = require("path");

const app = express();

// Explicitly allow CORS from frontend origin
const allowedOrigins = ["https://velora-jewlery.vercel.app", "https://velora-jewlery.vercel.app/", "http://localhost:3000", "http://127.0.0.1:3000"];

// Apply CORS middleware early
app.use(cors({
  origin: function(origin, callback){
    // allow requests with no origin (like mobile apps or curl requests)
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));

// Explicitly handle OPTIONS preflight requests
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Logging middleware to log response headers for debugging
app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`Response headers for ${req.method} ${req.url}:`, res.getHeaders());
  });
  next();
});

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

  console.log(`Received file: originalname=${req.file.originalname}, mimetype=${req.file.mimetype}, size=${req.file.size}, path=${req.file.path}`);

  if (!fs.existsSync(req.file.path)) {
    console.error("Uploaded file does not exist at path:", req.file.path);
    return res.status(400).send("Uploaded file not found.");
  }

  const formData = new FormData();
  const fileBuffer = fs.readFileSync(req.file.path);
  formData.append("image", fileBuffer, {
    filename: req.file.originalname,
    contentType: req.file.mimetype,
  });

  try {
    // Send the uploaded image to the new external Python service for feature extraction
    const response = await axios.post(
      "https://velora-new-python.onrender.com/extract",
      formData,
      {
        headers: formData.getHeaders(),
      }
    );

    const queryFeatures = response.data.features;
    console.log("Query features length:", queryFeatures.length);

    if (!queryFeatures || queryFeatures.length === 0) {
      return res.status(500).send("No features returned from feature extraction.");
    }

    // Similarity threshold
    const threshold = 0.7;

    // Compare against catalog and filter by threshold
    const catalog = require("./catlog.json");

    const results = catalog
      .map(item => {
        // Ensure that item.features exists before calculating similarity
      if (!item.features) {
          console.warn(`Item ${item.id} does not have features.`);
          return null;
        }

        // Calculate similarity between the query and catalog item
        let similarity = cosineSimilarity(queryFeatures, item.features);
        similarity = similarity * 100; // convert to percentile
        console.log(`Similarity for item ${item.id} (${item.name}):`, similarity);

        return {
          ...item,
          similarity,
        };
      })
      .filter(item => item && item.similarity >= threshold * 100) // Filter valid items
      .sort((a, b) => b.similarity - a.similarity) // Sort results by similarity (highest first)
      .slice(0, 5); // Limit the number of results to the top 5 most similar

    // Return the results as JSON
    res.json({ results });
  } catch (err) {
    if (err.response && err.response.data) {
      console.error("Error response from Python backend:", err.response.data);
    } else {
      console.error("Error in /search:", err);
    }
    res.status(500).send("Error processing image");
  }
});

// Serve static files (Optional, if you want to serve the uploaded images)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Error handling middleware to catch route parsing errors and others
app.use((err, req, res, next) => {
  console.error("Express error handler caught an error:", err);
  if (err instanceof SyntaxError || err.message.includes("path-to-regexp")) {
    res.status(400).send("Invalid route or path parameter.");
  } else {
    res.status(500).send("Internal server error.");
  }
});

// Listen on all interfaces
app.listen(process.env.PORT || 5000, "0.0.0.0", () => {
  console.log("Node.js backend running on http://localhost:5000");
});
