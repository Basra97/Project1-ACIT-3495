const express = require('express');
const mysql = require('mysql2');
const app = express();
app.use(express.json());

// MySQL connection
const db = mysql.createConnection({
  host: 'mysql',
  user: 'root',
  password: 'example',
  database: 'data_db'
});

// Endpoint for data entry
app.post('/enter', async (req, res) => {
  const { username, password, data } = req.body;
  try {
    // Call Auth Service using native Fetch
    const response = await fetch('http://auth-service:4000/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const auth = await response.json();
    if (!auth.valid) return res.status(401).send('Invalid credentials');

    // Insert data into MySQL
    db.query('INSERT INTO entries (value) VALUES (?)', [data]);
    res.send('Data inserted');
  } catch (err) {
    console.error(err);
    res.status(500).send('Service error');
  }
});

// Start server
app.listen(3000, () => console.log('Enter Data Web running on port 3000'));
