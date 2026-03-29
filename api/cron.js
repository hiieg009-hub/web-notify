const path = require('path');

try {
  require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });
  require('dotenv').config({ path: path.join(process.cwd(), '.env') });
} catch (_) {}

const { cronAuthorized } = require('../lib/config');
const { processDueSchedules } = require('../lib/scheduleEngine');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Tumia GET au POST' });
    return;
  }

  if (!cronAuthorized(req.headers)) {
    res.status(401).json({ error: 'Cron si halali (Bearer CRON_SECRET).' });
    return;
  }

  try {
    const out = await processDueSchedules();
    res.status(200).json({ ok: true, ...out });
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
};
