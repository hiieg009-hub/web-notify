const http = require('http');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { sendFcmFromBody, getFixedTopic } = require('./lib/fcmSend');
const {
  getSiteName,
  getScheduleTz,
  adminSecretConfigured,
  cronAuthorized,
} = require('./lib/config');
const { handleSchedule } = require('./lib/scheduleController');
const { processDueSchedules } = require('./lib/scheduleEngine');

const PORT = Number(process.env.PORT) || 3000;
const publicDir = path.join(__dirname, 'public');

const corsApi = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, x-admin-secret, Authorization',
};

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.js') return 'application/javascript; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.json') return 'application/json; charset=utf-8';
  if (ext === '.ico') return 'image/x-icon';
  return 'application/octet-stream';
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function writeJson(res, status, obj, extraHeaders = {}) {
  res.writeHead(status, {
    ...corsApi,
    'Content-Type': 'application/json; charset=utf-8',
    ...extraHeaders,
  });
  res.end(JSON.stringify(obj));
}

const server = http.createServer(async (req, res) => {
  const urlPath = (req.url || '/').split('?')[0];

  if (req.method === 'OPTIONS' && urlPath.startsWith('/api/')) {
    res.writeHead(204, corsApi);
    res.end();
    return;
  }

  if (req.method === 'GET' && urlPath === '/api/meta') {
    writeJson(res, 200, {
      siteName: getSiteName(),
      topic: getFixedTopic(),
      scheduleTz: getScheduleTz(),
      adminRequired: adminSecretConfigured(),
    });
    return;
  }

  if (urlPath === '/api/schedule') {
    let bodyRaw = '';
    if (req.method === 'POST') {
      try {
        bodyRaw = await readBody(req);
      } catch (e) {
        writeJson(res, 400, { error: String(e.message || e) });
        return;
      }
    }
    const result = await handleSchedule(req.method, req.headers, bodyRaw);
    if (result.status === 204) {
      res.writeHead(204, corsApi);
      res.end();
      return;
    }
    writeJson(res, result.status, result.json);
    return;
  }

  if (urlPath === '/api/cron' && (req.method === 'GET' || req.method === 'POST')) {
    if (!cronAuthorized(req.headers)) {
      writeJson(res, 401, { error: 'Cron si halali (Bearer CRON_SECRET).' });
      return;
    }
    try {
      const out = await processDueSchedules();
      writeJson(res, 200, { ok: true, ...out });
    } catch (e) {
      writeJson(res, 500, { error: e.message || String(e) });
    }
    return;
  }

  if (req.method === 'POST' && urlPath === '/api/send') {
    let raw;
    try {
      raw = await readBody(req);
    } catch (e) {
      writeJson(res, 400, { error: String(e.message || e) });
      return;
    }
    let parsed = {};
    try {
      parsed = raw ? JSON.parse(raw) : {};
    } catch {
      writeJson(res, 400, { error: 'JSON si halali' });
      return;
    }

    const result = await sendFcmFromBody(parsed);
    if (!result.ok) {
      writeJson(res, result.status, { error: result.error });
      return;
    }
    res.writeHead(200, {
      ...corsApi,
      'Content-Type': 'application/json; charset=utf-8',
    });
    res.end(result.body);
    return;
  }

  const rel =
    urlPath === '/'
      ? 'index.html'
      : path.normalize(urlPath.replace(/^\//, '')).replace(/^(\.\.(\/|\\|$))+/, '');
  const safeRoot = path.resolve(publicDir);
  const filePath = path.resolve(safeRoot, rel);
  if (filePath !== safeRoot && !filePath.startsWith(safeRoot + path.sep)) {
    res.writeHead(403);
    res.end();
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(urlPath === '/' ? 500 : 404, { 'Content-Type': 'text/plain' });
      res.end(urlPath === '/' ? 'Haipatikani index.html' : '404');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType(filePath) });
    res.end(data);
  });
});

setInterval(() => {
  processDueSchedules().catch((err) =>
    console.error('[schedule]', err && err.message ? err.message : err)
  );
}, 60 * 1000);

server.listen(PORT, () => {
  console.log(`Local: http://localhost:${PORT}`);
});
