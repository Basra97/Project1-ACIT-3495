const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_ISS = process.env.JWT_ISSUER || 'auth-service';
const JWT_EXP = process.env.JWT_EXPIRES_IN || '15m';

// Minimal, in-memory credentials suitable for a simple assignment/demo.
// You can override these via environment variables.
const DEFAULT_USER = process.env.DEFAULT_ADMIN_USER || 'admin';
const DEFAULT_PASS = process.env.DEFAULT_ADMIN_PASS || 'admin123';

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.post('/validate', (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.json({ valid: false });
    const ok = username === DEFAULT_USER && password === DEFAULT_PASS;
    if (!ok) return res.json({ valid: false });
    return res.json({ valid: true, user: { username: DEFAULT_USER } });
  } catch (e) {
    console.error(e);
    return res.json({ valid: false });
  }
});

// New: issue JWT
app.post('/login', (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    const ok = username === DEFAULT_USER && password === DEFAULT_PASS;
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });
    const token = jwt.sign({ sub: username }, JWT_SECRET, { expiresIn: JWT_EXP, issuer: JWT_ISS });
    return res.json({ token, user: { username } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server error' });
  }
});

// Optional: verify a JWT (for diagnostics)
app.post('/verify', (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ error: 'token required' });
    const payload = jwt.verify(token, JWT_SECRET, { issuer: JWT_ISS });
    return res.json({ valid: true, payload });
  } catch (e) {
    return res.status(401).json({ valid: false, error: e && e.message ? e.message : 'invalid token' });
  }
});

app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});
