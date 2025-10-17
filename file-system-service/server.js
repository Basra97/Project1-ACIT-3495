const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const STORAGE_DIR = '/data/files';
// Ensure storage directory exists on startup
fs.mkdirSync(STORAGE_DIR, { recursive: true });

function sanitizeName(name) {
  // Keep letters, numbers, spaces, dashes, underscores, dots, and parentheses
  const cleaned = (name || 'file')
    .replace(/[^\w.\-() ]+/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
  // Limit length to avoid FS limits (~255)
  if (cleaned.length > 180) {
    const ext = path.extname(cleaned);
    const base = path.basename(cleaned, ext).slice(- (180 - ext.length));
    return base + ext;
  }
  return cleaned || ('file-' + Date.now());
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Re-ensure directory exists at request time to avoid race conditions
    fs.mkdir(STORAGE_DIR, { recursive: true }, (err) => cb(err, STORAGE_DIR));
  },
  filename: (req, file, cb) => {
    const safe = sanitizeName(file.originalname);
    cb(null, Date.now() + '-' + safe);
  }
});
const upload = multer({ storage });

// JWT middleware
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_ISSUER = process.env.JWT_ISSUER || 'auth-service';
function verifyJWT(req, res, next) {
  try {
    const hdr = req.headers['authorization'] || '';
    const m = /^Bearer\s+(.+)$/i.exec(hdr);
    if (!m) return res.status(401).send('missing token');
    const token = m[1];
    jwt.verify(token, JWT_SECRET, { issuer: JWT_ISSUER });
    return next();
  } catch (e) {
    return res.status(401).send('invalid token');
  }
}

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.post('/upload', verifyJWT, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded');
  const filePath = path.join('/files', req.file.filename);
  res.json({ path: filePath, filename: req.file.filename });
});

// Serve files statically but require auth for reads; support token via header or query param
function extractToken(req) {
  const hdr = req.headers['authorization'] || '';
  const m = /^Bearer\s+(.+)$/i.exec(hdr);
  if (m) return m[1];
  // Allow token in query for <video src> convenience
  if (req.query && typeof req.query.token === 'string' && req.query.token) return req.query.token;
  return '';
}

function verifyJWTForStatic(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) return res.status(401).send('missing token');
    jwt.verify(token, JWT_SECRET, { issuer: JWT_ISSUER });
    return next();
  } catch (e) {
    return res.status(401).send('invalid token');
  }
}

app.use('/files', (req, res, next) => {
  // Only protect GET/HEAD for reading files; other methods handled elsewhere
  if (req.method === 'GET' || req.method === 'HEAD') {
    return verifyJWTForStatic(req, res, () => express.static(STORAGE_DIR, { fallthrough: true })(req, res, next));
  }
  return express.static(STORAGE_DIR, { fallthrough: true })(req, res, next);
});

// Delete a stored file
app.delete('/files/:name', verifyJWT, async (req, res) => {
  try {
    const name = req.params.name;
    const full = path.join(STORAGE_DIR, name);
    if (!fs.existsSync(full)) return res.status(404).send('Not found');
    await fs.promises.unlink(full);
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).send('Error deleting file');
  }
});

// Basic error handler (including multer errors)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send(typeof err === 'string' ? err : (err && err.message) ? err.message : 'Server error');
});

app.listen(5000, () => console.log('File System service running on port 5000'));
