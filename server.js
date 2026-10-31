const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const rooms = new Map();

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, rooms: rooms.size });
});

function ensureRoom(roomCode) {
  if (!rooms.has(roomCode)) {
    rooms.set(roomCode, {
      code: roomCode,
      state: null,
      players: new Map(),
    });
  }
  return rooms.get(roomCode);
}

io.on('connection', (socket) => {
  socket.on('create-room', ({ roomCode, playerName, role, state }) => {
    const room = ensureRoom(roomCode);
    room.players.set(socket.id, { socketId: socket.id, playerName, role, connected: true });
    socket.join(roomCode);
    socket.emit('room-ready', { roomCode, playerName, role, state: state || room.state });
    io.to(roomCode).emit('room-state', { roomCode, players: [...room.players.values()], state: room.state || state });
  });

  socket.on('join-room', ({ roomCode, playerName, role }) => {
    const room = ensureRoom(roomCode);
    room.players.set(socket.id, { socketId: socket.id, playerName, role, connected: true });
    socket.join(roomCode);
    socket.emit('room-ready', { roomCode, playerName, role, state: room.state });
    io.to(roomCode).emit('room-state', { roomCode, players: [...room.players.values()], state: room.state });
  });

  socket.on('state:update', ({ roomCode, state }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    room.state = state;
    io.to(roomCode).emit('room-state', { roomCode, players: [...room.players.values()], state });
  });

  socket.on('chat', ({ roomCode, message }) => {
    io.to(roomCode).emit('chat', message);
  });

  socket.on('disconnect', () => {
    for (const [roomCode, room] of rooms) {
      if (room.players.has(socket.id)) {
        room.players.delete(socket.id);
        io.to(roomCode).emit('room-state', { roomCode, players: [...room.players.values()], state: room.state });
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`OPS multiplayer backend listening on http://localhost:${PORT}`);
});
