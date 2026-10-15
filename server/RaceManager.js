export class RaceManager {
  constructor(rooms) { this.rooms = rooms; }
  start(code) { const room = this.rooms.get(code); if (!room) return false; room.started = true; room.startedAt = Date.now(); return true; }
  standings(code) { const room = this.rooms.get(code); return room ? room.listPlayers().sort((a,b) => b.score-a.score) : []; }
}