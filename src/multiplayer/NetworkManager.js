// src/multiplayer/NetworkManager.js

import { GAME_CONFIG } from '../utils/Constants.js';

export class NetworkManager {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.playerId = null;
        this.roomCode = null;
        this.isHost = false;
        this.serverUrl = GAME_CONFIG.SERVER_URL;

        this.onConnect = null;
        this.onDisconnect = null;
        this.onRoomCreated = null;
        this.onRoomJoined = null;
        this.onPlayerJoined = null;
        this.onPlayerLeft = null;
        this.onGameStart = null;
        this.onGameState = null;
        this.onRaceEnd = null;
        this.onError = null;

        this.io = null;
    }

    async loadSocketIO() {
        if (this.io) return true;

        try {
            // Dynamic import of socket.io-client
            const module = await import('socket.io-client');
            this.io = module.io || module.default;
            return true;
        } catch (e) {
            console.warn('Socket.IO client not available:', e);
            return false;
        }
    }

    async connect(serverUrl) {
        if (serverUrl) this.serverUrl = serverUrl;

        const loaded = await this.loadSocketIO();
        if (!loaded) {
            if (this.onError) this.onError('Socket.IO library not available. Install socket.io-client.');
            return false;
        }

        return new Promise((resolve) => {
            try {
                this.socket = this.io(this.serverUrl, {
                    transports: ['websocket', 'polling'],
                    timeout: 10000,
                    reconnection: true,
                    reconnectionAttempts: 5
                });

                this.socket.on('connect', () => {
                    this.connected = true;
                    this.playerId = this.socket.id;
                    if (this.onConnect) this.onConnect();
                    resolve(true);
                });

                this.socket.on('disconnect', () => {
                    this.connected = false;
                    if (this.onDisconnect) this.onDisconnect();
                });

                this.socket.on('connect_error', (err) => {
                    this.connected = false;
                    if (this.onError) this.onError('Connection failed: ' + err.message);
                    resolve(false);
                });

                // Game events
                this.socket.on('room_created', (data) => {
                    this.roomCode = data.roomCode;
                    this.isHost = true;
                    if (this.onRoomCreated) this.onRoomCreated(data);
                });

                this.socket.on('room_joined', (data) => {
                    this.roomCode = data.roomCode;
                    if (this.onRoomJoined) this.onRoomJoined(data);
                });

                this.socket.on('player_joined', (data) => {
                    if (this.onPlayerJoined) this.onPlayerJoined(data);
                });

                this.socket.on('player_left', (data) => {
                    if (this.onPlayerLeft) this.onPlayerLeft(data);
                });

                this.socket.on('game_start', (data) => {
                    if (this.onGameStart) this.onGameStart(data);
                });

                this.socket.on('game_state', (data) => {
                    if (this.onGameState) this.onGameState(data);
                });

                this.socket.on('race_end', (data) => {
                    if (this.onRaceEnd) this.onRaceEnd(data);
                });

                this.socket.on('error', (data) => {
                    if (this.onError) this.onError(data.message || 'Server error');
                });

                // Timeout fallback
                setTimeout(() => {
                    if (!this.connected) {
                        resolve(false);
                    }
                }, 10000);

            } catch (e) {
                if (this.onError) this.onError('Failed to connect: ' + e.message);
                resolve(false);
            }
        });
    }

    createRoom(playerName, bikeColor) {
        if (!this.socket || !this.connected) return;
        this.socket.emit('create_room', { name: playerName, bikeColor });
    }

    joinRoom(roomCode, playerName, bikeColor) {
        if (!this.socket || !this.connected) return;
        this.socket.emit('join_room', { roomCode: roomCode.toUpperCase(), name: playerName, bikeColor });
    }

    findPublicRoom(playerName, bikeColor) {
        if (!this.socket || !this.connected) return;
        this.socket.emit('find_room', { name: playerName, bikeColor });
    }

    startGame() {
        if (!this.socket || !this.connected) return;
        this.socket.emit('start_game', { roomCode: this.roomCode });
    }

    sendPlayerState(state) {
        if (!this.socket || !this.connected) return;
        this.socket.volatile.emit('player_state', {
            roomCode: this.roomCode,
            ...state
        });
    }

    sendDeliveryComplete(score, deliveries) {
        if (!this.socket || !this.connected) return;
        this.socket.emit('delivery_complete', {
            roomCode: this.roomCode,
            score,
            deliveries
        });
    }

    leaveRoom() {
        if (!this.socket || !this.connected) return;
        this.socket.emit('leave_room', { roomCode: this.roomCode });
        this.roomCode = null;
        this.isHost = false;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.connected = false;
        this.roomCode = null;
        this.isHost = false;
    }
}
