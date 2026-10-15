// src/missions/MissionManager.js

import { MISSION_DATA, GAME_CONFIG } from '../utils/Constants.js';
import { OrderSystem } from './OrderSystem.js';
import { CustomerSatisfaction } from './CustomerSatisfaction.js';
import { EventSystem } from './EventSystem.js';
import { getPlayerProfile, savePlayerProfile } from '../utils/Storage.js';

export class MissionManager {
    constructor(world, player) {
        this.world = world;
        this.player = player;
        this.orderSystem = new OrderSystem(world);
        this.satisfaction = new CustomerSatisfaction();
        this.eventSystem = new EventSystem(world);

        this.currentMission = null;
        this.missionState = 'idle'; // 'idle', 'briefing', 'active', 'completed', 'failed'
        this.isEndless = false;
        this.endlessDeliveries = 0;

        this.eventPopupCallback = null;
        this.onMissionComplete = null;
        this.onMissionFail = null;
        this.onOrderEvent = null;
    }

    getMissionList() {
        const profile = getPlayerProfile();
        return MISSION_DATA.map(m => ({
            ...m,
            completed: profile.completedMissions.includes(m.id),
            unlocked: m.id === 1 || profile.completedMissions.includes(m.id - 1)
        }));
    }

    startMission(missionId) {
        const mission = MISSION_DATA.find(m => m.id === missionId);
        if (!mission) return false;

        this.currentMission = { ...mission };
        this.missionState = 'briefing';
        this.isEndless = false;

        // Setup events
        this.eventSystem.reset();
        this.eventSystem.queueEvents(mission.events || []);

        // Setup weather/time
        if (mission.weather) {
            this.world.setWeather(mission.weather);
        } else {
            this.world.setWeather('clear');
        }

        if (mission.timeOfDay) {
            this.world.setTimeOfDay(mission.timeOfDay);
        } else {
            this.world.setTimeOfDay('day');
        }

        return true;
    }

    startEndlessMode() {
        this.isEndless = true;
        this.endlessDeliveries = 0;
        this.missionState = 'active';
        this.satisfaction.reset();
        this.player.score = 0;
        this.player.deliveries = 0;

        this.startNextEndlessOrder();
        return true;
    }

    startNextEndlessOrder() {
        this.orderSystem.reset();
        this.satisfaction.reset();
        const order = this.orderSystem.createRandomOrder();
        this.missionState = 'active';
        return order;
    }

    acceptMission() {
        if (this.missionState !== 'briefing') return;

        this.missionState = 'active';
        this.satisfaction.reset();
        this.player.score = 0;
        this.player.deliveries = 0;
        this.player.foodCondition = 100;

        // Create order
        const mission = this.currentMission;
        this.orderSystem.createOrder(mission.food, mission.time, mission.distance);
    }

    update(deltaTime) {
        if (this.missionState !== 'active') return;

        const playerPos = this.player.getPosition();
        const playerSpeed = Math.abs(this.player.getSpeed());

        // Update order
        const orderResult = this.orderSystem.update(deltaTime, playerPos);

        if (orderResult === 'picked_up') {
            if (this.onOrderEvent) this.onOrderEvent('picked_up', '📦 تم استلام الطلب! — Order picked up!');
        }

        if (orderResult === 'delivered') {
            this.handleDeliveryComplete();
            return;
        }

        if (orderResult === 'failed') {
            this.handleDeliveryFail();
            return;
        }

        // Update satisfaction
        if (this.orderSystem.currentOrder) {
            const order = this.orderSystem.currentOrder;
            const satResult = this.satisfaction.update(
                deltaTime,
                order.timeRemaining,
                order.timeLimit || GAME_CONFIG.DELIVERY_BASE_TIME
            );

            if (satResult === 'angry_call') {
                if (this.onOrderEvent) {
                    this.onOrderEvent('angry_call', '📱 الزبون كيتصل — Customer calling!');
                }
            }
        }

        // Update events
        const event = this.eventSystem.update(deltaTime, playerPos, playerSpeed);
        if (event) {
            this.handleEvent(event);
        }
    }

