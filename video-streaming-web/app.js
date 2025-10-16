// Simple frontend for Video Streaming (Web)
// - Uses mock auth and mock video data for now
// - API-ready: configure BASE_URLS when backend is available

const CONFIG = {
  AUTH_BASE_URL: localStorage.getItem('AUTH_BASE_URL') || '', // e.g., http://localhost:4000
  API_BASE_URL: localStorage.getItem('API_BASE_URL') || '',   // e.g., http://localhost:5001
  FILE_BASE_URL: localStorage.getItem('FILE_BASE_URL') || '', // e.g., http://localhost:5000
};

// Mock store
const mock = {
  // Public domain/sample videos
  videos: [
    {
      id: 'big-buck-bunny',
      title: 'Big Buck Bunny (sample)',
      description: 'Open movie project - CC BY',
      // Remote MP4 to ensure it plays without backend
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      thumb: 'https://i.imgur.com/0rK9g2K.jpeg',
      duration: '09:56',
    },
    {
      id: 'sintel',
      title: 'Sintel (trailer sample)',
      description: 'Blender Foundation - CC BY',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      thumb: 'https://i.imgur.com/7T7rYQH.jpeg',
      duration: '04:50',
    },
  ],
};

// App state
const state = {
  user: JSON.parse(sessionStorage.getItem('user') || 'null'),
  videos: mock.videos,
  filtered: mock.videos,
};

// DOM
const els = {
  loginBtn: document.getElementById('login-btn'),
  logoutBtn: document.getElementById('logout-btn'),
  userInfo: document.getElementById('user-info'),
  usernameLabel: document.getElementById('username-label'),
  loginModal: document.getElementById('login-modal'),
  loginForm: document.getElementById('login-form'),
  cancelLogin: document.getElementById('cancel-login'),
  list: document.getElementById('video-list'),
  search: document.getElementById('search'),
  playerModal: document.getElementById('player-modal'),
  closePlayer: document.getElementById('close-player'),
  player: document.getElementById('player'),
  playerSource: document.getElementById('player-source'),
  playerTitle: document.getElementById('player-title'),
  // settings
  settingsBtn: document.getElementById('settings-btn'),
  settingsModal: document.getElementById('settings-modal'),
  settingsForm: document.getElementById('settings-form'),
  settingsCancel: document.getElementById('settings-cancel'),
  cfgAuth: document.getElementById('cfg-auth'),
  cfgApi: document.getElementById('cfg-api'),
  cfgFile: document.getElementById('cfg-file'),
  cfgHideMock: document.getElementById('cfg-hide-mock'),
  // toasts
  toastContainer: document.getElementById('toast-container'),
  uploadLink: document.getElementById('upload-link'),
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

// Show a cross-page toast if set by another page
try {
  const stored = sessionStorage.getItem('TOAST');
  if (stored) {
    const data = JSON.parse(stored);
    showToast(data);
    sessionStorage.removeItem('TOAST');
  }
} catch {}

function setAuthUI() {
  if (state.user) {
    els.loginBtn.classList.add('hidden');
    els.userInfo.classList.remove('hidden');
    els.usernameLabel.textContent = state.user.username;
  } else {
    els.loginBtn.classList.remove('hidden');
    els.userInfo.classList.add('hidden');
    els.usernameLabel.textContent = '';
  }
}

function openLogin() { els.loginModal.classList.remove('hidden'); }
function closeLogin() { els.loginModal.classList.add('hidden'); }

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

function logout() {
  state.user = null;
  sessionStorage.removeItem('user');
  setAuthUI();
  showToast({ title: 'Logged out', kind: 'info' });
}

function renderList(items) {
  els.list.innerHTML = '';
  const frag = document.createDocumentFragment();
  items.forEach(v => {
    const a = document.createElement('a');
    a.href = '#';
    a.className = 'card-link';
    a.addEventListener('click', (e) => { e.preventDefault(); openPlayer(v); });

    const card = document.createElement('article');
    card.className = 'card video-card';
    // Delete button for both local and API items
    const isLocal = v._local || String(v.id || '').startsWith('local-');
    const del = document.createElement('button');
    del.className = 'delete-btn';
    del.type = 'button';
    del.textContent = 'Delete';
    del.title = isLocal ? 'Remove local video' : 'Remove from Catalog and Storage';
    const needsAuth = Boolean(CONFIG.API_BASE_URL) && !isLocal;
    if (needsAuth && !state.user) {
      del.disabled = true;
      del.title = 'Login required to delete';
    }
    del.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const ok = confirm('Delete this video?');
      if (!ok) return;
      if (isLocal) {
        deleteLocalVideo(v.id);
      } else {
        deleteApiVideo(v);
      }
    });
    card.appendChild(del);
    const img = document.createElement('img');
    img.className = 'thumb';
    img.alt = v.title;
    img.loading = 'lazy';
    img.src = v.thumb || '';

    const meta = document.createElement('div');
    meta.className = 'meta';
    const h = document.createElement('h3');
    h.className = 'title';
    h.textContent = v.title;
    const p = document.createElement('p');
    p.className = 'subtitle';
    p.textContent = v.description || '';

    meta.appendChild(h); meta.appendChild(p);
    card.appendChild(img); card.appendChild(meta);
    a.appendChild(card);
    frag.appendChild(a);
  });
  els.list.appendChild(frag);
}

