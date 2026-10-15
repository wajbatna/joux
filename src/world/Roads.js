// src/world/Roads.js

import * as THREE from 'three';
import { GAME_CONFIG } from '../utils/Constants.js';

export class Roads {
    constructor(scene) {
        this.scene = scene;
        this.roadData = [];
        this.intersections = [];
    }

    generate() {
        const { GRID_SIZE, BLOCK_SIZE, ROAD_WIDTH, WORLD_SIZE } = GAME_CONFIG;
        const half = (GRID_SIZE * BLOCK_SIZE) / 2;

        const roadMat = new THREE.MeshStandardMaterial({
            color: GAME_CONFIG.COLORS.ROAD,
            roughness: 0.9,
            metalness: 0.1
        });

        const lineMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.8
        });

        const sidewalkMat = new THREE.MeshStandardMaterial({
            color: GAME_CONFIG.COLORS.SIDEWALK,
            roughness: 0.8
        });

        // Horizontal roads
        for (let i = 0; i <= GRID_SIZE; i++) {
            const z = -half + i * BLOCK_SIZE;
            const roadGeom = new THREE.PlaneGeometry(GRID_SIZE * BLOCK_SIZE, ROAD_WIDTH);
            const road = new THREE.Mesh(roadGeom, roadMat);
            road.rotation.x = -Math.PI / 2;
            road.position.set(0, 0.01, z);
            road.receiveShadow = true;
            this.scene.add(road);

            this.roadData.push({
                horizontal: true,
                z: z,
                x1: -half,
                x2: half
            });

            // Center line
            const lineGeom = new THREE.PlaneGeometry(GRID_SIZE * BLOCK_SIZE, 0.15);
            const line = new THREE.Mesh(lineGeom, lineMat);
            line.rotation.x = -Math.PI / 2;
            line.position.set(0, 0.02, z);
            this.scene.add(line);

            // Dashed lines
            for (let d = -half; d < half; d += 4) {
                const dashGeom = new THREE.PlaneGeometry(2, 0.1);
                const dashTop = new THREE.Mesh(dashGeom, lineMat);
                dashTop.rotation.x = -Math.PI / 2;
                dashTop.position.set(d, 0.02, z + ROAD_WIDTH * 0.25);
                this.scene.add(dashTop);

                const dashBot = dashTop.clone();
                dashBot.position.z = z - ROAD_WIDTH * 0.25;
                this.scene.add(dashBot);
            }

            // Sidewalks
            const swGeom = new THREE.BoxGeometry(GRID_SIZE * BLOCK_SIZE, 0.25, GAME_CONFIG.SIDEWALK_WIDTH);
            const swTop = new THREE.Mesh(swGeom, sidewalkMat);
            swTop.position.set(0, 0.125, z + ROAD_WIDTH / 2 + GAME_CONFIG.SIDEWALK_WIDTH / 2);
            swTop.receiveShadow = true;
            swTop.castShadow = true;
            this.scene.add(swTop);

            const swBot = new THREE.Mesh(swGeom, sidewalkMat);
            swBot.position.set(0, 0.125, z - ROAD_WIDTH / 2 - GAME_CONFIG.SIDEWALK_WIDTH / 2);
            swBot.receiveShadow = true;
            swBot.castShadow = true;
            this.scene.add(swBot);
        }

        // Vertical roads
        for (let i = 0; i <= GRID_SIZE; i++) {
            const x = -half + i * BLOCK_SIZE;
            const roadGeom = new THREE.PlaneGeometry(ROAD_WIDTH, GRID_SIZE * BLOCK_SIZE);
            const road = new THREE.Mesh(roadGeom, roadMat);
            road.rotation.x = -Math.PI / 2;
            road.position.set(x, 0.01, 0);
            road.receiveShadow = true;
            this.scene.add(road);

            this.roadData.push({
                horizontal: false,
                x: x,
                z1: -half,
                z2: half
            });

            // Center line
            const lineGeom = new THREE.PlaneGeometry(0.15, GRID_SIZE * BLOCK_SIZE);
            const line = new THREE.Mesh(lineGeom, lineMat);
            line.rotation.x = -Math.PI / 2;
            line.position.set(x, 0.02, 0);
            this.scene.add(line);

            // Sidewalks
            const swGeom = new THREE.BoxGeometry(GAME_CONFIG.SIDEWALK_WIDTH, 0.25, GRID_SIZE * BLOCK_SIZE);
            const swLeft = new THREE.Mesh(swGeom, sidewalkMat);
            swLeft.position.set(x - ROAD_WIDTH / 2 - GAME_CONFIG.SIDEWALK_WIDTH / 2, 0.125, 0);
            swLeft.receiveShadow = true;
            this.scene.add(swLeft);

            const swRight = new THREE.Mesh(swGeom, sidewalkMat);
            swRight.position.set(x + ROAD_WIDTH / 2 + GAME_CONFIG.SIDEWALK_WIDTH / 2, 0.125, 0);
            swRight.receiveShadow = true;
            this.scene.add(swRight);
        }

        // Record intersections
        for (let i = 0; i <= GRID_SIZE; i++) {
            for (let j = 0; j <= GRID_SIZE; j++) {
                this.intersections.push({
                    x: -half + i * BLOCK_SIZE,
                    z: -half + j * BLOCK_SIZE
                });
            }
        }

        return { roads: this.roadData, intersections: this.intersections };
    }

    getRandomRoadPosition() {
        const road = this.roadData[Math.floor(Math.random() * this.roadData.length)];
        if (road.horizontal) {
            return {
                x: road.x1 + Math.random() * (road.x2 - road.x1),
                z: road.z + (Math.random() - 0.5) * 4
            };
        } else {
            return {
                x: road.x + (Math.random() - 0.5) * 4,
                z: road.z1 + Math.random() * (road.z2 - road.z1)
            };
        }
    }

    getRandomIntersection() {
        return this.intersections[Math.floor(Math.random() * this.intersections.length)];
    }
}
