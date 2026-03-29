const path = require('path');

try {
  require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });
  require('dotenv').config({ path: path.join(process.cwd(), '.env') });
} catch (_) {}

const { getFixedTopic } = require('../lib/fcmSend');
const { getSiteName, getScheduleTz, adminSecretConfigured } = require('../lib/config');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Tumia GET' });
    return;
  }
  res.status(200).json({
    siteName: getSiteName(),
    topic: getFixedTopic(),
    scheduleTz: getScheduleTz(),
    adminRequired: adminSecretConfigured(),
  });
};
