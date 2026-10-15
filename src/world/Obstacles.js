// src/world/Obstacles.js

import * as THREE from 'three';
import { GAME_CONFIG } from '../utils/Constants.js';
import { randomRange } from '../utils/MathUtils.js';

export class Obstacles {
    constructor(scene, roads, physics) {
        this.scene = scene;
        this.roads = roads;
        this.physics = physics;
        this.obstacles = [];
        this.activeEvents = [];
    }

    generate() {
        this.generatePotholes();
        this.generateSpeedBumps();
        this.generateTrafficLights();
        this.generatePoliceCheckpoints();
        this.generateMarketStalls();
    }

    generatePotholes() {
        for (let i = 0; i < 20; i++) {
            const pos = this.roads.getRandomRoadPosition();
            const size = randomRange(0.5, 1.5);

            const geom = new THREE.CircleGeometry(size, 8);
            const mat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 1.0 });
            const pothole = new THREE.Mesh(geom, mat);
            pothole.rotation.x = -Math.PI / 2;
            pothole.position.set(pos.x, 0.015, pos.z);
            this.scene.add(pothole);

            this.obstacles.push({
                type: 'pothole',
                position: { x: pos.x, z: pos.z },
                radius: size,
                mesh: pothole
            });
        }
    }

    generateSpeedBumps() {
        for (let i = 0; i < 10; i++) {
            const pos = this.roads.getRandomRoadPosition();

            const geom = new THREE.BoxGeometry(GAME_CONFIG.ROAD_WIDTH - 2, 0.2, 0.8);
            const mat = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.7 });
            const bump = new THREE.Mesh(geom, mat);
            bump.position.set(pos.x, 0.1, pos.z);
            bump.castShadow = true;
            this.scene.add(bump);

            // Stripes
            for (let s = -4; s < 4; s += 1.5) {
                const stripeGeom = new THREE.BoxGeometry(0.3, 0.22, 0.82);
                const stripeMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
                const stripe = new THREE.Mesh(stripeGeom, stripeMat);
                stripe.position.set(pos.x + s, 0.11, pos.z);
                this.scene.add(stripe);
            }

            this.obstacles.push({
                type: 'speedbump',
                position: { x: pos.x, z: pos.z },
                radius: GAME_CONFIG.ROAD_WIDTH / 2,
                mesh: bump
            });
        }
    }

    generateTrafficLights() {
        const intersections = this.roads.intersections;
        const selectedIntersections = intersections.filter(() => Math.random() > 0.6);

        selectedIntersections.forEach(inter => {
            const poleGeom = new THREE.CylinderGeometry(0.08, 0.08, 4, 6);
            const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5 });
            const pole = new THREE.Mesh(poleGeom, poleMat);
            pole.position.set(inter.x + 5, 2, inter.z + 5);
            pole.castShadow = true;
            this.scene.add(pole);

            // Light box
            const boxGeom = new THREE.BoxGeometry(0.4, 1.0, 0.3);
            const boxMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
            const box = new THREE.Mesh(boxGeom, boxMat);
            box.position.set(inter.x + 5, 4.2, inter.z + 5);
            this.scene.add(box);

            // Lights
            const lightColors = [0xff0000, 0xffaa00, 0x00ff00];
            const lightPositions = [4.6, 4.2, 3.8];
            const lights = lightColors.map((color, idx) => {
                const lightGeom = new THREE.SphereGeometry(0.1, 8, 8);
                const lightMat = new THREE.MeshStandardMaterial({
                    color,
                    emissive: color,
                    emissiveIntensity: idx === 2 ? 1.0 : 0.1
                });
                const light = new THREE.Mesh(lightGeom, lightMat);
                light.position.set(inter.x + 5, lightPositions[idx], inter.z + 5.16);
                this.scene.add(light);
                return { mesh: light, color, mat: lightMat };
            });

            this.obstacles.push({
                type: 'traffic_light',
                position: inter,
                lights,
                state: 'green',
                timer: randomRange(5, 15)
            });
        });
    }

    generatePoliceCheckpoints() {
        for (let i = 0; i < 3; i++) {
            const pos = this.roads.getRandomRoadPosition();

            // Barrier
            const barrierGeom = new THREE.BoxGeometry(6, 1.0, 0.3);
            const barrierMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
            const barrier = new THREE.Mesh(barrierGeom, barrierMat);
            barrier.position.set(pos.x, 0.5, pos.z);
            barrier.castShadow = true;
            this.scene.add(barrier);

            // Stripes
            for (let s = -2.5; s < 2.5; s += 1) {
                const stripeGeom = new THREE.BoxGeometry(0.3, 0.8, 0.32);
                const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
                const stripe = new THREE.Mesh(stripeGeom, stripeMat);
                stripe.position.set(pos.x + s, 0.5, pos.z);
                this.scene.add(stripe);
            }

            // Police officer
            const officerGroup = new THREE.Group();
            const bodyGeom = new THREE.CylinderGeometry(0.2, 0.15, 0.8, 8);
            const bodyMat = new THREE.MeshStandardMaterial({ color: 0x223344 });
            const body = new THREE.Mesh(bodyGeom, bodyMat);
            body.position.y = 1.0;
            officerGroup.add(body);

            const headGeom = new THREE.SphereGeometry(0.15, 8, 8);
            const headMat = new THREE.MeshStandardMaterial({ color: 0xddbb99 });
            const head = new THREE.Mesh(headGeom, headMat);
            head.position.y = 1.55;
            officerGroup.add(head);

            const capGeom = new THREE.CylinderGeometry(0.17, 0.2, 0.12, 8);
            const capMat = new THREE.MeshStandardMaterial({ color: 0x223344 });
            const cap = new THREE.Mesh(capGeom, capMat);
            cap.position.y = 1.72;
            officerGroup.add(cap);

            officerGroup.position.set(pos.x + 3, 0, pos.z + 1.5);
            officerGroup.castShadow = true;
            this.scene.add(officerGroup);

            this.physics.addCollider(pos.x, pos.z, 6, 0.5, 'checkpoint');

            this.obstacles.push({
                type: 'police',
                position: { x: pos.x, z: pos.z },
                radius: 6,
                barrier,
                officer: officerGroup,
                active: true
            });
        }
    }

    generateMarketStalls() {
        for (let i = 0; i < 5; i++) {
            const pos = this.roads.getRandomRoadPosition();

            // Stall structure
            const stallGeom = new THREE.BoxGeometry(3, 2, 2);
            const stallMat = new THREE.MeshStandardMaterial({ color: GAME_CONFIG.COLORS.MARKET, roughness: 0.9 });
            const stall = new THREE.Mesh(stallGeom, stallMat);
            stall.position.set(pos.x, 1, pos.z);
            stall.castShadow = true;
            this.scene.add(stall);

            // Canopy
            const canopyGeom = new THREE.BoxGeometry(3.5, 0.1, 2.5);
            const canopyColors = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44, 0xff8800];
            const canopyMat = new THREE.MeshStandardMaterial({
                color: canopyColors[Math.floor(Math.random() * canopyColors.length)]
            });
            const canopy = new THREE.Mesh(canopyGeom, canopyMat);
            canopy.position.set(pos.x, 2.5, pos.z);
            this.scene.add(canopy);

            // Goods
            for (let g = 0; g < 3; g++) {
                const goodGeom = new THREE.SphereGeometry(0.2, 6, 6);
                const goodMat = new THREE.MeshStandardMaterial({
                    color: [0xff6600, 0xff0000, 0x00ff00, 0xffff00][Math.floor(Math.random() * 4)]
                });
                const good = new THREE.Mesh(goodGeom, goodMat);
                good.position.set(pos.x + randomRange(-1, 1), 2.1, pos.z + randomRange(-0.5, 0.5));
                this.scene.add(good);
            }

            this.physics.addCollider(pos.x, pos.z, 3, 2, 'market');

            this.obstacles.push({
                type: 'market',
                position: { x: pos.x, z: pos.z },
                radius: 3,
                mesh: stall
            });
        }
    }

    update(deltaTime) {
        // Update traffic lights
        this.obstacles.forEach(obs => {
            if (obs.type === 'traffic_light') {
                obs.timer -= deltaTime;
                if (obs.timer <= 0) {
                    if (obs.state === 'green') {
                        obs.state = 'yellow';
                        obs.timer = 3;
                    } else if (obs.state === 'yellow') {
                        obs.state = 'red';
                        obs.timer = randomRange(8, 15);
                    } else {
                        obs.state = 'green';
                        obs.timer = randomRange(8, 15);
                    }

                    // Update light visuals
                    if (obs.lights) {
                        obs.lights.forEach((light, idx) => {
                            const isActive = (obs.state === 'red' && idx === 0) ||
                                           (obs.state === 'yellow' && idx === 1) ||
                                           (obs.state === 'green' && idx === 2);
                            light.mat.emissiveIntensity = isActive ? 1.0 : 0.1;
                        });
                    }
                }
            }
        });
    }

    checkPlayerNearObstacle(px, pz, radius = 5) {
        const nearby = [];
        this.obstacles.forEach(obs => {
            const dx = px - obs.position.x;
            const dz = pz - obs.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < (obs.radius || radius)) {
                nearby.push({ ...obs, distance: dist });
            }
        });
        return nearby;
    }
}
