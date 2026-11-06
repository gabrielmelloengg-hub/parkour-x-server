
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

const players = {};

app.get("/", (req, res) => {
  res.json({
    game: "PARKOUR X ONLINE",
    status: "online",
    players: Object.keys(players).length
  });
});

io.on("connection", (socket) => {
  console.log("Jogador conectado:", socket.id);

  players[socket.id] = {
    id: socket.id,
    name: "Player",
    x: 0,
    y: 2,
    z: 0,
    rotation: 0
  };

  socket.emit("init", {
    id: socket.id,
    players
  });

  socket.broadcast.emit(
    "playerJoined",
    players[socket.id]
  );

  socket.on("move", (data) => {
    if (!data || typeof data !== "object") return;

    const { x, y, z, rotation } = data;

    if (![x, y, z, rotation].every(
      v => typeof v === "number" && Number.isFinite(v)
    )) return;

    Object.assign(players[socket.id], {
      x, y, z, rotation
    });

    socket.broadcast.emit("playerMoved", {
      id: socket.id,
      x, y, z, rotation
    });
  });

  socket.on("disconnect", () => {
    delete players[socket.id];

    io.emit("playerLeft", socket.id);

    console.log("Jogador saiu:", socket.id);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, "0.0.0.0", () => {
  console.log("=================================");
  console.log(" PARKOUR X ONLINE");
  console.log(" Servidor iniciado!");
  console.log(` Porta: ${PORT}`);
  console.log("=================================");
});
