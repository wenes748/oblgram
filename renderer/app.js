const socket = io('https://oblgram.onrender.com', { transports: ['websocket'] });

let ME = null;
let CURRENT = null;
let ACTIVE_TOKEN = null;
let VIEWING_USER = null;
let NFT_CATALOG_CACHE = [];
let STORE_TARGET = null;

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c =>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// ================== SVG ПОДАРКИ ==================
const NFT_ICONS = {
  bear: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="bear-body" cx="40%" cy="30%"><stop offset="0%" stop-color="#d4a373"/><stop offset="100%" stop-color="#8b5a2b"/></radialGradient></defs>
    <circle cx="35" cy="32" r="15" fill="#8b5a2b"/><circle cx="85" cy="32" r="15" fill="#8b5a2b"/>
    <circle cx="35" cy="32" r="7" fill="#6b4423"/><circle cx="85" cy="32" r="7" fill="#6b4423"/>
    <ellipse cx="60" cy="68" rx="38" ry="35" fill="url(#bear-body)" stroke="#5a3610" stroke-width="2.5"/>
    <ellipse cx="60" cy="80" rx="20" ry="15" fill="#f0d9b5"/>
    <circle cx="48" cy="60" r="4" fill="#1a1a1a"/><circle cx="72" cy="60" r="4" fill="#1a1a1a"/>
    <ellipse cx="60" cy="74" rx="5" ry="4" fill="#1a1a1a"/>
    <path d="M52 84 Q60 92 68 84" stroke="#1a1a1a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <circle cx="32" cy="86" r="6" fill="#e88888" opacity="0.6"/><circle cx="88" cy="86" r="6" fill="#e88888" opacity="0.6"/>
  </svg>`,
  rose: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="rose-g" cx="50%" cy="40%"><stop offset="0%" stop-color="#ff5c8a"/><stop offset="60%" stop-color="#c2185b"/><stop offset="100%" stop-color="#7a0a30"/></radialGradient></defs>
    <path d="M60 60 Q57 85 60 108" stroke="#2e7d32" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <path d="M60 90 Q44 82 38 68 Q48 72 60 82 Z" fill="#4caf50"/>
    <circle cx="60" cy="48" r="28" fill="url(#rose-g)" stroke="#5a0a20" stroke-width="2.5"/>
    <path d="M44 40 Q60 28 76 40 Q70 58 60 56 Q50 58 44 40 Z" fill="#ff8fb0"/>
  </svg>`,
  cake: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <rect x="22" y="58" width="76" height="46" rx="8" fill="#f5d0a9" stroke="#8b5a2b" stroke-width="2.5"/>
    <rect x="22" y="58" width="76" height="16" fill="#ff9fb0"/>
    <circle cx="36" cy="68" r="2.5" fill="#e53935"/><circle cx="50" cy="68" r="2.5" fill="#e53935"/>
    <circle cx="70" cy="68" r="2.5" fill="#e53935"/><circle cx="84" cy="68" r="2.5" fill="#e53935"/>
    <rect x="54" y="30" width="10" height="28" fill="#ffc828" rx="2"/>
    <path d="M59 18 Q64 26 59 30 Q54 26 59 18 Z" fill="#ff6b35"/>
  </svg>`,
  heart: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="heart-g" cx="35%" cy="30%"><stop offset="0%" stop-color="#ff8fb0"/><stop offset="60%" stop-color="#e53935"/><stop offset="100%" stop-color="#8a1038"/></radialGradient></defs>
    <path d="M60 104 C24 78 10 56 10 40 C10 24 24 12 38 12 C48 12 56 18 60 26 C64 18 72 12 82 12 C96 12 110 24 110 40 C110 56 96 78 60 104 Z" fill="url(#heart-g)" stroke="#5a0a20" stroke-width="2.5"/>
    <ellipse cx="40" cy="36" rx="10" ry="6" fill="#fff" opacity="0.5"/>
  </svg>`,
  cup: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="cup-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffe066"/><stop offset="50%" stop-color="#e8a800"/><stop offset="100%" stop-color="#8b6508"/></linearGradient></defs>
    <path d="M26 30 L94 30 L86 84 Q84 100 60 100 Q36 100 34 84 Z" fill="url(#cup-g)" stroke="#6b4a00" stroke-width="2.5"/>
    <path d="M94 38 Q112 38 112 56 Q112 74 94 74" stroke="#6b4a00" stroke-width="4" fill="none"/>
    <path d="M26 38 Q8 38 8 56 Q8 74 26 74" stroke="#6b4a00" stroke-width="4" fill="none"/>
    <rect x="22" y="24" width="76" height="14" rx="4" fill="#b87400" stroke="#6b4a00" stroke-width="2"/>
    <text x="60" y="68" text-anchor="middle" font-size="26" font-weight="bold" fill="#6b4a00" font-family="Arial">1</text>
  </svg>`,
  rocket: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="rocket-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#a0a8b0"/></linearGradient></defs>
    <path d="M60 8 C78 26 88 54 84 78 L74 96 L46 96 L36 78 C32 54 42 26 60 8 Z" fill="url(#rocket-body)" stroke="#5a6870" stroke-width="2.5"/>
    <circle cx="60" cy="46" r="12" fill="#2aabee" stroke="#fff" stroke-width="3"/>
    <path d="M36 78 L18 96 L36 96 Z" fill="#e53935"/><path d="M84 78 L102 96 L84 96 Z" fill="#e53935"/>
    <path d="M50 96 Q60 118 70 96 Z" fill="#ff8c00"/>
    <path d="M56 96 Q60 110 64 96 Z" fill="#fff" opacity="0.8"/>
  </svg>`,
  diamond: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="dia-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#d0f8ff"/><stop offset="40%" stop-color="#7ff5ff"/><stop offset="100%" stop-color="#0088aa"/></linearGradient></defs>
    <path d="M30 30 L60 8 L90 30 L110 50 L60 110 L10 50 Z" fill="url(#dia-g)" stroke="#004a66" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M30 30 L60 50 L90 30 M10 50 L60 50 L110 50 M60 50 L60 110" stroke="#004a66" stroke-width="1.8" fill="none" opacity="0.7"/>
    <path d="M36 30 L60 16 L68 30 Z" fill="#fff" opacity="0.75"/>
  </svg>`,
  alien: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="alien-body" cx="50%" cy="35%"><stop offset="0%" stop-color="#b8ffb8"/><stop offset="100%" stop-color="#2e7d32"/></radialGradient></defs>
    <path d="M60 8 C86 8 104 34 104 60 C104 86 86 108 60 108 C34 108 16 86 16 60 C16 34 34 8 60 8 Z" fill="url(#alien-body)" stroke="#1a4a1e" stroke-width="2.5"/>
    <ellipse cx="42" cy="56" rx="13" ry="17" fill="#1a1a1a"/><ellipse cx="78" cy="56" rx="13" ry="17" fill="#1a1a1a"/>
    <ellipse cx="40" cy="52" rx="5" ry="6" fill="#fff"/><ellipse cx="76" cy="52" rx="5" ry="6" fill="#fff"/>
    <path d="M48 84 Q60 90 72 84" stroke="#1a4a1e" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  </svg>`,
  crown: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="crown-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fff3a0"/><stop offset="50%" stop-color="#ffc828"/><stop offset="100%" stop-color="#8b6508"/></linearGradient></defs>
    <path d="M18 42 L30 74 L90 74 L102 42 L84 58 L70 26 L60 50 L50 26 L36 58 Z" fill="url(#crown-g)" stroke="#5a3a00" stroke-width="2.5" stroke-linejoin="round"/>
    <rect x="26" y="74" width="68" height="22" rx="4" fill="url(#crown-g)" stroke="#5a3a00" stroke-width="2.5"/>
    <circle cx="42" cy="85" r="4" fill="#e53935"/><circle cx="60" cy="85" r="4" fill="#2aabee"/><circle cx="78" cy="85" r="4" fill="#a855f7"/>
    <circle cx="18" cy="40" r="6" fill="#ff5c8a" stroke="#5a3a00" stroke-width="1.5"/>
    <circle cx="60" cy="22" r="6" fill="#2aabee" stroke="#5a3a00" stroke-width="1.5"/>
    <circle cx="102" cy="40" r="6" fill="#a855f7" stroke="#5a3a00" stroke-width="1.5"/>
  </svg>`,
  unicorn: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="uni-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ffd6f0"/><stop offset="50%" stop-color="#ff8fb0"/><stop offset="100%" stop-color="#a855f7"/></linearGradient></defs>
    <path d="M60 6 L68 34 L100 42 L72 56 L72 88 L48 88 L48 56 L20 42 L52 34 Z" fill="url(#uni-g)" stroke="#6d3a99" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M60 6 L63 20 L57 20 Z" fill="#ffc828"/>
    <circle cx="48" cy="52" r="4" fill="#1a1a1a"/>
    <path d="M48 88 L40 108 L50 96 L60 108 L70 96 L80 108 L72 88 Z" fill="url(#uni-g)" stroke="#6d3a99" stroke-width="1.5"/>
  </svg>`,
  dragon: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="drg-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ff8c4a"/><stop offset="50%" stop-color="#e53935"/><stop offset="100%" stop-color="#6b0a00"/></linearGradient></defs>
    <path d="M60 14 L70 36 L96 26 L88 54 L114 60 L88 70 L96 100 L70 88 L60 114 L50 88 L24 100 L32 70 L6 60 L32 54 L24 26 L50 36 Z" fill="url(#drg-g)" stroke="#3a0500" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="46" cy="56" r="6" fill="#ffe066"/><circle cx="74" cy="56" r="6" fill="#ffe066"/>
    <circle cx="46" cy="56" r="2.5" fill="#000"/><circle cx="74" cy="56" r="2.5" fill="#000"/>
    <path d="M44 78 Q60 86 76 78" stroke="#3a0500" stroke-width="2.5" fill="none"/>
  </svg>`,
  phoenix: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="phx-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fff5a0"/><stop offset="40%" stop-color="#ffc828"/><stop offset="70%" stop-color="#ff6b35"/><stop offset="100%" stop-color="#c2185b"/></linearGradient></defs>
    <path d="M60 6 C66 32 84 30 102 22 C96 42 108 50 114 68 C100 62 92 68 84 82 C80 98 70 108 60 118 C50 108 40 98 36 82 C28 68 20 62 6 68 C12 50 24 42 18 22 C36 30 54 32 60 6 Z" fill="url(#phx-g)" stroke="#7a1040" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M60 36 L66 58 L60 80 L54 58 Z" fill="#fff" opacity="0.7"/>
    <circle cx="60" cy="72" r="5" fill="#fff" opacity="0.9"/>
  </svg>`,
  galaxy: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="gal-g" cx="50%" cy="50%"><stop offset="0%" stop-color="#ffffff"/><stop offset="25%" stop-color="#a855f7"/><stop offset="60%" stop-color="#3a1a6a"/><stop offset="100%" stop-color="#0a0a2a"/></radialGradient></defs>
    <circle cx="60" cy="60" r="54" fill="url(#gal-g)"/>
    <ellipse cx="60" cy="60" rx="54" ry="18" fill="none" stroke="#fff" stroke-width="1.8" opacity="0.6"/>
    <ellipse cx="60" cy="60" rx="54" ry="18" fill="none" stroke="#a855f7" stroke-width="1.5" opacity="0.4" transform="rotate(55 60 60)"/>
    <ellipse cx="60" cy="60" rx="54" ry="18" fill="none" stroke="#a855f7" stroke-width="1.5" opacity="0.4" transform="rotate(-55 60 60)"/>
    <circle cx="30" cy="36" r="1.8" fill="#fff"/><circle cx="90" cy="30" r="1.2" fill="#fff"/>
    <circle cx="82" cy="90" r="1.8" fill="#fff"/><circle cx="34" cy="92" r="1.2" fill="#fff"/>
    <circle cx="60" cy="60" r="4" fill="#fff"/>
  </svg>`,

  // ===== СИГАРА =====
  cigar: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="cigar-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f5c542"/><stop offset="50%" stop-color="#d4a017"/><stop offset="100%" stop-color="#8b6508"/>
      </linearGradient>
      <linearGradient id="cigar-tip" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#8b4513"/><stop offset="100%" stop-color="#3a1a00"/>
      </linearGradient>
    </defs>
    <path d="M10 46 Q6 60 10 74 Q30 88 70 84 Q102 80 110 62 Q102 44 70 40 Q30 36 10 46 Z" fill="url(#cigar-body)" stroke="#5a3a00" stroke-width="2"/>
    <ellipse cx="14" cy="60" rx="8" ry="14" fill="url(#cigar-tip)" stroke="#1a0500" stroke-width="1.5"/>
    <ellipse cx="14" cy="60" rx="5" ry="10" fill="#ff6b35"/>
    <ellipse cx="14" cy="60" rx="3" ry="6" fill="#ffc828"/>
    <path d="M40 42 Q42 60 40 82 M65 40 Q67 60 65 84 M90 44 Q92 60 90 80" stroke="#8b6508" stroke-width="0.8" fill="none" opacity="0.6"/>
    <circle cx="75" cy="62" r="10" fill="#fff" stroke="#c0c0c0" stroke-width="1.5"/>
    <circle cx="75" cy="62" r="8" fill="#e8e8e8"/>
    <text x="75" y="65" text-anchor="middle" font-size="7" fill="#2aabee" font-weight="bold">T</text>
    <path d="M8 46 Q0 34 12 22 Q26 16 30 26 Q20 30 18 40" fill="#e8e8e8" opacity="0.8"/>
  </svg>`,

  // ===== ДЕНЬГИ =====
  money: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="money-bg" cx="50%" cy="50%">
        <stop offset="0%" stop-color="#fff3a0"/><stop offset="70%" stop-color="#ffc828"/><stop offset="100%" stop-color="#e8a800"/>
      </radialGradient>
      <linearGradient id="money-lens" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#c8ff60"/><stop offset="100%" stop-color="#4caf50"/>
      </linearGradient>
    </defs>
    <path d="M20 68 Q16 90 30 100 Q44 108 60 108 Q76 108 90 100 Q104 90 100 68 Q108 58 100 48 Q88 42 76 46 Q68 36 60 36 Q52 36 44 46 Q32 42 20 48 Q12 58 20 68 Z" fill="url(#money-bg)" stroke="#b87400" stroke-width="2"/>
    <path d="M40 60 Q50 48 60 48 Q70 48 80 60 Q70 72 60 72 Q50 72 40 60 Z" fill="#4a5a2a" opacity="0.4"/>
    <path d="M18 54 L48 48 L54 72 L24 78 Z" fill="url(#money-lens)" stroke="#1a2a5a" stroke-width="3" stroke-linejoin="round"/>
    <path d="M56 60 L66 58 L72 82 L62 84 Z" fill="url(#money-lens)" stroke="#1a2a5a" stroke-width="3" stroke-linejoin="round"/>
    <path d="M48 48 Q52 54 56 60" stroke="#1a2a5a" stroke-width="3" fill="none"/>
    <path d="M66 58 Q74 56 82 58" stroke="#1a2a5a" stroke-width="3" fill="none"/>
    <text x="36" y="68" text-anchor="middle" font-size="22" font-weight="900" fill="#1a2a5a" font-family="Arial">$</text>
    <text x="64" y="76" text-anchor="middle" font-size="22" font-weight="900" fill="#1a2a5a" font-family="Arial">$</text>
  </svg>`,

  // ===== ПЕПЕ — САМАЯ ДОРОГАЯ =====
  pepe: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="pepe-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#7ac74f"/><stop offset="100%" stop-color="#4caf50"/>
      </linearGradient>
      <linearGradient id="pepe-heart" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffd966"/><stop offset="100%" stop-color="#ff9800"/>
      </linearGradient>
    </defs>
    <path d="M40 14 Q40 6 50 8 Q58 4 66 10 Q76 6 82 14 Q84 24 78 28 Q88 30 90 40 Q98 40 98 50 Q98 62 88 64 Q90 78 78 88 Q80 100 66 104 Q60 112 50 108 Q40 116 32 106 Q20 108 18 96 Q8 92 10 80 Q2 72 6 60 Q2 48 12 42 Q12 30 22 28 Q24 16 34 18 Q36 12 40 14 Z" fill="url(#pepe-body)" stroke="#2e7d32" stroke-width="2.5"/>
    <path d="M28 34 Q60 26 92 34 Q94 46 92 50 Q60 46 28 50 Q26 42 28 34 Z" fill="#1a5a9a" stroke="#0a3a6a" stroke-width="1.5"/>
    <path d="M26 32 Q22 28 20 30 Q22 34 26 32 Z M94 32 Q98 28 100 30 Q98 34 94 32 Z" fill="#1a5a9a" stroke="#0a3a6a" stroke-width="1"/>
    <ellipse cx="38" cy="56" rx="11" ry="13" fill="#1a1a1a"/>
    <ellipse cx="82" cy="56" rx="11" ry="13" fill="#1a1a1a"/>
    <ellipse cx="38" cy="56" rx="9" ry="11" fill="#3a5a7a"/>
    <ellipse cx="82" cy="56" rx="9" ry="11" fill="#3a5a7a"/>
    <circle cx="36" cy="54" r="2" fill="#fff"/><circle cx="40" cy="58" r="1.5" fill="#fff"/>
    <circle cx="80" cy="54" r="2" fill="#fff"/><circle cx="84" cy="58" r="1.5" fill="#fff"/>
    <path d="M30 76 Q60 68 90 76 Q90 88 60 90 Q30 88 30 76 Z" fill="#c62828" stroke="#8a1c00" stroke-width="2"/>
    <path d="M30 78 Q60 74 90 78" stroke="#ff8fb0" stroke-width="1.5" fill="none" opacity="0.6"/>
    <path d="M42 108 Q60 96 78 108 Q72 118 60 118 Q48 118 42 108 Z" fill="url(#pepe-heart)" stroke="#c55a00" stroke-width="2"/>
    <path d="M60 100 L60 118" stroke="#c55a00" stroke-width="1" opacity="0.5"/>
    <path d="M22 76 Q14 78 14 88 Q20 86 24 84 Z" fill="url(#pepe-body)" stroke="#2e7d32" stroke-width="1.5"/>
    <path d="M98 76 Q106 78 106 88 Q100 86 96 84 Z" fill="url(#pepe-body)" stroke="#2e7d32" stroke-width="1.5"/>
  </svg>`,
};

