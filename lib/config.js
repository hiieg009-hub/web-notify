const path = require('path');

function getSiteName() {
  return (process.env.SITE_NAME || 'Notifications').trim() || 'Notifications';
}

function getScheduleTz() {
  const z = (process.env.SCHEDULE_TZ || 'UTC').trim();
  try {
    Intl.DateTimeFormat(undefined, { timeZone: z });
    return z;
  } catch {
    return 'UTC';
  }
}

function getScheduleDbPath() {
  const p = (process.env.SCHEDULE_DB_PATH || '').trim();
  if (p) {
    return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
  }
  return path.join(process.cwd(), 'data', 'schedules.json');
}

function adminSecretConfigured() {
  return !!(process.env.ADMIN_SECRET && String(process.env.ADMIN_SECRET).trim());
}

function getAdminSecret() {
  return (process.env.ADMIN_SECRET || '').trim();
}

function getCronSecret() {
  return (process.env.CRON_SECRET || '').trim();
}

/** Headers: IncomingHttpHeaders au object ya kawaida */
function adminAuthorized(headers) {
  if (!adminSecretConfigured()) return true;
  const h = headers || {};
  const x = h['x-admin-secret'] || h['X-Admin-Secret'];
  if (x && String(x).trim() === getAdminSecret()) return true;
  const auth = h.authorization || h.Authorization;
  if (auth && String(auth).startsWith('Bearer ')) {
    return String(auth).slice(7).trim() === getAdminSecret();
  }
  return false;
}

function cronAuthorized(headers) {
  const secret = getCronSecret();
  if (!secret) {
    if (process.env.VERCEL) return false;
    return true;
  }
  const h = headers || {};
  const auth = h.authorization || h.Authorization;
  if (auth && String(auth).startsWith('Bearer ')) {
    return String(auth).slice(7).trim() === secret;
  }
  return false;
}

module.exports = {
  getSiteName,
  getScheduleTz,
  getScheduleDbPath,
  adminSecretConfigured,
  getAdminSecret,
  getCronSecret,
  adminAuthorized,
  cronAuthorized,
};
