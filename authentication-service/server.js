const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const users = [{ username: 'admin', password: '1234' }];

app.post('/validate', (req, res) => {
  const { username, password } = req.body;
  const valid = users.some(u => u.username === username && u.password === password);
  res.json({ valid });
});

app.listen(4000, () => console.log('Auth service running on port 4000'));