function nftIconSVG(iconId) {
  return NFT_ICONS[iconId] || NFT_ICONS.bear;
}

function nftIconSVG(iconId) {
  return NFT_ICONS[iconId] || NFT_ICONS.bear;
}

function nftIconSVG(iconId) {
  return NFT_ICONS[iconId] || NFT_ICONS.bear;
}

// ================== ОПРЕДЕЛЕНИЕ УСТРОЙСТВА ==================
function detectDevice() {
  const ua = navigator.userAgent;
  const isMobileUA = /Android|iPhone|iPod|Opera Mini|IEMobile|Mobile/i.test(ua) && !/iPad/i.test(ua);
  const isTabletUA = /iPad|Tablet|PlayBook|Silk/i.test(ua) ||
                     (/Android/i.test(ua) && !/Mobile/i.test(ua));
  const w = window.innerWidth;
  const touch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

  let device = 'desktop';
  if (isMobileUA) device = 'mobile';
  else if (isTabletUA) device = 'tablet';
  else if (w < 600) device = 'mobile';
  else if (w < 1024 && touch) device = 'tablet';

  document.body.classList.remove('device-mobile', 'device-tablet', 'device-desktop');
  document.body.classList.add('device-' + device);
  return { device, w, h: window.innerHeight, touch };
}
let DEVICE = detectDevice();
window.addEventListener('resize', () => { DEVICE = detectDevice(); });

