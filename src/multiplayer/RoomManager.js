// src/multiplayer/RoomManager.js

import { RemotePlayer } from './RemotePlayer.js';

export class RoomManager {
    constructor(scene, networkManager) {
        this.scene = scene;
        this.network = networkManager;
        this.remotePlayers = new Map();
        this.roomState = 'idle'; // 'idle', 'lobby', 'racing', 'finished'
        this.raceTimer = 0;
        this.raceTimeLimit = 180;
    }

    setupCallbacks(ui) {
        this.network.onRoomCreated = (data) => {
            this.roomState = 'lobby';
            ui.updateLobby(data.players, data.roomCode, this.network.isHost);
        };

        this.network.onRoomJoined = (data) => {
            this.roomState = 'lobby';
            ui.updateLobby(data.players, data.roomCode, this.network.isHost);
        };

        this.network.onPlayerJoined = (data) => {
            ui.updateLobby(data.players, this.network.roomCode, this.network.isHost);
            ui.showNotification(`🏍️ ${data.playerName} انضم! — joined!`);
        };

        this.network.onPlayerLeft = (data) => {
            // Remove remote player
            if (this.remotePlayers.has(data.playerId)) {
                this.remotePlayers.get(data.playerId).dispose();
                this.remotePlayers.delete(data.playerId);
            }
            ui.updateLobby(data.players, this.network.roomCode, this.network.isHost);
            ui.showNotification(`${data.playerName} غادر — left`);
        };

        this.network.onGameStart = (data) => {
            this.roomState = 'racing';
            this.raceTimer = 0;
            this.raceTimeLimit = data.timeLimit || 180;

            // Create remote players
            (data.players || []).forEach(p => {
                if (p.id !== this.network.playerId) {
                    const remote = new RemotePlayer(
                        this.scene, p.id, p.name, p.bikeColor
                    );
                    this.remotePlayers.set(p.id, remote);
                }
            });
        };

        this.network.onGameState = (data) => {
            // Update remote players
            if (data.players) {
                data.players.forEach(p => {
                    if (p.id === this.network.playerId) return;

                    let remote = this.remotePlayers.get(p.id);
                    if (!remote) {
                        remote = new RemotePlayer(this.scene, p.id, p.name, p.bikeColor);
                        this.remotePlayers.set(p.id, remote);
                    }

                    remote.updateTarget(
                        p.x, p.y || 0, p.z,
                        p.rotation, p.speed,
                        p.score, p.deliveries
                    );
                });
            }
        };

        this.network.onRaceEnd = (data) => {
            this.roomState = 'finished';
        };
    }

    update(deltaTime) {
        if (this.roomState === 'racing') {
            this.raceTimer += deltaTime;

            // Update remote players
            this.remotePlayers.forEach(rp => rp.update(deltaTime));
        }
    }

    sendPlayerState(player) {
        if (this.roomState !== 'racing') return;
        const pos = player.getPosition();
        this.network.sendPlayerState({
            x: pos.x,
            y: pos.y,
            z: pos.z,
            rotation: player.getRotation(),
            speed: player.getSpeed(),
            score: player.score,
            deliveries: player.deliveries
        });
    }

    getRankings(localPlayer) {
        const rankings = [];

        // Add local player
        rankings.push({
            name: 'أنت — You',
            score: localPlayer.score,
            deliveries: localPlayer.deliveries,
            self: true
        });

        // Add remote players
        this.remotePlayers.forEach(rp => {
            rankings.push({
                name: rp.name,
                score: rp.score,
                deliveries: rp.deliveries,
                self: false
            });
        });

        // Sort by score
        rankings.sort((a, b) => b.score - a.score);
        return rankings;
    }

    cleanup() {
        this.remotePlayers.forEach(rp => rp.dispose());
        this.remotePlayers.clear();
        this.roomState = 'idle';
        this.raceTimer = 0;
    }

    leave() {
        this.network.leaveRoom();
        this.cleanup();
    }
}
