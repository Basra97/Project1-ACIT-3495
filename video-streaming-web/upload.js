// Mock Upload UI logic: stores a lightweight representation in localStorage

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
  const url = `${CONFIG.AUTH_BASE_URL}/validate`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!data?.valid) throw new Error('Invalid credentials');
  const user = { username: data.user?.username || username, password };
  state.user = user;
  sessionStorage.setItem('user', JSON.stringify(user));
  setAuthUI();
  showToast({ title: 'Logged in', body: `Hello, ${user.username}`, kind: 'success' });
}
function logout() { state.user = null; localStorage.removeItem('user'); setAuthUI(); showToast({ title: 'Logged out', kind: 'info' }); }
function logout() { state.user = null; sessionStorage.removeItem('user'); setAuthUI(); showToast({ title: 'Logged out', kind: 'info' }); }

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

els.file.addEventListener('change', () => {
  const file = els.file.files?.[0];
  if (file) showPreview(file);
});

els.cancel.addEventListener('click', () => {
  history.back();
});

els.form.addEventListener('submit', async (e) => {
  e.preventDefault();
  // require login for mock upload to simulate flow
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

  // If File and Catalog services are configured, try real backend flow.
  const canUseBackend = Boolean(CONFIG.FILE_BASE_URL) && Boolean(CONFIG.API_BASE_URL);
  if (canUseBackend) {
    try {
      if (!state.user) throw new Error('Login required');
      // 1) Upload file to File System service
      const fd = new FormData();
      fd.append('file', file);
      const upRes = await fetch(`${CONFIG.FILE_BASE_URL}/upload`, {
        method: 'POST',
        body: fd,
      });
      if (!upRes.ok) {
        const text = await safeReadText(upRes);
        const err = new Error(`File upload failed (${upRes.status} ${upRes.statusText})${text ? `: ${text}` : ''}`);
        err.code = upRes.status; // annotate
        throw err;
      }
      const upData = await upRes.json();
      const path = upData.path || (upData.filename ? `/files/${upData.filename}` : '');
      if (!path) throw new Error('No path returned from file service');

      // 2) Record metadata in Catalog service
      const metaRes = await fetch(`${CONFIG.API_BASE_URL}/videos`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: title || file.name, path }),
      });
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
      console.error('Backend upload failed, falling back to local mock:', err);
      const msg = (err && err.message) ? err.message : 'Unknown error';
      showToast({ title: 'Upload error', body: msg, kind: 'error' });
      showToast({ title: 'Fallback', body: 'Saving locally only for now.', kind: 'info' });
      // fall through to local mock save
    }
  }

  // Fallback: local mock save so the UI remains usable without backend
  const id = 'local-' + Date.now();
  const entry = {
    id,
    title: title || file.name,
    description,
    url: objectUrl,
    thumb: '',
    duration: '',
    _local: true,
  };
  const key = 'LOCAL_UPLOADS';
  const current = JSON.parse(localStorage.getItem(key) || '[]');
  current.unshift(entry);
  localStorage.setItem(key, JSON.stringify(current));
  sessionStorage.setItem('TOAST', JSON.stringify({ title: 'Upload added', body: 'Mock upload saved locally', kind: 'success' }));
  restoreUi();
  window.location.href = './index.html';
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

