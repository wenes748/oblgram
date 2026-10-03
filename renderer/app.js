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
  bear: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="bear-body" cx="40%" cy="30%">
      <stop offset="0%" stop-color="#c48b5c"/><stop offset="100%" stop-color="#7a4a1e"/>
    </radialGradient></defs>
    <circle cx="26" cy="26" r="12" fill="#a06b3a"/><circle cx="74" cy="26" r="12" fill="#a06b3a"/>
    <circle cx="26" cy="26" r="6" fill="#7a4a1e"/><circle cx="74" cy="26" r="6" fill="#7a4a1e"/>
    <circle cx="50" cy="55" r="30" fill="url(#bear-body)" stroke="#5a3610" stroke-width="2"/>
    <ellipse cx="50" cy="66" rx="16" ry="12" fill="#e8c8a0"/>
    <circle cx="40" cy="50" r="3" fill="#1a1a1a"/><circle cx="60" cy="50" r="3" fill="#1a1a1a"/>
    <ellipse cx="50" cy="62" rx="4" ry="3" fill="#1a1a1a"/>
    <path d="M44 70 Q50 76 56 70" stroke="#1a1a1a" stroke-width="2" fill="none" stroke-linecap="round"/>
  </svg>`,
  rose: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="rose-g" cx="50%" cy="40%">
      <stop offset="0%" stop-color="#ff5c8a"/><stop offset="100%" stop-color="#8a1038"/>
    </radialGradient></defs>
    <path d="M50 55 Q48 75 50 92" stroke="#2e7d32" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M50 75 Q38 70 34 60 Q42 62 50 70 Z" fill="#4caf50"/>
    <path d="M50 82 Q62 78 66 68 Q58 70 50 78 Z" fill="#4caf50"/>
    <circle cx="50" cy="42" r="22" fill="url(#rose-g)" stroke="#5a0a20" stroke-width="2"/>
    <path d="M38 38 Q50 28 62 38 Q58 50 50 48 Q42 50 38 38 Z" fill="#ff8fb0"/>
    <path d="M42 42 Q50 36 58 42" stroke="#8a1038" stroke-width="1.5" fill="none"/>
  </svg>`,
  cake: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect x="20" y="50" width="60" height="38" rx="6" fill="#f5d0a9" stroke="#a0764a" stroke-width="2"/>
    <rect x="20" y="50" width="60" height="12" fill="#ff8fb0"/>
    <circle cx="32" cy="56" r="2" fill="#e53935"/><circle cx="48" cy="56" r="2" fill="#e53935"/>
    <circle cx="64" cy="56" r="2" fill="#e53935"/>
    <rect x="46" y="28" width="8" height="20" fill="#ffc828"/>
    <path d="M50 18 Q54 24 50 28 Q46 24 50 18 Z" fill="#ff6b35"/>
    <ellipse cx="50" cy="50" rx="32" ry="4" fill="#fff" opacity=".7"/>
  </svg>`,
  heart: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="heart-g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ff5c8a"/><stop offset="100%" stop-color="#c2185b"/>
    </linearGradient></defs>
    <path d="M50 88 C20 66 8 48 8 34 C8 20 20 10 32 10 C40 10 47 15 50 22 C53 15 60 10 68 10 C80 10 92 20 92 34 C92 48 80 66 50 88 Z"
          fill="url(#heart-g)" stroke="#8a1038" stroke-width="2"/>
    <ellipse cx="34" cy="30" rx="8" ry="5" fill="#fff" opacity="0.5"/>
  </svg>`,
  cup: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="cup-g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffe066"/><stop offset="100%" stop-color="#b87400"/>
    </linearGradient></defs>
    <path d="M22 25 L78 25 L72 70 Q70 82 50 82 Q30 82 28 70 Z"
          fill="url(#cup-g)" stroke="#7a4a00" stroke-width="2"/>
    <path d="M78 32 Q92 32 92 46 Q92 60 78 60" stroke="#7a4a00" stroke-width="3" fill="none"/>
    <path d="M22 32 Q8 32 8 46 Q8 60 22 60" stroke="#7a4a00" stroke-width="3" fill="none"/>
    <rect x="22" y="22" width="56" height="10" rx="3" fill="#b87400" stroke="#7a4a00" stroke-width="1.5"/>
    <text x="50" y="55" text-anchor="middle" font-size="20" font-weight="bold" fill="#7a4a00">1</text>
  </svg>`,
  rocket: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="rocket-g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#e0e7ff"/><stop offset="100%" stop-color="#7d8b99"/>
    </linearGradient></defs>
    <path d="M50 6 C65 20 72 45 68 65 L62 78 L38 78 L32 65 C28 45 35 20 50 6 Z"
          fill="url(#rocket-g)" stroke="#4a5568" stroke-width="2"/>
    <circle cx="50" cy="38" r="9" fill="#2aabee" stroke="#fff" stroke-width="2"/>
    <path d="M32 65 L18 78 L32 78 Z" fill="#e53935"/>
    <path d="M68 65 L82 78 L68 78 Z" fill="#e53935"/>
    <path d="M42 78 Q50 96 58 78 Z" fill="#ffa500"/>
  </svg>`,
  diamond: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="dia-g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#a8f0ff"/><stop offset="100%" stop-color="#0088aa"/>
    </linearGradient></defs>
    <path d="M25 25 L50 8 L75 25 L92 42 L50 92 L8 42 Z"
          fill="url(#dia-g)" stroke="#004a66" stroke-width="2" stroke-linejoin="round"/>
    <path d="M25 25 L50 42 L75 25 M8 42 L50 42 L92 42 M50 42 L50 92"
          stroke="#004a66" stroke-width="1.5" fill="none" opacity="0.6"/>
    <path d="M30 25 L50 15 L55 25 Z" fill="#fff" opacity="0.6"/>
  </svg>`,
  alien: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="alien-g" cx="50%" cy="40%">
      <stop offset="0%" stop-color="#a8ffb8"/><stop offset="100%" stop-color="#2e7d32"/>
    </radialGradient></defs>
    <path d="M50 8 C70 8 84 28 84 48 C84 68 70 84 50 84 C30 84 16 68 16 48 C16 28 30 8 50 8 Z"
          fill="url(#alien-g)" stroke="#1a4a1e" stroke-width="2"/>
    <ellipse cx="36" cy="45" rx="9" ry="12" fill="#1a1a1a"/>
    <ellipse cx="64" cy="45" rx="9" ry="12" fill="#1a1a1a"/>
    <ellipse cx="34" cy="42" rx="3" ry="4" fill="#fff"/>
    <ellipse cx="62" cy="42" rx="3" ry="4" fill="#fff"/>
    <path d="M42 68 Q50 72 58 68" stroke="#1a4a1e" stroke-width="2" fill="none"/>
  </svg>`,
  crown: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="crown-g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffe066"/><stop offset="100%" stop-color="#b87400"/>
    </linearGradient></defs>
    <path d="M15 35 L25 60 L75 60 L85 35 L70 48 L58 25 L50 45 L42 25 L30 48 Z"
          fill="url(#crown-g)" stroke="#7a4a00" stroke-width="2" stroke-linejoin="round"/>
    <rect x="22" y="60" width="56" height="18" rx="3" fill="url(#crown-g)" stroke="#7a4a00" stroke-width="2"/>
    <circle cx="35" cy="69" r="3" fill="#e53935"/><circle cx="50" cy="69" r="3" fill="#2aabee"/>
    <circle cx="65" cy="69" r="3" fill="#a855f7"/>
    <circle cx="15" cy="33" r="4" fill="#ff5c8a"/><circle cx="50" cy="20" r="4" fill="#2aabee"/>
    <circle cx="85" cy="33" r="4" fill="#a855f7"/>
  </svg>`,
  unicorn: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="uni-g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffb3e6"/><stop offset="100%" stop-color="#a855f7"/>
    </linearGradient></defs>
    <path d="M50 8 L58 32 L82 40 L60 50 L60 75 L40 75 L40 50 L18 40 L42 32 Z"
          fill="url(#uni-g)" stroke="#6d3a99" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="42" cy="46" r="3" fill="#1a1a1a"/>
    <path d="M40 75 L35 92 L42 82 L50 92 L58 82 L65 92 L60 75 Z"
          fill="url(#uni-g)" stroke="#6d3a99" stroke-width="1.5"/>
  </svg>`,
  pegasus: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="peg-g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fff"/><stop offset="100%" stop-color="#7fb8e0"/>
    </linearGradient></defs>
    <path d="M25 30 Q10 20 8 45 Q20 40 30 45 Z" fill="#fff" stroke="#4a7aa0" stroke-width="1.5"/>
    <path d="M75 30 Q90 20 92 45 Q80 40 70 45 Z" fill="#fff" stroke="#4a7aa0" stroke-width="1.5"/>
    <ellipse cx="50" cy="55" rx="25" ry="22" fill="url(#peg-g)" stroke="#4a7aa0" stroke-width="2"/>
    <path d="M40 38 L46 25 L52 38" fill="#fff" stroke="#4a7aa0" stroke-width="1.5"/>
    <circle cx="42" cy="52" r="3" fill="#1a1a1a"/><circle cx="58" cy="52" r="3" fill="#1a1a1a"/>
    <path d="M40 72 L36 92 M50 76 L50 92 M60 72 L64 92" stroke="#4a7aa0" stroke-width="3" stroke-linecap="round"/>
  </svg>`,
  dragon: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="drg-g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ff6b35"/><stop offset="100%" stop-color="#8a1c00"/>
    </linearGradient></defs>
    <path d="M50 12 L58 30 L78 22 L72 44 L92 50 L72 58 L78 80 L58 72 L50 90 L42 72 L22 80 L28 58 L8 50 L28 44 L22 22 L42 30 Z"
          fill="url(#drg-g)" stroke="#5a1000" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="40" cy="48" r="4" fill="#ffe066"/><circle cx="60" cy="48" r="4" fill="#ffe066"/>
    <circle cx="40" cy="48" r="1.5" fill="#000"/><circle cx="60" cy="48" r="1.5" fill="#000"/>
    <path d="M40 62 Q50 68 60 62" stroke="#5a1000" stroke-width="2" fill="none"/>
  </svg>`,
  phoenix: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="phx-g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffe066"/><stop offset="50%" stop-color="#ff6b35"/><stop offset="100%" stop-color="#c2185b"/>
    </linearGradient></defs>
    <path d="M50 8 C55 25 70 25 82 18 C78 32 88 38 92 52 C82 48 75 52 70 62 C68 75 60 82 50 92 C40 82 32 75 30 62 C25 52 18 48 8 52 C12 38 22 32 18 18 C30 25 45 25 50 8 Z"
          fill="url(#phx-g)" stroke="#7a1040" stroke-width="2" stroke-linejoin="round"/>
    <path d="M50 30 L54 45 L50 60 L46 45 Z" fill="#fff" opacity="0.6"/>
  </svg>`,
  galaxy: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="gal-g" cx="50%" cy="50%">
        <stop offset="0%" stop-color="#fff"/>
        <stop offset="30%" stop-color="#a855f7"/>
        <stop offset="70%" stop-color="#2a1a5a"/>
        <stop offset="100%" stop-color="#0a0a2a"/>
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="42" fill="url(#gal-g)"/>
    <ellipse cx="50" cy="50" rx="42" ry="14" fill="none" stroke="#fff" stroke-width="1.5" opacity="0.5"/>
    <ellipse cx="50" cy="50" rx="42" ry="14" fill="none" stroke="#fff" stroke-width="1.5" opacity="0.3" transform="rotate(60 50 50)"/>
    <ellipse cx="50" cy="50" rx="42" ry="14" fill="none" stroke="#fff" stroke-width="1.5" opacity="0.3" transform="rotate(-60 50 50)"/>
    <circle cx="30" cy="35" r="1.5" fill="#fff"/><circle cx="70" cy="30" r="1" fill="#fff"/>
    <circle cx="65" cy="70" r="1.5" fill="#fff"/><circle cx="35" cy="72" r="1" fill="#fff"/>
    <circle cx="50" cy="50" r="3" fill="#fff"/>
  </svg>`,
};

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
  const phone = $('phone').value.trim();
  if (phone.length < 5) return toast('Введите номер');
  socket.emit('register', phone);
};
$('phone').addEventListener('keydown', e => e.key === 'Enter' && $('btn-phone').click());
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
$('msg-input').addEventListener('keydown', e => e.key === 'Enter' && sendMsg());
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
