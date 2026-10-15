export class RoomManager {
  constructor(sceneOrNetwork, maybeNetwork) {
    this.scene = maybeNetwork ? sceneOrNetwork : null;
    this.network = maybeNetwork || sceneOrNetwork;
    this.roomCode = null;
    this.roomState = 'idle';
    this.remotePlayers = new Map();
  }
  async create(name = 'Livreur') {
    const socket = await this.network.connect();
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('انتهت مهلة إنشاء الغرفة')), 8000);
      socket.once('room:created', data => { clearTimeout(timeout); this.roomCode = data.code; this.roomState = 'lobby'; resolve(data); });
      socket.once('room:error', data => { clearTimeout(timeout); reject(new Error(data?.message || 'تعذر إنشاء الغرفة')); });
      socket.emit('room:create', { name });
    });
  }
  async join(code, name = 'Livreur') {
    const socket = await this.network.connect();
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('انتهت مهلة دخول الغرفة')), 8000);
      socket.once('room:joined', data => { clearTimeout(timeout); this.roomCode = data.code; this.roomState = 'lobby'; resolve(data); });
      socket.once('room:error', data => { clearTimeout(timeout); reject(new Error(data?.message || 'تعذر دخول الغرفة')); });
      socket.emit('room:join', { code, name });
    });
  }
  leave() { this.network.leaveRoom?.(); this.roomCode = null; this.roomState = 'idle'; }
  dispose() { this.leave(); for (const player of this.remotePlayers.values()) player.dispose?.(); this.remotePlayers.clear(); }
}
