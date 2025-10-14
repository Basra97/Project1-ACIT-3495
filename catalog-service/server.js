import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'supersecret';

const app = express();
app.use(cors());
app.use(express.json());

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization token' });
  }

  const token = authHeader.slice(7); // Remove "Bearer "

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded; // Attach decoded payload to request
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}


const config = {
  host: process.env.MYSQL_HOST || 'mysql',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'example',
  database: process.env.MYSQL_DB || 'data_db',
};

let pool;
async function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: config.host,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    });
  }
  return pool;
}

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/videos', requireAuth, async (req, res) => {
  try {
    const p = await getPool();
    const [rows] = await p.query('SELECT id, title, path, uploaded_at FROM videos ORDER BY uploaded_at DESC');
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
});

app.post('/videos', requireAuth, async (req, res) => {
  try {
    const { title, path } = req.body || {};
    if (!title || !path) return res.status(400).json({ error: 'title and path required' });
    const p = await getPool();
    const [result] = await p.execute('INSERT INTO videos (title, path) VALUES (?, ?)', [title, path]);
    res.status(201).json({ id: result.insertId, title, path });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
});

app.delete('/videos/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid id' });
    const p = await getPool();
    const [result] = await p.execute('DELETE FROM videos WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'not found' });
    return res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
});

const port = process.env.PORT || 5001;
app.listen(port, () => console.log(`Catalog service listening on ${port}`));
