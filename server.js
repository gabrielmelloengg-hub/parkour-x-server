
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const players = Object.create(null);

const VALID_SKINS = ["banana", "itachi"];

function validNumber(value, min, max) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max
  );
}

function cleanName(value) {
  if (typeof value !== "string") return "Player";

  return value
    .trim()
    .replace(/[<>]/g, "")
    .slice(0, 20) || "Player";
}

function cleanSkin(value) {
  return VALID_SKINS.includes(value)
    ? value
    : "banana";
}

function playerCount() {
  return Object.keys(players).length;
}

// Status público do servidor
app.get("/", (req, res) => {
  res.json({
    game: "PARKOUR X ONLINE",
    status: "online",
    version: "2.0",
    players: playerCount(),
    skins: VALID_SKINS
  });
});

// Jogadores conectados
io.on("connection", (socket) => {
  console.log("Jogador conectado:", socket.id);

  const player = {
    id: socket.id,
    name: "Player",
    skin: "banana",

    x: 0,
    y: 1.8,
    z: 0,
    rotation: 0,

    moving: false,
    running: false,
    jumping: false,

    kiteActive: false,
    dibicando: false
  };

  players[socket.id] = player;

  // Envia jogadores existentes ao novo cliente
  socket.emit("init", {
    id: socket.id,
    players
  });

  // Informa aos outros que entrou alguém
  socket.broadcast.emit("playerJoined", player);

  // Configuração do jogador
  socket.on("setPlayer", (data) => {
    if (!data || typeof data !== "object") return;

    player.name = cleanName(data.name);
    player.skin = cleanSkin(data.skin);

    io.emit("playerUpdated", {
      id: socket.id,
      name: player.name,
      skin: player.skin
    });
  });

  // Alteração de skin durante a partida
  socket.on("setSkin", (skin) => {
    player.skin = cleanSkin(skin);

    io.emit("playerUpdated", {
      id: socket.id,
      name: player.name,
      skin: player.skin
    });
  });

  // Sincronização de movimento
  socket.on("move", (data) => {
    if (!data || typeof data !== "object") return;

    const { x, y, z, rotation } = data;

    if (
      !validNumber(x, -10000, 10000) ||
      !validNumber(y, -1000, 10000) ||
      !validNumber(z, -10000, 10000) ||
      !validNumber(rotation, -100000, 100000)
    ) {
      return;
    }

    player.x = x;
    player.y = y;
    player.z = z;
    player.rotation = rotation;

    if (typeof data.moving === "boolean") {
      player.moving = data.moving;
    }

    if (typeof data.running === "boolean") {
      player.running = data.running;
    }

    if (typeof data.jumping === "boolean") {
      player.jumping = data.jumping;
    }

    if (typeof data.kiteActive === "boolean") {
      player.kiteActive = data.kiteActive;
    }

    if (typeof data.dibicando === "boolean") {
      player.dibicando = data.dibicando;
    }

    // Envia atualização para os outros jogadores
    socket.broadcast.emit("playerMoved", {
      id: socket.id,

      x: player.x,
      y: player.y,
      z: player.z,
      rotation: player.rotation,

      moving: player.moving,
      running: player.running,
      jumping: player.jumping,

      kiteActive: player.kiteActive,
      dibicando: player.dibicando
    });
  });

  // Desconexão
  socket.on("disconnect", () => {
    delete players[socket.id];

    io.emit("playerLeft", socket.id);

    console.log(
      "Jogador saiu:",
      socket.id,
      "| Online:",
      playerCount()
    );
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, "0.0.0.0", () => {
  console.log("=================================");
  console.log("       PARKOUR X ONLINE V2");
  console.log("=================================");
  console.log("Servidor iniciado!");
  console.log("Porta:", PORT);
  console.log("Skins: Banana / Itachi");
  console.log("Multiplayer ativo");
  console.log("=================================");
});
