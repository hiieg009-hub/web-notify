const http = require('http');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { sendFcmFromBody, getFixedTopic } = require('./lib/fcmSend');

const PORT = Number(process.env.PORT) || 3000;
const publicDir = path.join(__dirname, 'public');

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
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

const server = http.createServer(async (req, res) => {
  const urlPath = (req.url || '/').split('?')[0];

  if (req.method === 'OPTIONS' && (urlPath === '/api/send' || urlPath === '/api/meta')) {
    res.writeHead(204, cors);
    res.end();
    return;
  }

  if (req.method === 'GET' && urlPath === '/api/meta') {
    res.writeHead(200, { ...cors, 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ topic: getFixedTopic() }));
    return;
  }

  if (req.method === 'POST' && urlPath === '/api/send') {
    let raw;
    try {
      raw = await readBody(req);
    } catch (e) {
      res.writeHead(400, { ...cors, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: String(e.message || e) }));
      return;
    }
    let parsed = {};
    try {
      parsed = raw ? JSON.parse(raw) : {};
    } catch {
      res.writeHead(400, { ...cors, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'JSON si halali' }));
      return;
    }

    const result = await sendFcmFromBody(parsed);
    if (!result.ok) {
      res.writeHead(result.status, { ...cors, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: result.error }));
      return;
    }
    res.writeHead(200, { ...cors, 'Content-Type': 'application/json; charset=utf-8' });
    res.end(result.body);
    return;
  }

  const rel =
    urlPath === '/' ? 'index.html' : path.normalize(urlPath.replace(/^\//, '')).replace(/^(\.\.(\/|\\|$))+/, '');
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

server.listen(PORT, () => {
  console.log(`Local: http://localhost:${PORT}`);
});
