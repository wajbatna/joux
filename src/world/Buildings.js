// src/world/Buildings.js

import * as THREE from 'three';
import { GAME_CONFIG } from '../utils/Constants.js';
import { randomRange, randomInt } from '../utils/MathUtils.js';

export class Buildings {
    constructor(scene, physics) {
        this.scene = scene;
        this.physics = physics;
    }

    generate() {
        const { GRID_SIZE, BLOCK_SIZE, ROAD_WIDTH, SIDEWALK_WIDTH } = GAME_CONFIG;
        const half = (GRID_SIZE * BLOCK_SIZE) / 2;
        const innerSize = BLOCK_SIZE - ROAD_WIDTH - SIDEWALK_WIDTH * 2 - 2;

        for (let gx = 0; gx < GRID_SIZE; gx++) {
            for (let gz = 0; gz < GRID_SIZE; gz++) {
                const blockCenterX = -half + gx * BLOCK_SIZE + BLOCK_SIZE / 2;
                const blockCenterZ = -half + gz * BLOCK_SIZE + BLOCK_SIZE / 2;

                this.generateBlock(blockCenterX, blockCenterZ, innerSize);
            }
        }
    }

    generateBlock(cx, cz, size) {
        const buildingCount = randomInt(3, 6);
        const hs = size / 2;

        for (let i = 0; i < buildingCount; i++) {
            const bw = randomRange(5, Math.min(15, size * 0.4));
            const bd = randomRange(5, Math.min(15, size * 0.4));
            const bh = randomRange(GAME_CONFIG.BUILDING_MIN_HEIGHT, GAME_CONFIG.BUILDING_MAX_HEIGHT);

            let bx = cx + randomRange(-hs + bw / 2, hs - bw / 2);
            let bz = cz + randomRange(-hs + bd / 2, hs - bd / 2);

            this.createBuilding(bx, bz, bw, bd, bh);
        }
    }

    createBuilding(x, z, w, d, h) {
        const colors = GAME_CONFIG.COLORS.BUILDING_BASE;
        const accents = GAME_CONFIG.COLORS.BUILDING_ACCENT;
        const baseColor = colors[Math.floor(Math.random() * colors.length)];
        const accentColor = accents[Math.floor(Math.random() * accents.length)];

        // Main building
        const geom = new THREE.BoxGeometry(w, h, d);
        const mat = new THREE.MeshStandardMaterial({
            color: baseColor,
            roughness: 0.85,
            metalness: 0.1
        });

        const building = new THREE.Mesh(geom, mat);
        building.position.set(x, h / 2, z);
        building.castShadow = true;
        building.receiveShadow = true;
        this.scene.add(building);

        // Add collider
        this.physics.addCollider(x, z, w, d, 'building');

        // Windows
        const windowMat = new THREE.MeshStandardMaterial({
            color: accentColor,
            roughness: 0.5,
            metalness: 0.3
        });

        const windowSize = 0.8;
        const windowSpacing = 2.5;

        // Front and back windows
        for (let wy = 3; wy < h - 2; wy += windowSpacing) {
            for (let wx = -w / 2 + 2; wx < w / 2 - 1; wx += windowSpacing) {
                const windowGeom = new THREE.PlaneGeometry(windowSize, windowSize * 1.3);

                const winFront = new THREE.Mesh(windowGeom, windowMat);
                winFront.position.set(x + wx, wy, z + d / 2 + 0.01);
                this.scene.add(winFront);

                const winBack = new THREE.Mesh(windowGeom, windowMat);
                winBack.position.set(x + wx, wy, z - d / 2 - 0.01);
                winBack.rotation.y = Math.PI;
                this.scene.add(winBack);
            }
        }

        // Side windows
        for (let wy = 3; wy < h - 2; wy += windowSpacing) {
            for (let wz = -d / 2 + 2; wz < d / 2 - 1; wz += windowSpacing) {
                const windowGeom = new THREE.PlaneGeometry(windowSize, windowSize * 1.3);

                const winLeft = new THREE.Mesh(windowGeom, windowMat);
                winLeft.position.set(x - w / 2 - 0.01, wy, z + wz);
                winLeft.rotation.y = -Math.PI / 2;
                this.scene.add(winLeft);

                const winRight = new THREE.Mesh(windowGeom, windowMat);
                winRight.position.set(x + w / 2 + 0.01, wy, z + wz);
                winRight.rotation.y = Math.PI / 2;
                this.scene.add(winRight);
            }
        }

        // Door
        if (Math.random() > 0.3) {
            const doorGeom = new THREE.PlaneGeometry(1.2, 2.2);
            const doorMat = new THREE.MeshStandardMaterial({ color: 0x553311, roughness: 0.7 });
            const door = new THREE.Mesh(doorGeom, doorMat);
            door.position.set(x, 1.1, z + d / 2 + 0.02);
            this.scene.add(door);

            // Moroccan door arch
            const archGeom = new THREE.CircleGeometry(0.6, 8, 0, Math.PI);
            const archMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.5 });
            const arch = new THREE.Mesh(archGeom, archMat);
            arch.position.set(x, 2.2, z + d / 2 + 0.03);
            this.scene.add(arch);
        }

        // Roof details
        if (Math.random() > 0.5) {
            const roofGeom = new THREE.BoxGeometry(w + 0.5, 0.3, d + 0.5);
            const roofMat = new THREE.MeshStandardMaterial({ color: 0x996644, roughness: 0.8 });
            const roof = new THREE.Mesh(roofGeom, roofMat);
            roof.position.set(x, h + 0.15, z);
            roof.castShadow = true;
            this.scene.add(roof);
        }

        // Satellite dish on some roofs
        if (Math.random() > 0.6) {
            const dishGeom = new THREE.SphereGeometry(0.5, 6, 6, 0, Math.PI);
            const dishMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 });
            const dish = new THREE.Mesh(dishGeom, dishMat);
            dish.position.set(x + randomRange(-w / 3, w / 3), h + 0.5, z + randomRange(-d / 3, d / 3));
            dish.rotation.x = -0.5;
            this.scene.add(dish);
        }
    }
}