// ================== ХРАНИЛИЩЕ АККАУНТОВ ==================
const ACC_KEY = 'oblgram_accounts';
const loadAccounts = () => { try { return JSON.parse(localStorage.getItem(ACC_KEY) || '[]'); } catch { return []; } };
const saveAccounts = l => localStorage.setItem(ACC_KEY, JSON.stringify(l));
function addAccountToken(token, user) {
  const l = loadAccounts();
  const i = l.findIndex(a => a.token === token);
  if (i === -1) l.push({ token, user }); else l[i].user = user;
  saveAccounts(l);
}
function removeAccountToken(t) { saveAccounts(loadAccounts().filter(a => a.token !== t)); }
function setActiveToken(t) { ACTIVE_TOKEN = t; localStorage.setItem('oblgram_active', t); }
function getActiveToken() { return localStorage.getItem('oblgram_active'); }

// ================== УТИЛИТЫ ==================
function toast(msg) {
  const t = $('toast'); t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._id);
  t._id = setTimeout(() => t.classList.remove('show'), 2500);
}
function fmtTime(ts) {
  if (!ts) return '';
  const d = new Date(ts), now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const diff = Math.floor((now - d) / 86400000);
  if (diff < 7) return d.toLocaleDateString('ru-RU', { weekday: 'short' });
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}
function fmtDate(ts) {
  if (!ts || ts === -1) return 'навсегда';
  return new Date(ts).toLocaleDateString('ru-RU');
}

