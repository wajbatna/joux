// src/multiplayer/RemotePlayer.js

import * as THREE from 'three';
import { lerp } from '../utils/MathUtils.js';

export class RemotePlayer {
    constructor(scene, id, name, color) {
        this.scene = scene;
        this.id = id;
        this.name = name;
        this.color = color;

        this.targetPos = new THREE.Vector3();
        this.targetRot = 0;
        this.currentPos = new THREE.Vector3();
        this.currentRot = 0;
        this.speed = 0;
        this.score = 0;
        this.deliveries = 0;

        this.group = new THREE.Group();
        this.buildModel();
        scene.add(this.group);

        // Name label
        this.createNameLabel();
    }

    buildModel() {
        // Simplified motorcycle model for remote players
        const mat = new THREE.MeshStandardMaterial({ color: this.color || 0x33aaff, metalness: 0.5, roughness: 0.5 });
        const darkMat = new THREE.MeshStandardMaterial({ color: 0x222222 });

        // Body
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 1.5), mat);
        body.position.y = 0.7;
        body.castShadow = true;
        this.group.add(body);

        // Wheels
        const wheelGeom = new THREE.TorusGeometry(0.25, 0.08, 6, 12);
        const fw = new THREE.Mesh(wheelGeom, darkMat);
        fw.position.set(0, 0.3, 0.65);
        fw.rotation.y = Math.PI / 2;
        this.group.add(fw);

        const rw = new THREE.Mesh(wheelGeom, darkMat);
        rw.position.set(0, 0.3, -0.55);
        rw.rotation.y = Math.PI / 2;
        this.group.add(rw);

        // Rider
        const riderBody = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.12, 0.5, 6),
            new THREE.MeshStandardMaterial({ color: 0x4466aa })
        );
        riderBody.position.y = 1.3;
        riderBody.castShadow = true;
        this.group.add(riderBody);

        const helmet = new THREE.Mesh(
            new THREE.SphereGeometry(0.14, 6, 6),
            mat
        );
        helmet.position.y = 1.65;
        this.group.add(helmet);

        // Delivery box
        const box = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.4, 0.4),
            new THREE.MeshStandardMaterial({ color: 0xff6b35 })
        );
        box.position.set(0, 1.1, -0.5);
        this.group.add(box);
    }

    createNameLabel() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.roundRect(0, 0, 256, 64, 10);
        ctx.fill();

        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.name || 'Player', 128, 42);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(3, 0.75, 1);
        sprite.position.y = 3;
        this.group.add(sprite);
    }

    updateTarget(x, y, z, rotation, speed, score, deliveries) {
        this.targetPos.set(x, y, z);
        this.targetRot = rotation;
        this.speed = speed;
        this.score = score || this.score;
        this.deliveries = deliveries || this.deliveries;
    }

    update(deltaTime) {
        // Interpolate position
        this.currentPos.lerp(this.targetPos, 0.15);
        this.currentRot = lerp(this.currentRot, this.targetRot, 0.15);

        this.group.position.copy(this.currentPos);
        this.group.rotation.y = this.currentRot;
    }

    dispose() {
        this.group.traverse(child => {
            if (child.isMesh) {
                child.geometry.dispose();
                if (child.material.dispose) child.material.dispose();
            }
            if (child.isSprite) {
                child.material.map?.dispose();
                child.material.dispose();
            }
        });
        this.scene.remove(this.group);
    }
}