function deleteLocalVideo(id) {
  try {
    const key = 'LOCAL_UPLOADS';
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    const next = current.filter(v => v.id !== id);
    if (next.length === current.length) {
      showToast({ title: 'Not found', body: 'Could not find local video.', kind: 'error' });
      return;
    }
    localStorage.setItem(key, JSON.stringify(next));
    // Remove from state
    state.videos = state.videos.filter(v => v.id !== id);
    const q = (els.search.value || '').toLowerCase();
    state.filtered = state.videos.filter(v =>
      v.title.toLowerCase().includes(q) || (v.description || '').toLowerCase().includes(q)
    );
    renderList(state.filtered);
    showToast({ title: 'Removed', body: 'Local video deleted.', kind: 'success' });
  } catch (err) {
    console.error('Delete failed', err);
    showToast({ title: 'Delete failed', kind: 'error' });
  }
}

function openPlayer(v) {
  els.player.pause();
  els.playerSource.src = v.url;
  els.playerTitle.textContent = v.title;
  els.player.load();
  els.playerModal.classList.remove('hidden');
}
function closePlayer() {
  els.player.pause();
  els.playerModal.classList.add('hidden');
}

async function deleteApiVideo(video) {
  try {
    if (!CONFIG.API_BASE_URL) {
      showToast({ title: 'API not configured', body: 'Set API Base URL in Settings', kind: 'error' });
      return;
    }
    if (!state.user) {
      openLogin();
      showToast({ title: 'Login required', body: 'Please login to delete videos.', kind: 'error' });
      return;
    }
    // Try to delete the stored file first (best effort)
    let fileIssue = '';
    try {
      if (CONFIG.FILE_BASE_URL && (video.path || video.url)) {
        let fileEndpoint = '';
        if (video.path) {
          fileEndpoint = `${CONFIG.FILE_BASE_URL}${video.path}`;
        } else if (video.url && video.url.startsWith(CONFIG.FILE_BASE_URL)) {
          fileEndpoint = video.url;
        }
        if (fileEndpoint) {
          const fr = await fetch(fileEndpoint, { method: 'DELETE' });
          if (![200, 204, 404].includes(fr.status)) {
            const t = await safeReadText(fr);
            fileIssue = `File delete: ${fr.status} ${fr.statusText}${t ? ` - ${t}` : ''}`;
          }
        }
      }
    } catch (e) {
      fileIssue = e?.message || 'File delete error';
    }

    const res = await fetch(`${CONFIG.API_BASE_URL}/videos/${encodeURIComponent(video.id)}`, { method: 'DELETE' });
    if (res.status !== 204) {
      const text = await safeReadText(res);
      throw new Error(`Delete failed (${res.status} ${res.statusText})${text ? `: ${text}` : ''}`);
    }
    state.videos = state.videos.filter(v => String(v.id) !== String(video.id));
    const q = (els.search.value || '').toLowerCase();
    state.filtered = state.videos.filter(v =>
      v.title.toLowerCase().includes(q) || (v.description || '').toLowerCase().includes(q)
    );
    renderList(state.filtered);
    showToast({ title: 'Deleted', body: 'Removed from Catalog and storage.', kind: 'success' });
    if (fileIssue) {
      showToast({ title: 'Cleanup note', body: fileIssue, kind: 'info' });
    }
  } catch (err) {
    console.error(err);
    showToast({ title: 'Delete error', body: err?.message || 'Unknown error', kind: 'error' });
  }
}

async function safeReadText(res) {
  try { return (await res.text()).slice(0, 300); } catch { return ''; }
}

// Settings modal logic
function openSettings() {
  els.cfgAuth.value = CONFIG.AUTH_BASE_URL;
  els.cfgApi.value = CONFIG.API_BASE_URL;
  els.cfgFile.value = CONFIG.FILE_BASE_URL;
  if (els.cfgHideMock) {
    els.cfgHideMock.checked = localStorage.getItem('HIDE_MOCK') === '1';
  }
  els.settingsModal.classList.remove('hidden');
}
function closeSettings() { els.settingsModal.classList.add('hidden'); }

