// const socket = io();

// document.getElementById("joinBtn").addEventListener("click", () => {
//     const username = document.getElementById("username").value.trim();
//     const roomId = document.getElementById("roomId").value.trim();

//     if (!username || !roomId) {
//         alert("Please fill in both fields");
//         return;
//     }

//     socket.emit("joinRoom", { roomId, username });

//     // Store in localStorage so dashboard/game page knows
//     localStorage.setItem("roomId", roomId);
//     localStorage.setItem("username", username);
// });

// // Update player list
// socket.on("roomUpdate", (players) => {
//     const playerList = document.getElementById("playerList");
//     playerList.innerHTML = "";
//     players.forEach(p => {
//         const li = document.createElement("li");
//         li.textContent = p.username;
//         playerList.appendChild(li);
//     });

//     // Show start button only if you are host
//     if (players[0].id === socket.id) {
//         document.getElementById("startGameBtn").style.display = "block";
//     }
// });

// // Host starts game
// document.getElementById("startGameBtn").addEventListener("click", () => {
//     const roomId = localStorage.getItem("roomId");
//     socket.emit("startGame", { roomId });
// });

// // Game started
// socket.on("gameStarted", ({ timer }) => {
//     alert(`Game started! You have ${timer} seconds to generate your meme.`);
//     window.location.href = "/dashboard"; // go to dashboard to make meme
// });
// const socket = io();
// const memeTitle = document.getElementById("memeTitle");
// const memeImage = document.getElementById("memeImage");
// const generateBtn = document.getElementById("generateBtn");
// const timerEl = document.getElementById("timer");

// // when the game starts
// socket.on("gameStarted", ({ meme, timer }) => {
//   showMeme(meme);
//   timerEl.textContent = `Time left: ${timer}s`;
// });

// // timer update
// socket.on("timerUpdate", (time) => {
//   timerEl.textContent = `Time left: ${time}s`;
// });

// // ✅ Show meme
// function showMeme(meme) {
//   memeTitle.textContent = meme.title;
//   memeImage.src = meme.url;
// }

// // ✅ Generate meme button
// generateBtn.addEventListener("click", async () => {
//   try {
//     const res = await fetch("/api/generate-meme");
//     const meme = await res.json();
//     showMeme(meme);
//   } catch (err) {
//     alert("Failed to load meme 😢");
//   }
// });
// Connect to socket.io
const socket = io();

// Get DOM elements
const memeTitle = document.getElementById("memeTitle");
const memeImage = document.getElementById("memeImage");
const generateBtn = document.getElementById("generateBtn");
const timerEl = document.getElementById("timer");

// 🎵 Load sound effects
const startSound = new Audio("/sounds/start.mp3"); // Round start
const voteSound = new Audio("/sounds/vote.mp3");   // Voting phase start
const winSound = new Audio("/sounds/win.mp3");     // Winner announcement

// ---------------------------
// 🔥 Game Event Handlers
// ---------------------------

// When the game starts → server sends same meme to all players
socket.on("gameStarted", ({ meme, timer }) => {
  startSound.play(); // 🔊 Play start sound
  showMeme(meme);
  timerEl.textContent = `Time left: ${timer}s`;
});

// Timer countdown from server
socket.on("timerUpdate", (time) => {
  timerEl.textContent = `Time left: ${time}s`;
});

// When voting begins
socket.on("votingStarted", ({ memes, players }) => {
  voteSound.play(); // 🔊 Play voting start sound
  // You can show voting UI here later
  console.log("🗳️ Voting has started!", memes);
});

// When voting ends
socket.on("votingEnded", ({ winner, winnerMeme }) => {
  winSound.play(); // 🔊 Play win sound
  alert(`🏆 Winner: ${winner?.name || "No one"}!`);
  console.log("Winner meme:", winnerMeme);
});

// ---------------------------
// 💬 Meme Display & Caption
// ---------------------------

// Display meme (shared for all players)
function showMeme(meme) {
  memeTitle.textContent = meme.title;
  memeImage.src = meme.url;
}

// When player clicks "Generate Caption" or similar
generateBtn.addEventListener("click", () => {
  const roomId = localStorage.getItem("roomId");
  const caption = prompt("💡 Enter your funny caption:");
  if (!caption) return alert("Caption cannot be empty!");

  // Send caption to server
  socket.emit("memeGenerated", {
    roomId,
    meme: { caption },
  });

  alert("✅ Caption submitted!");
});
