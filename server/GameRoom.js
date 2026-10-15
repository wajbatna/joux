import { randomBytes } from 'node:crypto';
export class GameRoom {
  constructor(hostName = 'Livreur') {
    this.code = randomBytes(3).toString('hex').toUpperCase();
    this.players = new Map();
    this.started = false;
    this.createdAt = Date.now();
    this.hostName = hostName;
  }
  addPlayer(id, name) { this.players.set(id, { id, name: String(name || 'Livreur').slice(0, 24), score: 0, joinedAt: Date.now() }); }
  removePlayer(id) { this.players.delete(id); }
  listPlayers() { return [...this.players.values()]; }
}