const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { createUser, verifyUser } = require('../utils/fileStore');

const router = express.Router();

const useMongo = !!process.env.MONGO_URI;

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

    let doc;
    if (useMongo) {
      const exists = await User.findOne({ email: email.toLowerCase() });
      if (exists) return res.status(409).json({ error: 'Email already registered' });
      const passwordHash = await bcrypt.hash(password, 10);
      doc = await User.create({ name, email: email.toLowerCase(), passwordHash });
    } else {
      doc = await createUser({ name, email, password });
    }

    req.session.user = { id: doc._id || doc.id, name: doc.name, email: doc.email };
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

    let user;
    if (useMongo) {
      const found = await User.findOne({ email: email.toLowerCase() });
      if (!found) return res.status(401).json({ error: 'Invalid credentials' });
      const match = await bcrypt.compare(password, found.passwordHash);
      if (!match) return res.status(401).json({ error: 'Invalid credentials' });
      user = { id: found._id, name: found.name, email: found.email };
    } else {
      const verified = await verifyUser({ email, password });
      if (!verified) return res.status(401).json({ error: 'Invalid credentials' });
      user = { id: verified.id, name: verified.name, email: verified.email };
    }

    req.session.user = user;
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

module.exports = router;