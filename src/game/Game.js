// Main game loop wired to the existing city, traffic, motorcycle and physics modules.
import * as THREE from 'three';
import { GAME_CONFIG } from '../utils/Constants.js';
import { Player } from './Player.js';
import { Physics } from './Physics.js';
import { GameCamera } from './Camera.js';
import { InputManager } from './InputManager.js';
import { World } from '../world/World.js';
import { SoundManager } from './SoundManager.js';
import { RemotePlayer } from '../multiplayer/RemotePlayer.js';

export class Game {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.running = false;
    this.lastTime = 0;
    this.elapsed = 0;
    this.lastHorn = false;
    this.lastInteract = false;
    this.lastPause = false;
    this.lastCamera = false;
    this.delivered = false;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 800);
    this.camera.position.set(0, 7, -12);

    this.physics = new Physics();
    this.world = new World(this.scene, this.physics);
    this.world.generate(progress => this.callbacks.onProgress?.(progress));
    this.player = new Player(this.scene, GAME_CONFIG.COLORS.MOTO_DEFAULT);
    this.input = new InputManager();
    this.cameraRig = new GameCamera(this.camera);
    this.sound = new SoundManager();
    this.clock = new THREE.Clock();
    this.destination = null;
    this.remotePlayers = new Map();
    this.animate = this.animate.bind(this);
    this.resize();
    this.reset();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.clock.start();
    requestAnimationFrame(this.animate);
  }
  pause() { this.running = false; this.sound.stopEngine?.(); }
  reset() {
    this.player.motorcycle.setPosition(0, 0, 0);
    this.player.motorcycle.setRotation(0);
    this.player.motorcycle.speed = 0;
    this.player.score = 0; this.player.deliveries = 0; this.player.satisfaction = 100;
    this.elapsed = 0; this.delivered = false;
    this.world.clearDeliveryMarkers();
    this.destination = null;
    this.callbacks.onSpeed?.(0);
  }
  syncRemotePlayers(players = [], localPlayerId = null) {
    const live = new Set(players.map(p => p.id).filter(id => id && id !== localPlayerId));
    players.forEach(p => {
      if (!p.id || p.id === localPlayerId) return;
      if (!this.remotePlayers.has(p.id)) this.remotePlayers.set(p.id, new RemotePlayer(this.scene, p.id, p.name || 'Livreur', p.bikeColor || 0x33aaff));
    });
    for (const [id, remote] of this.remotePlayers) {
      if (!live.has(id)) { remote.dispose(); this.remotePlayers.delete(id); }
    }
  }
  updateRemotePlayer(id, state = {}) {
    if (!id || !state) return;
    let remote = this.remotePlayers.get(id);
    if (!remote) { remote = new RemotePlayer(this.scene, id, 'Livreur', 0x33aaff); this.remotePlayers.set(id, remote); }
    remote.updateTarget(Number(state.x) || 0, 0, Number(state.z) || 0, Number(state.rotation) || 0, Number(state.speed) || 0);
  }
  setDestination() {
    if (this.destination) this.world.removeDeliveryMarker(this.destination);
    const p = this.player.getPosition();
    const x = p.x;
    const z = p.z + 100;
    this.destination = this.world.createDeliveryMarker(THREE.MathUtils.clamp(x, -80, 80), z, 'dropoff');
    this.delivered = false;
  }
  setBikeColor(color) { this.player.motorcycle.setColor(Number.parseInt(String(color).replace('#',''), 16)); }
  activateAudio() { this.sound.init(); this.sound.resume(); }
  setAction(action, active = true) {
    const map = { forward: 'accelerate', brake: 'brake', left: 'left', right: 'right' };
    if (map[action]) this.input.state[map[action]] = active;
  }
  horn() { this.sound.init(); this.sound.resume(); this.sound.playHorn?.(); this.callbacks.onHorn?.(); }
  resize() {
    if (!this.renderer || !this.camera) return;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.aspect = window.innerWidth / Math.max(1, window.innerHeight);
    this.camera.updateProjectionMatrix();
  }
  animate(now) {
    if (!this.running) return;
    requestAnimationFrame(this.animate);
    const dt = Math.min(Math.max((now - this.lastTime) / 1000, 0), 0.04);
    this.lastTime = now;
    this.input.update();
    this.sound.playEngineSound?.(Math.abs(this.player.getSpeed()), GAME_CONFIG.MOTO_MAX_SPEED);
    if (this.input.consumePause() && !this.lastPause) this.callbacks.onPause?.();
    if (this.input.consumeCamera()) this.cameraRig.toggleMode();
    const input = this.input.state;
    if (input.horn && !this.lastHorn) this.horn();
    if (input.interact && !this.lastInteract) this.callbacks.onInteract?.();
    this.lastHorn = input.horn; this.lastInteract = input.interact;
    if (!this.running) return;

    const collided = this.player.update(input, dt, this.physics);
    if (collided) this.callbacks.onCollision?.();
    const position = this.player.getPosition();
    this.world.update(dt, position);
    for (const remote of this.remotePlayers.values()) remote.update(dt);
    this.cameraRig.update(position, this.player.getRotation(), this.player.getSpeed(), dt);
    this.elapsed += dt;

    if (this.destination && !this.delivered && position.distanceTo(this.destination.position) < 4) {
      this.delivered = true;
      this.world.removeDeliveryMarker(this.destination);
      this.destination = null;
      this.player.completeDelivery();
      this.callbacks.onDestination?.();
    }
    this.callbacks.onSpeed?.(this.player.motorcycle.getSpeedKmh());
    this.callbacks.onPlayerState?.({ x: position.x, z: position.z, rotation: this.player.getRotation(), speed: this.player.getSpeed() });
    this.renderer.render(this.scene, this.camera);
  }
}
