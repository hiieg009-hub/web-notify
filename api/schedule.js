const path = require('path');

try {
  require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });
  require('dotenv').config({ path: path.join(process.cwd(), '.env') });
} catch (_) {}

const { handleSchedule } = require('../lib/scheduleController');

function getBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-secret, Authorization',
  };
  Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  let bodyRaw = '';
  if (req.method === 'POST') {
    try {
      bodyRaw = await getBody(req);
    } catch (e) {
      res.status(400).json({ error: String(e.message || e) });
      return;
    }
  }

  const result = await handleSchedule(req.method, req.headers, bodyRaw);
  if (result.status === 204) {
    res.status(204).end();
    return;
  }
  res.status(result.status).json(result.json);
};