async function fetchVideos() {
  if (CONFIG.API_BASE_URL) {
    try {
      if (!state.user) {
        showToast({ title: 'Login required', body: 'Login to view videos from Catalog.', kind: 'info' });
        state.videos = [];
        state.filtered = [];
        return;
      }
      const res = await fetch(`${CONFIG.API_BASE_URL}/videos`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const items = await res.json();
      state.videos = (Array.isArray(items) ? items : []).map(v => ({
        id: v.id || v._id || crypto.randomUUID(),
        title: v.title || 'Untitled',
        description: v.description || '',
        url: v.url || (CONFIG.FILE_BASE_URL && v.path ? `${CONFIG.FILE_BASE_URL}${v.path}` : ''),
        path: v.path || '',
        thumb: v.thumb || '',
        duration: v.duration || '',
      }));
      state.filtered = state.videos;
      return;
    } catch (err) {
      console.warn('Fetch /videos failed, using mock. Reason:', err?.message || err);
      showToast({ title: 'Using mock data', body: 'Could not load from API.', kind: 'info' });
    }
  }
  // Base list = mock (can be hidden in Settings)
  let list = localStorage.getItem('HIDE_MOCK') === '1' ? [] : [...mock.videos];
  // Merge in local uploads (if any) at the top
  try {
    const local = JSON.parse(localStorage.getItem('LOCAL_UPLOADS') || '[]');
    if (Array.isArray(local)) {
      list = [...local, ...list];
    }
  } catch {}
  state.videos = list;
  state.filtered = list;
}

// Events
els.loginBtn.addEventListener('click', openLogin);
els.cancelLogin.addEventListener('click', closeLogin);
els.logoutBtn.addEventListener('click', logout);
els.closePlayer.addEventListener('click', closePlayer);
// settings events
els.settingsBtn.addEventListener('click', openSettings);
els.settingsCancel?.addEventListener('click', closeSettings);
els.settingsForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  localStorage.setItem('AUTH_BASE_URL', els.cfgAuth.value.trim());
  localStorage.setItem('API_BASE_URL', els.cfgApi.value.trim());
  localStorage.setItem('FILE_BASE_URL', els.cfgFile.value.trim());
  if (els.cfgHideMock) {
    localStorage.setItem('HIDE_MOCK', els.cfgHideMock.checked ? '1' : '0');
  }
  // refresh config in memory
  CONFIG.AUTH_BASE_URL = localStorage.getItem('AUTH_BASE_URL') || '';
  CONFIG.API_BASE_URL = localStorage.getItem('API_BASE_URL') || '';
  CONFIG.FILE_BASE_URL = localStorage.getItem('FILE_BASE_URL') || '';
  closeSettings();
  fetchVideos().then(() => renderList(state.filtered));
  showToast({ title: 'Settings saved', kind: 'success' });
});
// Gate Upload link by login: if not logged in, open login modal, then redirect after successful login
if (els.uploadLink) {
  els.uploadLink.addEventListener('click', (e) => {
    if (!state.user) {
      e.preventDefault();
      openLogin();
      showToast({ title: 'Login required', body: 'Please login to upload.', kind: 'info' });
      // After a successful login, navigate to upload page automatically
      const handler = async (ev) => {
        ev.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        if (!username || !password) return;
        try {
          if (!CONFIG.AUTH_BASE_URL) throw new Error('Auth service URL not set. Open Settings.');
          await loginReal(username, password);
          closeLogin();
          els.loginForm.removeEventListener('submit', handler);
          window.location.href = './upload.html';
        } catch (err) {
          showToast({ title: 'Login failed', body: err?.message || 'Error', kind: 'error' });
        }
      };
      // Temporarily override the login submit to redirect
      els.loginForm.addEventListener('submit', handler);
    }
  });
}
els.loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  if (!username || !password) return;
  try {
    if (!CONFIG.AUTH_BASE_URL) throw new Error('Auth service URL not set. Open Settings.');
    await loginReal(username, password);
    closeLogin();
    await fetchVideos();
    renderList(state.filtered);
  } catch (err) {
    showToast({ title: 'Login failed', body: err?.message || 'Error', kind: 'error' });
  }
});

els.search.addEventListener('input', () => {
  const q = els.search.value.toLowerCase();
  state.filtered = state.videos.filter(v =>
    v.title.toLowerCase().includes(q) || (v.description || '').toLowerCase().includes(q)
  );
  renderList(state.filtered);
});

// Initial render
setAuthUI();
fetchVideos().then(() => renderList(state.filtered));
