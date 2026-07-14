/* ========== SafeVoice AI — COMMON JS ========== */

const API_BASE = window.location.origin;
const WS_BASE = API_BASE.replace('http', 'ws');

/* ========== JWT HELPERS ========== */
function getToken() {
  return localStorage.getItem('sg_access_token');
}

function getRefreshToken() {
  return localStorage.getItem('sg_refresh_token');
}

function setTokens(access, refresh) {
  localStorage.setItem('sg_access_token', access);
  if (refresh) localStorage.setItem('sg_refresh_token', refresh);
}

function removeTokens() {
  localStorage.removeItem('sg_access_token');
  localStorage.removeItem('sg_refresh_token');
}

function decodeJwt(token) {
  try {
    const base64 = token.split('.')[1];
    const decoded = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    const json = decodeURIComponent(escape(decoded));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getCurrentUser() {
  const token = getToken();
  if (!token) return null;
  const payload = decodeJwt(token);
  if (!payload) return null;
  // Check expiry
  if (payload.exp && payload.exp * 1000 < Date.now()) {
    return null;
  }
  return payload;
}

function checkAuth() {
  const user = getCurrentUser();
  if (!user) {
    // Token expired — try refresh in background, redirect if no refresh token
    const rt = getRefreshToken();
    if (rt) {
      // Kick off refresh and reload (async, page will reload)
      refreshToken(rt);
      return null;
    }
    window.location.href = '/dang-nhap.html';
    return null;
  }
  return user;
}

async function refreshToken(rt) {
  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: rt }),
    });
    if (res.ok) {
      const data = await res.json();
      setTokens(data.access_token, null);
      window.location.reload();
    } else {
      removeTokens();
      window.location.href = '/dang-nhap.html';
    }
  } catch {
    removeTokens();
    window.location.href = '/dang-nhap.html';
  }
}

/* ========== API HELPER ========== */
async function api(method, url, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body && method !== 'GET') {
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${url}`, opts);

  if (res.status === 401) {
    const rt = getRefreshToken();
    if (rt) {
      await refreshToken(rt);
      return;
    }
    removeTokens();
    window.location.href = '/dang-nhap.html';
    return;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Lỗi không xác định' }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }

  return res.json();
}

/* ========== WEBSOCKET ========== */
let socket = null;
let wsCallbacks = [];

function setupWebSocket() {
  // Load Socket.IO client
  if (typeof io === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.socket.io/4.7.4/socket.io.min.js';
    script.onload = () => connectWebSocket();
    document.head.appendChild(script);
  } else {
    connectWebSocket();
  }
}

function connectWebSocket() {
  try {
    socket = io(`${API_BASE}/ws/alerts`, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('🔌 WebSocket connected');
    });

    socket.on('new-alert', (alert) => {
      console.log('🚨 New alert:', alert);
      showAlertToast(alert);
      playAlertSound();
      updateNotificationBadge();
      wsCallbacks.forEach(cb => {
        if (cb.event === 'new-alert') cb.fn(alert);
      });
    });

    socket.on('alert-updated', (alert) => {
      console.log('✅ Alert updated:', alert);
      wsCallbacks.forEach(cb => {
        if (cb.event === 'alert-updated') cb.fn(alert);
      });
    });

    socket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected');
    });
  } catch (err) {
    console.error('WebSocket connection failed:', err);
    setTimeout(connectWebSocket, 5000);
  }
}

function onWsEvent(event, fn) {
  wsCallbacks.push({ event, fn });
}

/* ========== TOAST NOTIFICATIONS ========== */
function showToast(title, message, severity = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { danger: '🚨', warning: '⚠️', success: '✅', info: 'ℹ️' };

  const toast = document.createElement('div');
  toast.className = `toast ${severity}`;
  toast.innerHTML = `
    <div class="toast-icon">${icons[severity] || 'ℹ️'}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;

  container.appendChild(toast);
  setTimeout(() => toast.remove(), 6000);
  toast.addEventListener('click', () => toast.remove());
}

function showAlertToast(alert) {
  const typeLabels = {
    scream: '🔴 La hét',
    help: '🟠 Kêu cứu',
    threat: '🟡 Đe dọa',
    argument: '🟤 Cãi vã',
  };

  const severity = alert.confidence_score >= 85 ? 'danger' : alert.confidence_score >= 70 ? 'warning' : 'info';
  const area = alert.device?.area || 'Không xác định';
  const label = typeLabels[alert.sound_type] || alert.sound_type;

  showToast(
    `${label}`,
    `Khu vực: ${area} — Độ tin cậy: ${alert.confidence_score.toFixed(0)}%`,
    severity
  );
}

/* ========== NOTIFICATION SOUND ========== */
let audioCtx = null;
function playAlertSound() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
    oscillator.frequency.setValueAtTime(660, audioCtx.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.2);
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.5);
  } catch (e) {
    console.log('Could not play alert sound:', e);
  }
}

/* ========== NOTIFICATION BADGE ========== */
let pendingCount = 0;
async function updateNotificationBadge() {
  try {
    const data = await api('GET', '/api/statistics/summary');
    pendingCount = data.pending_urgent || 0;
    const badge = document.getElementById('notification-badge');
    if (badge) {
      badge.textContent = pendingCount;
      badge.style.display = pendingCount > 0 ? 'flex' : 'none';
    }
  } catch {}
}

