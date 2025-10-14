const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')

const app = express();
app.use(cors());
app.use(express.json());

// use a shared secret (same in catalog-service)
const SECRET = process.env.JWT_SECRET || 'supersecret';

const users = [{ username: 'admin', password: '1234' }];

function generateToken(username) {
  return 'token-' + username + '-' + Date.now();
}

app.post('/validate', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ valid: false, error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { username: user.username, role: user.role },
    SECRET,
    { expiresIn: '1h' }
  );

  res.json({
    valid: true,
    username: username,
    token
  });
});

app.listen(4000, () => console.log('Auth service running on port 4000'));
