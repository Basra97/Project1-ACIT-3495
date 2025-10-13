// Mock Upload UI logic: stores a lightweight representation in localStorage

const els = {
  form: document.getElementById('upload-form'),
  title: document.getElementById('title'),
  description: document.getElementById('description'),
  file: document.getElementById('file'),
  preview: document.getElementById('preview'),
  previewVideo: document.getElementById('preview-video'),
  cancel: document.getElementById('cancel'),
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
  user: JSON.parse(localStorage.getItem('user') || 'null'),
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
function loginMock(username) {
  const user = { username, token: 'mock-token-' + Math.random().toString(36).slice(2) };
  state.user = user;
  localStorage.setItem('user', JSON.stringify(user));
  setAuthUI();
  showToast({ title: 'Logged in', body: `Hello, ${username}`, kind: 'success' });
}
function logout() { state.user = null; localStorage.removeItem('user'); setAuthUI(); showToast({ title: 'Logged out', kind: 'info' }); }

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

  // NOTE: For the mock we won't persist the raw video; we store a blob URL placeholder
  // Real flow will POST to File Service and DB. Here we record minimal metadata.
  const id = 'local-' + Date.now();
  const entry = {
    id,
    title: title || file.name,
    description,
    url: objectUrl, // ephemeral blob url; good enough to navigate back and preview within this tab session
    thumb: '',
    duration: '',
    _local: true,
  };
  const key = 'LOCAL_UPLOADS';
  const current = JSON.parse(localStorage.getItem(key) || '[]');
  current.unshift(entry);
  localStorage.setItem(key, JSON.stringify(current));

  // Redirect back to list
  sessionStorage.setItem('TOAST', JSON.stringify({ title: 'Upload added', body: 'Mock upload saved locally', kind: 'success' }));
  window.location.href = './index.html';
});

// auth events
els.loginBtn?.addEventListener('click', openLogin);
els.cancelLogin?.addEventListener('click', closeLogin);
els.logoutBtn?.addEventListener('click', logout);
els.loginForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  if (!username || !password) return;
  loginMock(username);
  closeLogin();
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

