// src/world/DayNight.js

import * as THREE from 'three';
import { lerp } from '../utils/MathUtils.js';

export class DayNightCycle {
    constructor(scene) {
        this.scene = scene;
        this.timeOfDay = 0.35; // 0-1 cycle
        this.sunLight = null;
        this.ambientLight = null;
        this.mode = 'day'; // 'day', 'sunset', 'night'
    }

    setup() {
        // Ambient light
        this.ambientLight = new THREE.AmbientLight(0x8899aa, 0.4);
        this.scene.add(this.ambientLight);

        // Directional sun light
        this.sunLight = new THREE.DirectionalLight(0xffffcc, 1.0);
        this.sunLight.position.set(50, 80, 30);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 300;
        this.sunLight.shadow.camera.left = -100;
        this.sunLight.shadow.camera.right = 100;
        this.sunLight.shadow.camera.top = 100;
        this.sunLight.shadow.camera.bottom = -100;
        this.scene.add(this.sunLight);

        // Hemisphere light for better ambient
        this.hemiLight = new THREE.HemisphereLight(0x88aacc, 0x554433, 0.3);
        this.scene.add(this.hemiLight);

        this.setMode('day');
    }

    setMode(mode) {
        this.mode = mode;

        switch (mode) {
            case 'day':
                this.scene.background = new THREE.Color(0x87CEEB);
                this.scene.fog = new THREE.Fog(0x87CEEB, 100, 400);
                this.sunLight.intensity = 1.0;
                this.sunLight.color.setHex(0xffffcc);
                this.ambientLight.intensity = 0.5;
                this.ambientLight.color.setHex(0x8899aa);
                this.sunLight.position.set(50, 80, 30);
                break;

            case 'sunset':
                this.scene.background = new THREE.Color(0xff8844);
                this.scene.fog = new THREE.Fog(0xff6633, 80, 350);
                this.sunLight.intensity = 0.7;
                this.sunLight.color.setHex(0xff8844);
                this.ambientLight.intensity = 0.3;
                this.ambientLight.color.setHex(0xff6633);
                this.sunLight.position.set(10, 20, 50);
                break;

            case 'night':
                this.scene.background = new THREE.Color(0x0a0a1a);
                this.scene.fog = new THREE.Fog(0x0a0a1a, 50, 200);
                this.sunLight.intensity = 0.15;
                this.sunLight.color.setHex(0x4466aa);
                this.ambientLight.intensity = 0.15;
                this.ambientLight.color.setHex(0x223355);
                this.sunLight.position.set(0, 50, 0);
                break;
        }
    }

    update(deltaTime) {
        // Could add gradual cycling if desired
    }
}
