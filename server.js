<<<<<<< HEAD
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'renderer')));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// ================= ХРАНИЛИЩЕ =================
const DATA_DIR = path.join(process.env.APPDATA || '.', 'Oblgram');
const AVATARS_DIR = path.join(DATA_DIR, 'avatars');
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(AVATARS_DIR, { recursive: true });
const DB_FILE = path.join(DATA_DIR, 'db.json');

let db = {
  users: [], chats: [], messages: [], tokens: {}, gifts: [],
  nextUserId: 1, nextChatId: 1, nextMsgId: 1, nextGiftId: 1,
};
if (fs.existsSync(DB_FILE)) {
  try { db = { ...db, ...JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) }; } catch {}
}
const saveDB = () => fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

app.get('/avatar/:file', (req, res) => {
  const f = path.join(AVATARS_DIR, path.basename(req.params.file));
  if (!fs.existsSync(f)) return res.status(404).end();
  res.sendFile(f);
});

// ================= КОНСТАНТЫ =================
const SPECIAL_PHONE = '+88814881488';
const SPECIAL_PASSWORD = 'keicov456';
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

// Каталог подарков (как в Telegram)
const NFT_CATALOG = [
  // ---- Обычные ----
  { id: 'bear',    name: 'Мишка',         icon: 'bear',    emoji: '🧸', rarity: 'common',    price: 15 },
  { id: 'rose',    name: 'Роза',          icon: 'rose',    emoji: '🌹', rarity: 'common',    price: 15 },
  { id: 'cake',    name: 'Торт',          icon: 'cake',    emoji: '🎂', rarity: 'common',    price: 25 },
  { id: 'heart',   name: 'Сердце',        icon: 'heart',   emoji: '❤️', rarity: 'common',    price: 25 },

  // ---- Редкие ----
  { id: 'cup',     name: 'Кубок',         icon: 'cup',     emoji: '🏆', rarity: 'rare',      price: 100 },
  { id: 'rocket',  name: 'Ракета',        icon: 'rocket',  emoji: '🚀', rarity: 'rare',      price: 150 },
  { id: 'diamond', name: 'Бриллиант',     icon: 'diamond', emoji: '💎', rarity: 'rare',      price: 200 },

  // ---- Эпические ----
  { id: 'alien',   name: 'Инопланетянин', icon: 'alien',   emoji: '👽', rarity: 'epic',      price: 500 },
  { id: 'crown',   name: 'Корона',        icon: 'crown',   emoji: '👑', rarity: 'epic',      price: 800 },
  { id: 'unicorn', name: 'Единорог',      icon: 'unicorn', emoji: '🦄', rarity: 'epic',      price: 1200 },

  // ---- Легендарные ----
  { id: 'cigar',   name: 'Сигара',        icon: 'cigar',   emoji: '🚬', rarity: 'legendary', price: 3000 },
  { id: 'money',   name: 'Деньги',        icon: 'money',   emoji: '💰', rarity: 'legendary', price: 5000 },
  { id: 'dragon',  name: 'Дракон',        icon: 'dragon',  emoji: '🐉', rarity: 'legendary', price: 8000 },
  { id: 'phoenix', name: 'Феникс',        icon: 'phoenix', emoji: '🔥', rarity: 'legendary', price: 12000 },
  { id: 'galaxy',  name: 'Галактика',     icon: 'galaxy',  emoji: '🌌', rarity: 'legendary', price: 20000 },

  // ---- САМАЯ ДОРОГАЯ ----
  { id: 'pepe',    name: 'Pepe',          icon: 'pepe',    emoji: '🐸', rarity: 'legendary', price: 100000 },
];

// ================= ХЕЛПЕРЫ =================
function makeUsername(phone) {
  const digits = phone.replace(/\D/g, '');
  let u;
  do { u = 'user_' + digits.slice(-4) + Math.floor(Math.random() * 900 + 100); }
  while (db.users.find(x => x.username === u));
  return u;
}

function getOrCreateUser(phone, password) {
  let user = db.users.find(u => u.phone === phone);
  if (!user) {
    const isAdmin = phone === SPECIAL_PHONE;
    const now = Date.now();
    user = {
      id: db.nextUserId++,
      phone,
      username: makeUsername(phone),
      name: isAdmin ? 'Администратор' : 'Пользователь ' + phone.slice(-4),
      bio: '',
      emoji: isAdmin ? '👑' : '🙂',
      photo: null,
      password: password || null,
      isAdmin,
      verified: isAdmin,
      stars: 1000,
      crystals: 50,
      premiumUntil: isAdmin ? -1 : now + MONTH_MS,
      nfts: [],
      createdAt: now,
    };
    db.users.push(user);
    saveDB();
  }
  return user;
}

function findOrCreateChat(a, b) {
  const [x, y] = a < b ? [a, b] : [b, a];
  let c = db.chats.find(ch => ch.userA === x && ch.userB === y);
  if (!c) {
    c = { id: db.nextChatId++, userA: x, userB: y, createdAt: Date.now() };
    db.chats.push(c); saveDB();
  }
  return c;
}

const online = new Map();

function isPremium(u) {
  if (!u) return false;
  if (u.premiumUntil === -1) return true;
  return (u.premiumUntil || 0) > Date.now();
}