const showAuth = name => ['screen-phone', 'screen-code', 'screen-pass']
  .forEach(id => $(id).classList.toggle('active', id === name));

// ================== АВТОВХОД ==================
(function init() {
  const accs = loadAccounts();
  const active = getActiveToken() || (accs[0] && accs[0].token);
  if (active) {
    ACTIVE_TOKEN = active;
    socket.emit('auto-login', active);
  } else {
    $('auth').classList.remove('hidden');
  }
})();

socket.on('auto-login-failed', () => {
  const active = getActiveToken();
  if (active) removeAccountToken(active);
  localStorage.removeItem('oblgram_active');
  ACTIVE_TOKEN = null;
  const accs = loadAccounts();
  if (accs.length) {
    ACTIVE_TOKEN = accs[0].token;
    setActiveToken(ACTIVE_TOKEN);
    socket.emit('auto-login', ACTIVE_TOKEN);
  } else {
    $('auth').classList.remove('hidden');
  }
});

// ================== АВТОРИЗАЦИЯ ==================
$('btn-phone').onclick = () => {
  let phone = $('phone').value.trim();
  // Оставляем только цифры и + в начале
  phone = phone.replace(/[^\d+]/g, '');
  if (phone.length < 8) return toast('Введите корректный номер');
  $('phone').value = phone;
  socket.emit('register', phone);
};
$('phone').addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/[^\d+\s\-()]/g, '');
});
$('phone').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    $('btn-phone').click();
  }
});
$('btn-code').onclick = () => {
  const code = $('code').value.trim();
  if (code.length < 4) return toast('Введите код');
  socket.emit('verify-code', { phone: $('phone').value.trim(), code });
};
$('code').addEventListener('keydown', e => e.key === 'Enter' && $('btn-code').click());
$('btn-back').onclick = () => showAuth('screen-phone');
$('btn-pass').onclick = () => {
  const password = $('password').value;
  if (!password) return toast('Введите пароль');
  socket.emit('verify-password', { phone: '+88814881488', password });
};
$('password').addEventListener('keydown', e => e.key === 'Enter' && $('btn-pass').click());

socket.on('code-sent', ({ phone, demoCode }) => {
  $('phone-display').textContent = phone;
  $('demo-code').textContent = demoCode;
  $('code').value = '';
  showAuth('screen-code');
  setTimeout(() => $('code').focus(), 100);
});
socket.on('need-password', () => {
  $('password').value = '';
  showAuth('screen-pass');
  setTimeout(() => $('password').focus(), 100);
});
socket.on('error-msg', toast);

