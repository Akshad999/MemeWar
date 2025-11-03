const express = require('express');
const { appendNameEmail, findInNames } = require('../utils/fileStore');
const router = express.Router();

router.post('/', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Missing fields' });
  appendNameEmail({ name, email });
  res.json({ ok: true });
});

router.get('/find', (req, res) => {
  const { name, email } = req.query;
  const results = findInNames({ name, email });
  res.json({ ok: true, results });
});

module.exports = router;