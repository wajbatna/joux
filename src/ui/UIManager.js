// src/ui/UIManager.js

export class UIManager {
    constructor() {
        this.elements = {};
        this.cacheElements();
        this.notificationTimeout = null;
    }

    cacheElements() {
        const ids = [
            'main-menu', 'sp-menu', 'mission-select', 'mp-menu', 'join-room-screen',
            'multiplayer-lobby', 'hud', 'pause-menu', 'results-screen',
            'garage-screen', 'settings-screen', 'loading-screen',
            'hud-score', 'hud-satisfaction', 'hud-deliveries', 'hud-speed',
            'hud-timer-fill', 'hud-timer-text', 'hud-timer-container',
            'order-popup', 'order-details', 'event-popup', 'event-icon', 'event-text',
            'results-title', 'results-stars', 'results-details', 'results-total',
            'loading-bar', 'loading-text', 'game-notification',
            'lobby-room-code', 'lobby-players', 'lobby-status', 'btn-start-race',
            'connection-status', 'mp-rankings', 'mp-rankings-list',
            'mission-list', 'minimap-canvas',
            'color-picker', 'garage-coins',
            'setting-music', 'setting-sfx', 'setting-quality', 'setting-shadows',
            'setting-sensitivity', 'setting-server-url', 'room-code-input',
            'mobile-controls'
        ];

        ids.forEach(id => {
            this.elements[id] = document.getElementById(id);
        });
    }

    showScreen(screenId) {
        const screens = ['main-menu', 'sp-menu', 'mission-select', 'mp-menu',
                        'join-room-screen', 'multiplayer-lobby', 'hud', 'pause-menu',
                        'results-screen', 'garage-screen', 'settings-screen'];

        screens.forEach(id => {
            const el = this.elements[id];
            if (!el) return;
            if (id === screenId) {
                el.classList.add('active');
                if (el.classList.contains('hidden')) el.classList.remove('hidden');
                if (el.style.display === 'none') el.style.display = '';
            } else {
                el.classList.remove('active');
                if (id === 'main-menu') {
                    el.classList.add('hidden');
                }
            }
        });
    }

    showMainMenu() {
        const screens = ['sp-menu', 'mission-select', 'mp-menu', 'join-room-screen',
                        'multiplayer-lobby', 'hud', 'pause-menu', 'results-screen',
                        'garage-screen', 'settings-screen'];
        screens.forEach(id => {
            const el = this.elements[id];
            if (el) {
                el.classList.remove('active');
                el.style.display = '';
            }
        });

        const menu = this.elements['main-menu'];
        if (menu) {
            menu.classList.remove('hidden');
            menu.style.display = '';
        }
    }

    hideAllScreens() {
        const screens = ['main-menu', 'sp-menu', 'mission-select', 'mp-menu',
                        'join-room-screen', 'multiplayer-lobby', 'pause-menu',
                        'results-screen', 'garage-screen', 'settings-screen'];
        screens.forEach(id => {
            const el = this.elements[id];
            if (el) {
                el.classList.remove('active');
                if (id === 'main-menu') el.classList.add('hidden');
            }
        });
    }

    showHUD(show) {
        const hud = this.elements['hud'];
        if (hud) {
            hud.classList.toggle('active', show);
        }
    }

    showPause(show) {
        const pause = this.elements['pause-menu'];
        if (pause) pause.classList.toggle('active', show);
    }

    showResults(show) {
        const results = this.elements['results-screen'];
        if (results) results.classList.toggle('active', show);
    }

