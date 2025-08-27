// // const cors = require('cors')
// // const express = require("express");
// // const http = require("http");
// // const { Server } = require("socket.io");
// // const mongoose = require("mongoose");
// // const axios = require("axios");
// // const path = require("path");
// // require("dotenv").config();

// // const app = express();
// // const server = http.createServer(app);
// // app.use(cors({
// //   origin: "*",
// //   methods: ["GET", "POST"]
// // }))
// // const io = new Server(server, {
// //   cors: {
// //     origin: "*",
// //     methods: ["GET", "POST"]
// //   }
// // });

// // app.use(express.static("public"));
// // app.use(express.json());

// // // ✅ MongoDB Connection
// // mongoose
// //   .connect(process.env.MONGO_URI, {
// //     dbName: "memeGame"
// //   })
// //   .then(() => console.log("✅ MongoDB connected"))
// //   .catch((err) => console.error("❌ MongoDB Error:", err));

// // // ✅ In-memory storage
// // let rooms = {};

// // // Serve landing page
// // app.get("/", (req, res) => {
// //   res.sendFile(path.join(__dirname, "public", "dashboard.html"));
// // });

// // // Serve lobby page
// // app.get("/lobby", (req, res) => {
// //   res.sendFile(path.join(__dirname, "public", "lobby.html"));
// // });

// // // Serve room page
// // app.get("/room", (req, res) => {
// //   res.sendFile(path.join(__dirname, "public", "room.html"));
// // });

// // // Serve game page
// // app.get("/play", (req, res) => {
// //   res.sendFile(path.join(__dirname, "public", "index.html"));
// // });

// // // ---------------- API ----------------

// // // Random meme generator (Reddit API)
// // app.get("/api/generate-meme", async (req, res) => {
// //   try {
// //     // Try to get memes from Reddit first
// //     const redditResponse = await axios.get(
// //       "https://www.reddit.com/r/memes/top.json?limit=50"
// //     );
    
// //     const memes = redditResponse.data.data.children;
// //     const validMemes = memes.filter(
// //       post => post.data.post_hint === "image" && !post.data.over_18
// //     );
    
// //     if (validMemes.length > 0) {
// //       const randomMeme = validMemes[Math.floor(Math.random() * validMemes.length)];
// //       res.json({
// //         url: randomMeme.data.url,
// //         title: randomMeme.data.title,
// //         author: randomMeme.data.author
// //       });
// //     } else {
// //       // Fallback to meme-api if Reddit fails
// //       const response = await axios.get("https://meme-api.com/gimme");
// //       res.json(response.data);
// //     }
// //   } catch (err) {
// //     console.error("❌ Meme fetch error:", err.message);
// //     res.json({
// //       url: "https://i.imgflip.com/30b1gx.jpg", // fallback meme
// //       title: "Fallback Meme",
// //     });
// //   }
// // });

// // // ---------------- Socket.IO ----------------
// // io.on("connection", (socket) => {
// //   console.log("🔌 New connection:", socket.id);

// //   socket.on("joinRoom", ({ roomId, playerName }) => {
// //     socket.join(roomId);
// //     rooms[roomId] = rooms[roomId] || { 
// //       players: [], 
// //       host: null, 
// //       memes: {},
// //       votes: {},
// //       voting: false,
// //       votingTimer: null
// //     };

// //     rooms[roomId].players.push({ id: socket.id, name: playerName });

// //     // Assign host if none exists
// //     if (!rooms[roomId].host) {
// //       rooms[roomId].host = socket.id;
// //       io.to(socket.id).emit("hostAssigned");
// //     }

// //     io.to(roomId).emit("roomUpdate", rooms[roomId].players);
// //   });

// //   socket.on("startGame", async ({ roomId }) => {
// //     try {
// //       const response = await axios.get("http://localhost:3000/api/generate-meme");
// //       const meme = response.data;

// //       let timer = 60;
// //       io.to(roomId).emit("gameStarted", { meme, timer });

// //       const countdown = setInterval(() => {
// //         timer--;
// //         io.to(roomId).emit("timerUpdate", timer);
// //         if (timer <= 0) {
// //           clearInterval(countdown);
// //           // Start voting phase instead of just showing memes
// //           startsVotingPhase(roomId);
// //         }
// //       }, 1000);
// //     } catch (err) {
// //       console.error("❌ startGame error:", err.message);
// //     }
// //   });

// //   socket.on("memeGenerated", ({ roomId, meme }) => {
// //     if (rooms[roomId]) {
// //       rooms[roomId].memes[socket.id] = meme;
// //       io.to(roomId).emit("memeAdded", { playerId: socket.id, meme });
// //     }
// //   });

