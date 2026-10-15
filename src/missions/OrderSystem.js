// src/missions/OrderSystem.js

import { distance2D, randomRange } from '../utils/MathUtils.js';
import { FOOD_EMOJIS } from '../utils/Constants.js';

export class OrderSystem {
    constructor(world) {
        this.world = world;
        this.currentOrder = null;
        this.pickupMarker = null;
        this.deliveryMarker = null;
    }

    createOrder(food, time, distance) {
        const pickup = this.world.roads.getRandomIntersection();
        let delivery;
        let attempts = 0;

        do {
            delivery = this.world.roads.getRandomIntersection();
            attempts++;
        } while (distance2D(pickup.x, pickup.z, delivery.x, delivery.z) < distance * 0.5 && attempts < 20);

        this.currentOrder = {
            food,
            emoji: FOOD_EMOJIS[food] || '📦',
            timeLimit: time,
            timeRemaining: time,
            pickup: { x: pickup.x, z: pickup.z },
            delivery: { x: delivery.x, z: delivery.z },
            state: 'pickup', // 'pickup' -> 'delivering' -> 'completed' / 'failed'
            foodCondition: 100
        };

        // Create markers
        this.pickupMarker = this.world.createDeliveryMarker(pickup.x, pickup.z, 'pickup');
        this.deliveryMarker = this.world.createDeliveryMarker(delivery.x, delivery.z, 'delivery');
        this.deliveryMarker.visible = false;

        return this.currentOrder;
    }

    createRandomOrder() {
        const foods = Object.keys(FOOD_EMOJIS);
        const food = foods[Math.floor(Math.random() * foods.length)];
        const time = randomRange(60, 120);
        const distance = randomRange(80, 200);
        return this.createOrder(food, time, distance);
    }

    update(deltaTime, playerPos) {
        if (!this.currentOrder) return null;

        this.currentOrder.timeRemaining -= deltaTime;

        if (this.currentOrder.timeRemaining <= 0) {
            this.currentOrder.state = 'failed';
            this.cleanup();
            return 'failed';
        }

        const order = this.currentOrder;

        if (order.state === 'pickup') {
            const dist = distance2D(playerPos.x, playerPos.z, order.pickup.x, order.pickup.z);
            if (dist < 5) {
                order.state = 'delivering';
                if (this.pickupMarker) {
                    this.world.removeDeliveryMarker(this.pickupMarker);
                    this.pickupMarker = null;
                }
                if (this.deliveryMarker) {
                    this.deliveryMarker.visible = true;
                }
                return 'picked_up';
            }
        }

        if (order.state === 'delivering') {
            const dist = distance2D(playerPos.x, playerPos.z, order.delivery.x, order.delivery.z);
            if (dist < 5) {
                order.state = 'completed';
                this.cleanup();
                return 'delivered';
            }
        }

        return null;
    }

    damageFoodCondition(amount) {
        if (this.currentOrder) {
            this.currentOrder.foodCondition = Math.max(0, this.currentOrder.foodCondition - amount);
        }
    }

    getDistanceToTarget(playerPos) {
        if (!this.currentOrder) return 0;
        const target = this.currentOrder.state === 'pickup'
            ? this.currentOrder.pickup
            : this.currentOrder.delivery;
        return distance2D(playerPos.x, playerPos.z, target.x, target.z);
    }

    getDirectionToTarget(playerPos) {
        if (!this.currentOrder) return 0;
        const target = this.currentOrder.state === 'pickup'
            ? this.currentOrder.pickup
            : this.currentOrder.delivery;
        return Math.atan2(target.x - playerPos.x, target.z - playerPos.z);
    }

    cleanup() {
        if (this.pickupMarker) {
            this.world.removeDeliveryMarker(this.pickupMarker);
            this.pickupMarker = null;
        }
        if (this.deliveryMarker) {
            this.world.removeDeliveryMarker(this.deliveryMarker);
            this.deliveryMarker = null;
        }
    }

    reset() {
        this.cleanup();
        this.currentOrder = null;
    }
}
