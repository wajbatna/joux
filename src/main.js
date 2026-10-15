import { Game } from './game/Game.js';
import { Storage, loadData, saveData, getSettings, saveSettings, getPlayerProfile, savePlayerProfile } from './utils/Storage.js';
import { MISSION_DATA } from './utils/Constants.js';

const $ = id => document.getElementById(id);
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
  el.textContent = message; el.classList.add('show');
  window.setTimeout(() => el.classList.remove('show'), 2400);
}
function hideScreens() {
  ['main-menu','sp-menu','mission-select','mp-menu','join-room-screen','pause-menu','results-screen','garage-screen','settings-screen','multiplayer-lobby'].forEach(id => {
    const el = $(id); if (!el) return;
    el.classList.remove('active');
    if (id === 'main-menu') el.classList.add('hidden'); else el.style.display = 'none';
  });
}
function showScreen(id) {
  hideScreens(); const el = $(id); if (!el) return;
  el.style.display = ''; el.classList.remove('hidden'); el.classList.add('active');
}
function showMain() {
  if (game) game.pause();
  paused = true;
  $('hud').style.display = 'none'; $('mobile-controls').style.display = 'none';
  hideScreens(); $('main-menu').classList.remove('hidden'); $('main-menu').style.display = 'flex';
}
function updateHUD() {
  $('hud-score').textContent = String(score);
  $('hud-deliveries').textContent = String(deliveries);
  $('hud-satisfaction').textContent = `${Math.max(0, satisfaction)}%`;
  $('garage-coins').textContent = String(storage.get('coins', 0));
}
function openOrder() {
  if (orderOpen || paused || mode === 'endless') return;
  orderOpen = true;
  const mission = MISSION_DATA[currentMission % MISSION_DATA.length];
  $('order-details').textContent = `${mission.food || mission.name} — ${mission.description}`;
  $('order-popup').style.display = 'block';
  clearTimeout(orderTimer);
  orderTimer = window.setTimeout(() => {
    if (!orderOpen) return;
    orderOpen = false; $('order-popup').style.display = 'none';
    satisfaction = Math.max(0, satisfaction - 10); updateHUD();
    notify('تأخر الطلب، رضا الزبون نقص شوية.');
  }, 15000);
}
function acceptOrder() {
  if (!orderOpen || paused) return;
  orderOpen = false; clearTimeout(orderTimer); $('order-popup').style.display = 'none';
  game?.setDestination(); notify('تم قبول الطلب! وصل للعلامة الخضراء 🛵');
}
function startGame(nextMode = 'mission', missionIndex = 0) {
  mode = nextMode; currentMission = missionIndex;
  score = 0; deliveries = 0; satisfaction = 100; orderOpen = false;
  clearTimeout(orderTimer); $('order-popup').style.display = 'none';
  try {
    if (!game) game = new Game($('game-canvas'), {
      onProgress: text => { $('loading-text').textContent = text; },
      onPause: pauseGame,
      onInteract: acceptOrder,
      onSpeed: speed => { $('hud-speed').textContent = String(Math.round(speed)); },
      onCollision: () => { satisfaction = Math.max(0, satisfaction - 2); updateHUD(); },
      onDestination: () => {
        deliveries++; score += MISSION_DATA[currentMission % MISSION_DATA.length].difficulty * 100;
        storage.set('coins', storage.get('coins', 0) + 10);
        updateHUD(); notify('برافو! وصلتي الطلب بنجاح 🎉');
        if (mode === 'mission') window.setTimeout(endGame, 900);
        else window.setTimeout(openOrder, 1800);
      }
    });
    game.reset(); game.start(); paused = false;
    hideScreens(); $('hud').style.display = 'block'; $('mobile-controls').style.display = 'block';
    $('hud-timer-container').style.display = mode === 'endless' ? 'none' : 'block';
    updateHUD(); window.setTimeout(openOrder, 1800);
  } catch (error) {
    console.error(error); notify('وقع مشكل فبدء اللعبة. حدّث الصفحة وحاول مرة أخرى.');
  }
}
function endGame() {
  paused = true; game?.pause();
  $('hud').style.display = 'none'; $('mobile-controls').style.display = 'none';
  $('results-title').textContent = '🎉 كملتي المهمة!';
  $('results-stars').textContent = satisfaction >= 80 ? '⭐⭐⭐' : satisfaction >= 50 ? '⭐⭐' : '⭐';
  $('results-details').textContent = `التوصيلات: ${deliveries} | رضا الزبون: ${satisfaction}%`;
  $('results-total').textContent = `${score} نقطة`;
  const profile = getPlayerProfile();
  profile.coins = storage.get('coins', 0); profile.totalDeliveries = (profile.totalDeliveries || 0) + deliveries;
  savePlayerProfile(profile); showScreen('results-screen');
}
function pauseGame() {
  if (paused) return;
  paused = true; game?.pause(); showScreen('pause-menu');
}
function resumeGame() { paused = false; hideScreens(); $('hud').style.display = 'block'; $('mobile-controls').style.display = 'block'; game?.start(); }
function renderMissions() {
  const list = $('mission-list'); list.replaceChildren();
  MISSION_DATA.forEach((mission,index) => {
    const btn=document.createElement('button'); btn.className='menu-btn';
    btn.textContent=`${index+1}. ${mission.name} — ${mission.time}s`;
    btn.addEventListener('click',()=>startGame('mission',index)); list.append(btn);
  });
}
$('btn-singleplayer')?.addEventListener('click',()=>showScreen('sp-menu'));
$('btn-sp-missions')?.addEventListener('click',()=>{renderMissions();showScreen('mission-select');});
$('btn-sp-endless')?.addEventListener('click',()=>startGame('endless'));
$('btn-sp-tutorial')?.addEventListener('click',()=>{startGame('endless');notify('W/↑ تسريع · S/↓ فرامل · A/D أو الأسهم للتوجيه · E قبول الطلب');});
$('btn-multiplayer')?.addEventListener('click',()=>{showScreen('mp-menu');notify('اللعب الجماعي يتطلب نشر وتشغيل السيرفر.');});
$('btn-mp-create')?.addEventListener('click',()=>notify('شغّل سيرفر Socket.IO قبل إنشاء غرفة.'));
$('btn-mp-join')?.addEventListener('click',()=>showScreen('join-room-screen'));
$('btn-mp-public')?.addEventListener('click',()=>notify('خاص السيرفر يكون متصل باش تلقى اللاعبين.'));
$('btn-join-confirm')?.addEventListener('click',()=>notify('تحقق من عنوان السيرفر ثم حاول مجدداً.'));
$('btn-garage')?.addEventListener('click',()=>showScreen('garage-screen'));
$('btn-settings')?.addEventListener('click',()=>{const s=getSettings();$('setting-music').value=s.musicVolume??50;$('setting-sfx').value=s.sfxVolume??70;$('setting-quality').value=s.quality||'medium';$('setting-shadows').checked=s.shadows!==false;$('setting-sensitivity').value=s.sensitivity??50;$('setting-server-url').value=s.serverUrl||import.meta.env.VITE_SERVER_URL||'http://localhost:3001';showScreen('settings-screen');});
['sp-back','mission-back','mp-back','join-back','lobby-back','garage-back','settings-back','btn-quit','btn-results-menu'].forEach(id=>$(id)?.addEventListener('click',showMain));
$('btn-resume')?.addEventListener('click',resumeGame);
$('btn-restart')?.addEventListener('click',()=>startGame(mode,currentMission));
$('btn-next-mission')?.addEventListener('click',()=>startGame('mission',(currentMission+1)%MISSION_DATA.length));
$('btn-accept-order')?.addEventListener('click',acceptOrder);
$('btn-start-race')?.addEventListener('click',()=>notify('السباق الجماعي يحتاج اتصالاً بالخادم.'));
$('touch-pause')?.addEventListener('click',pauseGame);
$('touch-interact')?.addEventListener('click',acceptOrder);
$('setting-server-url')?.addEventListener('change',e=>{const s=getSettings();s.serverUrl=e.target.value.trim();saveSettings(s);storage.set('serverUrl',s.serverUrl);});
['setting-music','setting-sfx','setting-quality','setting-shadows','setting-sensitivity'].forEach(id=>$(id)?.addEventListener('change',()=>{const s=getSettings();s.musicVolume=Number($('setting-music').value);s.sfxVolume=Number($('setting-sfx').value);s.quality=$('setting-quality').value;s.shadows=$('setting-shadows').checked;s.sensitivity=Number($('setting-sensitivity').value);saveSettings(s);}));
const picker=$('color-picker');
if(picker){['#ff6b35','#e63946','#2a9d8f','#f4a261','#457b9d','#f1faee'].forEach((color,i)=>{const b=document.createElement('button');b.className='color-swatch'+(i===0?' selected':'');b.style.background=color;b.setAttribute('aria-label',`لون الدراجة ${i+1}`);b.addEventListener('click',()=>{picker.querySelectorAll('.color-swatch').forEach(el=>el.classList.remove('selected'));b.classList.add('selected');storage.set('bikeColor',color);game?.setBikeColor(color);});picker.append(b);});}
window.addEventListener('resize',()=>game?.resize());
window.addEventListener('error',e=>{console.error(e.error||e.message);});
$('loading-bar').style.width='100%'; $('loading-text').textContent='اللعبة واجدة!';
window.setTimeout(()=>$('loading-screen')?.classList.add('hidden'),700);
$('hud').style.display='none'; $('mobile-controls').style.display='none'; updateHUD();
