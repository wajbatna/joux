// src/game/Motorcycle.js

import * as THREE from 'three';
import { clamp, lerp } from '../utils/MathUtils.js';
import { GAME_CONFIG } from '../utils/Constants.js';

export class Motorcycle {
    constructor(scene, color = GAME_CONFIG.COLORS.MOTO_DEFAULT) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.speed = 0;
        this.rotation = 0;
        this.lean = 0;
        this.wheelRotation = 0;

        this.position = new THREE.Vector3(0, 0, 0);
        this.color = color;

        this.buildModel();
        scene.add(this.group);
    }

    buildModel() {
        const mat = new THREE.MeshStandardMaterial({ color: this.color, metalness: 0.6, roughness: 0.4 });
        const darkMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.3, roughness: 0.7 });
        const chromeMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.1 });
        const seatMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
        const lightMat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 0.5 });
        const redMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.3 });

        // Body/frame
        this.body = new THREE.Group();

        // Main body
        const bodyGeom = new THREE.BoxGeometry(0.6, 0.5, 1.8);
        const bodyMesh = new THREE.Mesh(bodyGeom, mat);
        bodyMesh.position.y = 0.7;
        bodyMesh.castShadow = true;
        this.body.add(bodyMesh);

        // Tank
        const tankGeom = new THREE.SphereGeometry(0.35, 8, 6);
        const tank = new THREE.Mesh(tankGeom, mat);
        tank.scale.set(1, 0.8, 1.5);
        tank.position.set(0, 1.0, 0.1);
        tank.castShadow = true;
        this.body.add(tank);

        // Seat
        const seatGeom = new THREE.BoxGeometry(0.45, 0.15, 0.8);
        const seat = new THREE.Mesh(seatGeom, seatMat);
        seat.position.set(0, 1.05, -0.3);
        this.body.add(seat);

        // Front fork
        const forkGeom = new THREE.CylinderGeometry(0.04, 0.04, 1, 6);
        const forkL = new THREE.Mesh(forkGeom, chromeMat);
        forkL.position.set(-0.15, 0.9, 0.75);
        forkL.rotation.x = -0.3;
        this.body.add(forkL);
        const forkR = forkL.clone();
        forkR.position.x = 0.15;
        this.body.add(forkR);

        // Handlebars
        const handleGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.7, 6);
        const handle = new THREE.Mesh(handleGeom, chromeMat);
        handle.rotation.z = Math.PI / 2;
        handle.position.set(0, 1.35, 0.7);
        this.body.add(handle);

        // Headlight
        const headlightGeom = new THREE.SphereGeometry(0.1, 6, 6);
        const headlight = new THREE.Mesh(headlightGeom, lightMat);
        headlight.position.set(0, 1.1, 1.0);
        this.body.add(headlight);

        // Taillight
        const taillightGeom = new THREE.BoxGeometry(0.2, 0.08, 0.05);
        const taillight = new THREE.Mesh(taillightGeom, redMat);
        taillight.position.set(0, 0.8, -0.9);
        this.body.add(taillight);

        // Exhaust
        const exhaustGeom = new THREE.CylinderGeometry(0.05, 0.06, 0.8, 6);
        const exhaust = new THREE.Mesh(exhaustGeom, chromeMat);
        exhaust.rotation.x = Math.PI / 2;
        exhaust.position.set(0.25, 0.45, -0.3);
        this.body.add(exhaust);

        // Wheels
        const wheelGeom = new THREE.TorusGeometry(0.3, 0.1, 8, 16);
        const wheelDiscGeom = new THREE.CylinderGeometry(0.25, 0.25, 0.08, 12);

        this.frontWheel = new THREE.Group();
        const frontTire = new THREE.Mesh(wheelGeom, darkMat);
        frontTire.rotation.y = Math.PI / 2;
        this.frontWheel.add(frontTire);
        const frontDisc = new THREE.Mesh(wheelDiscGeom, chromeMat);
        frontDisc.rotation.z = Math.PI / 2;
        this.frontWheel.add(frontDisc);
        this.frontWheel.position.set(0, 0.35, 0.85);
        this.frontWheel.castShadow = true;
        this.body.add(this.frontWheel);

        this.rearWheel = new THREE.Group();
        const rearTire = new THREE.Mesh(wheelGeom, darkMat);
        rearTire.rotation.y = Math.PI / 2;
        this.rearWheel.add(rearTire);
        const rearDisc = new THREE.Mesh(wheelDiscGeom, chromeMat);
        rearDisc.rotation.z = Math.PI / 2;
        this.rearWheel.add(rearDisc);
        this.rearWheel.position.set(0, 0.35, -0.75);
        this.rearWheel.castShadow = true;
        this.body.add(this.rearWheel);

        // Delivery box
        const boxGeom = new THREE.BoxGeometry(0.6, 0.5, 0.5);
        const boxMat = new THREE.MeshStandardMaterial({ color: 0xff6b35, roughness: 0.8 });
        this.deliveryBox = new THREE.Mesh(boxGeom, boxMat);
        this.deliveryBox.position.set(0, 1.4, -0.6);
        this.deliveryBox.castShadow = true;
        this.body.add(this.deliveryBox);

        // Rider (simplified)
        this.rider = new THREE.Group();

        // Rider body
        const riderBodyGeom = new THREE.CylinderGeometry(0.2, 0.15, 0.6, 8);
        const riderBodyMat = new THREE.MeshStandardMaterial({ color: 0x2244aa });
        const riderBody = new THREE.Mesh(riderBodyGeom, riderBodyMat);
        riderBody.position.set(0, 1.55, 0);
        this.rider.add(riderBody);

        // Helmet
        const helmetGeom = new THREE.SphereGeometry(0.18, 8, 8);
        const helmetMat = new THREE.MeshStandardMaterial({ color: 0xff6b35, metalness: 0.5, roughness: 0.3 });
        const helmet = new THREE.Mesh(helmetGeom, helmetMat);
        helmet.position.set(0, 1.95, 0.05);
        helmet.castShadow = true;
        this.rider.add(helmet);

        // Visor
        const visorGeom = new THREE.BoxGeometry(0.2, 0.08, 0.1);
        const visorMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.2 });
        const visor = new THREE.Mesh(visorGeom, visorMat);
        visor.position.set(0, 1.9, 0.18);
        this.rider.add(visor);

        // Arms
        const armGeom = new THREE.CylinderGeometry(0.05, 0.04, 0.5, 6);
        const armMat = new THREE.MeshStandardMaterial({ color: 0x2244aa });
        const leftArm = new THREE.Mesh(armGeom, armMat);
        leftArm.position.set(-0.25, 1.5, 0.3);
        leftArm.rotation.x = -0.7;
        this.rider.add(leftArm);
        const rightArm = leftArm.clone();
        rightArm.position.x = 0.25;
        this.rider.add(rightArm);

        // Legs
        const legGeom = new THREE.CylinderGeometry(0.06, 0.05, 0.5, 6);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const leftLeg = new THREE.Mesh(legGeom, legMat);
        leftLeg.position.set(-0.15, 1.05, -0.1);
        leftLeg.rotation.x = 0.5;
        this.rider.add(leftLeg);
        const rightLeg = leftLeg.clone();
        rightLeg.position.x = 0.15;
        this.rider.add(rightLeg);

        this.body.add(this.rider);
        this.group.add(this.body);
    }

    update(input, deltaTime, physics) {
        // Acceleration
        if (input.accelerate) {
            this.speed += GAME_CONFIG.MOTO_ACCELERATION * deltaTime;
        }
        if (input.brake) {
            if (this.speed > 0) {
                this.speed -= GAME_CONFIG.MOTO_BRAKE_FORCE * deltaTime;
            } else {
                this.speed -= GAME_CONFIG.MOTO_ACCELERATION * 0.3 * deltaTime; // Reverse
            }
        }

        // Friction
        if (!input.accelerate && !input.brake) {
            if (this.speed > 0) {
                this.speed -= GAME_CONFIG.MOTO_FRICTION * deltaTime;
                if (this.speed < 0) this.speed = 0;
            } else if (this.speed < 0) {
                this.speed += GAME_CONFIG.MOTO_FRICTION * deltaTime;
                if (this.speed > 0) this.speed = 0;
            }
        }

        this.speed = clamp(this.speed, -GAME_CONFIG.MOTO_MAX_SPEED * 0.2, GAME_CONFIG.MOTO_MAX_SPEED);

        // Steering
        const turnFactor = Math.min(Math.abs(this.speed) / 15, 1);
        if (input.left) {
            this.rotation += GAME_CONFIG.MOTO_TURN_SPEED * deltaTime * turnFactor;
        }
        if (input.right) {
            this.rotation -= GAME_CONFIG.MOTO_TURN_SPEED * deltaTime * turnFactor;
        }

        // Move
        const newX = this.position.x + Math.sin(this.rotation) * this.speed * deltaTime;
        const newZ = this.position.z + Math.cos(this.rotation) * this.speed * deltaTime;

        // Collision check
        const collision = physics.checkCollision(newX, newZ, 1.2);
        if (collision.collided) {
            const resolved = physics.resolveCollision(newX, newZ, 1.2, collision);
            this.position.x = resolved.x;
            this.position.z = resolved.z;
            this.speed *= 0.3;
            return true; // collision happened
        } else {
            this.position.x = newX;
            this.position.z = newZ;
        }

        // World bounds
        const bound = GAME_CONFIG.WORLD_SIZE / 2 - 5;
        this.position.x = clamp(this.position.x, -bound, bound);
        this.position.z = clamp(this.position.z, -bound, bound);

        // Lean
        const targetLean = (input.left ? 1 : 0) - (input.right ? 1 : 0);
        this.lean = lerp(this.lean, targetLean * GAME_CONFIG.MOTO_LEAN_FACTOR * turnFactor, 0.1);

        // Wheel rotation
        this.wheelRotation += this.speed * deltaTime * 3;

        // Update visual
        this.group.position.copy(this.position);
        this.group.rotation.y = this.rotation;
        this.body.rotation.z = this.lean;

        if (this.frontWheel) this.frontWheel.rotation.x = this.wheelRotation;
        if (this.rearWheel) this.rearWheel.rotation.x = this.wheelRotation;

        return false;
    }

    getSpeedKmh() {
        return Math.abs(Math.round(this.speed * 3.6));
    }

    setColor(color) {
        this.color = color;
        this.body.traverse((child) => {
            if (child.isMesh && child.material.color && child.material.color.getHex() === this.color) {
                child.material.color.setHex(color);
            }
        });
    }

    setPosition(x, y, z) {
        this.position.set(x, y, z);
        this.group.position.copy(this.position);
    }

    setRotation(r) {
        this.rotation = r;
        this.group.rotation.y = r;
    }

    dispose() {
        this.group.traverse((child) => {
            if (child.isMesh) {
                child.geometry.dispose();
                if (child.material.dispose) child.material.dispose();
            }
        });
        this.scene.remove(this.group);
    }
}
