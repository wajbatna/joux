import { io } from 'socket.io-client';
import { GAME_CONFIG } from '../utils/Constants.js';

export class NetworkManager {
  constructor(serverUrl = GAME_CONFIG.SERVER_URL) {
    this.serverUrl = serverUrl;
    this.socket = null;
    this.connected = false;
    this.playerId = null;
    this.roomCode = null;
    this.isHost = false;
    this.onConnect = null; this.onDisconnect = null;
    this.onRoomCreated = null; this.onRoomJoined = null;
    this.onPlayerJoined = null; this.onPlayerLeft = null;
    this.onGameStart = null; this.onGameState = null; this.onRaceEnd = null; this.onError = null;
  }
  connect(serverUrl) {
    if (serverUrl) this.serverUrl = serverUrl;
    if (this.socket?.connected) return Promise.resolve(this.socket);
    if (this.socket) this.socket.disconnect();
    return new Promise((resolve, reject) => {
      const socket = io(this.serverUrl, { transports: ['websocket','polling'], timeout: 8000, reconnection: true });
      this.socket = socket;
      const fail = err => { this.connected = false; this.onError?.(err?.message || 'Connection failed'); reject(err instanceof Error ? err : new Error(String(err?.message || 'Connection failed'))); };
      socket.once('connect', () => { this.connected = true; this.playerId = socket.id; this.onConnect?.(); resolve(socket); });
      socket.once('connect_error', fail);
      socket.on('disconnect', () => { this.connected = false; this.onDisconnect?.(); });
      socket.on('room:created', data => { this.roomCode = data.code; this.isHost = true; this.onRoomCreated?.({ ...data, roomCode: data.code }); });
      socket.on('room:joined', data => { this.roomCode = data.code; this.isHost = false; this.onRoomJoined?.({ ...data, roomCode: data.code }); });
      socket.on('room:players', data => this.onPlayerJoined?.({ players: data.players || [], roomCode: this.roomCode }));
      socket.on('race:started', data => this.onGameStart?.(data));
      socket.on('player:state', data => this.onGameState?.(data));
      socket.on('race:ended', data => this.onRaceEnd?.(data));
      socket.on('room:error', data => this.onError?.(data?.message || 'Room error'));
    });
  }
  emit(event, data) { if (this.socket?.connected) this.socket.emit(event, data); }
  createRoom(playerName = 'Livreur', bikeColor) { this.emit('room:create', { name: playerName, bikeColor }); }
  joinRoom(roomCode, playerName = 'Livreur', bikeColor) { this.emit('room:join', { code: roomCode, name: playerName, bikeColor }); }
  findPublicRoom(playerName = 'Livreur', bikeColor) { this.createRoom(playerName, bikeColor); }
  leaveRoom() { this.emit('room:leave', {}); this.roomCode = null; this.isHost = false; }
  disconnect() { this.socket?.disconnect(); this.socket = null; this.connected = false; this.roomCode = null; }
}
