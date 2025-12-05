import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';

const app = express();
app.use(cors());
app.use(express.json());

const config = {
  host: process.env.MYSQL_HOST || 'mysql',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'example',
  database: process.env.MYSQL_DB || 'data_db',
};

const auth = {
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtIssuer: process.env.JWT_ISSUER || 'auth-service',
};

function verifyJWT(req, res, next) {
  try {
    const hdr = req.headers['authorization'] || '';
    const m = /^Bearer\s+(.+)$/i.exec(hdr);
    if (!m) return res.status(401).json({ error: 'missing token' });
    const token = m[1];
    const payload = jwt.verify(token, auth.jwtSecret, { issuer: auth.jwtIssuer });
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'invalid token' });
  }
}

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

// Ensure schema includes optional thumb column
async function ensureSchema() {
  const p = await getPool();
  try {
    await p.query("ALTER TABLE videos ADD COLUMN thumb VARCHAR(1024) NULL");
  } catch (e) {
    // ignore if exists
  }
}

app.get('/health', (req, res) => res.json({ status: 'ok' }));
ensureSchema().catch(() => {});

app.get('/videos', verifyJWT, async (req, res) => {
  try {
    const p = await getPool();
  const [rows] = await p.query('SELECT id, title, path, thumb, uploaded_at FROM videos ORDER BY uploaded_at DESC');
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
});

app.post('/videos', verifyJWT, async (req, res) => {
  try {
    const { title, path, thumb } = req.body || {};
    if (!title || !path) return res.status(400).json({ error: 'title and path required' });
    const p = await getPool();
    const [result] = await p.execute('INSERT INTO videos (title, path, thumb) VALUES (?, ?, ?)', [title, path, thumb || null]);
    res.status(201).json({ id: result.insertId, title, path, thumb: thumb || null });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
});

app.delete('/videos/:id', verifyJWT, async (req, res) => {
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