// ================== ВХОД ==================
socket.on('auth-success', ({ user, token }) => {
  ME = user;
  addAccountToken(token, user);
  setActiveToken(token);
  $('auth').classList.add('hidden');
  $('app').classList.remove('hidden');
  renderMe();
  socket.emit('get-chats');
});

function renderMe() {
  const av = $('me-avatar');
  av.style.backgroundImage = ME.photo ? `url(${ME.photo})` : '';
  av.textContent = ME.photo ? '' : (ME.emoji || '?');
  $('me-name').innerHTML = esc(ME.name) + (ME.verified ? ' <span class="verified">✔</span>' : '');
  $('me-username').textContent = '@' + ME.username;
  $('me-premium-badge').classList.toggle('hidden', !ME.premium);
  $('me-stars').textContent = '⭐ ' + (ME.stars || 0);
  $('me-crystals').textContent = '💠 ' + (ME.crystals || 0);
  $('btn-admin').style.display = ME.isAdmin ? '' : 'none';
}

socket.on('profile-updated', user => {
  ME = user;
  addAccountToken(ACTIVE_TOKEN, user);
  renderMe();
  if (VIEWING_USER && VIEWING_USER.id === user.id) {
    VIEWING_USER = user;
    renderProfileView();
  }
  socket.emit('get-chats');
});

// ================== ПОИСК ==================
$('search-input').addEventListener('input', e => {
  const q = e.target.value.trim();
  if (!q) { $('search-overlay').classList.add('hidden'); return; }
  socket.emit('search-users', q);
});
$('search-close').onclick = () => {
  $('search-overlay').classList.add('hidden');
  $('search-input').value = '';
};
socket.on('search-results', users => {
  $('search-overlay').classList.remove('hidden');
  if (!users.length) {
    $('search-results').innerHTML = '<div class="empty-hint">Никого не найдено</div>';
    return;
  }
  $('search-results').innerHTML = users.map(u => `
    <div class="user-row" data-id="${u.id}">
      <div class="user-row-avatar" ${u.photo ? `style="background-image:url(${u.photo});"` : ''}>
        ${u.photo ? '' : esc(u.emoji || '🙂')}
      </div>
      <div>
        <div class="user-row-name">${esc(u.name)}${u.verified ? ' <span class="verified">✔</span>' : ''}${u.premium ? ' 💎' : ''}</div>
        <div class="user-row-username">@${esc(u.username)}</div>
      </div>
    </div>`).join('');
  $('search-results').querySelectorAll('.user-row').forEach(el => {
    const id = Number(el.dataset.id);
    const user = users.find(u => u.id === id);
    el.onclick = () => {
      $('search-close').click();
      openUserProfile(user);
    };
  });
});

// ================== СПИСОК ЧАТОВ ==================
socket.on('chats-list', chats => {
  const list = $('chats-list');
  if (!chats.length) {
    list.innerHTML = '<div class="empty-hint">Нет чатов. Найдите по <b>@username</b>.</div>';
    return;
  }
  list.innerHTML = chats.map(c => `
    <div class="chat-row" data-chat="${c.chat_id}" data-other="${c.other_id}"
         data-name="${esc(c.name)}" data-username="${esc(c.username)}"
         data-emoji="${esc(c.emoji || '🙂')}" data-photo="${c.photo || ''}">
      <div class="chat-row-avatar ${c.premium ? 'premium' : ''}"
           ${c.photo ? `style="background-image:url(${c.photo})"` : ''}>
        ${c.photo ? '' : esc(c.emoji || '🙂')}
      </div>
      <div class="chat-row-body">
        <div class="chat-row-top">
          <span class="chat-row-name">${esc(c.name)}${c.verified ? ' <span class="verified">✔</span>' : ''}</span>
          <span class="chat-row-time">${fmtTime(c.last_time)}</span>
        </div>
        <div class="chat-row-last">${c.last_text ? esc(c.last_text) : 'Нет сообщений'}</div>
      </div>
    </div>`).join('');
  list.querySelectorAll('.chat-row').forEach(el => {
    el.onclick = () => openDialog(
      Number(el.dataset.chat), Number(el.dataset.other),
      el.dataset.name, el.dataset.username,
      el.dataset.emoji, el.dataset.photo
    );
  });
});

// ================== ДИАЛОГ ==================
function openDialog(chatId, otherId, name, username, emoji, photo) {
  CURRENT = { chatId, otherId, name, username, emoji, photo };
  $('chat-empty').classList.add('hidden');
  $('chat-active').classList.remove('hidden');

  const av = $('chat-avatar');
  av.style.backgroundImage = photo ? `url(${photo})` : '';
  av.textContent = photo ? '' : (emoji || '?');
  $('chat-name').textContent = name;
  $('chat-status').textContent = '@' + username;
  $('messages').innerHTML = '';
  socket.emit('open-chat', chatId);

  document.querySelectorAll('.chat-row').forEach(r =>
    r.classList.toggle('active', Number(r.dataset.chat) === chatId));

  if (DEVICE.device === 'mobile') {
    document.body.classList.add('mobile-chat-open');
    $('chat-back-mobile').classList.remove('hidden');
  }
}
$('chat-back-mobile').onclick = () => {
  document.body.classList.remove('mobile-chat-open');
  $('chat-back-mobile').classList.add('hidden');
};
$('chat-avatar').onclick = () => {
  if (!CURRENT) return;
  openUserProfile({ id: CURRENT.otherId, name: CURRENT.name, username: CURRENT.username,
                    emoji: CURRENT.emoji, photo: CURRENT.photo });
};
$('chat-header-info').onclick = $('chat-avatar').onclick;

$('btn-send').onclick = sendMsg;
$('msg-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    sendMsg();
  }
});

// Отправка с мобильной клавиатуры по кнопке "Готово"
$('msg-input').addEventListener('blur', () => {
  // Скрываем клавиатуру после отправки — не трогаем
});

