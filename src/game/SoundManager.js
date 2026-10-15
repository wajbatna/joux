// src/game/SoundManager.js

export class SoundManager {
    constructor() {
        this.ctx = null;
        this.masterVolume = 0.7;
        this.sfxVolume = 0.7;
        this.musicVolume = 0.5;
        this.initialized = false;
        this.oscillators = {};
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('AudioContext not available');
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playEngineSound(speed, maxSpeed) {
        if (!this.ctx) return;
        const freq = 80 + (speed / maxSpeed) * 200;
        if (!this.oscillators.engine) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            gain.gain.value = 0;
            osc.start();
            this.oscillators.engine = { osc, gain };
        }
        const eng = this.oscillators.engine;
        eng.osc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.1);
        const vol = Math.min(0.08, (speed / maxSpeed) * 0.08) * this.sfxVolume;
        eng.gain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.1);
    }

    stopEngine() {
        if (this.oscillators.engine) {
            this.oscillators.engine.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
        }
    }

    playHorn() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = 440;
        gain.gain.value = 0.15 * this.sfxVolume;
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
        osc.stop(this.ctx.currentTime + 0.4);
    }

    playPickup() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 600;
        gain.gain.value = 0.12 * this.sfxVolume;
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
        osc.stop(this.ctx.currentTime + 0.2);
    }

    playDelivery() {
        if (!this.ctx) return;
        [523, 659, 784].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.value = 0.1 * this.sfxVolume;
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(this.ctx.currentTime + i * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.12 + 0.3);
            osc.stop(this.ctx.currentTime + i * 0.12 + 0.3);
        });
    }

    playCollision() {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 0.15;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }
        const source = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        source.buffer = buffer;
        gain.gain.value = 0.2 * this.sfxVolume;
        source.connect(gain);
        gain.connect(this.ctx.destination);
        source.start();
    }

    setVolumes(music, sfx) {
        this.musicVolume = music / 100;
        this.sfxVolume = sfx / 100;
    }

    dispose() {
        Object.values(this.oscillators).forEach(o => {
            try { o.osc.stop(); } catch(e) {}
        });
        this.oscillators = {};
        if (this.ctx) this.ctx.close();
    }
}
