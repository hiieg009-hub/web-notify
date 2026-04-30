const crypto = require('crypto');
const { DateTime } = require('luxon');
const { adminAuthorized, adminSetupError } = require('./config');
const store = require('./scheduleStore');

function newId() {
  return crypto.randomBytes(12).toString('hex');
}

/**
 * @param {string} method
 * @param {import('http').IncomingHttpHeaders} headers
 * @param {string} bodyRaw
 */
async function handleSchedule(method, headers, bodyRaw) {
  if (method === 'OPTIONS') return { status: 204, json: null };

  if (adminSetupError()) {
    return {
      status: 503,
      json: {
        error:
          'ADMIN_SECRET haipo. Weka kwenye .env.local. Dev bila nenosiri: ADMIN_AUTH_OPEN=1 (si salama hadharani).',
      },
    };
  }

  if (!adminAuthorized(headers)) {
    return {
      status: 401,
      json: { error: 'Hitaji nenosiri la admin (x-admin-secret au Bearer).' },
    };
  }

  if (method === 'GET') {
    const data = await store.read();
    return { status: 200, json: { items: data.items } };
  }

  if (method !== 'POST') {
    return { status: 405, json: { error: 'Tumia GET au POST' } };
  }

  let body;
  try {
    body = bodyRaw && String(bodyRaw).trim() ? JSON.parse(bodyRaw) : {};
  } catch {
    return { status: 400, json: { error: 'JSON si halali' } };
  }

  if (body.action === 'delete') {
    const id = (body.id || '').trim();
    if (!id) return { status: 400, json: { error: 'Id inahitajika' } };
    await store.readModifyWrite(async (data) => {
      data.items = data.items.filter((i) => i.id !== id);
    });
    return { status: 200, json: { ok: true } };
  }

  if (body.action === 'setEnabled') {
    const id = (body.id || '').trim();
    if (!id) return { status: 400, json: { error: 'Id inahitajika' } };
    const enabled = !!body.enabled;
    await store.readModifyWrite(async (data) => {
      const it = data.items.find((i) => i.id === id);
      if (it) it.enabled = enabled;
    });
    return { status: 200, json: { ok: true } };
  }

  const title = (body.title || '').trim();
  const b = (body.body || '').trim();
  const image = (body.image || '').trim();
  if (!title && !b && !image) {
    return { status: 400, json: { error: 'Weka angalau title, body, au image.' } };
  }

  const mode = (body.mode || '').trim();
  if (mode !== 'once' && mode !== 'daily') {
    return { status: 400, json: { error: 'mode lazima iwe once au daily' } };
  }

  const item = {
    id: newId(),
    title,
    body: b,
    image,
    mode,
    enabled: true,
    createdAt: new Date().toISOString(),
    lastSentAt: null,
  };

  if (mode === 'once') {
    const runAt = (body.runAt || '').trim();
    if (!runAt) {
      return { status: 400, json: { error: 'runAt inahitajika (ISO datetime)' } };
    }
    const dt = DateTime.fromISO(runAt);
    if (!dt.isValid) {
      return { status: 400, json: { error: 'runAt si tarehe halali' } };
    }
    item.runAt = dt.toISO();
  } else {
    const dailyTime = (body.dailyTime || '').trim();
    const m = /^(\d{1,2}):(\d{2})$/.exec(dailyTime);
    if (!m) {
      return {
        status: 400,
        json: { error: 'dailyTime lazima iwe HH:mm (mfano 09:30)' },
      };
    }
    const hh = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    if (hh > 23 || mm > 59) {
      return { status: 400, json: { error: 'Saa si halali' } };
    }
    item.hour = hh;
    item.minute = mm;
  }

  await store.readModifyWrite(async (data) => {
    data.items.push(item);
  });
  return { status: 201, json: { ok: true, item } };
}

module.exports = { handleSchedule };
