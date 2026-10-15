// src/missions/CustomerSatisfaction.js

import { clamp } from '../utils/MathUtils.js';

export class CustomerSatisfaction {
    constructor() {
        this.satisfaction = 100;
        this.callTimer = 0;
        this.callInterval = 30;
        this.hasCalledAngry = false;
    }

    reset() {
        this.satisfaction = 100;
        this.callTimer = 0;
        this.hasCalledAngry = false;
    }

    update(deltaTime, timeRemaining, totalTime) {
        // Decrease based on time elapsed
        const timeRatio = timeRemaining / totalTime;
        if (timeRatio < 0.5) {
            this.satisfaction -= 0.3 * deltaTime;
        }
        if (timeRatio < 0.25) {
            this.satisfaction -= 0.5 * deltaTime;
        }

        // Angry customer call
        this.callTimer += deltaTime;
        if (this.callTimer > this.callInterval && timeRatio < 0.4 && !this.hasCalledAngry) {
            this.hasCalledAngry = true;
            return 'angry_call';
        }

        this.satisfaction = clamp(this.satisfaction, 0, 100);
        return null;
    }

    applyDamage(amount) {
        this.satisfaction = clamp(this.satisfaction - amount, 0, 100);
    }

    applyBonus(amount) {
        this.satisfaction = clamp(this.satisfaction + amount, 0, 100);
    }

    getStars() {
        if (this.satisfaction >= 90) return 3;
        if (this.satisfaction >= 70) return 2;
        if (this.satisfaction >= 40) return 1;
        return 0;
    }

    getSatisfactionPercent() {
        return Math.round(this.satisfaction);
    }
}
