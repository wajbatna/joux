// Main game loop wired to the existing city, traffic, motorcycle and physics modules.
import * as THREE from 'three';
import { GAME_CONFIG } from '../utils/Constants.js';
import { Player } from './Player.js';
import { Physics } from './Physics.js';
import { GameCamera } from './Camera.js';
import { InputManager } from './InputManager.js';
import { World } from '../world/World.js';
import { SoundManager } from './SoundManager.js';

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
  pause() { this.running = false; this.sound.stop?.(); }
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
  setDestination() {
    if (this.destination) this.world.removeDeliveryMarker(this.destination);
    const p = this.player.getPosition();
    const x = Math.round(p.x / 60) * 60;
    const z = p.z + 100;
    this.destination = this.world.createDeliveryMarker(THREE.MathUtils.clamp(x, -80, 80), z, 'dropoff');
    this.delivered = false;
  }
  setBikeColor(color) { this.player.motorcycle.setColor(Number.parseInt(String(color).replace('#',''), 16)); }
  setAction(action, active = true) {
    const map = { forward: 'accelerate', brake: 'brake', left: 'left', right: 'right' };
    if (map[action]) this.input.state[map[action]] = active;
  }
  horn() { this.sound.horn?.(); this.callbacks.onHorn?.(); }
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
