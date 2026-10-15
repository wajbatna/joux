// src/world/Pedestrians.js

import * as THREE from 'three';
import { GAME_CONFIG } from '../utils/Constants.js';
import { randomRange, distance2D } from '../utils/MathUtils.js';

export class Pedestrians {
    constructor(scene, roads) {
        this.scene = scene;
        this.roads = roads;
        this.peds = [];
    }

    generate() {
        const count = GAME_CONFIG.PEDESTRIAN_COUNT;
        const colors = [0x2244aa, 0xaa2244, 0x44aa22, 0xdddddd, 0xaa8844, 0x884422, 0x336655];

        for (let i = 0; i < count; i++) {
            const pos = this.roads.getRandomRoadPosition();
            // Offset to sidewalk
            pos.z += (Math.random() > 0.5 ? 1 : -1) * (GAME_CONFIG.ROAD_WIDTH / 2 + 1);

            const ped = this.createPedestrian(
                colors[Math.floor(Math.random() * colors.length)]
            );

            ped.mesh.position.set(pos.x, 0, pos.z);
            this.scene.add(ped.mesh);
            this.peds.push(ped);
        }
    }

    createPedestrian(clothColor) {
        const group = new THREE.Group();

        // Body
        const bodyGeom = new THREE.CylinderGeometry(0.15, 0.12, 0.7, 6);
        const bodyMat = new THREE.MeshStandardMaterial({ color: clothColor });
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        body.position.y = 1.0;
        body.castShadow = true;
        group.add(body);

        // Head
        const headGeom = new THREE.SphereGeometry(0.12, 6, 6);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xddbb99 });
        const head = new THREE.Mesh(headGeom, headMat);
        head.position.y = 1.5;
        group.add(head);

        // Legs
        const legGeom = new THREE.CylinderGeometry(0.06, 0.05, 0.5, 5);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x333333 });

        const leftLeg = new THREE.Mesh(legGeom, legMat);
        leftLeg.position.set(-0.08, 0.4, 0);
        group.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeom, legMat);
        rightLeg.position.set(0.08, 0.4, 0);
        group.add(rightLeg);

        // Some wear traditional Moroccan clothing
        if (Math.random() > 0.5) {
            const djellaba = new THREE.Mesh(
                new THREE.ConeGeometry(0.25, 1.2, 8),
                new THREE.MeshStandardMaterial({ color: clothColor })
            );
            djellaba.position.y = 0.9;
            group.add(djellaba);
        }

        return {
            mesh: group,
            speed: randomRange(0.5, 2),
            direction: randomRange(0, Math.PI * 2),
            state: 'walking',
            stateTimer: randomRange(2, 10),
            walkTimer: 0
        };
    }

    update(deltaTime, playerPos) {
        this.peds.forEach(ped => {
            ped.stateTimer -= deltaTime;
            ped.walkTimer += deltaTime;

            if (ped.stateTimer <= 0) {
                if (ped.state === 'walking') {
                    ped.state = 'idle';
                    ped.stateTimer = randomRange(2, 8);
                } else {
                    ped.state = 'walking';
                    ped.direction = randomRange(0, Math.PI * 2);
                    ped.stateTimer = randomRange(3, 12);
                }
            }

            // Flee from player if close
            const dist = distance2D(
                ped.mesh.position.x, ped.mesh.position.z,
                playerPos.x, playerPos.z
            );

            if (dist < 5) {
                const awayAngle = Math.atan2(
                    ped.mesh.position.x - playerPos.x,
                    ped.mesh.position.z - playerPos.z
                );
                ped.direction = awayAngle;
                ped.state = 'walking';
                ped.speed = 3;
            } else {
                ped.speed = randomRange(0.5, 2);
            }

            if (ped.state === 'walking') {
                ped.mesh.position.x += Math.sin(ped.direction) * ped.speed * deltaTime;
                ped.mesh.position.z += Math.cos(ped.direction) * ped.speed * deltaTime;
                ped.mesh.rotation.y = ped.direction;

                // Walking animation
                const legSwing = Math.sin(ped.walkTimer * 5) * 0.3;
                if (ped.mesh.children[2]) ped.mesh.children[2].rotation.x = legSwing;
                if (ped.mesh.children[3]) ped.mesh.children[3].rotation.x = -legSwing;
            }

            // Keep in bounds
            const bound = GAME_CONFIG.WORLD_SIZE / 2 - 5;
            if (Math.abs(ped.mesh.position.x) > bound) ped.direction = Math.PI - ped.direction;
            if (Math.abs(ped.mesh.position.z) > bound) ped.direction = -ped.direction;
            ped.mesh.position.x = Math.max(-bound, Math.min(bound, ped.mesh.position.x));
            ped.mesh.position.z = Math.max(-bound, Math.min(bound, ped.mesh.position.z));
        });
    }
}
