# MemeWar
This is an project that how can  be do multi tasking like 2 way communication with client to server and also one client to other client that i just learned and used to make the game but also called as my own project Meme War game ....where ppl can play games still they will get how to win in difficult sitiuation ... The lobby is to interactive ....
Meme War is a real-time multiplayer meme battle game where players compete to create and vote for the funniest memes. It combines creativity, humor, and competition in timed rounds, with a live scoreboard to track winners.

🚀 Features

Meme Generation & Submission – Players can create or upload memes to battle against opponents.

Round-Based Gameplay – Each match has 3 rounds:

60s Meme Creation Phase

30s Voting Phase

Winner Announcement + Auto Next Round

Voting System – Players (and spectators) can upvote their favorite meme in each round.

Scoreboard – Tracks scores across rounds and declares the final winner at the end.

Real-Time Updates – Powered by Socket.IO, all events (submissions, votes, round timers) update instantly across connected players.

Fair Play System – Players only see opponent memes after both have submitted.

Automatic Game Flow – No manual refresh needed; game moves between phases automatically.

🛠️ Tech Stack

Frontend: HTML, CSS, Vanilla JS

Backend: Node.js, Express, Socket.IO

Database: MongoDB (for scores & meme data)

🎯 Gameplay Flow

Both players join the room.

Each round starts with 60s meme creation.

After submission, both memes are revealed for a 30s voting phase.

Votes are counted and winner is announced.

After 3 rounds, final scores decide the Meme War champion...