// На мобильных blur не должен блокировать кнопку отправки
$('btn-send').addEventListener('touchstart', (e) => {
  e.preventDefault();
  sendMsg();
}, { passive: false });
function sendMsg() {
  const text = $('msg-input').value.trim();
  if (!text || !CURRENT) return;
  socket.emit('send-message', { chatId: CURRENT.chatId, text });
  $('msg-input').value = '';
}
socket.on('chat-history', ({ messages }) => {
  const box = $('messages');
  box.innerHTML = messages.map(renderMsg).join('');
  box.scrollTop = box.scrollHeight;
});
socket.on('new-message', m => {
  if (!CURRENT) return;
  const box = $('messages');
  box.insertAdjacentHTML('beforeend', renderMsg(m));
  box.scrollTop = box.scrollHeight;
  socket.emit('get-chats');
});
function renderMsg(m) {
  const mine = m.senderId === ME.id;
  return `<div class="msg ${mine ? 'mine' : 'theirs'}">
    <div class="msg-text">${esc(m.text)}</div>
    <div class="msg-time">${fmtTime(m.createdAt)}</div></div>`;
}
socket.on('chat-opened', ({ chat, other }) => {
  openDialog(chat.id, other.id, other.name, other.username, other.emoji, other.photo);
  socket.emit('get-chats');
});
socket.on('chats-updated', () => socket.emit('get-chats'));

// ================== НАСТРОЙКИ ==================
$('me-badge').onclick = () => $('modal-settings').classList.remove('hidden');
$('settings-close').onclick = () => $('modal-settings').classList.add('hidden');
$('go-profile').onclick = () => { $('modal-settings').classList.add('hidden'); openUserProfile(ME); };
$('go-accounts').onclick = () => { $('modal-settings').classList.add('hidden'); openAccounts(); };
$('go-store').onclick = () => { $('modal-settings').classList.add('hidden'); openStore('stars'); };
$('go-nfts').onclick = () => { $('modal-settings').classList.add('hidden'); openMyNfts(); };
$('settings-logout').onclick = () => {
  if (!confirm('Выйти из аккаунта?')) return;
  removeAccountToken(ACTIVE_TOKEN);
  localStorage.removeItem('oblgram_active');
  ACTIVE_TOKEN = null;
  location.reload();
};

// ================== ПРОФИЛЬ ==================
function openUserProfile(user) {
  VIEWING_USER = user;
  renderProfileView();
  $('modal-profile-view').classList.remove('hidden');
}

function renderProfileView() {
  const u = VIEWING_USER;
  const isMe = u.id === ME.id;

  $('pv-title').textContent = isMe ? 'Мой профиль' : 'Профиль';
  const av = $('pv-avatar');
  av.style.backgroundImage = u.photo ? `url(${u.photo})` : '';
  av.textContent = u.photo ? '' : (u.emoji || '🙂');

  $('pv-name').innerHTML = esc(u.name) + (u.verified ? ' <span class="verified">✔</span>' : '');
  $('pv-username').textContent = '@' + u.username;
  $('pv-bio').textContent = u.bio || '';

  $('pv-premium').classList.toggle('hidden', !u.premium);
  $('pv-stars').textContent = '⭐ ' + (u.stars || 0);
  $('pv-crystals').textContent = '💠 ' + (u.crystals || 0);

  $('pv-phone').textContent = u.phone || '—';
  $('pv-status').innerHTML = (u.isAdmin ? '👑 Администратор' : 'Пользователь') +
    (u.verified ? ' • <span class="verified">✔</span>' : '');
  $('pv-prem-until').textContent = u.premium ? fmtDate(u.premiumUntil) : 'нет';

  const nfts = u.nfts || [];
  const grid = $('pv-nfts');
  if (!nfts.length) {
    grid.innerHTML = '<div class="empty-nfts">Подарков пока нет</div>';
  } else {
    grid.innerHTML = nfts.map(n => `
      <div class="nft-card ${n.rarity}">
        <div class="nft-art">${nftIconSVG(n.icon)}</div>
        <div class="nft-name">${esc(n.name)}</div>
        <div class="nft-rarity ${n.rarity}">${n.rarity}</div>
        ${n.from ? `<div class="nft-from">от ${esc(n.from)}</div>` : ''}
      </div>`).join('');
  }

  $('pv-edit').classList.toggle('hidden', !isMe);
  $('pv-write').classList.toggle('hidden', isMe);
  $('pv-gift').classList.toggle('hidden', isMe);
}

$('pv-close').onclick = () => { $('modal-profile-view').classList.add('hidden'); VIEWING_USER = null; };
$('pv-back').onclick = () => {
  $('modal-profile-view').classList.add('hidden');
  VIEWING_USER = null;
  if (ME) $('modal-settings').classList.remove('hidden');
};
$('pv-edit').onclick = () => { $('modal-profile-view').classList.add('hidden'); openProfileEdit(); };
$('pv-write').onclick = () => {
  if (!VIEWING_USER) return;
  socket.emit('start-chat', VIEWING_USER.id);
  $('modal-profile-view').classList.add('hidden');
};
$('pv-gift').onclick = () => {
  if (!VIEWING_USER) return;
  $('modal-profile-view').classList.add('hidden');
  openStore('stars', VIEWING_USER);
};