    updateHUD(data) {
        if (this.elements['hud-score']) this.elements['hud-score'].textContent = data.score;
        if (this.elements['hud-satisfaction']) this.elements['hud-satisfaction'].textContent = data.satisfaction + '%';
        if (this.elements['hud-deliveries']) this.elements['hud-deliveries'].textContent = data.deliveries;
        if (this.elements['hud-speed']) this.elements['hud-speed'].textContent = data.speed;

        // Timer
        const timerContainer = this.elements['hud-timer-container'];
        if (timerContainer) {
            timerContainer.style.display = data.orderState !== 'none' ? '' : 'none';
        }

        if (this.elements['hud-timer-fill'] && data.timeTotal > 0) {
            const pct = Math.max(0, (data.timeRemaining / data.timeTotal) * 100);
            this.elements['hud-timer-fill'].style.width = pct + '%';

            // Color based on time
            if (pct > 60) this.elements['hud-timer-fill'].style.background = 'linear-gradient(90deg, #33ff33, #66ff66)';
            else if (pct > 30) this.elements['hud-timer-fill'].style.background = 'linear-gradient(90deg, #ffaa00, #ffcc00)';
            else this.elements['hud-timer-fill'].style.background = 'linear-gradient(90deg, #ff3333, #ff6666)';
        }

        if (this.elements['hud-timer-text'] && data.timeRemaining !== undefined) {
            const mins = Math.floor(Math.max(0, data.timeRemaining) / 60);
            const secs = Math.floor(Math.max(0, data.timeRemaining) % 60);
            this.elements['hud-timer-text'].textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        }
    }

    showOrderPopup(order) {
        const popup = this.elements['order-popup'];
        const details = this.elements['order-details'];
        if (popup && details && order) {
            details.innerHTML = `
                <p>${order.emoji} ${order.food}</p>
                <p>⏱️ الوقت: ${order.timeLimit}s</p>
                <p>📍 ${order.state === 'pickup' ? 'اذهب لاستلام الطلب' : 'وصّل الطلب'}</p>
            `;
            popup.classList.add('active');
        }
    }

    hideOrderPopup() {
        const popup = this.elements['order-popup'];
        if (popup) popup.classList.remove('active');
    }

    showEventPopup(icon, text, duration = 3000) {
        const popup = this.elements['event-popup'];
        const iconEl = this.elements['event-icon'];
        const textEl = this.elements['event-text'];

        if (popup && iconEl && textEl) {
            iconEl.textContent = icon;
            textEl.textContent = text;
            popup.classList.add('active');

            setTimeout(() => {
                popup.classList.remove('active');
            }, duration);
        }
    }

    showNotification(message, duration = 3000) {
        const notif = this.elements['game-notification'];
        if (!notif) return;

        notif.textContent = message;
        notif.classList.add('show');

        if (this.notificationTimeout) clearTimeout(this.notificationTimeout);
        this.notificationTimeout = setTimeout(() => {
            notif.classList.remove('show');
        }, duration);
    }

    setResults(data) {
        if (this.elements['results-title']) {
            this.elements['results-title'].textContent = data.success
                ? '🎉 تم التوصيل! — Delivered!'
                : '❌ فشل التوصيل — Delivery Failed!';
        }

        if (this.elements['results-stars']) {
            this.elements['results-stars'].textContent = '⭐'.repeat(data.stars || 0) + '☆'.repeat(3 - (data.stars || 0));
        }

        if (this.elements['results-details']) {
            this.elements['results-details'].innerHTML = `
                <div class="results-row"><span class="label">النقاط — Score</span><span class="value">${data.score}</span></div>
                <div class="results-row"><span class="label">الرضا — Satisfaction</span><span class="value">${data.satisfaction}%</span></div>
                ${data.timeBonus ? `<div class="results-row"><span class="label">مكافأة الوقت — Time Bonus</span><span class="value">+${data.timeBonus}</span></div>` : ''}
                ${data.foodCondition !== undefined ? `<div class="results-row"><span class="label">حالة الأكل — Food</span><span class="value">${data.foodCondition}%</span></div>` : ''}
                ${data.deliveries !== undefined ? `<div class="results-row"><span class="label">التوصيلات — Deliveries</span><span class="value">${data.deliveries}</span></div>` : ''}
            `;
        }

        if (this.elements['results-total']) {
            this.elements['results-total'].textContent = `${data.score} نقطة — points`;
        }
    }

    setLoadingProgress(progress, text) {
        if (this.elements['loading-bar']) {
            this.elements['loading-bar'].style.width = progress + '%';
        }
        if (this.elements['loading-text'] && text) {
            this.elements['loading-text'].textContent = text;
        }
    }

    hideLoading() {
        const loading = this.elements['loading-screen'];
        if (loading) loading.classList.add('hidden');
    }

