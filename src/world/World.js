// src/world/World.js

import * as THREE from 'three';
import { GAME_CONFIG } from '../utils/Constants.js';
import { Roads } from './Roads.js';
import { Buildings } from './Buildings.js';
import { Traffic } from './Traffic.js';
import { Obstacles } from './Obstacles.js';
import { Pedestrians } from './Pedestrians.js';
import { Weather } from './Weather.js';
import { DayNightCycle } from './DayNight.js';

export class World {
    constructor(scene, physics) {
        this.scene = scene;
        this.physics = physics;
        this.roads = new Roads(scene);
        this.buildings = new Buildings(scene, physics);
        this.traffic = null;
        this.obstacles = null;
        this.pedestrians = null;
        this.weather = new Weather(scene);
        this.dayNight = new DayNightCycle(scene);
        this.deliveryMarkers = [];
    }

    generate(onProgress) {
        if (onProgress) onProgress('إنشاء الطرق...');
        const { roads, intersections } = this.roads.generate();

        if (onProgress) onProgress('بناء المدينة...');
        this.buildings.generate();

        // Ground plane
        const groundGeom = new THREE.PlaneGeometry(GAME_CONFIG.WORLD_SIZE, GAME_CONFIG.WORLD_SIZE);
        const groundMat = new THREE.MeshStandardMaterial({
            color: GAME_CONFIG.COLORS.SAND,
            roughness: 1.0
        });
        const ground = new THREE.Mesh(groundGeom, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        if (onProgress) onProgress('إضافة المركبات...');
        this.traffic = new Traffic(this.scene, this.roads, this.physics);
        this.traffic.generate();

        if (onProgress) onProgress('إضافة العوائق...');
        this.obstacles = new Obstacles(this.scene, this.roads, this.physics);
        this.obstacles.generate();

        if (onProgress) onProgress('إضافة المشاة...');
        this.pedestrians = new Pedestrians(this.scene, this.roads);
        this.pedestrians.generate();

        // Setup lighting
        this.dayNight.setup();

        // Add some decorative elements
        this.addDecorations();

        if (onProgress) onProgress('جاهز!');
    }

    addDecorations() {
        // Street lights
        const intersections = this.roads.intersections;
        intersections.forEach(inter => {
            if (Math.random() > 0.4) return;

            const poleGeom = new THREE.CylinderGeometry(0.06, 0.06, 5, 6);
            const poleMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.6 });
            const pole = new THREE.Mesh(poleGeom, poleMat);
            pole.position.set(inter.x + 5.5, 2.5, inter.z + 5.5);
            pole.castShadow = true;
            this.scene.add(pole);

            // Lamp
            const lampGeom = new THREE.SphereGeometry(0.2, 6, 6);
            const lampMat = new THREE.MeshStandardMaterial({
                color: 0xffffaa,
                emissive: 0xffffaa,
                emissiveIntensity: 0.3
            });
            const lamp = new THREE.Mesh(lampGeom, lampMat);
            lamp.position.set(inter.x + 5.5, 5.2, inter.z + 5.5);
            this.scene.add(lamp);
        });

        // Palm trees
        for (let i = 0; i < 15; i++) {
            const pos = this.roads.getRandomRoadPosition();
            pos.z += (Math.random() > 0.5 ? 1 : -1) * (GAME_CONFIG.ROAD_WIDTH / 2 + 3);

            const trunkGeom = new THREE.CylinderGeometry(0.15, 0.2, 6, 6);
            const trunkMat = new THREE.MeshStandardMaterial({ color: 0x775533 });
            const trunk = new THREE.Mesh(trunkGeom, trunkMat);
            trunk.position.set(pos.x, 3, pos.z);
            trunk.castShadow = true;
            this.scene.add(trunk);

            // Leaves
            for (let l = 0; l < 5; l++) {
                const leafGeom = new THREE.ConeGeometry(0.3, 3, 4);
                const leafMat = new THREE.MeshStandardMaterial({ color: 0x337722 });
                const leaf = new THREE.Mesh(leafGeom, leafMat);
                const angle = (l / 5) * Math.PI * 2;
                leaf.position.set(
                    pos.x + Math.cos(angle) * 1,
                    6.5,
                    pos.z + Math.sin(angle) * 1
                );
                leaf.rotation.z = Math.cos(angle) * 0.8;
                leaf.rotation.x = Math.sin(angle) * 0.8;
                leaf.castShadow = true;
                this.scene.add(leaf);
            }
        }

