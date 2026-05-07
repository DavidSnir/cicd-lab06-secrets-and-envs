const express = require('express');
const { signToken, verifyToken } = require('./auth');

const app = express();
app.use(express.json());

app.post('/token', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'username is required' });
  try {
    const token = signToken({ username });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/protected', (req, res) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }
  try {
    const payload = verifyToken(header.slice(7));
    res.json({ message: `Hello, ${payload.username}` });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = app;
