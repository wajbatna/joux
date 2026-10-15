// src/game/Player.js

import { Motorcycle } from './Motorcycle.js';

export class Player {
    constructor(scene, color) {
        this.motorcycle = new Motorcycle(scene, color);
        this.score = 0;
        this.deliveries = 0;
        this.satisfaction = 100;
        this.combo = 1;
        this.coins = 0;
        this.hasOrder = false;
        this.currentOrder = null;
        this.collisionCooldown = 0;
        this.foodCondition = 100;
    }

    update(input, deltaTime, physics) {
        if (this.collisionCooldown > 0) {
            this.collisionCooldown -= deltaTime;
        }

        const collided = this.motorcycle.update(input, deltaTime, physics);

        if (collided && this.collisionCooldown <= 0) {
            this.collisionCooldown = 1.0;
            this.foodCondition = Math.max(0, this.foodCondition - 10);
            if (Math.abs(this.motorcycle.speed) > 20) {
                this.score = Math.max(0, this.score - 15);
            }
            return true;
        }
        return false;
    }

    addScore(points) {
        this.score += Math.round(points * this.combo);
    }

    completeDelivery() {
        this.deliveries++;
        this.combo = Math.min(this.combo + 0.5, 3);
    }

    failDelivery() {
        this.combo = 1;
    }

    getPosition() {
        return this.motorcycle.position;
    }

    getRotation() {
        return this.motorcycle.rotation;
    }

    getSpeed() {
        return this.motorcycle.speed;
    }

    dispose() {
        this.motorcycle.dispose();
    }
}
