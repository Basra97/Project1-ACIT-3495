const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

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

app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});
