const socket = io();

// Read query params
const params = new URLSearchParams(window.location.search);
const roomId = params.get("roomId");
const username = params.get("username");

// Show room info
document.getElementById("roomInfo").textContent = `You are ${username} in room ${roomId}`;

// Join room on socket side
socket.emit("joinRoom", { roomId, username });

// Local meme state
let currentMeme = null;

// Generate (online API first, else local unique)
document.getElementById("generateBtn").addEventListener("click", async () => {
  try {
    // Try the online endpoint
    let res = await fetch("/api/meme");
    if (!res.ok) throw new Error("api/meme failed");
    let meme = await res.json();

    // fallback: local unique if url missing
    if (!meme || !meme.url) {
      res = await fetch("/api/generate-meme");
      meme = await res.json();
      if (!meme || !meme.url) throw new Error("No memes available");
    }

    currentMeme = meme;
    renderMyMeme();
  } catch (err) {
    alert("No memes available (or API error).");
    console.error(err);
  }
});

document.getElementById("shareBtn").addEventListener("click", () => {
  if (!currentMeme) {
    alert("Generate a meme first!");
    return;
  }
  const caption = document.getElementById("captionInput").value.trim();
  const payload = { url: currentMeme.url, title: currentMeme.title || "Meme", caption };
  socket.emit("memeGenerated", { roomId, meme: payload });
});

// Update players (optional UI hook)
socket.on("roomUpdate", (players) => {
  console.log("Players:", players);
});

// Receive room memes
socket.on("showMemes", (memesObj) => {
  const grid = document.getElementById("roomMemes");
  grid.innerHTML = "";
  Object.values(memesObj).forEach(m => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h4>${m.title || "Meme"}</h4>
      <img src="${m.url}" alt="meme"/>
      ${m.caption ? `<p>${m.caption}</p>` : ""}
    `;
    grid.appendChild(card);
  });
});

function renderMyMeme() {
  document.getElementById("myMeme").style.display = "block";
  document.getElementById("myMemeTitle").textContent = currentMeme.title || "Meme";
  document.getElementById("myMemeImg").src = currentMeme.url;
  const cap = document.getElementById("captionInput").value.trim();
  document.getElementById("myMemeCaption").textContent = cap;
}
