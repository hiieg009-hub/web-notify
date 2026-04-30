const path = require('path');

try {
  require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });
  require('dotenv').config({ path: path.join(process.cwd(), '.env') });
} catch (_) {}

const {
  adminAuthorized,
  adminSetupError,
  isAdminAuthOpen,
} = require('../lib/config');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, x-admin-secret, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Tumia GET au POST' });
    return;
  }

  if (adminSetupError()) {
    res.status(503).json({
      error:
        'No BETMAKINI IDs configured on the server. Add at least one inside lib/betmakiniIds.js then redeploy.',
    });
    return;
  }

  if (isAdminAuthOpen()) {
    res.status(200).json({ ok: true, open: true });
    return;
  }

  if (!adminAuthorized(req.headers)) {
    res.status(401).json({ ok: false, error: 'Invalid BETMAKINI ID.' });
    return;
  }

  res.status(200).json({ ok: true });
};
