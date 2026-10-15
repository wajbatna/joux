// src/missions/EventSystem.js

import { distance2D, randomRange } from '../utils/MathUtils.js';

export class EventSystem {
    constructor(world) {
        this.world = world;
        this.activeEvent = null;
        this.eventQueue = [];
        this.eventCooldown = 0;
        this.handledEvents = new Set();
    }

    queueEvents(eventTypes) {
        this.eventQueue = [...eventTypes].filter(e => e !== 'none');
        this.shuffleQueue();
    }

    shuffleQueue() {
        for (let i = this.eventQueue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.eventQueue[i], this.eventQueue[j]] = [this.eventQueue[j], this.eventQueue[i]];
        }
    }

    update(deltaTime, playerPos, playerSpeed) {
        if (this.eventCooldown > 0) {
            this.eventCooldown -= deltaTime;
            return null;
        }

        // Check for proximity-based events
        if (this.world.obstacles) {
            const nearby = this.world.obstacles.checkPlayerNearObstacle(playerPos.x, playerPos.z);

            for (const obs of nearby) {
                if (this.handledEvents.has(obs)) continue;

                if (obs.type === 'pothole' && obs.distance < 2 && playerSpeed > 15) {
                    this.handledEvents.add(obs);
                    return { type: 'pothole_hit', data: obs, penalty: 10 };
                }

                if (obs.type === 'speedbump' && obs.distance < 3 && playerSpeed > 20) {
                    this.handledEvents.add(obs);
                    return { type: 'speedbump_fast', data: obs, penalty: 5 };
                }

                if (obs.type === 'police' && obs.distance < 5 && obs.active) {
                    this.handledEvents.add(obs);
                    return { type: 'police_check', data: obs };
                }
            }
        }

        // Check for traffic events
        if (this.world.traffic) {
            const nearVehicles = this.world.traffic.getVehiclesNear(playerPos.x, playerPos.z, 10);

            for (const v of nearVehicles) {
                const id = `${v.type}_${Math.round(v.mesh.position.x)}_${Math.round(v.mesh.position.z)}`;
                if (this.handledEvents.has(id)) continue;

                if (v.type === 'taxi' && v.state === 'stopped') {
                    this.handledEvents.add(id);
                    return { type: 'taxi_stopped', data: v };
                }

                if (v.type === 'bus' && v.state === 'stopped') {
                    this.handledEvents.add(id);
                    return { type: 'bus_loading', data: v };
                }

                if (v.type === 'donkey') {
                    this.handledEvents.add(id);
                    return { type: 'donkey_crossing', data: v };
                }
            }
        }

        // Trigger queued events
        if (this.eventQueue.length > 0 && Math.random() < 0.005) {
            const eventType = this.eventQueue.shift();
            this.eventCooldown = 10;
            return this.createScriptedEvent(eventType);
        }

        return null;
    }

    createScriptedEvent(type) {
        switch (type) {
            case 'taxi':
                return { type: 'taxi_warning', message: '⚠️ طاكسي واقف! — Taxi stopped ahead!' };
            case 'donkey':
                return { type: 'donkey_warning', message: '🫏 حمار في الطريق! — Donkey crossing!' };
            case 'bus':
                return { type: 'bus_warning', message: '🚌 طوبيس واقف! — Bus loading!' };
            case 'police':
                return { type: 'police_warning', message: '👮 كنترول البوليس! — Police checkpoint!' };
            case 'potholes':
                return { type: 'pothole_warning', message: '🕳️ حفر في الطريق! — Potholes ahead!' };
            case 'angry_customer':
                return { type: 'angry_customer', message: '📱 الزبون غاضب! — Customer is angry!' };
            case 'wedding':
                return { type: 'wedding', message: '🎉 عرس في الزنقة! — Wedding blocking road!' };
            case 'rain':
                return { type: 'rain_start', message: '🌧️ شتا كتنزل! — Rain starting!' };
            default:
                return null;
        }
    }

    reset() {
        this.activeEvent = null;
        this.eventQueue = [];
        this.eventCooldown = 0;
        this.handledEvents.clear();
    }
}
