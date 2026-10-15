// src/multiplayer/Lobby.js

export class Lobby {
    constructor(networkManager, uiManager) {
        this.network = networkManager;
        this.ui = uiManager;
        this.players = [];
    }

    async connectToServer(serverUrl) {
        const connected = await this.network.connect(serverUrl);
        this.ui.setConnectionStatus(connected);
        return connected;
    }

    createRoom(playerName, bikeColor) {
        if (!this.network.connected) {
            this.ui.showNotification('⚠️ غير متصل بالسيرفر — Not connected to server');
            return;
        }
        this.network.createRoom(playerName, bikeColor);
    }

    joinRoom(roomCode, playerName, bikeColor) {
        if (!this.network.connected) {
            this.ui.showNotification('⚠️ غير متصل بالسيرفر — Not connected to server');
            return;
        }
        this.network.joinRoom(roomCode, playerName, bikeColor);
    }

    findPublicRoom(playerName, bikeColor) {
        if (!this.network.connected) {
            this.ui.showNotification('⚠️ غير متصل بالسيرفر — Not connected to server');
            return;
        }
        this.network.findPublicRoom(playerName, bikeColor);
    }
}