function publicUser(u) {
  return {
    id: u.id, username: u.username, name: u.name,
    bio: u.bio || '', emoji: u.emoji || '🙂',
    photo: u.photo ? `/avatar/${u.photo}` : null,
    verified: !!u.verified, isAdmin: !!u.isAdmin,
    phone: u.phone,
    stars: u.stars || 0,
    crystals: u.crystals || 0,
    premium: isPremium(u),
    premiumUntil: u.premiumUntil || 0,
    nfts: (u.nfts || []).map(n => ({
      id: n.id, catalogId: n.catalogId, name: n.name,
      icon: n.icon || n.catalogId,
      emoji: n.emoji, rarity: n.rarity, obtainedAt: n.obtainedAt,
      from: n.from || null,
    })),
    online: online.has(u.id),
  };
}

// ================= SOCKET =================
io.on('connection', (socket) => {

  socket.on('auto-login', (token) => {
    const userId = db.tokens[token];
    const user = userId && db.users.find(u => u.id === userId);
    if (!user) return socket.emit('auto-login-failed');
    socket.data.userId = user.id;
    online.set(user.id, socket);
    socket.emit('auth-success', { user: publicUser(user), token });
    sendChats(user.id);
  });

  socket.on('register', (phone) => {
    const code = String(Math.floor(10000 + Math.random() * 90000));
    socket.data.phone = phone;
    socket.data.code = code;
    socket.emit('code-sent', {
      phone, demoCode: code,
      needPassword: phone === SPECIAL_PHONE,
    });
  });

  socket.on('verify-code', ({ phone, code }) => {
    if (socket.data.code !== code || socket.data.phone !== phone)
      return socket.emit('error-msg', 'Неверный код');
    if (phone === SPECIAL_PHONE) return socket.emit('need-password');
    finishLogin(socket, phone);
  });

  socket.on('verify-password', ({ phone, password }) => {
    if (phone !== SPECIAL_PHONE || password !== SPECIAL_PASSWORD)
      return socket.emit('error-msg', 'Неверный пароль');
    finishLogin(socket, phone, password);
  });

  function finishLogin(sock, phone, password) {
    const user = getOrCreateUser(phone, password);
    sock.data.userId = user.id;
    online.set(user.id, sock);
    const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
    db.tokens[token] = user.id;
    saveDB();
    sock.emit('auth-success', { user: publicUser(user), token });
    sendChats(user.id);
  }

  socket.on('update-profile', (patch) => {
    const user = db.users.find(u => u.id === socket.data.userId);
    if (!user) return;
    if (typeof patch.name === 'string' && patch.name.trim())
      user.name = patch.name.trim().slice(0, 40);
    if (typeof patch.bio === 'string') user.bio = patch.bio.slice(0, 120);
    if (typeof patch.emoji === 'string' && patch.emoji)
      user.emoji = patch.emoji.slice(0, 4);
    if (typeof patch.username === 'string') {
      const u = patch.username.replace('@', '').trim().toLowerCase();
      if (u.length >= 3 && /^[a-z0-9_]+$/.test(u) &&
          !db.users.find(x => x.username === u && x.id !== user.id)) {
        user.username = u;
      } else if (u.length >= 3) {
        socket.emit('error-msg', 'Юзернейм занят или некорректен');
      }
    }
    saveDB();
    io.emit('user-changed', { id: user.id });
    socket.emit('profile-updated', publicUser(user));
  });

  socket.on('upload-photo', ({ dataUrl }) => {
    const user = db.users.find(u => u.id === socket.data.userId);
    if (!user || !dataUrl || !dataUrl.startsWith('data:image/')) return;
    const m = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!m) return socket.emit('error-msg', 'Неверный формат');
    const ext = m[1] === 'jpeg' ? 'jpg' : m[1];
    const buf = Buffer.from(m[2], 'base64');
    if (buf.length > 5 * 1024 * 1024) return socket.emit('error-msg', 'Файл слишком большой');
    const fname = `u${user.id}_${Date.now()}.${ext}`;
    fs.writeFileSync(path.join(AVATARS_DIR, fname), buf);
    if (user.photo) {
      const old = path.join(AVATARS_DIR, user.photo);
      if (fs.existsSync(old)) try { fs.unlinkSync(old); } catch {}
    }
    user.photo = fname; saveDB();
    io.emit('user-changed', { id: user.id });
    socket.emit('profile-updated', publicUser(user));
  });

  socket.on('remove-photo', () => {
    const user = db.users.find(u => u.id === socket.data.userId);
    if (!user || !user.photo) return;
    const f = path.join(AVATARS_DIR, user.photo);
    if (fs.existsSync(f)) try { fs.unlinkSync(f); } catch {}
    user.photo = null; saveDB();
    io.emit('user-changed', { id: user.id });
    socket.emit('profile-updated', publicUser(user));
  });

  socket.on('search-users', (q) => {
    const s = q.replace('@', '').trim().toLowerCase();
    socket.emit('search-results',
      db.users.filter(u => u.username.toLowerCase().includes(s) && u.id !== socket.data.userId)
        .slice(0, 20).map(publicUser));
  });

  socket.on('start-chat', (otherId) => {
    const me = socket.data.userId;
    if (!me || !otherId || me === otherId) return;
    const chat = findOrCreateChat(me, otherId);
    const other = db.users.find(u => u.id === otherId);
    socket.emit('chat-opened', { chat: { id: chat.id }, other: publicUser(other) });
    const o = online.get(otherId);
    if (o) o.emit('chats-updated');
  });

  socket.on('open-chat', (chatId) => {
    socket.join('chat-' + chatId);
    socket.emit('chat-history', {
      chatId,
      messages: db.messages.filter(m => m.chatId === chatId)
        .sort((a, b) => a.createdAt - b.createdAt).slice(-200),
    });
  });

  socket.on('send-message', ({ chatId, text }) => {
    const me = socket.data.userId;
    if (!me || !chatId || !text.trim()) return;
    const msg = { id: db.nextMsgId++, chatId, senderId: me,
                  text: text.trim(), createdAt: Date.now() };
    db.messages.push(msg); saveDB();
    io.to('chat-' + chatId).emit('new-message', msg);
    const chat = db.chats.find(c => c.id === chatId);
    const partner = chat.userA === me ? chat.userB : chat.userA;
    const o = online.get(partner);
    if (o) o.emit('chats-updated');
  });

  socket.on('get-chats', () => sendChats(socket.data.userId));

  // ---------- Покупка NFT ----------
  socket.on('nft:catalog', () => socket.emit('nft:catalog', NFT_CATALOG));

  socket.on('nft:buy', (catalogId) => {
    const me = db.users.find(u => u.id === socket.data.userId);
    if (!me) return;
    const item = NFT_CATALOG.find(x => x.id === catalogId);
    if (!item) return socket.emit('error-msg', 'Не найдено');
    if ((me.stars || 0) < item.price)
      return socket.emit('error-msg', 'Недостаточно звёзд');
    me.stars -= item.price;
    me.nfts = me.nfts || [];
    me.nfts.push({
      id: db.nextGiftId++,
      catalogId: item.id,
      name: item.name,
      icon: item.icon,
      emoji: item.emoji,
      rarity: item.rarity,
      obtainedAt: Date.now(),
      from: 'магазин',
    });
    saveDB();
    socket.emit('profile-updated', publicUser(me));
    socket.emit('gift-notify', { text: `Вы купили подарок «${item.name}»` });
  });

  // ---------- Подарки ----------
  socket.on('gift:send', ({ toUserId, type, amount, catalogId, days }) => {
    const me = db.users.find(u => u.id === socket.data.userId);
    const to = db.users.find(u => u.id === toUserId);
    if (!me || !to || me.id === to.id) return;

    if (type === 'stars') {
      const amt = Math.max(1, Math.min(1000000, Number(amount) || 0));
      if ((me.stars || 0) < amt) return socket.emit('error-msg', 'Недостаточно звёзд');
      me.stars -= amt;
      to.stars = (to.stars || 0) + amt;
      saveDB();
      const fromSock = online.get(me.id);
      const toSock = online.get(to.id);
      if (fromSock) fromSock.emit('profile-updated', publicUser(me));
      if (toSock) {
        toSock.emit('profile-updated', publicUser(to));
        toSock.emit('gift-notify', { text: `${me.name} подарил вам ⭐${amt}` });
      }
      socket.emit('gift-notify', { text: `Вы подарили ⭐${amt} пользователю ${to.name}` });
    } else if (type === 'crystals') {
      const amt = Math.max(1, Math.min(1000000, Number(amount) || 0));
      if ((me.crystals || 0) < amt) return socket.emit('error-msg', 'Недостаточно кристаллов');
      me.crystals -= amt;
      to.crystals = (to.crystals || 0) + amt;
      saveDB();
      const fromSock = online.get(me.id);
      const toSock = online.get(to.id);
      if (fromSock) fromSock.emit('profile-updated', publicUser(me));
      if (toSock) {
        toSock.emit('profile-updated', publicUser(to));
        toSock.emit('gift-notify', { text: `${me.name} подарил вам 💠${amt}` });
      }
      socket.emit('gift-notify', { text: `Вы подарили 💠${amt} пользователю ${to.name}` });
    } else if (type === 'premium') {
      const d = Math.max(0, Math.min(36500, Number(days) || 30));
      if (d === 0) {
        to.premiumUntil = -1;
      } else {
        const base = Math.max(Date.now(), to.premiumUntil > 0 ? to.premiumUntil : 0);
        to.premiumUntil = base + d * 24 * 60 * 60 * 1000;
      }
      saveDB();
      const toSock = online.get(to.id);
      if (toSock) {
        toSock.emit('profile-updated', publicUser(to));
        toSock.emit('gift-notify', { text: `${me.name} подарил вам Premium на ${d === 0 ? 'всегда' : d + ' дн.'}` });
      }
      socket.emit('gift-notify', { text: `Premium отправлен ${to.name}` });
    } else if (type === 'nft') {
      const item = NFT_CATALOG.find(x => x.id === catalogId);
      if (!item) return;
      if ((me.stars || 0) < item.price)
        return socket.emit('error-msg', 'Недостаточно звёзд');
      me.stars -= item.price;
      to.nfts = to.nfts || [];
      to.nfts.push({
        id: db.nextGiftId++,
        catalogId: item.id,
        name: item.name,
        icon: item.icon,
        emoji: item.emoji,
        rarity: item.rarity,
        obtainedAt: Date.now(),
        from: me.name,
      });
      saveDB();
      const fromSock = online.get(me.id);
      const toSock = online.get(to.id);
      if (fromSock) fromSock.emit('profile-updated', publicUser(me));
      if (toSock) {
        toSock.emit('profile-updated', publicUser(to));
        toSock.emit('gift-notify', { text: `${me.name} подарил вам «${item.name}»` });
      }
      socket.emit('gift-notify', { text: `Подарок «${item.name}» отправлен` });
    }
  });

  // ---------- АДМИНКА ----------
  socket.on('admin:get-users', () => {
    const me = db.users.find(u => u.id === socket.data.userId);
    if (!me?.isAdmin) return;
    socket.emit('admin:users', db.users.map(publicUser));
  });

  socket.on('admin:verify', ({ userId, value }) => {
    const me = db.users.find(u => u.id === socket.data.userId);
    if (!me?.isAdmin) return;
    const t = db.users.find(u => u.id === userId);
    if (!t) return;
    t.verified = !!value; saveDB();
    io.emit('user-changed', { id: t.id });
    socket.emit('admin:users', db.users.map(publicUser));
    const s = online.get(t.id);
    if (s) s.emit('profile-updated', publicUser(t));
  });

  socket.on('admin:give-stars', ({ userId, amount }) => {
    const me = db.users.find(u => u.id === socket.data.userId);
    if (!me?.isAdmin) return;
    const t = db.users.find(u => u.id === userId);
    if (!t) return;
    const amt = Number(amount) || 0;
    t.stars = Math.max(0, (t.stars || 0) + amt);
    saveDB();
    socket.emit('admin:users', db.users.map(publicUser));
    const s = online.get(t.id);
    if (s) s.emit('profile-updated', publicUser(t));
  });

  socket.on('admin:give-crystals', ({ userId, amount }) => {
    const me = db.users.find(u => u.id === socket.data.userId);
    if (!me?.isAdmin) return;
    const t = db.users.find(u => u.id === userId);
    if (!t) return;
    const amt = Number(amount) || 0;
    t.crystals = Math.max(0, (t.crystals || 0) + amt);
    saveDB();
    socket.emit('admin:users', db.users.map(publicUser));
    const s = online.get(t.id);
    if (s) s.emit('profile-updated', publicUser(t));
  });

  socket.on('admin:give-premium', ({ userId, days }) => {
    const me = db.users.find(u => u.id === socket.data.userId);
    if (!me?.isAdmin) return;
    const t = db.users.find(u => u.id === userId);
    if (!t) return;
    const d = Number(days);
    if (d === -1 || d === 0) {
      t.premiumUntil = -1;
    } else {
      const base = Math.max(Date.now(), t.premiumUntil > 0 ? t.premiumUntil : 0);
      t.premiumUntil = base + d * 24 * 60 * 60 * 1000;
    }
    saveDB();
    socket.emit('admin:users', db.users.map(publicUser));
    const s = online.get(t.id);
    if (s) s.emit('profile-updated', publicUser(t));
  });

  socket.on('admin:give-nft', ({ userId, catalogId }) => {
    const me = db.users.find(u => u.id === socket.data.userId);
    if (!me?.isAdmin) return;
    const t = db.users.find(u => u.id === userId);
    if (!t) return;
    const item = NFT_CATALOG.find(x => x.id === catalogId);
    if (!item) return;
    t.nfts = t.nfts || [];
    t.nfts.push({
      id: db.nextGiftId++,
      catalogId: item.id,
      name: item.name,
      icon: item.icon,
      emoji: item.emoji,
      rarity: item.rarity,
      obtainedAt: Date.now(),
      from: 'админ',
    });
    saveDB();
    socket.emit('admin:users', db.users.map(publicUser));
    const s = online.get(t.id);
    if (s) s.emit('profile-updated', publicUser(t));
  });

  socket.on('disconnect', () => {
    if (socket.data.userId) online.delete(socket.data.userId);
  });
});

