// Upload UI (backend-only)

const els = {
  form: document.getElementById('upload-form'),
  title: document.getElementById('title'),
  description: document.getElementById('description'),
  file: document.getElementById('file'),
  preview: document.getElementById('preview'),
  previewVideo: document.getElementById('preview-video'),
  cancel: document.getElementById('cancel'),
  submitBtn: document.getElementById('submit-btn'),
  uploadingIndicator: document.getElementById('uploading-indicator'),
  // auth + settings
  loginBtn: document.getElementById('login-btn'),
  logoutBtn: document.getElementById('logout-btn'),
  userInfo: document.getElementById('user-info'),
  usernameLabel: document.getElementById('username-label'),
  loginModal: document.getElementById('login-modal'),
  loginForm: document.getElementById('login-form'),
  cancelLogin: document.getElementById('cancel-login'),
  settingsBtn: document.getElementById('settings-btn'),
  settingsModal: document.getElementById('settings-modal'),
  settingsForm: document.getElementById('settings-form'),
  settingsCancel: document.getElementById('settings-cancel'),
  cfgAuth: document.getElementById('cfg-auth'),
  cfgApi: document.getElementById('cfg-api'),
  cfgFile: document.getElementById('cfg-file'),
  toastContainer: document.getElementById('toast-container'),
};

let objectUrl = null;
let state = {
  user: JSON.parse(sessionStorage.getItem('user') || 'null'),
  token: sessionStorage.getItem('token') || '',
};

const CONFIG = {
  AUTH_BASE_URL: localStorage.getItem('AUTH_BASE_URL') || '',
  API_BASE_URL: localStorage.getItem('API_BASE_URL') || '',
  FILE_BASE_URL: localStorage.getItem('FILE_BASE_URL') || '',
};

function showToast({ title = '', body = '', kind = 'info', timeout = 3500 } = {}) {
  if (!els.toastContainer) return;
  const t = document.createElement('div');
  t.className = `toast ${kind}`;
  const h = document.createElement('div'); h.className = 'title'; h.textContent = title;
  const p = document.createElement('div'); p.className = 'body'; p.textContent = body;
  t.appendChild(h); if (body) t.appendChild(p);
  els.toastContainer.appendChild(t);
  setTimeout(() => t.remove(), timeout);
}

function setAuthUI() {
  if (state.user) {
    els.loginBtn?.classList.add('hidden');
    els.userInfo?.classList.remove('hidden');
    if (els.usernameLabel) els.usernameLabel.textContent = state.user.username;
  } else {
    els.loginBtn?.classList.remove('hidden');
    els.userInfo?.classList.add('hidden');
    if (els.usernameLabel) els.usernameLabel.textContent = '';
  }
}

