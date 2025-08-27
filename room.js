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
const socket = io();
const memeTitle = document.getElementById("memeTitle");
const memeImage = document.getElementById("memeImage");
const generateBtn = document.getElementById("generateBtn");
const timerEl = document.getElementById("timer");

// when the game starts
socket.on("gameStarted", ({ meme, timer }) => {
  showMeme(meme);
  timerEl.textContent = `Time left: ${timer}s`;
});

// timer update
socket.on("timerUpdate", (time) => {
  timerEl.textContent = `Time left: ${time}s`;
});

// ✅ Show meme
function showMeme(meme) {
  memeTitle.textContent = meme.title;
  memeImage.src = meme.url;
}

// ✅ Generate meme button
generateBtn.addEventListener("click", async () => {
  try {
    const res = await fetch("/api/generate-meme");
    const meme = await res.json();
    showMeme(meme);
  } catch (err) {
    alert("Failed to load meme 😢");
  }
});
