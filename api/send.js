const path = require('path');

try {
  require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });
  require('dotenv').config({ path: path.join(process.cwd(), '.env') });
} catch (_) {}

const { sendFcmFromBody } = require('../lib/fcmSend');
const { adminSetupError, adminAuthorized } = require('../lib/config');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, x-admin-secret, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Tumia POST' });
    return;
  }

  if (adminSetupError()) {
    res.status(503).json({
      error:
        'ADMIN_SECRET haipo. Weka kwenye .env. Dev bila nenosiri: ADMIN_AUTH_OPEN=1 (si salama hadharani).',
    });
    return;
  }

  if (!adminAuthorized(req.headers)) {
    res.status(401).json({
      error:
        'Hitaji nenosiri la admin (x-admin-secret au Bearer sawa na ADMIN_SECRET).',
    });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      res.status(400).json({ error: 'JSON si halali' });
      return;
    }
  }

  const result = await sendFcmFromBody(body);
  if (!result.ok) {
    res.status(result.status).json({ error: result.error });
    return;
  }
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(200).send(result.body);
};
