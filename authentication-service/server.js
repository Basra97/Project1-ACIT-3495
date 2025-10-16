const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());

// Config
const config = {
  port: process.env.PORT || 4000,
  db: {
    host: process.env.MYSQL_HOST || 'mysql',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'example',
    database: process.env.MYSQL_DB || 'data_db',
  },
};

let pool;
async function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: config.db.host,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    });
  }
  return pool;
}

// Ensure users table exists and seed a default admin on first run (beginner-friendly, plain text)
async function ensureUsersTableAndSeed() {
  const p = await getPool();
  await p.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  // Add plain password column if migrating from older schema
  await p.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255) NULL');
  const [rows] = await p.query('SELECT COUNT(*) AS c FROM users');
  const count = (rows && rows[0] && rows[0].c) || 0;
  if (count === 0) {
    const username = process.env.DEFAULT_ADMIN_USER || 'admin';
    const password = process.env.DEFAULT_ADMIN_PASS || 'admin123';
    await p.execute('INSERT INTO users (username, password) VALUES (?, ?)', [username, password]);
    console.log(`Seeded default user: ${username}`);
  }
}

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Backward-compat simple validation endpoint
app.post('/validate', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.json({ valid: false });
    const p = await getPool();
    const [rows] = await p.execute('SELECT id, username, password FROM users WHERE username = ?', [username]);
    if (!rows || rows.length === 0) return res.json({ valid: false });
    const user = rows[0];
    const ok = password === user.password;
    if (!ok) return res.json({ valid: false });
    return res.json({ valid: true, user: { id: user.id, username: user.username } });
  } catch (e) {
    console.error(e);
    return res.json({ valid: false });
  }
});

// Startup
ensureUsersTableAndSeed()
  .then(() => {
    app.listen(config.port, () => console.log(`Auth service running on port ${config.port}`));
  })
  .catch((err) => {
    console.error('Failed to initialize auth service:', err);
    process.exit(1);
  });
