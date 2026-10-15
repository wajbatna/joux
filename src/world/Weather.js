// src/world/Weather.js

import * as THREE from 'three';

export class Weather {
    constructor(scene) {
        this.scene = scene;
        this.rainParticles = null;
        this.currentWeather = 'clear';
    }

    setWeather(type) {
        this.currentWeather = type;

        if (type === 'rain') {
            this.createRain();
        } else {
            this.removeRain();
        }
    }

    createRain() {
        if (this.rainParticles) return;

        const count = 3000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 200;
            positions[i * 3 + 1] = Math.random() * 50;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
            velocities[i] = 20 + Math.random() * 30;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0xaaccff,
            size: 0.15,
            transparent: true,
            opacity: 0.6
        });

        this.rainParticles = new THREE.Points(geometry, material);
        this.rainVelocities = velocities;
        this.scene.add(this.rainParticles);
    }

    removeRain() {
        if (this.rainParticles) {
            this.scene.remove(this.rainParticles);
            this.rainParticles.geometry.dispose();
            this.rainParticles.material.dispose();
            this.rainParticles = null;
        }
    }

    update(deltaTime, playerPos) {
        if (this.rainParticles && this.currentWeather === 'rain') {
            const positions = this.rainParticles.geometry.attributes.position.array;
            for (let i = 0; i < positions.length / 3; i++) {
                positions[i * 3 + 1] -= this.rainVelocities[i] * deltaTime;

                if (positions[i * 3 + 1] < 0) {
                    positions[i * 3 + 1] = 50;
                    positions[i * 3] = playerPos.x + (Math.random() - 0.5) * 200;
                    positions[i * 3 + 2] = playerPos.z + (Math.random() - 0.5) * 200;
                }
            }
            this.rainParticles.geometry.attributes.position.needsUpdate = true;
        }
    }
}
