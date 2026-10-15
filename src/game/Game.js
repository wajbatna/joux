// src/game/Game.js

import * as THREE from 'three';
import { GAME_CONFIG } from '../utils/Constants.js';
import { Player } from './Player.js';
import { Physics } from './Physics.js';
import { GameCamera } from './Camera.js';
import { InputManager } from './InputManager.js';
import { SoundManager } from './SoundManager.js';
import { World } from '../world/World.js';
import { MissionManager } from '../missions/MissionManager.js';
import { UIManager } from '../ui/UIManager.js';
import { NetworkManager } from '../multiplayer/NetworkManager.js';
import { RoomManager } from '../multiplayer/RoomManager.js';
import { Lobby } from '../multiplayer/Lobby.js';
import { getPlayerProfile, savePlayerProfile, getSettings, saveSettings } from '../utils/Storage.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.gameCamera = null;
        this.clock = new THREE.Clock();

        this.input = new InputManager();
        this.sound = new SoundManager();
        this.ui = new UIManager();
        this.physics = new Physics();
        this.world = null;
        this.player = null;
        this.missions = null;

        this.network = new NetworkManager();
        this.roomManager = null;
        this.lobby = null;

        this.state = 'loading'; // 'loading', 'menu', 'playing', 'paused', 'results'
        this.gameMode = null; // 'singleplayer', 'multiplayer'
        this.isPaused = false;

        this.profile = getPlayerProfile();
        this.settings = getSettings();

        this.networkTickTimer = 0;
        this.minimapTimer = 0;
    }

    async init() {
        this.ui.setLoadingProgress(10, 'تهيئة المحرك...');

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: this.settings.quality !== 'low',
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = this.settings.shadows;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;

        this.ui.setLoadingProgress(20, 'إنشاء المشهد...');

        // Scene
        this.scene = new THREE.Scene();

        // Camera
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.5, 500);
        this.gameCamera = new GameCamera(this.camera);

        this.ui.setLoadingProgress(30, 'بناء المدينة...');

        // World
        this.world = new World(this.scene, this.physics);
        await new Promise(resolve => {
            setTimeout(() => {
                this.world.generate((status) => {
                    this.ui.setLoadingProgress(30 + Math.random() * 40, status);
                });
                resolve();
            }, 50);
        });

        this.ui.setLoadingProgress(75, 'إنشاء اللاعب...');

        // Player
        this.player = new Player(this.scene, this.profile.bikeColor);
        this.player.motorcycle.setPosition(0, 0, 0);

        // Mission manager
        this.missions = new MissionManager(this.world, this.player);

        // Room manager
        this.roomManager = new RoomManager(this.scene, this.network);
        this.lobby = new Lobby(this.network, this.ui);

        this.ui.setLoadingProgress(85, 'إعداد التحكم...');

        this.setupEventListeners();
        this.setupMissionCallbacks();
        this.setupMultiplayerCallbacks();
        this.applySettings();

        this.ui.setLoadingProgress(95, 'جاهز!');

        // Handle resize
        window.addEventListener('resize', () => this.onResize());

        this.ui.setLoadingProgress(100, 'مول التوصيل جاهز!');

        setTimeout(() => {
            this.ui.hideLoading();
            this.state = 'menu';
            this.ui.showMainMenu();
        }, 500);

        // Start game loop
        this.animate();
    }

    setupEventListeners() {
        // Main menu
        document.getElementById('btn-singleplayer')?.addEventListener('click', () => {
            this.ui.hideAllScreens();
            this.ui.showScreen('sp-menu');
        });

        document.getElementById('btn-multiplayer')?.addEventListener('click', () => {
            this.ui.hideAllScreens();
            this.ui.showScreen('mp-menu');
            this.tryConnectMultiplayer();
        });

        document.getElementById('btn-garage')?.addEventListener('click', () => {
            this.showGarage();
        });

        document.getElementById('btn-settings')?.addEventListener('click', () => {
            this.showSettings();
        });

        // SP menu
        document.getElementById('sp-back')?.addEventListener('click', () => {
            this.ui.showMainMenu();
        });

        document.getElementById('btn-sp-missions')?.addEventListener('click', () => {
            this.showMissionSelect();
        });

        document.getElementById('btn-sp-endless')?.addEventListener('click', () => {
            this.startEndlessMode();
        });

        document.getElementById('btn-sp-tutorial')?.addEventListener('click', () => {
            this.startMission(1);
        });

        // Mission select
        document.getElementById('mission-back')?.addEventListener('click', () => {
            this.ui.hideAllScreens();
            this.ui.showScreen('sp-menu');
        });

        // MP menu
        document.getElementById('mp-back')?.addEventListener('click', () => {
            this.ui.showMainMenu();
        });

        document.getElementById('btn-mp-create')?.addEventListener('click', () => {
            this.createMultiplayerRoom();
        });

        document.getElementById('btn-mp-join')?.addEventListener('click', () => {
            this.ui.hideAllScreens();
            this.ui.showScreen('join-room-screen');
        });

        document.getElementById('btn-mp-public')?.addEventListener('click', () => {
            this.findPublicRoom();
        });

        // Join room
        document.getElementById('join-back')?.addEventListener('click', () => {
            this.ui.hideAllScreens();
            this.ui.showScreen('mp-menu');
        });

        document.getElementById('btn-join-confirm')?.addEventListener('click', () => {
            const code = document.getElementById('room-code-input')?.value || '';
            if (code.length >= 4) {
                this.joinMultiplayerRoom(code);
            }
        });

        // Lobby
        document.getElementById('lobby-back')?.addEventListener('click', () => {
            this.roomManager.leave();
            this.ui.hideAllScreens();
            this.ui.showScreen('mp-menu');
        });

        document.getElementById('btn-start-race')?.addEventListener('click', () => {
            this.network.startGame();
        });

        // HUD
        document.getElementById('btn-accept-order')?.addEventListener('click', () => {
            this.ui.hideOrderPopup();
            this.missions.acceptMission();
        });

        // Pause
        document.getElementById('btn-resume')?.addEventListener('click', () => {
            this.resumeGame();
        });

        document.getElementById('btn-restart')?.addEventListener('click', () => {
            this.restartMission();
        });

        document.getElementById('btn-quit')?.addEventListener('click', () => {
            this.quitToMenu();
        });

        // Results
        document.getElementById('btn-next-mission')?.addEventListener('click', () => {
            this.nextMission();
        });

        document.getElementById('btn-results-menu')?.addEventListener('click', () => {
            this.quitToMenu();
        });

        // Garage
        document.getElementById('garage-back')?.addEventListener('click', () => {
            this.ui.showMainMenu();
        });

        // Settings
        document.getElementById('settings-back')?.addEventListener('click', () => {
            this.saveCurrentSettings();
            this.ui.showMainMenu();
        });

        // Canvas click to init sound
        this.canvas.addEventListener('click', () => {
            this.sound.init();
            this.sound.resume();
        }, { once: true });

        this.canvas.addEventListener('touchstart', () => {
            this.sound.init();
            this.sound.resume();
        }, { once: true });
    }

    setupMissionCallbacks() {
        this.missions.onOrderEvent = (type, message) => {
            const icons = {
                'picked_up': '📦',
                'angry_call': '📱',
                'warning': '⚠️',
                'police': '👮',
                'info': 'ℹ️',
                'angry': '😡',
                'weather': '🌧️',
                'success': '✅'
            };
            this.ui.showEventPopup(icons[type] || '⚠️', message);

            if (type === 'picked_up') {
                this.sound.playPickup();
            }
        };

        this.missions.onMissionComplete = (data) => {
            this.state = 'results';
            this.sound.playDelivery();
            this.ui.showHUD(false);
            this.ui.setResults({
                success: true,
                score: data.score,
                satisfaction: data.satisfaction,
                stars: data.stars,
                timeBonus: data.timeBonus,
                foodCondition: data.foodCondition
            });
            this.ui.showResults(true);
            this.input.showMobileControls(false);
        };

        this.missions.onMissionFail = (data) => {
            this.state = 'results';
            this.ui.showHUD(false);
            this.ui.setResults({
                success: false,
                score: data.score,
                satisfaction: 0,
                stars: 0,
                deliveries: data.deliveries
            });
            this.ui.showResults(true);
            this.input.showMobileControls(false);
        };
    }

    setupMultiplayerCallbacks() {
        this.roomManager.setupCallbacks(this.ui);

        this.network.onGameStart = (data) => {
            this.roomManager.roomState = 'racing';
            this.roomManager.raceTimeLimit = data.timeLimit || 180;
            this.roomManager.raceTimer = 0;

            // Create remote players
            if (data.players) {
                data.players.forEach(p => {
                    if (p.id !== this.network.playerId) {
                        const { RemotePlayer: RP } = require('../multiplayer/RemotePlayer.js');
                        // Already handled in roomManager callback
                    }
                });
            }

            // Start the multiplayer game
            this.gameMode = 'multiplayer';
            this.state = 'playing';
            this.ui.hideAllScreens();
            this.ui.showHUD(true);
            this.input.showMobileControls(true);

            // Start a delivery
            this.missions.startEndlessMode();
            this.ui.showNotification('🏁 السباق بدأ! — Race started!');
        };

        this.network.onConnect = () => {
            this.ui.setConnectionStatus(true);
        };

        this.network.onDisconnect = () => {
            this.ui.setConnectionStatus(false);
            if (this.state === 'playing' && this.gameMode === 'multiplayer') {
                this.ui.showNotification('⚠️ فقدان الاتصال — Connection lost');
            }
        };

        this.network.onError = (msg) => {
            this.ui.showNotification('❌ ' + msg);
        };

        this.network.onRoomCreated = (data) => {
            this.roomManager.roomState = 'lobby';
            this.ui.hideAllScreens();
            this.ui.showScreen('multiplayer-lobby');
            this.ui.updateLobby(data.players, data.roomCode, true);
        };

        this.network.onRoomJoined = (data) => {
            this.roomManager.roomState = 'lobby';
            this.ui.hideAllScreens();
            this.ui.showScreen('multiplayer-lobby');
            this.ui.updateLobby(data.players, data.roomCode, this.network.isHost);
        };

        this.network.onPlayerJoined = (data) => {
            this.ui.updateLobby(data.players, this.network.roomCode, this.network.isHost);
            this.ui.showNotification(`🏍️ ${data.playerName} انضم!`);
        };

        this.network.onPlayerLeft = (data) => {
            if (this.roomManager.remotePlayers.has(data.playerId)) {
                this.roomManager.remotePlayers.get(data.playerId).dispose();
                this.roomManager.remotePlayers.delete(data.playerId);
            }
            if