// ================== РЕДАКТИРОВАНИЕ ==================
function openProfileEdit() {
  $('pe-preview').textContent = ME.photo ? '' : (ME.emoji || '🙂');
  $('pe-preview').style.backgroundImage = ME.photo ? `url(${ME.photo})` : '';
  $('pe-name').value = ME.name;
  $('pe-username').value = ME.username;
  $('pe-bio').value = ME.bio || '';
  $('pe-emoji').value = ME.emoji || '🙂';
  $('modal-profile-edit').classList.remove('hidden');
}
$('pe-close').onclick = () => $('modal-profile-edit').classList.add('hidden');
$('pe-back').onclick = () => {
  $('modal-profile-edit').classList.add('hidden');
  openUserProfile(ME);
};
$('pe-emoji').addEventListener('input', e => {
  if (!ME.photo) $('pe-preview').textContent = e.target.value || '🙂';
});
$('pe-upload').onclick = () => $('pe-file').click();
$('pe-file').addEventListener('change', e => {
  const f = e.target.files[0];
  if (!f) return;
  if (f.size > 5 * 1024 * 1024) return toast('Файл больше 5 МБ');
  const reader = new FileReader();
  reader.onload = () => {
    socket.emit('upload-photo', { dataUrl: reader.result });
    $('modal-profile-edit').classList.add('hidden');
    toast('Фото обновлено');
  };
  reader.readAsDataURL(f);
});
$('pe-remove').onclick = () => { socket.emit('remove-photo'); toast('Фото удалено'); };
$('pe-save').onclick = () => {
  socket.emit('update-profile', {
    name: $('pe-name').value,
    username: $('pe-username').value,
    bio: $('pe-bio').value,
    emoji: $('pe-emoji').value,
  });
  $('modal-profile-edit').classList.add('hidden');
  toast('Профиль обновлён');
};

// ================== АККАУНТЫ ==================
function openAccounts() { renderAccounts(); $('modal-accounts').classList.remove('hidden'); }
$('acc-close').onclick = () => $('modal-accounts').classList.add('hidden');
$('acc-back').onclick = () => {
  $('modal-accounts').classList.add('hidden');
  $('modal-settings').classList.remove('hidden');
};
function renderAccounts() {
  const list = loadAccounts();
  $('accounts-list').innerHTML = list.map(a => {
    const u = a.user || {};
    const active = a.token === ACTIVE_TOKEN;
    const content = u.photo ? '' : esc(u.emoji || '🙂');
    const style = u.photo ? `style="background-image:url(${u.photo})"` : '';
    return `<div class="account-row ${active ? 'active' : ''}" data-token="${a.token}">
      <div class="acc-avatar" ${style}>${content}</div>
      <div class="acc-info">
        <div class="acc-name">${esc(u.name || 'Аккаунт')}${u.verified ? ' <span class="verified">✔</span>' : ''}${u.premium ? ' 💎' : ''}</div>
        <div class="acc-phone">${esc(u.phone || '')} · ⭐${u.stars || 0} · 💠${u.crystals || 0}</div>
      </div>
    </div>`;
  }).join('');
  $('accounts-list').querySelectorAll('.account-row').forEach(el => {
    el.onclick = () => {
      const tok = el.dataset.token;
      if (tok === ACTIVE_TOKEN) return $('modal-accounts').classList.add('hidden');
      setActiveToken(tok);
      location.reload();
    };
  });
}
$('acc-add').onclick = () => {
  $('modal-accounts').classList.add('hidden');
  $('modal-settings').classList.add('hidden');
  $('app').classList.add('hidden');
  $('auth').classList.remove('hidden');
  showAuth('screen-phone');
  $('phone').value = $('code').value = $('password').value = '';
};

