import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { GameRoom } from './GameRoom.js';

const app = express();
app.use(cors());
app.use(express.json());
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: true, methods: ['GET','POST'] } });
const rooms = new Map();
const maxPlayers = Math.max(2, Number(process.env.MAX_PLAYERS_PER_ROOM || 8));
app.get('/health', (_req,res) => res.json({ ok: true, service: 'livreur-rush-3d', rooms: rooms.size }));
io.on('connection', socket => {
  socket.emit('server:ready', { id: socket.id });
  socket.on('room:create', ({ name = 'Livreur' } = {}) => {
    const room = new GameRoom(name);
    rooms.set(room.code, room);
    socket.join(room.code);
    room.addPlayer(socket.id, name);
    socket.data.roomCode = room.code;
    socket.emit('room:created', { code: room.code, players: room.listPlayers(), host: true });
    io.to(room.code).emit('room:players', { players: room.listPlayers() });
  });
  socket.on('room:join', ({ code, name = 'Livreur' } = {}) => {
    const room = rooms.get(String(code || '').trim().toUpperCase());
    if (!room) return socket.emit('room:error', { message: 'الغرفة ما لقاينهاش' });
    if (room.started) return socket.emit('room:error', { message: 'السباق بدا بالفعل' });
    if (room.players.size >= maxPlayers) return socket.emit('room:error', { message: 'الغرفة عامرة' });
    socket.join(room.code);
    room.addPlayer(socket.id, name);
    socket.data.roomCode = room.code;
    socket.emit('room:joined', { code: room.code, players: room.listPlayers() });
    io.to(room.code).emit('room:players', { players: room.listPlayers() });
  });
  socket.on('race:start', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    room.started = true;
    io.to(room.code).emit('race:started', { at: Date.now() });
  });
  socket.on('player:state', state => {
    if (socket.data.roomCode) socket.to(socket.data.roomCode).emit('player:state', { id: socket.id, state });
  });
  const leaveRoom = () => {
    const code = socket.data.roomCode;
    if (!code) return;
    const room = rooms.get(code);
    if (room) {
      room.removePlayer(socket.id);
      if (!room.players.size) rooms.delete(code);
      else io.to(code).emit('room:players', { players: room.listPlayers() });
    }
    socket.leave(code);
    socket.data.roomCode = null;
  };
  socket.on('room:leave', leaveRoom);
  socket.on('disconnect', leaveRoom);
});
const port = Number(process.env.SERVER_PORT || 3001);
httpServer.listen(port, '0.0.0.0', () => console.log(`Livreur Rush server listening on ${port}`));
