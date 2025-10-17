const els = {
  signupForm: document.getElementById('signup-form'),
  signinForm: document.getElementById('signin-form'),
  signupSection: document.getElementById('signup-section'),
  signinSection: document.getElementById('signin-section'),
  settingsBtn: document.getElementById('settings-btn'),
  settingsModal: document.getElementById('settings-modal'),
  settingsForm: document.getElementById('settings-form'),
  settingsCancel: document.getElementById('settings-cancel'),
  cfgAuth: document.getElementById('cfg-auth'),
  cfgApi: document.getElementById('cfg-api'),
  cfgFile: document.getElementById('cfg-file'),
  toasts: document.getElementById('toast-container'),
};

const CONFIG = {
  AUTH_BASE_URL: localStorage.getItem('AUTH_BASE_URL') || '',
  API_BASE_URL: localStorage.getItem('API_BASE_URL') || '',
  FILE_BASE_URL: localStorage.getItem('FILE_BASE_URL') || '',
};

function showToast(msg, kind='info'){
  const t = document.createElement('div'); t.className = `toast ${kind}`;
  const h = document.createElement('div'); h.className = 'title'; h.textContent = msg;
  t.appendChild(h); els.toasts.appendChild(t); setTimeout(()=>t.remove(), 3000);
}
// Show signup only if the user has never logged in before
try {
  const firstTime = localStorage.getItem('HAS_LOGGED_IN') !== 'true';
  if (firstTime) {
    els.signupSection.classList.remove('hidden');
  } else {
    els.signupSection.classList.add('hidden');
  }
} catch {}


function openSettings(){
  els.cfgAuth.value = CONFIG.AUTH_BASE_URL; els.cfgApi.value = CONFIG.API_BASE_URL; els.cfgFile.value = CONFIG.FILE_BASE_URL;
  els.settingsModal.classList.remove('hidden');
}
function closeSettings(){ els.settingsModal.classList.add('hidden'); }

els.settingsBtn.addEventListener('click', openSettings);
els.settingsCancel.addEventListener('click', closeSettings);
els.settingsForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  localStorage.setItem('AUTH_BASE_URL', els.cfgAuth.value.trim());
  localStorage.setItem('API_BASE_URL', els.cfgApi.value.trim());
  localStorage.setItem('FILE_BASE_URL', els.cfgFile.value.trim());
  CONFIG.AUTH_BASE_URL = localStorage.getItem('AUTH_BASE_URL') || '';
  CONFIG.API_BASE_URL = localStorage.getItem('API_BASE_URL') || '';
  CONFIG.FILE_BASE_URL = localStorage.getItem('FILE_BASE_URL') || '';
  closeSettings();
  showToast('Settings saved', 'success');
});

async function signup(username, password){
  const r = await fetch(`${CONFIG.AUTH_BASE_URL}/signup`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username, password }) });
  if (!r.ok) throw new Error(await r.text() || 'Signup failed');
  return r.json();
}
async function login(username, password){
  const r = await fetch(`${CONFIG.AUTH_BASE_URL}/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username, password }) });
  if (!r.ok) throw new Error(await r.text() || 'Login failed');
  return r.json();
}

els.signupForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const username = document.getElementById('su-username').value.trim();
  const password = document.getElementById('su-password').value;
  if (!username || !password) return;
  try{
    const res = await signup(username, password);
    sessionStorage.setItem('token', res.token);
    sessionStorage.setItem('user', JSON.stringify({ username }));
    try { localStorage.setItem('HAS_LOGGED_IN', 'true'); } catch {}
    showToast('Account created and signed in', 'success');
    setTimeout(()=> { window.location.href = './index.html'; }, 500);
  }catch(err){ showToast(err.message || 'Signup error', 'error'); }
});

els.signinForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const username = document.getElementById('si-username').value.trim();
  const password = document.getElementById('si-password').value;
  if (!username || !password) return;
  try{
    const res = await login(username, password);
    sessionStorage.setItem('token', res.token);
    sessionStorage.setItem('user', JSON.stringify({ username }));
    try { localStorage.setItem('HAS_LOGGED_IN', 'true'); } catch {}
    showToast('Signed in', 'success');
    setTimeout(()=> { window.location.href = './index.html'; }, 500);
  }catch(err){ showToast(err.message || 'Login error', 'error'); }
});