/* ========== DARK MODE ========== */
function initTheme() {
  const saved = localStorage.getItem('sg_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('sg_theme', next);
}

/* ========== RENDER APP SHELL ========== */
function renderAppShell(activePageId) {
  const user = getCurrentUser();
  if (!user) return;

  const roleLabels = {
    admin: 'Quản trị viên',
    ban_giam_hieu: 'Ban giám hiệu',
    giam_thi: 'Giám thị',
    bao_ve: 'Bảo vệ',
  };

  const initials = (user.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const navItems = [
    { id: 'dashboard', icon: '📊', label: 'Tổng quan', href: '/tong-quan.html' },
    { id: 'alerts', icon: '🚨', label: 'Cảnh báo trực tiếp', href: '/canh-bao.html', badge: true },
    { id: 'history', icon: '📋', label: 'Lịch sử cảnh báo', href: '/lich-su.html' },
    { id: 'statistics', icon: '📈', label: 'Thống kê', href: '/thong-ke.html' },
    { id: 'devices', icon: '🎙️', label: 'Thiết bị', href: '/thiet-bi.html' },
  ];

  if (user.role === 'admin') {
    navItems.push({ id: 'users', icon: '👥', label: 'Người dùng', href: '/nguoi-dung.html' });
  }

  navItems.push({ id: 'settings', icon: '⚙️', label: 'Cài đặt', href: '/cai-dat.html' });

  const pageTitles = {
    dashboard: 'Tổng quan',
    alerts: 'Cảnh báo trực tiếp',
    history: 'Lịch sử cảnh báo',
    statistics: 'Thống kê',
    devices: 'Quản lý thiết bị',
    users: 'Quản lý người dùng',
    settings: 'Cài đặt hệ thống',
  };

  const shell = document.getElementById('app-shell');
  if (!shell) return;

  shell.innerHTML = `
    <!-- Sidebar -->
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-brand">
        <div class="brand-icon"><img src="/logo.png" alt="Logo"></div>
        <div>
          <h1>SafeVoice</h1>
          <span class="brand-sub">AI Monitoring System</span>
        </div>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-section">
          <div class="nav-section-title">Giám sát</div>
          ${navItems.slice(0, 4).map(item => `
            <a href="${item.href}" class="nav-item ${activePageId === item.id ? 'active' : ''}">
              <span class="nav-icon">${item.icon}</span>
              <span>${item.label}</span>
              ${item.badge ? `<span class="nav-badge" id="sidebar-alert-badge" style="display:none">0</span>` : ''}
            </a>
          `).join('')}
        </div>
        <div class="nav-section">
          <div class="nav-section-title">Quản lý</div>
          ${navItems.slice(4).map(item => `
            <a href="${item.href}" class="nav-item ${activePageId === item.id ? 'active' : ''}">
              <span class="nav-icon">${item.icon}</span>
              <span>${item.label}</span>
            </a>
          `).join('')}
        </div>
      </nav>
    </aside>

    <!-- Topbar -->
    <header class="topbar">
      <div class="topbar-left">
        <button class="mobile-menu-btn" onclick="toggleSidebar()">☰</button>
        <h2>${pageTitles[activePageId] || 'SafeVoice AI'}</h2>
      </div>
      <div class="topbar-right">
        <button class="topbar-btn" onclick="toggleTheme()" title="Chuyển đổi giao diện">
          🌙
        </button>
        <button class="topbar-btn" onclick="window.location.href='/canh-bao.html'" title="Cảnh báo">
          🔔
          <span class="badge" id="notification-badge" style="display:none">0</span>
        </button>
        <div class="user-info">
          <div class="user-avatar">${initials}</div>
          <div class="user-meta">
            <span class="user-name">${user.name || 'User'}</span>
            <span class="user-role">${roleLabels[user.role] || user.role}</span>
          </div>
        </div>
        <button class="btn btn-outline btn-sm" onclick="logout()">Đăng xuất</button>
      </div>
    </header>

    <!-- Toast container -->
    <div class="toast-container" id="toast-container"></div>
  `;

  // Set up mobile sidebar toggle
  window.toggleSidebar = () => {
    document.getElementById('sidebar').classList.toggle('open');
  };

  // Close sidebar on link click (mobile)
  document.querySelectorAll('.sidebar .nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.remove('open');
    });
  });
}

function logout() {
  removeTokens();
  window.location.href = '/dang-nhap.html';
}

/* ========== DATE/TIME HELPERS ========== */
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDateTime(dateStr) {
  return `${formatDate(dateStr)} ${formatTime(dateStr)}`;
}

function formatRelative(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

/* ========== LABEL HELPERS ========== */
const SOUND_TYPE_LABELS = {
  scream: { label: 'La hét', icon: '🔴', color: 'danger' },
  help: { label: 'Kêu cứu', icon: '🟠', color: 'warning' },
  threat: { label: 'Đe dọa', icon: '🟡', color: 'caution' },
  argument: { label: 'Cãi vã', icon: '🟤', color: 'info' },
};

const STATUS_LABELS = {
  pending: { label: 'Chờ xử lý', class: 'badge-warning' },
  confirmed: { label: 'Đã xác nhận', class: 'badge-danger' },
  false_alarm: { label: 'Báo động giả', class: 'badge-muted' },
  resolved: { label: 'Đã xử lý', class: 'badge-success' },
};

function getSeverityClass(confidence) {
  if (confidence >= 85) return 'severity-high';
  if (confidence >= 70) return 'severity-medium';
  return 'severity-low';
}

function getConfidenceColor(confidence) {
  if (confidence >= 85) return 'var(--danger)';
  if (confidence >= 70) return 'var(--warning)';
  return 'var(--caution)';
}

/* ========== PAGE INIT ========== */
function initPage(pageId) {
  initTheme();
  const user = checkAuth();
  if (!user) return null;
  renderAppShell(pageId);
  setupWebSocket();
  updateNotificationBadge();
  return user;
}