    populateMissionList(missions, onSelect) {
        const list = this.elements['mission-list'];
        if (!list) return;
        list.innerHTML = '';

        missions.forEach(m => {
            const btn = document.createElement('button');
            btn.className = 'menu-btn';
            btn.style.opacity = m.unlocked ? '1' : '0.5';
            btn.style.width = '100%';
            btn.innerHTML = `
                ${m.completed ? '✅' : m.unlocked ? '🔓' : '🔒'}
                ${m.name}
                ${'⭐'.repeat(m.difficulty)}
            `;
            if (m.unlocked) {
                btn.addEventListener('click', () => onSelect(m.id));
            }
            list.appendChild(btn);
        });
    }

    populateColorPicker(colors, currentColor, onSelect) {
        const picker = this.elements['color-picker'];
        if (!picker) return;
        picker.innerHTML = '';

        colors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch' + (color === currentColor ? ' selected' : '');
            swatch.style.backgroundColor = '#' + color.toString(16).padStart(6, '0');
            swatch.addEventListener('click', () => {
                picker.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
                swatch.classList.add('selected');
                onSelect(color);
            });
            picker.appendChild(swatch);
        });
    }

    updateLobby(players, roomCode, isHost) {
        if (this.elements['lobby-room-code']) {
            this.elements['lobby-room-code'].textContent = roomCode || '----';
        }

        const list = this.elements['lobby-players'];
        if (list) {
            list.innerHTML = '';
            (players || []).forEach(p => {
                const card = document.createElement('div');
                card.className = 'lobby-player-card';
                card.innerHTML = `
                    <div class="player-icon">🏍️</div>
                    <div class="player-name">${p.name || 'لاعب'}</div>
                    <div style="font-size:0.7em;color:#aaa">${p.ready ? '✅ جاهز' : '⏳'}</div>
                `;
                list.appendChild(card);
            });
        }

        const startBtn = this.elements['btn-start-race'];
        if (startBtn) {
            startBtn.style.display = (isHost && players && players.length >= 2) ? '' : 'none';
        }
    }

    updateMultiplayerRankings(rankings) {
        const container = this.elements['mp-rankings'];
        const list = this.elements['mp-rankings-list'];
        if (!container || !list) return;

        container.style.display = rankings && rankings.length > 0 ? '' : 'none';
        if (!rankings) return;

        list.innerHTML = '';
        rankings.forEach((r, i) => {
            const row = document.createElement('div');
            row.className = 'mp-rank-row' + (r.self ? ' self' : '');
            row.innerHTML = `<span>#${i + 1} ${r.name}</span><span>${r.score}</span>`;
            list.appendChild(row);
        });
    }

    setConnectionStatus(connected) {
        const el = this.elements['connection-status'];
        if (el) {
            el.className = 'connection-status ' + (connected ? 'connected' : 'disconnected');
            el.textContent = connected ? '✅ متصل — Connected' : '❌ غير متصل — Disconnected';
        }
    }

    updateMinimap(playerPos, playerRot, targets, worldSize) {
        const canvas = this.elements['minimap-canvas'];
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        const scale = w / worldSize;

        ctx.fillStyle = '#1a2a1a';
        ctx.fillRect(0, 0, w, h);

        // Grid lines (roads)
        ctx.strokeStyle = '#334433';
        ctx.lineWidth = 1;
        const gridStep = 60 * scale;
        for (let i = 0; i < w; i += gridStep) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, h);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(w, i);
            ctx.stroke();
        }

        // Targets
        if (targets) {
            targets.forEach(t => {
                const tx = (t.x / worldSize + 0.5) * w;
                const tz = (t.z / worldSize + 0.5) * h;
                ctx.fillStyle = t.type === 'pickup' ? '#33ff33' : '#ff3333';
                ctx.beginPath();
                ctx.arc(tx, tz, 4, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        // Player
        const px = (playerPos.x / worldSize + 0.5) * w;
        const pz = (playerPos.z / worldSize + 0.5) * h;
        ctx.fillStyle = '#ffd700';
        ctx.save();
        ctx.translate(px, pz);
        ctx.rotate(-playerRot);
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.lineTo(-3, 4);
        ctx.lineTo(3, 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}
