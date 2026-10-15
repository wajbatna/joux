// src/utils/MathUtils.js

export function lerp(a, b, t) {
    return a + (b - a) * t;
}

export function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

export function randomInt(min, max) {
    return Math.floor(randomRange(min, max + 1));
}

export function distance2D(x1, z1, x2, z2) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    return Math.sqrt(dx * dx + dz * dz);
}

export function angleBetween(x1, z1, x2, z2) {
    return Math.atan2(x2 - x1, z2 - z1);
}

export function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
}

export function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

export function smoothDamp(current, target, velocity, smoothTime, deltaTime) {
    smoothTime = Math.max(0.0001, smoothTime);
    const omega = 2.0 / smoothTime;
    const x = omega * deltaTime;
    const exp = 1.0 / (1.0 + x + 0.48 * x * x + 0.235 * x * x * x);
    let change = current - target;
    const maxChange = Infinity;
    change = clamp(change, -maxChange, maxChange);
    const temp = (velocity + omega * change) * deltaTime;
    velocity = (velocity - omega * temp) * exp;
    let output = target + (change + temp) * exp;
    return { value: output, velocity };
}
