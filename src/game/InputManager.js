// src/game/InputManager.js

export class InputManager {
    constructor() {
        this.keys = {};
        this.touches = {};
        this.isMobile = this.detectMobile();

        this.state = {
            accelerate: false,
            brake: false,
            left: false,
            right: false,
            horn: false,
            interact: false,
            pause: false,
            camera: false
        };

        this.setupKeyboard();
        if (this.isMobile) {
            this.setupTouch();
        }
    }

    detectMobile() {
        return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            || (window.innerWidth <= 800 && 'ontouchstart' in window);
    }

    setupKeyboard() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Escape') this.state.pause = true;
            if (e.code === 'KeyC') this.state.camera = true;
            e.preventDefault();
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    setupTouch() {
        const buttons = {
            'touch-accel': 'accelerate',
            'touch-brake': 'brake',
            'touch-left': 'left',
            'touch-right': 'right',
            'touch-horn': 'horn',
            'touch-interact': 'interact',
            'touch-pause': 'pause'
        };

        Object.entries(buttons).forEach(([id, action]) => {
            const el = document.getElementById(id);
            if (!el) return;

            const onStart = (e) => {
                e.preventDefault();
                this.touches[action] = true;
                el.classList.add('pressed');
                if (action === 'pause') this.state.pause = true;
            };

            const onEnd = (e) => {
                e.preventDefault();
                this.touches[action] = false;
                el.classList.remove('pressed');
            };

            el.addEventListener('touchstart', onStart, { passive: false });
            el.addEventListener('touchend', onEnd, { passive: false });
            el.addEventListener('touchcancel', onEnd, { passive: false });
            el.addEventListener('mousedown', onStart);
            el.addEventListener('mouseup', onEnd);
            el.addEventListener('mouseleave', onEnd);
        });
    }

    update() {
        this.state.accelerate = this.keys['KeyW'] || this.keys['ArrowUp'] || this.touches.accelerate || false;
        this.state.brake = this.keys['KeyS'] || this.keys['ArrowDown'] || this.touches.brake || false;
        this.state.left = this.keys['KeyA'] || this.keys['ArrowLeft'] || this.touches.left || false;
        this.state.right = this.keys['KeyD'] || this.keys['ArrowRight'] || this.touches.right || false;
        this.state.horn = this.keys['KeyH'] || this.touches.horn || false;
        this.state.interact = this.keys['KeyE'] || this.touches.interact || false;
    }

    consumePause() {
        const was = this.state.pause;
        this.state.pause = false;
        return was;
    }

    consumeCamera() {
        const was = this.state.camera;
        this.state.camera = false;
        return was;
    }

    showMobileControls(show) {
        const el = document.getElementById('mobile-controls');
        if (el) {
            el.classList.toggle('active', show && this.isMobile);
        }
    }

    showInteractButton(show) {
        const el = document.getElementById('touch-interact');
        if (el) {
            el.classList.toggle('visible', show);
        }
    }
}
