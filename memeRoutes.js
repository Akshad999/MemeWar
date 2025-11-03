// const express = require("express");
// const fs = require("fs");
// const path = require("path");

// const router = express.Router();

// // Paths to meme and used meme files
// const memesFilePath = path.join(__dirname, "../memes.json");
// const usedMemesFilePath = path.join(__dirname, "../usedMemes.json");

// // Helper: Load memes from file
// function loadMemes() {
//     if (!fs.existsSync(memesFilePath)) return [];
//     return JSON.parse(fs.readFileSync(memesFilePath, "utf8"));
// }

// // Helper: Load used memes
// function loadUsedMemes() {
//     if (!fs.existsSync(usedMemesFilePath)) return [];
//     return JSON.parse(fs.readFileSync(usedMemesFilePath, "utf8"));
// }

// // Helper: Save used memes
// function saveUsedMemes(data) {
//     fs.writeFileSync(usedMemesFilePath, JSON.stringify(data, null, 2));
// }

// // Route: GET /api/generate-meme
// router.get("/generate-meme", (req, res) => {
//     const memes = loadMemes();
//     let usedMemes = loadUsedMemes();

//     // Reset if all memes are used
//     if (usedMemes.length >= memes.length) {
//         usedMemes = [];
//     }

//     // Filter unused memes
//     const availableMemes = memes.filter(meme => !usedMemes.includes(meme.id));

//     if (availableMemes.length === 0) {
//         return res.json({ error: "No memes available right now" });
//     }

//     // Pick a random meme
//     const randomMeme = availableMemes[Math.floor(Math.random() * availableMemes.length)];

//     // Mark as used
//     usedMemes.push(randomMeme.id);
//     saveUsedMemes(usedMemes);

//     res.json({
//         id: randomMeme.id,
//         title: randomMeme.title,
//         image: randomMeme.image
//     });
// });


// router.get("/meme", async (req, res) => {
//     try {
//         const response = await fetch("https://meme-api.com/gimme");
//         const data = await response.json();
//         res.json({ url: data.url });
//     } catch (err) {
//         res.status(500).json({ error: "Failed to fetch meme" });
//     }
// });
// module.exports = router;



// routes/memeRoutes.js
const express = require("express");
const fs = require("fs");
const path = require("path");

// Ensure fetch available
const hasGlobalFetch = typeof fetch !== "undefined";
const fetchPolyfill = hasGlobalFetch ? null : (...args) => import("node-fetch").then(m => m.default(...args));
const doFetch = async (...args) => (hasGlobalFetch ? fetch(...args) : fetchPolyfill(...args));

const router = express.Router();

// ✅ Correct paths to your data
const memesFilePath = path.join(__dirname, "../data/memes.json");
const usedMemesFilePath = path.join(__dirname, "../data/usedMemes.json");

// Helpers
function loadJSONSafe(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}
function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

// Unique meme from local JSON (no repeat until all used)
router.get("/generate-meme", (req, res) => {
  const memes = loadJSONSafe(memesFilePath, []);
  let used = loadJSONSafe(usedMemesFilePath, []);

  if (!Array.isArray(used)) used = [];

  if (!Array.isArray(memes) || memes.length === 0) {
    return res.status(500).json({ error: "No memes seed file found" });
  }

  // reset when all used
  if (used.length >= memes.length) used = [];

  const available = memes.filter(m => !used.includes(m.id));
  if (available.length === 0) {
    // Shouldn’t happen due to reset above, but keep safe
    used = [];
    saveJSON(usedMemesFilePath, used);
    return res.json({ error: "No memes available right now" });
  }

  const pick = available[Math.floor(Math.random() * available.length)];
  used.push(pick.id);
  saveJSON(usedMemesFilePath, used);

  // Return a consistent shape: { title, url }
  return res.json({ title: pick.title, url: pick.image });
});

// Online meme (API) – used by dashboard too
router.get("/meme", async (req, res) => {
  try {
    const r = await doFetch("https://meme-api.com/gimme");
    if (!r.ok) throw new Error(`API ${r.status}`);
    const data = await r.json();
    return res.json({ title: data.title, url: data.url });
  } catch (err) {
    console.error("Meme API error, using fallback:", err.message);
    // fallback to one local item
    const memes = loadJSONSafe(memesFilePath, []);
    if (memes.length) {
      const pick = memes[Math.floor(Math.random() * memes.length)];
      return res.json({ title: pick.title, url: pick.image });
    }
    return res.status(500).json({ error: "Failed to fetch meme" });
  }
});

module.exports = router;
