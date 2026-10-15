import { Game } from './game/Game.js';
import { InputManager } from './game/InputManager.js';
import { Storage } from './utils/Storage.js';
import { missions } from './missions/missions.js';

const $ = (id) => document.getElementById(id);
const storage = new Storage();
let game = null;
let mode = 'mission';
let currentMission = 0;
let score = 0;
let deliveries = 0;
let satisfaction = 100;
let paused = true;
let orderOpen = false;
let orderTimer = null;

function notify(message) {
  const el = $('game-notification');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  window.setTimeout(() => el.classList.remove('show'), 2200);
}
function hideScreens() {
  ['main-menu','sp-menu','mission-select','mp-menu','join-room-screen','pause-menu','results-screen','garage-screen','settings-screen','multiplayer-lobby'].forEach(id => {
    const el = $(id);
    if (el) { el.classList.remove('active'); if (id === 'main-menu') el.classList.add('hidden'); else el.style.display = 'none'; }
  });
}
function showScreen(id) {
  hideScreens();
  const el = $(id);
  if (!el) return;
  el.style.display = '';
  el.classList.remove('hidden');
  el.classList.add('active');
}
function showMain() {
  hideScreens();
  const el = $('main-menu');
  el.classList.remove('hidden');
  el.style.display = 'flex';
}
function updateHUD() {
  if ($('hud-score')) $('hud-score').textContent = String(score);
  if ($('hud-deliveries')) $('hud-deliveries').textContent = String(deliveries);
  if ($('hud-satisfaction')) $('hud-satisfaction').textContent = `${Math.max(0, satisfaction)}%`;
  if ($('garage-coins')) $('garage-coins').textContent = String(storage.get('coins', 0));
}
function openOrder() {
  if (orderOpen || paused || mode === 'endless') return;
  orderOpen = true;
  const mission = missions[currentMission % missions.length];
  $('order-details').textContent = `${mission.title} — مكافأة ${mission.reward} نقطة`;
  $('order-popup').style.display = 'block';
  orderTimer = window.setTimeout(() => { if (orderOpen) { orderOpen = false; $('order-popup').style.display = 'none'; satisfaction = Math.max(0, satisfaction - 10); updateHUD(); } }, 12000);
}
function acceptOrder() {
  if (!orderOpen) return;
  orderOpen = false;
  clearTimeout(orderTimer);
  $('order-popup').style.display = 'none';
  notify('تم قبول الطلب! وصل للزبون بأمان 🛵');
  if (game) game.setDestination();
}
function startGame(nextMode = 'mission', missionIndex = 0) {
  mode = nextMode;
  currentMission = missionIndex;
  score = 0; deliveries = 0; satisfaction = 100; orderOpen = false;
  clearTimeout(orderTimer);
  if ($('order-popup')) $('order-popup').style.display = 'none';
  if (!game) game = new Game($('game-canvas'), {
    onSpeed: speed => { if ($('hud-speed')) $('hud-speed').textContent = String(Math.round(speed)); },
    onCollision: () => { satisfaction = Math.max(0, satisfaction - 3); updateHUD(); },
    onDestination: () => {
      deliveries++; score += missions[currentMission % missions.length].reward;
      storage.set('coins', storage.get('coins', 0) + 10); updateHUD();
      notify('برافو! وصلتي الطلب بنجاح 🎉');
      if (mode === 'mission' && deliveries >= 1) endGame();
      else window.setTimeout(openOrder, 1800);
    }
  });
  game.reset();
  game.start();
  paused = false;
  hideScreens();
  $('hud').style.display = 'block';
  $('mobile-controls').style.display = 'block';
  $('hud-timer-container').style.display = mode === 'endless' ? 'none' : 'block';
  $('mp-rankings').style.display = 'none';
  updateHUD();
  window.setTimeout(openOrder, 3000);
}
function endGame() {
  paused = true;
  if (game) game.pause();
  $('hud').style.display = 'none';
  $('mobile-controls').style.display = 'none';
  $('results-title').textContent = '🎉 كملتي المهمة!';
  $('results-stars').textContent = satisfaction >= 80 ? '⭐⭐⭐' : satisfaction >= 50 ? '⭐⭐' : '⭐';
  $('results-details').textContent = `التوصيلات: ${deliveries} | رضا الزبون: ${satisfaction}%`;
  $('results-total').textContent = `${score} نقطة`;
  showScreen('results-screen');
}
function pauseGame() {
  if (paused) return;
  paused = true;
  if (game) game.pause();
  showScreen('pause-menu');
}
function resumeGame() {
  paused = false;
  hideScreens();
  if (game) game.start();
}
function renderMissions() {
  const list = $('mission-list');
  list.replaceChildren();
  missions.forEach((mission, index) => {
    const btn = document.createElement('button');
    btn.className = 'menu-btn';
    btn.textContent = `${index + 1}. ${mission.title} — ${mission.reward} نقطة`;
    btn.addEventListener('click', () => startGame('mission', index));
    list.append(btn);
  });
}
$('btn-singleplayer')?.addEventListener('click', () => showScreen('sp-menu'));
$('btn-sp-missions')?.addEventListener('click', () => { renderMissions(); showScreen('mission-select'); });
$('btn-sp-endless')?.addEventListener('click', () => startGame('endless'));
$('btn-sp-tutorial')?.addEventListener('click', () => { startGame('endless'); notify('استعمل الأسهم أو WASD للتحرك، واجمع الطلبات!'); });
$('btn-multiplayer')?.addEventListener('click', () => { showScreen('mp-menu'); notify('اللعب الجماعي يحتاج تشغيل السيرفر.'); });
$('btn-mp-create')?.addEventListener('click', () => notify('شغّل السيرفر ثم جرّب اللعب الجماعي.'));
$('btn-mp-join')?.addEventListener('click', () => showScreen('join-room-screen'));
$('btn-mp-public')?.addEventListener('click', () => notify('خاص سيرفر اللعب الجماعي يكون خدام.'));
$('btn-join-confirm')?.addEventListener('click', () => notify('تعذر الاتصال: تحقق من عنوان السيرفر.'));
$('btn-garage')?.addEventListener('click', () => showScreen('garage-screen'));
$('btn-settings')?.addEventListener('click', () => { $('setting-server-url').value = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'; showScreen('settings-screen'); });
['sp-back','mission-back','mp-back','join-back','lobby-back','garage-back','settings-back','btn-quit','btn-results-menu'].forEach(id => $(id)?.addEventListener('click', showMain));
$('btn-resume')?.addEventListener('click', resumeGame);
$('btn-restart')?.addEventListener('click', () => startGame(mode, currentMission));
$('btn-next-mission')?.addEventListener('click', () => startGame('mission', (currentMission + 1) % missions.length));
$('btn-accept-order')?.addEventListener('click', acceptOrder);
$('btn-start-race')?.addEventListener('click', () => notify('السباق الجماعي غير متاح دون سيرفر متصل.'));
$('touch-pause')?.addEventListener('click', pauseGame);
$('touch-interact')?.addEventListener('click', acceptOrder);
$('setting-server-url')?.addEventListener('change', e => storage.set('serverUrl', e.target.value.trim()));
const colors = ['#ff6b35','#e63946','#2a9d8f','#f4a261','#457b9d','#f1faee'];
const picker = $('color-picker');
if (picker) colors.forEach((color, i) => { const b = document.createElement('button'); b.className = 'color-swatch' + (i === 0 ? ' selected' : ''); b.style.background = color; b.setAttribute('aria-label', `لون الدراجة ${i+1}`); b.addEventListener('click', () => { picker.querySelectorAll('.color-swatch').forEach(el => el.classList.remove('selected')); b.classList.add('selected'); storage.set('bikeColor', color); game?.setBikeColor(color); }); picker.append(b); });
new InputManager({
  onPause: pauseGame,
  onHorn: () => game?.horn(),
  onInteract: acceptOrder,
  onAction: action => game?.setAction(action)
});
window.addEventListener('resize', () => game?.resize());
window.addEventListener('error', event => { console.error(event.error || event.message); notify('وقع خطأ فاللعبة. حدّث الصفحة وحاول مرة أخرى.'); });
window.addEventListener('unhandledrejection', event => { console.error(event.reason); notify('تعذر إكمال العملية. تحقق من الاتصال.'); });
$('loading-bar').style.width = '100%';
$('loading-text').textContent = 'اللعبة واجدة!';
window.setTimeout(() => $('loading-screen')?.classList.add('hidden'), 500);
$('hud').style.display = 'none';
$('mobile-controls').style.display = 'none';
updateHUD();