        // Moroccan flags
        for (let i = 0; i < 5; i++) {
            const pos = this.roads.getRandomRoadPosition();
            const flagPole = new THREE.Mesh(
                new THREE.CylinderGeometry(0.03, 0.03, 4, 4),
                new THREE.MeshStandardMaterial({ color: 0xcccccc })
            );
            flagPole.position.set(pos.x, 2, pos.z + 7);
            this.scene.add(flagPole);

            const flag = new THREE.Mesh(
                new THREE.PlaneGeometry(1.5, 1),
                new THREE.MeshStandardMaterial({
                    color: 0xff0000,
                    side: THREE.DoubleSide
                })
            );
            flag.position.set(pos.x + 0.75, 3.5, pos.z + 7);
            this.scene.add(flag);

            // Star on flag
            const star = new THREE.Mesh(
                new THREE.CircleGeometry(0.15, 5),
                new THREE.MeshStandardMaterial({
                    color: 0x006233,
                    side: THREE.DoubleSide
                })
            );
            star.position.set(pos.x + 0.75, 3.5, pos.z + 7.01);
            this.scene.add(star);
        }
    }

    createDeliveryMarker(x, z, type = 'pickup') {
        const group = new THREE.Group();

        const color = type === 'pickup' ? 0x33ff33 : 0xff3333;
        const emoji = type === 'pickup' ? '📦' : '🏠';

        // Cylinder base
        const baseGeom = new THREE.CylinderGeometry(1.5, 1.5, 0.1, 16);
        const baseMat = new THREE.MeshStandardMaterial({
            color,
            transparent: true,
            opacity: 0.5,
            emissive: color,
            emissiveIntensity: 0.5
        });
        const base = new THREE.Mesh(baseGeom, baseMat);
        base.position.y = 0.1;
        group.add(base);

        // Arrow
        const arrowGeom = new THREE.ConeGeometry(0.4, 1.5, 8);
        const arrowMat = new THREE.MeshStandardMaterial({
            color,
            emissive: color,
            emissiveIntensity: 0.8
        });
        const arrow = new THREE.Mesh(arrowGeom, arrowMat);
        arrow.position.y = 4;
        group.add(arrow);

        // Pole
        const poleGeom = new THREE.CylinderGeometry(0.05, 0.05, 3, 4);
        const poleMat = new THREE.MeshStandardMaterial({ color });
        const pole = new THREE.Mesh(poleGeom, poleMat);
        pole.position.y = 2;
        group.add(pole);

        group.position.set(x, 0, z);
        group.userData = { type, time: 0 };
        this.scene.add(group);
        this.deliveryMarkers.push(group);
        return group;
    }

    removeDeliveryMarker(marker) {
        const idx = this.deliveryMarkers.indexOf(marker);
        if (idx !== -1) {
            this.deliveryMarkers.splice(idx, 1);
            marker.traverse(child => {
                if (child.isMesh) {
                    child.geometry.dispose();
                    if (child.material.dispose) child.material.dispose();
                }
            });
            this.scene.remove(marker);
        }
    }

    clearDeliveryMarkers() {
        [...this.deliveryMarkers].forEach(m => this.removeDeliveryMarker(m));
    }

    update(deltaTime, playerPos) {
        if (this.traffic) this.traffic.update(deltaTime, playerPos);
        if (this.obstacles) this.obstacles.update(deltaTime);
        if (this.pedestrians) this.pedestrians.update(deltaTime, playerPos);
        if (this.weather) this.weather.update(deltaTime, playerPos);
        if (this.dayNight) this.dayNight.update(deltaTime);

        // Animate delivery markers
        this.deliveryMarkers.forEach(marker => {
            marker.userData.time += deltaTime;
            // Bob up and down
            const arrow = marker.children[1];
            if (arrow) {
                arrow.position.y = 4 + Math.sin(marker.userData.time * 3) * 0.5;
            }
            // Rotate base
            const base = marker.children[0];
            if (base) {
                base.rotation.y += deltaTime;
            }
        });
    }

    setWeather(type) {
        this.weather.setWeather(type);
    }

    setTimeOfDay(mode) {
        this.dayNight.setMode(mode);
    }
}
