const express = require('express');
const fetch = require('node-fetch');

const router = express.Router();

function pickFrom(list, n=12) {
  const shuffled = [...list].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

router.get('/', async (req, res) => {
  try {
    const t = Date.now();
    const endpoints = [
      `https://www.reddit.com/r/memes/top.json?t=day&limit=50&_=${t}`,
      `https://www.reddit.com/r/dankmemes/top.json?t=day&limit=50&_=${t}`,
      `https://www.reddit.com/r/ProgrammerHumor/hot.json?limit=50&_=${t}`
    ];

    const results = await Promise.all(endpoints.map(u => fetch(u).then(r => r.json()).catch(() => null)));
    const posts = results.flatMap(r => {
      if (!r || !r.data || !r.data.children) return [];
      return r.data.children.map(c => c.data);
    }).filter(p => p && p.post_hint === 'image' && p.url && !p.over_18);

    const chosen = pickFrom(posts, 16).map(p => ({
      id: p.id,
      title: p.title,
      author: p.author,
      permalink: "https://reddit.com" + p.permalink,
      img: p.url,
      ups: p.ups
    }));

    res.json({ ok: true, memes: chosen });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'Failed to fetch memes' });
  }
});

module.exports = router;