// //   socket.on("submitVote", ({ roomId, votedPlayerId }) => {
// //     if (rooms[roomId] && rooms[roomId].voting) {
// //       // Initialize votes object if not exists
// //       if (!rooms[roomId].votes[votedPlayerId]) {
// //         rooms[roomId].votes[votedPlayerId] = 0;
// //       }
      
// //       // Add vote
// //       rooms[roomId].votes[votedPlayerId]++;
      
// //       // Check if all players have voted
// //       const votersCount = Object.keys(rooms[roomId].votes).length;
// //       const playersCount = rooms[roomId].players.length;
      
// //       if (votersCount >= playersCount) {
// //         // All players have voted, end voting early
// //         clearTimeout(rooms[roomId].votingTimer);
// //         endVotingPhase(roomId);
// //       }
// //     }
// //   });

// //   socket.on("disconnect", () => {
// //     console.log("❌ Disconnected:", socket.id);
// //     // Remove player from all rooms
// //     for (const roomId in rooms) {
// //       rooms[roomId].players = rooms[roomId].players.filter(p => p.id !== socket.id);
      
// //       // Remove player's memes
// //       delete rooms[roomId].memes[socket.id];
      
// //       // If host left, assign new host
// //       if (rooms[roomId].host === socket.id && rooms[roomId].players.length > 0) {
// //         rooms[roomId].host = rooms[roomId].players[0].id;
// //         io.to(rooms[roomId].host).emit("hostAssigned");
// //       }
      
// //       io.to(roomId).emit("roomUpdate", rooms[roomId].players);
// //     }
// //   });

// //   // Function to start voting phase
// //   function startsVotingPhase(roomId) {
// //     if (!rooms[roomId]) return;
    
// //     rooms[roomId].voting = true;
// //     rooms[roomId].votes = {};
    
// //     io.to(roomId).emit("votingStarted", { 
// //       memes: rooms[roomId].memes,
// //       players: rooms[roomId].players,
// //       duration: 20 
// //     });
    
// //     // Set voting timer
// //     rooms[roomId].votingTimer = setTimeout(() => {
// //       endVotingPhase(roomId);
// //     }, 20000);
// //   }

// //   // Function to end voting phase and determine winner
// //   function endVotingPhase(roomId) {
// //     if (!rooms[roomId]) return;
    
// //     rooms[roomId].voting = false;
    
// //     // Find winner
// //     let winner = null;
// //     let maxVotes = 0;
    
// //     for (const [playerId, votes] of Object.entries(rooms[roomId].votes)) {
// //       if (votes > maxVotes) {
// //         maxVotes = votes;
// //         winner = playerId;
// //       }
// //     }
    
// //     // Get winner details
// //     const winnerPlayer = rooms[roomId].players.find(p => p.id === winner);
// //     const winnerMeme = rooms[roomId].memes[winner];
    
// //     io.to(roomId).emit("votingEnded", {
// //       votes: rooms[roomId].votes,
// //       winner: winnerPlayer,
// //       winnerMeme: winnerMeme
// //     });
// //   }
// // });

// // // ---------------- Start Server ----------------
// // const PORT = process.env.PORT || 3000;
// // server.listen(PORT, () => {
// //   console.log(`🚀 Server running on http://localhost:${PORT}`);
// // });

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

const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

// In-memory rooms
const rooms = {};

/** helper: fetch a meme (tries Reddit then fallback) */
async function fetchOneMeme() {
  try {
    const subreddits = ["memes", "dankmemes", "wholesomememes", "me_irl"];
    const sub = subreddits[Math.floor(Math.random() * subreddits.length)];
    const r = await axios.get(`https://www.reddit.com/r/${sub}/hot.json?limit=50`, { timeout: 6000 });
    const posts = (r.data?.data?.children || []).map(c => c.data);
    const valid = posts.filter(p =>
      p && !p.over_18 && (p.post_hint === "image" || p.url?.includes("i.redd.it") || p.url?.includes("imgur"))
    );
    if (valid.length) {
      const pick = valid[Math.floor(Math.random() * valid.length)];
      return { url: pick.url, title: pick.title || "Meme", author: pick.author || "reddit" };
    }
  } catch (e) {
    // ignore and fallback
  }

  // fallback meme-api
  try {
    const f = await axios.get("https://meme-api.com/gimme", { timeout: 5000 });
    if (f.data?.url) return { url: f.data.url, title: f.data.title || "Meme", author: f.data.author || "meme-api" };
  } catch (e) {
    // ignore
  }

  // final fallback list
  const fallback = [
    { url: "https://i.imgflip.com/30b1gx.jpg", title: "Fallback 1" },
    { url: "https://i.imgflip.com/1bij.jpg", title: "Fallback 2" },
    { url: "https://i.imgflip.com/1g8my4.jpg", title: "Fallback 3" }
  ];
  return fallback[Math.floor(Math.random() * fallback.length)];
}

