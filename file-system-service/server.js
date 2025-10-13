const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
app.use(express.json());

const STORAGE_DIR = '/data/files';
fs.mkdirSync(STORAGE_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, STORAGE_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded');
  const filePath = path.join('/files', req.file.filename);
  res.json({ path: filePath, filename: req.file.filename });
});

app.get('/files/:name', (req, res) => {
  const name = req.params.name;
  const full = path.join(STORAGE_DIR, name);
  if (!fs.existsSync(full)) return res.status(404).send('Not found');
  res.sendFile(full);
});

app.listen(5000, () => console.log('File System service running on port 5000'));
