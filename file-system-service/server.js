const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

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

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded');
  const filePath = path.join('/files', req.file.filename);
  res.json({ path: filePath, filename: req.file.filename });
});

// Serve files statically
app.use('/files', express.static(STORAGE_DIR, { fallthrough: true }));

// Basic error handler (including multer errors)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send(typeof err === 'string' ? err : (err && err.message) ? err.message : 'Server error');
});

app.listen(5000, () => console.log('File System service running on port 5000'));
