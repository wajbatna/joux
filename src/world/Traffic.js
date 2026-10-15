// src/world/Traffic.js

import * as THREE from 'three';
import { GAME_CONFIG } from '../utils/Constants.js';
import { randomRange, distance2D, angleBetween } from '../utils/MathUtils.js';

export class Traffic {
    constructor(scene, roads, physics) {
        this.scene = scene;
        this.roads = roads;
        this.physics = physics;
        this.vehicles = [];
    }

    generate() {
        const count = GAME_CONFIG.TRAFFIC_COUNT;

        for (let i = 0; i < count; i++) {
            const type = Math.random();
            let vehicle;

            if (type < 0.35) {
                vehicle = this.createSmallTaxi();
            } else if (type < 0.55) {
                vehicle = this.createLargeTaxi();
            } else if (type < 0.7) {
                vehicle = this.createBus();
            } else if (type < 0.85) {
                vehicle = this.createCar();
            } else {
                vehicle = this.createDonkeyCart();
            }

            this.vehicles.push(vehicle);
        }
    }

    createVehicleBase(color, w, h, d) {
        const group = new THREE.Group();
        const bodyGeom = new THREE.BoxGeometry(w, h, d);
        const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.3 });
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        body.position.y = h / 2 + 0.4;
        body.castShadow = true;
        group.add(body);

        // Wheels
        const wheelGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 8);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const positions = [
            [-w / 2 - 0.1, 0.35, d / 2 - 0.5],
            [w / 2 + 0.1, 0.35, d / 2 - 0.5],
            [-w / 2 - 0.1, 0.35, -d / 2 + 0.5],
            [w / 2 + 0.1, 0.35, -d / 2 + 0.5]
        ];
        positions.forEach(([x, y, z]) => {
            const wheel = new THREE.Mesh(wheelGeom, wheelMat);
            wheel.position.set(x, y, z);
            wheel.rotation.z = Math.PI / 2;
            group.add(wheel);
        });

        return group;
    }

    createSmallTaxi() {
        const group = this.createVehicleBase(GAME_CONFIG.COLORS.TAXI_SMALL, 1.8, 1.2, 4);

        // Taxi sign
        const signGeom = new THREE.BoxGeometry(0.6, 0.3, 0.3);
        const signMat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 0.3 });
        const sign = new THREE.Mesh(signGeom, signMat);
        sign.position.set(0, 2.0, 0);
        group.add(sign);

        // Windshield
        const wsGeom = new THREE.PlaneGeometry(1.6, 0.8);
        const wsMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, metalness: 0.5, roughness: 0.2, transparent: true, opacity: 0.7 });
        const ws = new THREE.Mesh(wsGeom, wsMat);
        ws.position.set(0, 1.5, 1.8);
        ws.rotation.x = -0.2;
        group.add(ws);

        return this.setupVehicle(group, 'taxi', 1.8, 4);
    }

    createLargeTaxi() {
        const group = this.createVehicleBase(GAME_CONFIG.COLORS.TAXI_LARGE, 2.0, 1.5, 5);

        // Blue stripe
        const stripeGeom = new THREE.BoxGeometry(2.02, 0.3, 5.02);
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0x2244aa });
        const stripe = new THREE.Mesh(stripeGeom, stripeMat);
        stripe.position.y = 1.2;
        group.add(stripe);

        return this.setupVehicle(group, 'grand_taxi', 2.0, 5);
    }

    createBus() {
        const group = this.createVehicleBase(GAME_CONFIG.COLORS.BUS, 2.5, 2.5, 8);

        // Windows
        const winMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.6 });
        for (let z = -3; z < 3.5; z += 1.5) {
            const winGeom = new THREE.PlaneGeometry(0.8, 1.0);
            const winL = new THREE.Mesh(winGeom, winMat);
            winL.position.set(-1.26, 2.0, z);
            winL.rotation.y = Math.PI / 2;
            group.add(winL);
            const winR = winL.clone();
            winR.position.x = 1.26;
            winR.rotation.y = -Math.PI / 2;
            group.add(winR);
        }

        return this.setupVehicle(group, 'bus', 2.5, 8, 8);
    }

    createCar() {
        const carColors = [0x3366cc, 0xcc3333, 0x33cc33, 0x666666, 0xcccc33];
        const color = carColors[Math.floor(Math.random() * carColors.length)];
        const group = this.createVehicleBase(color, 1.8, 1.2, 3.8);

        return this.setupVehicle(group, 'car', 1.8, 3.8);
    }

    createDonkeyCart() {
        const group = new THREE.Group();

        // Cart
        const cartGeom = new THREE.BoxGeometry(1.5, 0.6, 2.5);
        const cartMat = new THREE.MeshStandardMaterial({ color: 0x885522, roughness: 0.9 });
        const cart = new THREE.Mesh(cartGeom, cartMat);
        cart.position.set(0, 0.8, -0.5);
        cart.castShadow = true;
        group.add(cart);

        // Cart wheels
        const wheelGeom = new THREE.TorusGeometry(0.4, 0.08, 6, 12);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        [-0.8, 0.8].forEach(x => {
            const wheel = new THREE.Mesh(wheelGeom, wheelMat);
            wheel.position.set(x, 0.4, -0.5);
            wheel.rotation.y = Math.PI / 2;
            group.add(wheel);
        });

        // Donkey body
        const donkeyBody = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 0.9, 1.8),
            new THREE.MeshStandardMaterial({ color: 0x888877 })
        );
        donkeyBody.position.set(0, 0.9, 1.8);
        donkeyBody.castShadow = true;
        group.add(donkeyBody);

        // Donkey head
        const donkeyHead = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.5, 0.6),
            new THREE.MeshStandardMaterial({ color: 0x777766 })
        );
        donkeyHead.position.set(0, 1.2, 2.8);
        group.add(donkeyHead);

        // Ears
        const earGeom = new THREE.ConeGeometry(0.08, 0.4, 4);
        const earMat = new THREE.MeshStandardMaterial({ color: 0x888877 });
        [-0.15, 0.15].forEach(x => {
            const ear = new THREE.Mesh(earGeom, earMat);
            ear.position.set(x, 1.6, 2.7);
            group.add(ear);
        });

        // Legs
        const legGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.7, 6);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x666655 });
        [[-0.3, 1.2], [0.3, 1.2], [-0.3, 2.4], [0.3, 2.4]].forEach(([x, z]) => {
            const leg = new THREE.Mesh(legGeom, legMat);
            leg.position.set(x, 0.35, z);
            group.add(leg);
        });

        return this.setupVehicle(group, 'donkey', 1.5, 4, 5);
    }

    setupVehicle(group, type, w, d, maxSpeed = null) {
        const pos = this.roads.getRandomRoadPosition();
        group.position.set(pos.x, 0, pos.z);

        const road = this.roads.roadData[Math.floor(Math.random() * this.roads.roadData.length)];
        let angle = 0;
        if (road.horizontal) {
            angle = Math.random() > 0.5 ? Math.PI / 2 : -Math.PI / 2;
        } else {
            angle = Math.random() > 0.5 ? 0 : Math.PI;
        }
        group.rotation.y = angle;

        this.scene.add(group);

        const speeds = {
            taxi: randomRange(10, 22),
            grand_taxi: randomRange(8, 18),
            bus: randomRange(5, 12),
            car: randomRange(10, 25),
            donkey: randomRange(2, 5)
        };

        const vehicle = {
            mesh: group,
            type,
            width: w,
            depth: d,
            speed: maxSpeed || speeds[type] || 10,
            direction: angle,
            state: 'moving', // 'moving', 'stopped', 'turning'
            stateTimer: 0,
            stopDuration: 0,
            originalPos: { x: pos.x, z: pos.z }
        };

        // Add collision for this vehicle
        this.physics.addCollider(pos.x, pos.z, w + 0.5, d + 0.5, type);

        return vehicle;
    }

    update(deltaTime, playerPos) {
        this.vehicles.forEach(v => {
            v.stateTimer += deltaTime;

            if (v.state === 'stopped') {
                if (v.stateTimer > v.stopDuration) {
                    v.state = 'moving';
                    v.stateTimer = 0;
                }
                return;
            }

            // Random stops
            if (v.type === 'taxi' && Math.random() < 0.001) {
                v.state = 'stopped';
                v.stateTimer = 0;
                v.stopDuration = randomRange(3, 8);
                return;
            }

            if (v.type === 'bus' && Math.random() < 0.002) {
                v.state = 'stopped';
                v.stateTimer = 0;
                v.stopDuration = randomRange(5, 15);
                return;
            }

            // Move vehicle
            const speed = v.speed * deltaTime;
            const newX = v.mesh.position.x + Math.sin(v.direction) * speed;
            const newZ = v.mesh.position.z + Math.cos(v.direction) * speed;

            // Keep in bounds
            const bound = GAME_CONFIG.WORLD_SIZE / 2 - 10;
            if (Math.abs(newX) > bound || Math.abs(newZ) > bound) {
                v.direction += Math.PI;
                v.mesh.rotation.y = v.direction;
            } else {
                v.mesh.position.x = newX;
                v.mesh.position.z = newZ;
            }

            // Update collider (remove old, add new would be expensive — we just update roughly)
        });
    }

    getVehiclesNear(x, z, radius) {
        return this.vehicles.filter(v => {
            const dist = distance2D(x, z, v.mesh.position.x, v.mesh.position.z);
            return dist < radius;
        });
    }
}