    handleEvent(event) {
        switch (event.type) {
            case 'pothole_hit':
                this.satisfaction.applyDamage(5);
                this.orderSystem.damageFoodCondition(10);
                if (this.onOrderEvent) {
                    this.onOrderEvent('warning', '🕳️ حفرة! الأكل تضرر — Pothole! Food damaged!');
                }
                break;

            case 'speedbump_fast':
                this.satisfaction.applyDamage(3);
                this.orderSystem.damageFoodCondition(5);
                if (this.onOrderEvent) {
                    this.onOrderEvent('warning', '⚠️ رالونتيسور! خفف السرعة — Speed bump!');
                }
                break;

            case 'police_check':
                if (this.onOrderEvent) {
                    this.onOrderEvent('police', '👮 كنترول! وقف — Police check! Stop!');
                }
                break;

            case 'taxi_stopped':
            case 'taxi_warning':
                if (this.onOrderEvent) {
                    this.onOrderEvent('warning', event.message || '🚕 طاكسي واقف! — Taxi stopped!');
                }
                this.player.addScore(GAME_CONFIG.SCORE_SAFE_AVOID);
                break;

            case 'donkey_crossing':
            case 'donkey_warning':
                if (this.onOrderEvent) {
                    this.onOrderEvent('warning', event.message || '🫏 حمار! — Donkey!');
                }
                break;

            case 'bus_loading':
            case 'bus_warning':
                if (this.onOrderEvent) {
                    this.onOrderEvent('info', event.message || '🚌 طوبيس — Bus loading!');
                }
                break;

            case 'angry_customer':
                this.satisfaction.applyDamage(10);
                if (this.onOrderEvent) {
                    this.onOrderEvent('angry', event.message || '😡 زبون غاضب!');
                }
                break;

            case 'wedding':
                if (this.onOrderEvent) {
                    this.onOrderEvent('info', event.message || '🎉 عرس!');
                }
                break;

            case 'rain_start':
                this.world.setWeather('rain');
                if (this.onOrderEvent) {
                    this.onOrderEvent('weather', event.message || '🌧️ شتا!');
                }
                break;

            default:
                if (event.message && this.onOrderEvent) {
                    this.onOrderEvent('info', event.message);
                }
        }
    }

    handleDeliveryComplete() {
        const order = this.orderSystem.currentOrder;
        const timeBonus = order.timeRemaining > order.timeLimit * 0.5 ? GAME_CONFIG.SCORE_EARLY_BONUS : 0;
        const foodBonus = order.foodCondition > 80 ? 25 : 0;
        const satBonus = this.satisfaction.satisfaction > 90 ? 30 : 0;

        this.player.addScore(GAME_CONFIG.SCORE_DELIVERY + timeBonus + foodBonus + satBonus);
        this.player.completeDelivery();

        if (this.isEndless) {
            this.endlessDeliveries++;
            if (this.onOrderEvent) {
                this.onOrderEvent('success', '✅ تم التوصيل! — Delivered!');
            }
            // Start next order after a short delay
            setTimeout(() => this.startNextEndlessOrder(), 2000);
        } else {
            this.missionState = 'completed';
            const profile = getPlayerProfile();
            if (!profile.completedMissions.includes(this.currentMission.id)) {
                profile.completedMissions.push(this.currentMission.id);
            }
            const missionKey = `mission_${this.currentMission.id}`;
            if (!profile.highScores[missionKey] || this.player.score > profile.highScores[missionKey]) {
                profile.highScores[missionKey] = this.player.score;
            }
            profile.totalDeliveries++;
            profile.coins += Math.round(this.player.score / 10);
            savePlayerProfile(profile);

            if (this.onMissionComplete) {
                this.onMissionComplete({
                    score: this.player.score,
                    satisfaction: this.satisfaction.getSatisfactionPercent(),
                    stars: this.satisfaction.getStars(),
                    timeBonus,
                    foodCondition: order.foodCondition,
                    mission: this.currentMission
                });
            }
        }
    }

    handleDeliveryFail() {
        this.player.failDelivery();

        if (this.isEndless) {
            this.missionState = 'completed';
            if (this.onMissionFail) {
                this.onMissionFail({
                    score: this.player.score,
                    deliveries: this.endlessDeliveries,
                    reason: 'timeout'
                });
            }
        } else {
            this.missionState = 'failed';
            if (this.onMissionFail) {
                this.onMissionFail({
                    score: this.player.score,
                    reason: 'timeout',
                    mission: this.currentMission
                });
            }
        }
    }

    getHUDData() {
        const order = this.orderSystem.currentOrder;
        return {
            score: this.player.score,
            satisfaction: this.satisfaction.getSatisfactionPercent(),
            deliveries: this.player.deliveries,
            speed: this.player.motorcycle.getSpeedKmh(),
            timeRemaining: order ? order.timeRemaining : 0,
            timeTotal: order ? order.timeLimit : 1,
            orderState: order ? order.state : 'none',
            foodCondition: order ? order.foodCondition : 100,
            distanceToTarget: order ? this.orderSystem.getDistanceToTarget(this.player.getPosition()) : 0,
            combo: this.player.combo
        };
    }

    reset() {
        this.orderSystem.reset();
        this.satisfaction.reset();
        this.eventSystem.reset();
        this.currentMission = null;
        this.missionState = 'idle';
        this.isEndless = false;
        this.endlessDeliveries = 0;
        this.world.setWeather('clear');
        this.world.setTimeOfDay('day');
    }
}