function sendChats(userId) {
  const sock = online.get(userId);
  if (!sock) return;
  const chats = db.chats
    .filter(c => c.userA === userId || c.userB === userId)
    .map(c => {
      const otherId = c.userA === userId ? c.userB : c.userA;
      const o = db.users.find(u => u.id === otherId);
      const msgs = db.messages.filter(m => m.chatId === c.id);
      const last = msgs[msgs.length - 1];
      return {
        chat_id: c.id, other_id: o.id,
        username: o.username, name: o.name,
        emoji: o.emoji, photo: o.photo ? `/avatar/${o.photo}` : null,
        verified: !!o.verified, premium: isPremium(o),
        crystals: o.crystals || 0,
        online: online.has(o.id),
        last_text: last ? last.text : null,
        last_time: last ? last.createdAt : null,
      };
    })
    .sort((a, b) => (b.last_time || 0) - (a.last_time || 0));
  sock.emit('chats-list', chats);
}

const PORT = process.env.PORT || 31234;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Oblgram server on port ${PORT}`);
  console.log(`DB: ${DB_FILE}`);
});

=======
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'renderer')));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// ================= ХРАНИЛИЩЕ =================
const DATA_DIR = path.join(process.env.APPDATA || '.', 'Oblgram');
const AVATARS_DIR = path.join(DATA_DIR, 'avatars');
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(AVATARS_DIR, { recursive: true });
const DB_FILE = path.join(DATA_DIR, 'db.json');

let db = {
  users: [], chats: [], messages: [], tokens: {}, gifts: [],
  nextUserId: 1, nextChatId: 1, nextMsgId: 1, nextGiftId: 1,
};
if (fs.existsSync(DB_FILE)) {
  try { db = { ...db, ...JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) }; } catch {}
}
const saveDB = () => fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

app.get('/avatar/:file', (req, res) => {
  const f = path.join(AVATARS_DIR, path.basename(req.params.file));
  if (!fs.existsSync(f)) return res.status(404).end();
  res.sendFile(f);
});

// ================= КОНСТАНТЫ =================
const SPECIAL_PHONE = '+88814881488';
const SPECIAL_PASSWORD = 'keicov456';
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

// Каталог подарков (как в Telegram)
const NFT_CATALOG = [
  { id: 'bear',    name: 'Мишка',         icon: 'bear',    emoji: '🧸', rarity: 'common',    price: 15 },
  { id: 'rose',    name: 'Роза',          icon: 'rose',    emoji: '🌹', rarity: 'common',    price: 15 },
  { id: 'cake',    name: 'Торт',          icon: 'cake',    emoji: '🎂', rarity: 'common',    price: 25 },
  { id: 'heart',   name: 'Сердце',        icon: 'heart',   emoji: '❤️', rarity: 'common',    price: 25 },
  { id: 'cup',     name: 'Кубок',         icon: 'cup',     emoji: '🏆', rarity: 'common',    price: 50 },
  { id: 'rocket',  name: 'Ракета',        icon: 'rocket',  emoji: '🚀', rarity: 'rare',      price: 100 },
  { id: 'diamond', name: 'Бриллиант',     icon: 'diamond', emoji: '💎', rarity: 'rare',      price: 150 },
  { id: 'alien',   name: 'Инопланетянин', icon: 'alien',   emoji: '👽', rarity: 'rare',      price: 200 },
  { id: 'crown',   name: 'Корона',        icon: 'crown',   emoji: '👑', rarity: 'epic',      price: 500 },
  { id: 'unicorn', name: 'Единорог',      icon: 'unicorn', emoji: '🦄', rarity: 'epic',      price: 750 },
  { id: 'pegasus', name: 'Пегас',         icon: 'pegasus', emoji: '🦅', rarity: 'legendary', price: 1500 },
  { id: 'dragon',  name: 'Дракон',        icon: 'dragon',  emoji: '🐉', rarity: 'legendary', price: 2500 },
  { id: 'phoenix', name: 'Феникс',        icon: 'phoenix', emoji: '🔥', rarity: 'legendary', price: 5000 },
  { id: 'galaxy',  name: 'Галактика',     icon: 'galaxy',  emoji: '🌌', rarity: 'legendary', price: 10000 },
];

// ================= ХЕЛПЕРЫ =================
function makeUsername(phone) {
  const digits = phone.replace(/\D/g, '');
  let u;
  do { u = 'user_' + digits.slice(-4) + Math.floor(Math.random() * 900 + 100); }
  while (db.users.find(x => x.username === u));
  return u;
}

function getOrCreateUser(phone, password) {
  let user = db.users.find(u => u.phone === phone);
  if (!user) {
    const isAdmin = phone === SPECIAL_PHONE;
    const now = Date.now();
    user = {
      id: db.nextUserId++,
      phone,
      username: makeUsername(phone),
      name: isAdmin ? 'Администратор' : 'Пользователь ' + phone.slice(-4),
      bio: '',
      emoji: isAdmin ? '👑' : '🙂',
      photo: null,
      password: password || null,
      isAdmin,
      verified: isAdmin,
      stars: 1000,
      crystals: 50,
      premiumUntil: isAdmin ? -1 : now + MONTH_MS,
      nfts: [],
      createdAt: now,
    };
    db.users.push(user);
    saveDB();
  }
  return user;
}

function findOrCreateChat(a, b) {
  const [x, y] = a < b ? [a, b] : [b, a];
  let c = db.chats.find(ch => ch.userA === x && ch.userB === y);
  if (!c) {
    c = { id: db.nextChatId++, userA: x, userB: y, createdAt: Date.now() };
    db.chats.push(c); saveDB();
  }
  return c;
}

const online = new Map();

function isPremium(u) {
  if (!u) return false;
  if (u.premiumUntil === -1) return true;
  return (u.premiumUntil || 0) > Date.now();
}

function publicUser(u) {
  return {
    id: u.id, username: u.username, name: u.name,
    bio: u.bio || '', emoji: u.emoji || '🙂',
    photo: u.photo ? `/avatar/${u.photo}` : null,
    verified: !!u.verified, isAdmin: !!u.isAdmin,
    phone: u.phone,
    stars: u.stars || 0,
    crystals: u.crystals || 0,
    premium: isPremium(u),
    premiumUntil: u.premiumUntil || 0,
    nfts: (u.nfts || []).map(n => ({
      id: n.id, catalogId: n.catalogId, name: n.name,
      icon: n.icon || n.catalogId,
      emoji: n.emoji, rarity: n.rarity, obtainedAt: n.obtainedAt,
      from: n.from || null,
    })),
    online: online.has(u.id),
  };
}

// ================= SOCKET =================
io.on('connection', (socket) => {

  socket.on('auto-login', (token) => {
    const userId = db.tokens[token];
    const user = userId && db.users.find(u => u.id === userId);
    if (!user) return socket.emit('auto-login-failed');
    socket.data.userId = user.id;
    online.set(user.id, socket);
    socket.emit('auth-success', { user: publicUser(user), token });
    sendChats(user.id);
  });

  socket.on('register', (phone) => {
    const code = String(Math.floor(10000 + Math.random() * 90000));
    socket.data.phone = phone;
    socket.data.code = code;
    socket.emit('code-sent', {
      phone, demoCode: code,
      needPassword: phone === SPECIAL_PHONE,
    });
  });

  socket.on('verify-code', ({ phone, code }) => {
    if (socket.data.code !== code || socket.data.phone !== phone)
      return socket.emit('error-msg', 'Неверный код');
    if (phone === SPECIAL_PHONE) return socket.emit('need-password');
    finishLogin(socket, phone);
  });

  socket.on('verify-password', ({ phone, password }) => {
    if (phone !== SPECIAL_PHONE || password !== SPECIAL_PASSWORD)
      return socket.emit('error-msg', 'Неверный пароль');
    finishLogin(socket, phone, password);
  });

  function finishLogin(sock, phone, password) {
    const user = getOrCreateUser(phone, password);
    sock.data.userId = user.id;
    online.set(user.id, sock);
    const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
    db.tokens[token] = user.id;
    saveDB();
    sock.emit('auth-success', { user: publicUser(user), token });
    sendChats(user.id);
  }

  socket.on('update-profile', (patch) => {
    const user = db.users.find(u => u.id === socket.data.userId);
    if (!user) return;
    if (typeof patch.name === 'string' && patch.name.trim())
      user.name = patch.name.trim().slice(0, 40);
    if (typeof patch.bio === 'string') user.bio = patch.bio.slice(0, 120);
    if (typeof patch.emoji === 'string' && patch.emoji)
      user.emoji = patch.emoji.slice(0, 4);
    if (typeof patch.username === 'string') {
      const u = patch.username.replace('@', '').trim().toLowerCase();
      if (u.length >= 3 && /^[a-z0-9_]+$/.test(u) &&
          !db.users.find(x => x.username === u && x.id !== user.id)) {
        user.username = u;
      } else if (u.length >= 3) {
        socket.emit('error-msg', 'Юзернейм занят или некорректен');
      }
    }
    saveDB();
    io.emit('user-changed', { id: user.id });
    socket.emit('profile-updated', publicUser(user));
  });

  socket.on('upload-photo', ({ dataUrl }) => {
    const user = db.users.find(u => u.id === socket.data.userId);
    if (!user || !dataUrl || !dataUrl.startsWith('data:image/')) return;
    const m = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!m) return socket.emit('error-msg', 'Неверный формат');
    const ext = m[1] === 'jpeg' ? 'jpg' : m[1];
    const buf = Buffer.from(m[2], 'base64');
    if (buf.length > 5 * 1024 * 1024) return socket.emit('error-msg', 'Файл слишком большой');
    const fname = `u${user.id}_${Date.now()}.${ext}`;
    fs.writeFileSync(path.join(AVATARS_DIR, fname), buf);
    if (user.photo) {
      const old = path.join(AVATARS_DIR, user.photo);
      if (fs.existsSync(old)) try { fs.unlinkSync(old); } catch {}
    }
    user.photo = fname; saveDB();
    io.emit('user-changed', { id: user.id });
    socket.emit('profile-updated', publicUser(user));
  });

  socket.on('remove-photo', () => {
    const user = db.users.find(u => u.id === socket.data.userId);
    if (!user || !user.photo) return;
    const f = path.join(AVATARS_DIR, user.photo);
    if (fs.existsSync(f)) try { fs.unlinkSync(f); } catch {}
    user.photo = null; saveDB();
    io.emit('user-changed', { id: user.id });
    socket.emit('profile-updated', publicUser(user));
  });

  socket.on('search-users', (q) => {
    const s = q.replace('@', '').trim().toLowerCase();
    socket.emit('search-results',
      db.users.filter(u => u.username.toLowerCase().includes(s) && u.id !== socket.data.userId)
        .slice(0, 20).map(publicUser));
  });

  socket.on('start-chat', (otherId) => {
    const me = socket.data.userId;
    if (!me || !otherId || me === otherId) return;
    const chat = findOrCreateChat(me, otherId);
    const other = db.users.find(u => u.id === otherId);
    socket.emit('chat-opened', { chat: { id: chat.id }, other: publicUser(other) });
    const o = online.get(otherId);
    if (o) o.emit('chats-updated');
  });

  socket.on('open-chat', (chatId) => {
    socket.join('chat-' + chatId);
    socket.emit('chat-history', {
      chatId,
      messages: db.messages.filter(m => m.chatId === chatId)
        .sort((a, b) => a.createdAt - b.createdAt).slice(-200),
    });
  });

  socket.on('send-message', ({ chatId, text }) => {
    const me = socket.data.userId;
    if (!me || !chatId || !text.trim()) return;
    const msg = { id: db.nextMsgId++, chatId, senderId: me,
                  text: text.trim(), createdAt: Date.now() };
    db.messages.push(msg); saveDB();
    io.to('chat-' + chatId).emit('new-message', msg);
    const chat = db.chats.find(c => c.id === chatId);
    const partner = chat.userA === me ? chat.userB : chat.userA;
    const o = online.get(partner);
    if (o) o.emit('chats-updated');
  });

  socket.on('get-chats', () => sendChats(socket.data.userId));

  // ---------- Покупка NFT ----------
  socket.on('nft:catalog', () => socket.emit('nft:catalog', NFT_CATALOG));

  socket.on('nft:buy', (catalogId) => {
    const me = db.users.find(u => u.id === socket.data.userId);
    if (!me) return;
    const item = NFT_CATALOG.find(x => x.id === catalogId);
    if (!item) return socket.emit('error-msg', 'Не найдено');
    if ((me.stars || 0) < item.price)
      return socket.emit('error-msg', 'Недостаточно звёзд');
    me.stars -= item.price;
    me.nfts = me.nfts || [];
    me.nfts.push({
      id: db.nextGiftId++,
      catalogId: item.id,
      name: item.name,
      icon: item.icon,
      emoji: item.emoji,
      rarity: item.rarity,
      obtainedAt: Date.now(),
      from: 'магазин',
    });
    saveDB();
    socket.emit('profile-updated', publicUser(me));
    socket.emit('gift-notify', { text: `Вы купили подарок «${item.name}»` });
  });

  // ---------- Подарки ----------
  socket.on('gift:send', ({ toUserId, type, amount, catalogId, days }) => {
    const me = db.users.find(u => u.id === socket.data.userId);
    const to = db.users.find(u => u.id === toUserId);
    if (!me || !to || me.id === to.id) return;

    if (type === 'stars') {
      const amt = Math.max(1, Math.min(1000000, Number(amount) || 0));
      if ((me.stars || 0) < amt) return socket.emit('error-msg', 'Недостаточно звёзд');
      me.stars -= amt;
      to.stars = (to.stars || 0) + amt;
      saveDB();
      const fromSock = online.get(me.id);
      const toSock = online.get(to.id);
      if (fromSock) fromSock.emit('profile-updated', publicUser(me));
      if (toSock) {
        toSock.emit('profile-updated', publicUser(to));
        toSock.emit('gift-notify', { text: `${me.name} подарил вам ⭐${amt}` });
      }
      socket.emit('gift-notify', { text: `Вы подарили ⭐${amt} пользователю ${to.name}` });
    } else if (type === 'crystals') {
      const amt = Math.max(1, Math.min(1000000, Number(amount) || 0));
      if ((me.crystals || 0) < amt) return socket.emit('error-msg', 'Недостаточно кристаллов');
      me.crystals -= amt;
      to.crystals = (to.crystals || 0) + amt;
      saveDB();
      const fromSock = online.get(me.id);
      const toSock = online.get(to.id);
      if (fromSock) fromSock.emit('profile-updated', publicUser(me));
      if (toSock) {
        toSock.emit('profile-updated', publicUser(to));
        toSock.emit('gift-notify', { text: `${me.name} подарил вам 💠${amt}` });
      }
      socket.emit('gift-notify', { text: `Вы подарили 💠${amt} пользователю ${to.name}` });
    } else if (type === 'premium') {
      const d = Math.max(0, Math.min(36500, Number(days) || 30));
      if (d === 0) {
        to.premiumUntil = -1;
      } else {
        const base = Math.max(Date.now(), to.premiumUntil > 0 ? to.premiumUntil : 0);
        to.premiumUntil = base + d * 24 * 60 * 60 * 1000;
      }
      saveDB();
      const toSock = online.get(to.id);
      if (toSock) {
        toSock.emit('profile-updated', publicUser(to));
        toSock.emit('gift-notify', { text: `${me.name} подарил вам Premium на ${d === 0 ? 'всегда' : d + ' дн.'}` });
      }
      socket.emit('gift-notify', { text: `Premium отправлен ${to.name}` });
    } else if (type === 'nft') {
      const item = NFT_CATALOG.find(x => x.id === catalogId);
      if (!item) return;
      if ((me.stars || 0) < item.price)
        return socket.emit('error-msg', 'Недостаточно звёзд');
      me.stars -= item.price;
      to.nfts = to.nfts || [];
      to.nfts.push({
        id: db.nextGiftId++,
        catalogId: item.id,
        name: item.name,
        icon: item.icon,
        emoji: item.emoji,
        rarity: item.rarity,
        obtainedAt: Date.now(),
        from: me.name,
      });
      saveDB();
      const fromSock = online.get(me.id);
      const toSock = online.get(to.id);
      if (fromSock) fromSock.emit('profile-updated', publicUser(me));
      if (toSock) {
        toSock.emit('profile-updated', publicUser(to));
        toSock.emit('gift-notify', { text: `${me.name} подарил вам «${item.name}»` });
      }
      socket.emit('gift-notify', { text: `Подарок «${item.name}» отправлен` });
    }
  });

  // ---------- АДМИНКА ----------
  socket.on('admin:get-users', () => {
    const me = db.users.find(u => u.id === socket.data.userId);
    if (!me?.isAdmin) return;
    socket.emit('admin:users', db.users.map(publicUser));
  });

  socket.on('admin:verify', ({ userId, value }) => {
    const me = db.users.find(u => u.id === socket.data.userId);
    if (!me?.isAdmin) return;
    const t = db.users.find(u => u.id === userId);
    if (!t) return;
    t.verified = !!value; saveDB();
    io.emit('user-changed', { id: t.id });
    socket.emit('admin:users', db.users.map(publicUser));
    const s = online.get(t.id);
    if (s) s.emit('profile-updated', publicUser(t));
  });

  socket.on('admin:give-stars', ({ userId, amount }) => {
    const me = db.users.find(u => u.id === socket.data.userId);
    if (!me?.isAdmin) return;
    const t = db.users.find(u => u.id === userId);
    if (!t) return;
    const amt = Number(amount) || 0;
    t.stars = Math.max(0, (t.stars || 0) + amt);
    saveDB();
    socket.emit('admin:users', db.users.map(publicUser));
    const s = online.get(t.id);
    if (s) s.emit('profile-updated', publicUser(t));
  });

  socket.on('admin:give-crystals', ({ userId, amount }) => {
    const me = db.users.find(u => u.id === socket.data.userId);
    if (!me?.isAdmin) return;
    const t = db.users.find(u => u.id === userId);
    if (!t) return;
    const amt = Number(amount) || 0;
    t.crystals = Math.max(0, (t.crystals || 0) + amt);
    saveDB();
    socket.emit('admin:users', db.users.map(publicUser));
    const s = online.get(t.id);
    if (s) s.emit('profile-updated', publicUser(t));
  });

  socket.on('admin:give-premium', ({ userId, days }) => {
    const me = db.users.find(u => u.id === socket.data.userId);
    if (!me?.isAdmin) return;
    const t = db.users.find(u => u.id === userId);
    if (!t) return;
    const d = Number(days);
    if (d === -1 || d === 0) {
      t.premiumUntil = -1;
    } else {
      const base = Math.max(Date.now(), t.premiumUntil > 0 ? t.premiumUntil : 0);
      t.premiumUntil = base + d * 24 * 60 * 60 * 1000;
    }
    saveDB();
    socket.emit('admin:users', db.users.map(publicUser));
    const s = online.get(t.id);
    if (s) s.emit('profile-updated', publicUser(t));
  });

  socket.on('admin:give-nft', ({ userId, catalogId }) => {
    const me = db.users.find(u => u.id === socket.data.userId);
    if (!me?.isAdmin) return;
    const t = db.users.find(u => u.id === userId);
    if (!t) return;
    const item = NFT_CATALOG.find(x => x.id === catalogId);
    if (!item) return;
    t.nfts = t.nfts || [];
    t.nfts.push({
      id: db.nextGiftId++,
      catalogId: item.id,
      name: item.name,
      icon: item.icon,
      emoji: item.emoji,
      rarity: item.rarity,
      obtainedAt: Date.now(),
      from: 'админ',
    });
    saveDB();
    socket.emit('admin:users', db.users.map(publicUser));
    const s = online.get(t.id);
    if (s) s.emit('profile-updated', publicUser(t));
  });

  socket.on('disconnect', () => {
    if (socket.data.userId) online.delete(socket.data.userId);
  });
});

function sendChats(userId) {
  const sock = online.get(userId);
  if (!sock) return;
  const chats = db.chats
    .filter(c => c.userA === userId || c.userB === userId)
    .map(c => {
      const otherId = c.userA === userId ? c.userB : c.userA;
      const o = db.users.find(u => u.id === otherId);
      const msgs = db.messages.filter(m => m.chatId === c.id);
      const last = msgs[msgs.length - 1];
      return {
        chat_id: c.id, other_id: o.id,
        username: o.username, name: o.name,
        emoji: o.emoji, photo: o.photo ? `/avatar/${o.photo}` : null,
        verified: !!o.verified, premium: isPremium(o),
        crystals: o.crystals || 0,
        online: online.has(o.id),
        last_text: last ? last.text : null,
        last_time: last ? last.createdAt : null,
      };
    })
    .sort((a, b) => (b.last_time || 0) - (a.last_time || 0));
  sock.emit('chats-list', chats);
}

const PORT = process.env.PORT || 31234;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Oblgram server on port ${PORT}`);
  console.log(`DB: ${DB_FILE}`);
});

>>>>>>> 239fa84985170630bafd2094ef2b27beb114bb8d
module.exports = server;