// Serve static pages
app.get("/", (_, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/lobby", (_, res) => res.sendFile(path.join(__dirname, "public", "lobby.html")));
app.get("/room", (_, res) => res.sendFile(path.join(__dirname, "public", "room.html")));
app.get("/play", (_, res) => res.sendFile(path.join(__dirname, "public", "game.html")));

// Socket.IO
io.on("connection", (socket) => {
  console.log("🔌 New connection:", socket.id);

  socket.on("joinRoom", ({ roomId, playerName }) => {
    socket.join(roomId);
    rooms[roomId] = rooms[roomId] || {
      players: [],
      host: null,
      round: 1,
      maxRounds: 4,      // you asked total rounds = 4
      roundDuration: 60, // seconds to create caption
      voteDuration: 20,  // seconds to vote
      roundMemes: {},    // playerId -> {url,title,caption,timestamp}
      currentSharedMeme: null,
      voting: false,
      gameTimer: null,
      votingTimer: null
    };

    const room = rooms[roomId];
    if (!room.players.find(p => p.id === socket.id)) {
      room.players.push({ id: socket.id, name: playerName || "Player", score: 0 });
    }

    if (!room.host) {
      room.host = socket.id;
      io.to(socket.id).emit("hostAssigned");
    }

    io.to(roomId).emit("roomUpdate", room.players);
  });

  // Host starts the game
  socket.on("startGame", async ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;
    // reset scores & round
    room.round = 1;
    room.players.forEach(p => p.score = 0);
    io.to(roomId).emit("gameWillStart", { rounds: room.maxRounds });
    // start the first round
    startRound(roomId).catch(err => console.error("startRound error:", err));
  });

  // Player submits their captioned meme for the current round
  socket.on("memeGenerated", ({ roomId, meme }) => {
    const room = rooms[roomId];
    if (!room || !room.currentSharedMeme) return;
    // store player's submission (same shared meme url + player's caption)
    room.roundMemes[socket.id] = {
      url: room.currentSharedMeme.url,
      title: room.currentSharedMeme.title,
      caption: (meme.caption || "").slice(0, 300),
      timestamp: Date.now()
    };
    io.to(roomId).emit("memeAdded", { playerId: socket.id, meme: room.roundMemes[socket.id] });

    // if everyone submitted, end create phase early
    if (Object.keys(room.roundMemes).length >= room.players.length) {
      if (room.gameTimer) {
        clearInterval(room.gameTimer);
        room.gameTimer = null;
      }
      startVotingPhase(roomId);
    }
  });

  // Player votes for a meme (votedPlayerId is the playerId who submitted)
  socket.on("submitVote", ({ roomId, votedPlayerId }) => {
    const room = rooms[roomId];
    if (!room || !room.voting) return;

    room.voterRecords = room.voterRecords || {};
    room.votes = room.votes || {};

    // disallow multiple votes from same socket
    if (room.voterRecords[socket.id]) return;
    room.voterRecords[socket.id] = votedPlayerId;

    if (!room.votes[votedPlayerId]) room.votes[votedPlayerId] = 0;
    room.votes[votedPlayerId]++;

    // broadcast updated votes
    io.to(roomId).emit("voteUpdate", room.votes);

    // if all players voted, end voting early
    const votersCount = Object.keys(room.voterRecords).length;
    if (votersCount >= room.players.length) {
      if (room.votingTimer) {
        clearInterval(room.votingTimer);
        room.votingTimer = null;
      }
      endVotingPhase(roomId);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id);
    for (const roomId of Object.keys(rooms)) {
      const room = rooms[roomId];
      const prev = room.players.length;
      room.players = room.players.filter(p => p.id !== socket.id);
      delete room.roundMemes[socket.id];
      if (room.host === socket.id && room.players.length > 0) {
        room.host = room.players[0].id;
        io.to(room.host).emit("hostAssigned");
      }
      if (prev !== room.players.length) io.to(roomId).emit("roomUpdate", room.players);
    }
  });

  // ---------------- helpers ----------------

  async function startRound(roomId) {
    const room = rooms[roomId];
    if (!room) return;

    // reset per-round state
    room.roundMemes = {};
    room.votes = {};
    room.voterRecords = {};
    room.voting = false;
    room.currentSharedMeme = await fetchOneMeme();

    const roundNum = room.round;
    const createSeconds = room.roundDuration;

    // send shared meme and create timer
    io.to(roomId).emit("gameStarted", {
      round: roundNum,
      maxRounds: room.maxRounds,
      meme: room.currentSharedMeme,
      timer: createSeconds
    });

    // server countdown for create phase
    let t = createSeconds;
    io.to(roomId).emit("timerUpdate", t);
    room.gameTimer = setInterval(() => {
      t--;
      io.to(roomId).emit("timerUpdate", t);
      if (t <= 0) {
        clearInterval(room.gameTimer);
        room.gameTimer = null;
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

    // If some players didn't submit, auto-submit them with empty caption
    for (const p of room.players) {
      if (!room.roundMemes[p.id]) {
        room.roundMemes[p.id] = {
          url: room.currentSharedMeme.url,
          title: room.currentSharedMeme.title,
          caption: "No caption",
          timestamp: Date.now()
        };
      }
    }

    // send all submitted memes and players to clients
    io.to(roomId).emit("votingStarted", {
      memes: room.roundMemes,
      players: room.players,
      duration: room.voteDuration
    });

    // voting countdown (server side)
    let vt = room.voteDuration;
    io.to(roomId).emit("votingTimerUpdate", vt);
    room.votingTimer = setInterval(() => {
      vt--;
      io.to(roomId).emit("votingTimerUpdate", vt);
      if (vt <= 0) {
        clearInterval(room.votingTimer);
        room.votingTimer = null;
        endVotingPhase(roomId);
      }
    }, 1000);
  }

  function endVotingPhase(roomId) {
    const room = rooms[roomId];
    if (!room) return;
    room.voting = false;

    // determine winner: most votes; tie -> earliest submission among tied
    let winnerId = null;
    let maxVotes = -1;

    // If nobody voted, treat votes map as zeros and pick earliest submission overall
    if (!room.votes || Object.keys(room.votes).length === 0) {
      // pick earliest timestamp among roundMemes
      let earliest = Infinity;
      for (const [pid, m] of Object.entries(room.roundMemes)) {
        if (m.timestamp < earliest) {
          earliest = m.timestamp;
          winnerId = pid;
        }
      }
    } else {
      // normal tally
      for (const [pid, v] of Object.entries(room.votes)) {
        if (v > maxVotes) {
          maxVotes = v;
          winnerId = pid;
        } else if (v === maxVotes) {
          // tie: pick earliest between current winnerId and pid
          const winnerTime = room.roundMemes[winnerId]?.timestamp ?? Infinity;
          const pidTime = room.roundMemes[pid]?.timestamp ?? Infinity;
          if (pidTime < winnerTime) winnerId = pid;
        }
      }
    }

    // award points: 25 per round to winner
    if (winnerId) {
      const p = room.players.find(x => x.id === winnerId);
      if (p) p.score = (p.score || 0) + 25;
    }

    const winnerPlayer = room.players.find(p => p.id === winnerId) || null;
    const winnerMeme = winnerId ? room.roundMemes[winnerId] : null;

    // Prepare scores copy
    const scores = room.players.map(p => ({ id: p.id, name: p.name, score: p.score || 0 }));

    // increment round counter BEFORE deciding next action (so nextRound value is correct)
    room.round += 1;
    const isMoreRounds = room.round <= room.maxRounds;

    // If more rounds: emit votingEnded, clients will show overlay and next round starts after a short delay
    io.to(roomId).emit("votingEnded", {
      votes: room.votes,
      winner: winnerPlayer,
      winnerMeme: winnerMeme,
      scores,
      nextRound: isMoreRounds
    });

    if (isMoreRounds) {
      // small pause (5s) then start next round
      setTimeout(() => startRound(roomId).catch(err => console.error(err)), 5000);
    } else {
      // game ended: determine overall winner(s)
      let overallWinner = null;
      let bestScore = -1;
      for (const p of room.players) {
        if ((p.score || 0) > bestScore) {
          bestScore = p.score || 0;
          overallWinner = p;
        } else if ((p.score || 0) === bestScore && overallWinner) {
          // tie-breaker: earliest last submission among tied (use timestamps in roundMemes if present)
          const pLast = room.roundMemes[p.id]?.timestamp ?? Infinity;
          const wLast = room.roundMemes[overallWinner.id]?.timestamp ?? Infinity;
          if (pLast < wLast) overallWinner = p;
        }
      }

      io.to(roomId).emit("gameEnded", {
        scores,
        overallWinner
      });

      // cleanup room to allow restart if desired
      room.round = 1;
      room.roundMemes = {};
      room.votes = {};
      room.voterRecords = {};
      room.currentSharedMeme = null;
      room.voting = false;
      if (room.gameTimer) { clearInterval(room.gameTimer); room.gameTimer = null; }
      if (room.votingTimer) { clearInterval(room.votingTimer); room.votingTimer = null; }
    }
  }
});

// start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server listening on ${PORT}`));
