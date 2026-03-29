const path = require('path');

try {
  require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });
  require('dotenv').config({ path: path.join(process.cwd(), '.env') });
} catch (_) {}

const { sendFcmFromBody } = require('../lib/fcmSend');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Tumia POST' });
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
  res.status(200).type('json').send(result.body);
};
