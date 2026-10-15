// src/game/Camera.js

import * as THREE from 'three';
import { lerp } from '../utils/MathUtils.js';
import { GAME_CONFIG } from '../utils/Constants.js';

export class GameCamera {
    constructor(camera) {
        this.camera = camera;
        this.mode = 'third'; // 'third' or 'first'
        this.distance = GAME_CONFIG.CAMERA_DISTANCE;
        this.height = GAME_CONFIG.CAMERA_HEIGHT;
        this.smoothness = GAME_CONFIG.CAMERA_SMOOTH;
        this.currentPos = new THREE.Vector3();
        this.currentLookAt = new THREE.Vector3();
        this.shakeAmount = 0;
        this.shakeDecay = 0.95;
    }

    toggleMode() {
        this.mode = this.mode === 'third' ? 'first' : 'third';
    }

    shake(amount) {
        this.shakeAmount = amount;
    }

    update(target, rotation, speed, deltaTime) {
        if (!target) return;

        const t = 1 - Math.pow(1 - this.smoothness, deltaTime * 60);

        if (this.mode === 'third') {
            const speedFactor = 1 + (speed / GAME_CONFIG.MOTO_MAX_SPEED) * 0.3;
            const dist = this.distance * speedFactor;
            const idealX = target.x - Math.sin(rotation) * dist;
            const idealZ = target.z - Math.cos(rotation) * dist;
            const idealY = target.y + this.height;

            this.currentPos.x = lerp(this.currentPos.x, idealX, t);
            this.currentPos.y = lerp(this.currentPos.y, idealY, t);
            this.currentPos.z = lerp(this.currentPos.z, idealZ, t);

            const lookX = target.x + Math.sin(rotation) * 5;
            const lookZ = target.z + Math.cos(rotation) * 5;
            this.currentLookAt.x = lerp(this.currentLookAt.x, lookX, t);
            this.currentLookAt.y = lerp(this.currentLookAt.y, target.y + 2, t);
            this.currentLookAt.z = lerp(this.currentLookAt.z, lookZ, t);

        } else {
            this.currentPos.x = lerp(this.currentPos.x, target.x, t * 2);
            this.currentPos.y = lerp(this.currentPos.y, target.y + 2.2, t * 2);
            this.currentPos.z = lerp(this.currentPos.z, target.z, t * 2);

            this.currentLookAt.x = target.x + Math.sin(rotation) * 20;
            this.currentLookAt.y = target.y + 1.5;
            this.currentLookAt.z = target.z + Math.cos(rotation) * 20;
        }

        // Apply shake
        if (this.shakeAmount > 0.01) {
            this.currentPos.x += (Math.random() - 0.5) * this.shakeAmount;
            this.currentPos.y += (Math.random() - 0.5) * this.shakeAmount * 0.5;
            this.shakeAmount *= this.shakeDecay;
        }

        this.camera.position.copy(this.currentPos);
        this.camera.lookAt(this.currentLookAt);
    }
}