function openLogin() { els.loginModal?.classList.remove('hidden'); }
function closeLogin() { els.loginModal?.classList.add('hidden'); }
async function loginReal(username, password) {
  // Prefer JWT /login; fallback to /validate
  let token = '';
  try {
    const r = await fetch(`${CONFIG.AUTH_BASE_URL}/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username, password }) });
    if (r.ok) { const j = await r.json(); token = j?.token || ''; }
  } catch {}
  if (!token) {
    const r2 = await fetch(`${CONFIG.AUTH_BASE_URL}/validate`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username, password }) });
    const j2 = await r2.json(); if (!j2?.valid) throw new Error('Invalid credentials');
  }
  const user = { username };
  state.user = user;
  state.token = token;
  sessionStorage.setItem('user', JSON.stringify(user));
  if (token) sessionStorage.setItem('token', token); else sessionStorage.removeItem('token');
  try { localStorage.setItem('HAS_LOGGED_IN', 'true'); } catch {}
  setAuthUI();
  setFormEnabled(true);
  showToast({ title: 'Logged in', body: `Hello, ${user.username}`, kind: 'success' });
}
function logout() { state.user = null; sessionStorage.removeItem('user'); setAuthUI(); showToast({ title: 'Logged out', kind: 'info' }); }
function authHeader() { return state.token ? { Authorization: `Bearer ${state.token}` } : {}; }

function openSettings() {
  if (!els.settingsModal) return;
  els.cfgAuth.value = CONFIG.AUTH_BASE_URL;
  els.cfgApi.value = CONFIG.API_BASE_URL;
  els.cfgFile.value = CONFIG.FILE_BASE_URL;
  els.settingsModal.classList.remove('hidden');
}
function closeSettings() { els.settingsModal?.classList.add('hidden'); }

function showPreview(file) {
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = URL.createObjectURL(file);
  els.previewVideo.src = objectUrl;
  els.preview.style.display = 'block';
}

function setFormEnabled(enabled) {
  const disabled = !enabled;
  els.title && (els.title.disabled = disabled);
  els.description && (els.description.disabled = disabled);
  els.file && (els.file.disabled = disabled);
  els.submitBtn && (els.submitBtn.disabled = disabled);
}

els.file.addEventListener('change', () => {
  const file = els.file.files?.[0];
  if (file) showPreview(file);
});

els.cancel.addEventListener('click', () => {
  history.back();
});

els.form.addEventListener('submit', async (e) => {
  e.preventDefault();
  // require login for upload
  if (!state.user) {
    openLogin();
    showToast({ title: 'Login required', body: 'Please login to upload.', kind: 'error' });
    return;
  }
  const file = els.file.files?.[0];
  if (!file) return;
  const title = els.title.value.trim();
  const description = els.description.value.trim();

  // UI lock and indicator
  const restoreUi = () => {
    els.submitBtn && (els.submitBtn.disabled = false, els.submitBtn.textContent = 'Upload');
    els.cancel && (els.cancel.disabled = false);
    els.uploadingIndicator && els.uploadingIndicator.classList.add('hidden');
  };
  els.submitBtn && (els.submitBtn.disabled = true, els.submitBtn.textContent = 'Uploading…');
  els.cancel && (els.cancel.disabled = true);
  els.uploadingIndicator && els.uploadingIndicator.classList.remove('hidden');

  // Require backend services to be configured
  const canUseBackend = Boolean(CONFIG.FILE_BASE_URL) && Boolean(CONFIG.API_BASE_URL);
  if (canUseBackend) {
    try {
      if (!state.user) throw new Error('Login required');
      // 1) Upload file to File System service
      const fd = new FormData();
      fd.append('file', file);
      if (!state.token) throw new Error('Missing token; please login again');
      const upRes = await fetch(`${CONFIG.FILE_BASE_URL}/upload`, { method: 'POST', headers: authHeader(), body: fd });
      if (!upRes.ok) {
        const text = await safeReadText(upRes);
        const err = new Error(`File upload failed (${upRes.status} ${upRes.statusText})${text ? `: ${text}` : ''}`);
        err.code = upRes.status; // annotate
        throw err;
      }
      const upData = await upRes.json();
      const path = upData.path || (upData.filename ? `/files/${upData.filename}` : '');
      if (!path) throw new Error('No path returned from file service');

      // 2) Generate a thumbnail (client-side, deterministic frame) and upload it (best-effort)
      let thumbPath = '';
      try {
        const thumbBlob = await extractThumbnailBlob(file, 320, 180, { random: false, attempts: 5 });
        if (thumbBlob) {
          const tfd = new FormData();
          const base = (title || file.name).replace(/\.[^.]+$/, '');
          tfd.append('file', thumbBlob, `${base}-thumb.png`);
          const tRes = await fetch(`${CONFIG.FILE_BASE_URL}/upload`, { method: 'POST', headers: authHeader(), body: tfd });
          if (tRes.ok) {
            const tData = await tRes.json();
            thumbPath = tData.path || (tData.filename ? `/files/${tData.filename}` : '');
          }
        }
      } catch (e) {
        console.warn('Thumbnail generation/upload failed:', e?.message || e);
      }

      // 3) Record metadata in Catalog service
      const metaRes = await fetch(`${CONFIG.API_BASE_URL}/videos`, { method: 'POST', headers: { 'content-type': 'application/json', ...authHeader() }, body: JSON.stringify({ title: title || file.name, path, thumb: thumbPath || null }) });
      if (!metaRes.ok) {
        const text = await safeReadText(metaRes);
        const err = new Error(`Catalog save failed (${metaRes.status} ${metaRes.statusText})${text ? `: ${text}` : ''}`);
        err.code = metaRes.status;
        throw err;
      }

      sessionStorage.setItem('TOAST', JSON.stringify({ title: 'Upload complete', body: 'Saved file and catalog entry', kind: 'success' }));
      restoreUi();
      window.location.href = './index.html';
      return;
    } catch (err) {
      console.error('Backend upload failed:', err);
      const msg = (err && err.message) ? err.message : 'Unknown error';
      showToast({ title: 'Upload error', body: msg, kind: 'error' });
      return restoreUi();
    }
  }
  // If backend is not configured, block upload
  showToast({ title: 'Backend required', body: 'Set File and API Base URLs in Settings.', kind: 'error' });
  restoreUi();
});

// auth events
els.loginBtn?.addEventListener('click', openLogin);
els.cancelLogin?.addEventListener('click', closeLogin);
els.logoutBtn?.addEventListener('click', logout);
els.loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  if (!username || !password) return;
  try {
    if (!CONFIG.AUTH_BASE_URL) throw new Error('Auth service URL not set. Open Settings.');
    await loginReal(username, password);
    closeLogin();
  } catch (err) {
    showToast({ title: 'Login failed', body: err?.message || 'Error', kind: 'error' });
  }
});

// settings events
els.settingsBtn?.addEventListener('click', openSettings);
els.settingsCancel?.addEventListener('click', closeSettings);
els.settingsForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  localStorage.setItem('AUTH_BASE_URL', els.cfgAuth.value.trim());
  localStorage.setItem('API_BASE_URL', els.cfgApi.value.trim());
  localStorage.setItem('FILE_BASE_URL', els.cfgFile.value.trim());
  CONFIG.AUTH_BASE_URL = localStorage.getItem('AUTH_BASE_URL') || '';
  CONFIG.API_BASE_URL = localStorage.getItem('API_BASE_URL') || '';
  CONFIG.FILE_BASE_URL = localStorage.getItem('FILE_BASE_URL') || '';
  closeSettings();
  showToast({ title: 'Settings saved', kind: 'success' });
});

// init
setAuthUI();
// Require login before using the upload page: disable form and prompt login
if (!state.user) {
  setFormEnabled(false);
  openLogin();
  showToast({ title: 'Login required', body: 'Please login to upload.', kind: 'info' });
}

// If user cancels login while not authenticated, navigate back
els.cancelLogin?.addEventListener('click', () => {
  if (!state.user) {
    history.back();
  }
});

// If redirected here in the future, could read session toast as well (not used on this page now)

// helpers
async function safeReadText(res) {
  try {
    const t = await res.text();
    return (t || '').slice(0, 500);
  } catch {
    return '';
  }
}

// Extract a thumbnail PNG Blob from a video file
// Options:
//  - random: pick a random timestamp between 5% and 95% of duration (fallback to ~first frame)
//  - attempts: number of seek/draw retries on failure
async function extractThumbnailBlob(file, width = 320, height = 180, opts = {}) {
  const { random = false, attempts = 3 } = opts || {};
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      const url = URL.createObjectURL(file);
      video.src = url;
      const cleanup = () => URL.revokeObjectURL(url);

      video.addEventListener('loadedmetadata', () => {
        const canvas = document.createElement('canvas');
        const vw = video.videoWidth || width;
        const vh = video.videoHeight || height;
        const ratio = Math.min(width / vw, height / vh) || 1;
        canvas.width = Math.max(1, Math.floor(vw * ratio));
        canvas.height = Math.max(1, Math.floor(vh * ratio));
        const ctx = canvas.getContext('2d');

        let tries = Math.max(1, attempts);
        const tryOnce = () => {
          let t = 0;
          if (!isNaN(video.duration) && video.duration > 0) {
            if (random) {
              const start = Math.max(0, video.duration * 0.05);
              const end = Math.max(start + 0.05, video.duration * 0.95);
              t = start + Math.random() * (end - start);
            } else {
              t = Math.min(0.1, video.duration * 0.01);
            }
          }
          const onSeeked = () => {
            try {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              canvas.toBlob((blob) => { cleanup(); resolve(blob); }, 'image/png', 0.9);
            } catch (e) {
              if (--tries > 0) {
                setTimeout(tryOnce, 60);
              } else {
                cleanup();
                resolve(null);
              }
            }
          };
          video.addEventListener('seeked', onSeeked, { once: true });
          try { video.currentTime = t; } catch { onSeeked(); }
        };
        tryOnce();
      }, { once: true });
      video.addEventListener('error', () => { cleanup(); resolve(null); }, { once: true });
    } catch {
      resolve(null);
    }
  });
}