// ================== МАГАЗИН ==================
function openStore(tab = 'stars', target = null) {
  STORE_TARGET = target;
  $('store-balance').textContent = ME.stars || 0;
  $('store-crystals').textContent = ME.crystals || 0;
  $('modal-store').classList.remove('hidden');
  if (target) {
    $('gift-stars-user').value = target.username;
    $('gift-crystals-user').value = target.username;
    $('gift-prem-user').value = target.username;
    $('nft-to').value = target.username;
  }
  switchStoreTab(tab);
}
function switchStoreTab(tab) {
  document.querySelectorAll('.store-tab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === tab));
  ['stars', 'crystals', 'premium', 'nft'].forEach(t =>
    $('pane-' + t).classList.toggle('hidden', t !== tab));
  if (tab === 'nft') socket.emit('nft:catalog');
}
$('btn-store').onclick = () => openStore('stars');
$('store-close').onclick = () => $('modal-store').classList.add('hidden');
document.querySelectorAll('.store-tab').forEach(t => t.onclick = () => switchStoreTab(t.dataset.tab));

$('gift-stars-send').onclick = () => {
  const username = $('gift-stars-user').value.replace('@', '').trim().toLowerCase();
  const amount = Number($('gift-stars-amount').value);
  if (!username) return toast('Введите @username');
  if (!amount || amount < 1) return toast('Введите сумму');
  socket.emit('search-users', username);
  socket.once('search-results', users => {
    const target = users.find(u => u.username === username);
    if (!target) return toast('Пользователь не найден');
    socket.emit('gift:send', { toUserId: target.id, type: 'stars', amount });
    $('modal-store').classList.add('hidden');
  });
};
$('gift-crystals-send').onclick = () => {
  const username = $('gift-crystals-user').value.replace('@', '').trim().toLowerCase();
  const amount = Number($('gift-crystals-amount').value);
  if (!username) return toast('Введите @username');
  if (!amount || amount < 1) return toast('Введите сумму');
  socket.emit('search-users', username);
  socket.once('search-results', users => {
    const target = users.find(u => u.username === username);
    if (!target) return toast('Пользователь не найден');
    socket.emit('gift:send', { toUserId: target.id, type: 'crystals', amount });
    $('modal-store').classList.add('hidden');
  });
};
$('gift-prem-send').onclick = () => {
  const username = $('gift-prem-user').value.replace('@', '').trim().toLowerCase();
  const days = Number($('gift-prem-days').value);
  if (!username) return toast('Введите @username');
  socket.emit('search-users', username);
  socket.once('search-results', users => {
    const target = users.find(u => u.username === username);
    if (!target) return toast('Пользователь не найден');
    if (days === 0 && !ME.isAdmin) return toast('Навсегда — только для админа');
    socket.emit('gift:send', { toUserId: target.id, type: 'premium', days });
    $('modal-store').classList.add('hidden');
  });
};

socket.on('nft:catalog', (catalog) => {
  NFT_CATALOG_CACHE = catalog;
  $('nft-grid').innerHTML = catalog.map(item => `
    <div class="nft-card ${item.rarity}" data-id="${item.id}">
      <div class="nft-art">${nftIconSVG(item.icon)}</div>
      <div class="nft-name">${esc(item.name)}</div>
      <div class="nft-rarity ${item.rarity}">${item.rarity}</div>
      <div class="nft-price">⭐ ${item.price}</div>
    </div>`).join('');
  $('nft-grid').querySelectorAll('.nft-card').forEach(card => {
    card.onclick = () => {
      const toUsername = $('nft-to').value.replace('@', '').trim().toLowerCase();
      if (toUsername) {
        socket.emit('search-users', toUsername);
        socket.once('search-results', users => {
          const target = users.find(u => u.username === toUsername);
          if (!target) return toast('Пользователь не найден');
          socket.emit('gift:send', { toUserId: target.id, type: 'nft', catalogId: card.dataset.id });
          $('modal-store').classList.add('hidden');
        });
      } else {
        socket.emit('nft:buy', card.dataset.id);
      }
    };
  });
});

socket.on('gift-notify', ({ text }) => {
  const el = document.createElement('div');
  el.className = 'gift-notification';
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
  toast(text);
});

// ================== МОИ ПОДАРКИ ==================
function openMyNfts() {
  const box = $('my-nfts');
  if (!ME.nfts || !ME.nfts.length) {
    box.innerHTML = '<div class="empty-nfts">У вас пока нет подарков. Купите в магазине ⭐</div>';
  } else {
    box.innerHTML = ME.nfts.map(n => `
      <div class="nft-card ${n.rarity}">
        <div class="nft-art">${nftIconSVG(n.icon)}</div>
        <div class="nft-name">${esc(n.name)}</div>
        <div class="nft-rarity ${n.rarity}">${n.rarity}</div>
        ${n.from ? `<div class="nft-from">от ${esc(n.from)}</div>` : ''}
      </div>`).join('');
  }
  $('modal-nfts').classList.remove('hidden');
}
$('nfts-close').onclick = () => $('modal-nfts').classList.add('hidden');

// ================== МОБИЛЬНЫЕ ТАБЫ ==================
document.querySelectorAll('.mtab').forEach(tab => {
  tab.onclick = () => {
    const t = tab.dataset.tab;
    document.querySelectorAll('.mtab').forEach(x => x.classList.toggle('active', x === tab));
    if (t === 'chats') document.body.classList.remove('mobile-chat-open');
    else if (t === 'search') $('search-input').focus();
    else if (t === 'store') openStore('stars');
    else if (t === 'me') $('modal-settings').classList.remove('hidden');
  };
});

// ================== АДМИНКА ==================
$('btn-admin').onclick = () => {
  socket.emit('nft:catalog');
  socket.emit('admin:get-users');
  $('modal-admin').classList.remove('hidden');
};
$('admin-close').onclick = () => $('modal-admin').classList.add('hidden');

socket.on('admin:users', users => {
  $('admin-users').innerHTML = users.map(u => `
    <div class="admin-row">
      <div class="user-row-avatar" ${u.photo ? `style="background-image:url(${u.photo});"` : ''}>
        ${u.photo ? '' : esc(u.emoji || '🙂')}
      </div>
      <div class="admin-row-body">
        <div class="admin-row-name">${esc(u.name)}${u.verified ? ' <span class="verified">✔</span>' : ''}${u.isAdmin ? ' 👑' : ''}${u.premium ? ' 💎' : ''}</div>
        <div class="admin-row-sub">@${esc(u.username)} • ⭐${u.stars || 0} • 💠${u.crystals || 0} • ${u.premiumUntil === -1 ? 'Premium ∞' : (u.premium ? 'Premium активен' : 'без Premium')}</div>
      </div>
      <button class="toggle-verify ${u.verified ? 'on' : 'off'}"
              data-action="verify" data-id="${u.id}" data-v="${u.verified ? '1' : '0'}">
        ${u.verified ? 'Снять ✔' : 'Выдать ✔'}
      </button>
      <div class="admin-actions">
        <input type="number" value="1000" data-input="stars-${u.id}" placeholder="⭐" />
        <button class="admin-btn stars" data-action="stars" data-id="${u.id}">+⭐ Звёзды</button>
        <input type="number" value="50" data-input="crystals-${u.id}" placeholder="💠" />
        <button class="admin-btn crystals" data-action="crystals" data-id="${u.id}">+💠 Кристаллы</button>
        <input type="number" value="30" data-input="prem-${u.id}" placeholder="дней" />
        <button class="admin-btn premium" data-action="prem" data-id="${u.id}">+💎 Premium</button>
        <select data-input="nft-${u.id}">
          ${NFT_CATALOG_CACHE.map(n => `<option value="${n.id}">${n.name}</option>`).join('')}
        </select>
        <button class="admin-btn nft" data-action="nft" data-id="${u.id}">+🎁 Подарок</button>
      </div>
    </div>`).join('');

  $('admin-users').querySelectorAll('button[data-action]').forEach(btn => {
    btn.onclick = () => {
      const id = Number(btn.dataset.id);
      const a = btn.dataset.action;
      if (a === 'verify') {
        socket.emit('admin:verify', { userId: id, value: btn.dataset.v !== '1' });
      } else if (a === 'stars') {
        const amt = Number(document.querySelector(`[data-input="stars-${id}"]`).value);
        socket.emit('admin:give-stars', { userId: id, amount: amt });
      } else if (a === 'crystals') {
        const amt = Number(document.querySelector(`[data-input="crystals-${id}"]`).value);
        socket.emit('admin:give-crystals', { userId: id, amount: amt });
      } else if (a === 'prem') {
        const days = Number(document.querySelector(`[data-input="prem-${id}"]`).value);
        socket.emit('admin:give-premium', { userId: id, days });
      } else if (a === 'nft') {
        const cat = document.querySelector(`[data-input="nft-${id}"]`).value;
        socket.emit('admin:give-nft', { userId: id, catalogId: cat });
      }
    };
  });
});

// Загружаем каталог подарков при старте
socket.emit('nft:catalog');
