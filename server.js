// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const axios = require("axios");
const path = require("path");
require("dotenv").config();
const cors = require("cors");

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: "*", methods: ["GET", "POST"] }));
app.use(express.static("public"));
app.use(express.json());

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// In-memory rooms
const rooms = {};

/** helper: fetch a meme (tries Reddit then fallback) */
async function fetchOneMeme() {
  try {
    const subreddits = ["memes", "dankmemes", "wholesomememes", "me_irl"];
    const sub = subreddits[Math.floor(Math.random() * subreddits.length)];

    const res = await axios.get(`https://www.reddit.com/r/${sub}/hot.json?limit=50`, {
      timeout: 6000,
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const posts = (res.data?.data?.children || []).map((c) => c.data);
    const valid = posts.filter(
      (p) =>
        p &&
        !p.over_18 &&
        (p.post_hint === "image" ||
          p.url?.includes("i.redd.it") ||
          p.url?.includes("imgur"))
    );

    if (valid.length) {
      const pick = valid[Math.floor(Math.random() * valid.length)];
      return {
        url: pick.url,
        title: pick.title || "Meme",
        author: pick.author || "reddit",
      };
    }
  } catch (err) {
    console.warn("⚠️ Reddit fetch failed:", err.message);
  }

  // fallback meme-api
  try {
    const f = await axios.get("https://meme-api.com/gimme", { timeout: 5000 });
    if (f.data?.url)
      return {
        url: f.data.url,
        title: f.data.title || "Meme",
        author: f.data.author || "meme-api",
      };
  } catch (err) {
    console.warn("⚠️ Meme-api fetch failed:", err.message);
  }

  // final fallback list
  const fallback = [
    { url: "https://i.imgflip.com/30b1gx.jpg", title: "Fallback Meme 1" },
    { url: "https://i.imgflip.com/1bij.jpg", title: "Fallback Meme 2" },
    { url: "https://i.imgflip.com/1g8my4.jpg", title: "Fallback Meme 3" },
  ];
  return fallback[Math.floor(Math.random() * fallback.length)];
}

// Serve static pages
app.get("/", (_, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/lobby", (_, res) => res.sendFile(path.join(__dirname, "public", "lobby.html")));
app.get("/room", (_, res) => res.sendFile(path.join(__dirname, "public", "room.html")));
app.get("/play", (_, res) => res.sendFile(path.join(__dirname, "public", "game.html")));

// --- Optional debug route to test meme fetch ---
app.get("/api/generate-meme", async (_, res) => {
  const meme = await fetchOneMeme();
  res.json(meme);
});

// =====================
// Socket.IO Game Logic
// =====================
io.on("connection", (socket) => {
  console.log("🔌 New connection:", socket.id);

  socket.on("joinRoom", ({ roomId, playerName }) => {
    socket.join(roomId);
    rooms[roomId] = rooms[roomId] || {
      players: [],
      host: null,
      round: 1,
      maxRounds: 4,
      roundDuration: 60,
      voteDuration: 20,
      roundMemes: {},
      currentSharedMeme: null,
      voting: false,
      gameTimer: null,
      votingTimer: null,
    };

    const room = rooms[roomId];

    if (!room.players.find((p) => p.id === socket.id)) {
      room.players.push({ id: socket.id, name: playerName || "Player", score: 0 });
    }

    if (!room.host) {
      room.host = socket.id;
      io.to(socket.id).emit("hostAssigned");
    }

    io.to(roomId).emit("roomUpdate", room.players);
  });

  socket.on("startGame", async ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;

    room.round = 1;
    room.players.forEach((p) => (p.score = 0));
    io.to(roomId).emit("gameWillStart", { rounds: room.maxRounds });

    startRound(roomId);
  });

  socket.on("memeGenerated", ({ roomId, meme }) => {
    const room = rooms[roomId];
    if (!room || !room.currentSharedMeme) return;

    // Each player adds their own caption to the same meme
    room.roundMemes[socket.id] = {
      url: room.currentSharedMeme.url,
      title: room.currentSharedMeme.title,
      caption: (meme.caption || "").slice(0, 300),
      timestamp: Date.now(),
    };

    io.to(roomId).emit("memeAdded", {
      playerId: socket.id,
      meme: room.roundMemes[socket.id],
    });

    // If everyone submitted early, start voting
    if (Object.keys(room.roundMemes).length >= room.players.length) {
      clearInterval(room.gameTimer);
      startVotingPhase(roomId);
    }
  });

  socket.on("submitVote", ({ roomId, votedPlayerId }) => {
    const room = rooms[roomId];
    if (!room || !room.voting) return;

    room.voterRecords = room.voterRecords || {};
    room.votes = room.votes || {};

    if (room.voterRecords[socket.id]) return; // prevent multiple votes

    room.voterRecords[socket.id] = votedPlayerId;
    room.votes[votedPlayerId] = (room.votes[votedPlayerId] || 0) + 1;

    io.to(roomId).emit("voteUpdate", room.votes);

    if (Object.keys(room.voterRecords).length >= room.players.length) {
      clearInterval(room.votingTimer);
      endVotingPhase(roomId);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id);
    for (const roomId of Object.keys(rooms)) {
      const room = rooms[roomId];
      const prev = room.players.length;
      room.players = room.players.filter((p) => p.id !== socket.id);
      delete room.roundMemes[socket.id];

      if (room.host === socket.id && room.players.length > 0) {
        room.host = room.players[0].id;
        io.to(room.host).emit("hostAssigned");
      }

      if (prev !== room.players.length) io.to(roomId).emit("roomUpdate", room.players);
    }
  });

  // ---------- Helper Functions ----------

  async function startRound(roomId) {
    const room = rooms[roomId];
    if (!room) return;

    room.roundMemes = {};
    room.votes = {};
    room.voterRecords = {};
    room.voting = false;
    room.currentSharedMeme = await fetchOneMeme();

    console.log(`🖼️ Shared Meme for ${roomId}: ${room.currentSharedMeme.url}`);

    let t = room.roundDuration;
    io.to(roomId).emit("gameStarted", {
      round: room.round,
      maxRounds: room.maxRounds,
      meme: room.currentSharedMeme,
      timer: t,
    });

    room.gameTimer = setInterval(() => {
      t--;
      io.to(roomId).emit("timerUpdate", t);
      if (t <= 0) {
        clearInterval(room.gameTimer);
        startVotingPhase(roomId);
      }
    }, 1000);
  }

  function startVotingPhase(roomId) {
    const room = rooms[roomId];
    if (!room) return;

    room.voting = true;
    room.votes = {};
    room.voterRecords = {};

    // Auto-fill missing captions
    for (const p of room.players) {
      if (!room.roundMemes[p.id]) {
        room.roundMemes[p.id] = {
          url: room.currentSharedMeme.url,
          title: room.currentSharedMeme.title,
          caption: "No caption 😅",
          timestamp: Date.now(),
        };
      }
    }

    io.to(roomId).emit("votingStarted", {
      memes: room.roundMemes,
      players: room.players,
      duration: room.voteDuration,
    });

    let vt = room.voteDuration;
    room.votingTimer = setInterval(() => {
      vt--;
      io.to(roomId).emit("votingTimerUpdate", vt);
      if (vt <= 0) {
        clearInterval(room.votingTimer);
        endVotingPhase(roomId);
      }
    }, 1000);
  }

  function endVotingPhase(roomId) {
    const room = rooms[roomId];
    if (!room) return;

    room.voting = false;
    let winnerId = null;
    let maxVotes = -1;

    // Determine winner (most votes or earliest)
    if (!room.votes || Object.keys(room.votes).length === 0) {
      let earliest = Infinity;
      for (const [pid, m] of Object.entries(room.roundMemes)) {
        if (m.timestamp < earliest) {
          earliest = m.timestamp;
          winnerId = pid;
        }
      }
    } else {
      for (const [pid, v] of Object.entries(room.votes)) {
        if (v > maxVotes) {
          maxVotes = v;
          winnerId = pid;
        }
      }
    }

    if (winnerId) {
      const p = room.players.find((x) => x.id === winnerId);
      if (p) p.score = (p.score || 0) + 25;
    }

    const winnerPlayer = room.players.find((p) => p.id === winnerId) || null;
    const winnerMeme = winnerId ? room.roundMemes[winnerId] : null;

    const scores = room.players.map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score || 0,
    }));

    room.round += 1;
    const isMoreRounds = room.round <= room.maxRounds;

    io.to(roomId).emit("votingEnded", {
      votes: room.votes,
      winner: winnerPlayer,
      winnerMeme,
      scores,
      nextRound: isMoreRounds,
    });

    if (isMoreRounds) {
      setTimeout(() => startRound(roomId), 5000);
    } else {
      // Final winner
      const topScore = Math.max(...room.players.map((p) => p.score));
      const overallWinner = room.players.find((p) => p.score === topScore);

      io.to(roomId).emit("gameEnded", {
        scores,
        overallWinner,
      });

      // Reset room
      room.round = 1;
      room.roundMemes = {};
      room.votes = {};
      room.voterRecords = {};
      room.currentSharedMeme = null;
      room.voting = false;
    }
  }
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`🚀 Meme War server running at http://localhost:${PORT}`)
);
