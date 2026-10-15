// src/game/Physics.js

import { clamp } from '../utils/MathUtils.js';
import { GAME_CONFIG } from '../utils/Constants.js';

export class Physics {
    constructor() {
        this.colliders = [];
    }

    addCollider(x, z, width, depth, type = 'static') {
        this.colliders.push({ x, z, width, depth, type, halfW: width / 2, halfD: depth / 2 });
    }

    clearColliders() {
        this.colliders = [];
    }

    checkCollision(px, pz, radius = 1.0) {
        for (const c of this.colliders) {
            const closestX = clamp(px, c.x - c.halfW, c.x + c.halfW);
            const closestZ = clamp(pz, c.z - c.halfD, c.z + c.halfD);
            const dx = px - closestX;
            const dz = pz - closestZ;
            const distSq = dx * dx + dz * dz;
            if (distSq < radius * radius) {
                return {
                    collided: true,
                    collider: c,
                    normal: { x: dx || 0.01, z: dz || 0.01 },
                    penetration: radius - Math.sqrt(distSq)
                };
            }
        }
        return { collided: false };
    }

    resolveCollision(px, pz, radius, collision) {
        if (!collision.collided) return { x: px, z: pz };
        const len = Math.sqrt(collision.normal.x * collision.normal.x + collision.normal.z * collision.normal.z);
        const nx = collision.normal.x / len;
        const nz = collision.normal.z / len;
        return {
            x: px + nx * (collision.penetration + 0.1),
            z: pz + nz * (collision.penetration + 0.1)
        };
    }

    isOnRoad(px, pz, roads) {
        for (const road of roads) {
            if (road.horizontal) {
                if (Math.abs(pz - road.z) < GAME_CONFIG.ROAD_WIDTH / 2 &&
                    px > road.x1 && px < road.x2) return true;
            } else {
                if (Math.abs(px - road.x) < GAME_CONFIG.ROAD_WIDTH / 2 &&
                    pz > road.z1 && pz < road.z2) return true;
            }
        }
        return false;
    }
}
