const path = require('path');
const { hasAnyBetmakiniId, isValidBetmakiniId } = require('./betmakiniIds');

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
  // Vercel: mfumo wa mradi ni read-only; /tmp pekee ndiyo inayoandika.
  if (process.env.VERCEL) {
    return path.join('/tmp', 'web-notify-schedules.json');
  }
  return path.join(process.cwd(), 'data', 'schedules.json');
}

/** Ratiba inahifadhiwa kwenye faili: Vercel hutumia /tmp (hupotea kati ya instances / baada ya refresh). */
function isScheduleStorageEphemeral() {
  const force = String(process.env.SCHEDULE_EPHEMERAL || '')
    .toLowerCase()
    .trim();
  if (force === '1' || force === 'true') return true;
  return !!process.env.VERCEL;
}

function getAdminSecret() {
  return (process.env.ADMIN_SECRET || '').trim();
}

/** Dev tu: ukiwa 1/true, API ya tuma/ratiba wazi bila ADMIN_SECRET (usitumie production). */
function isAdminAuthOpen() {
  const v = String(process.env.ADMIN_AUTH_OPEN || '')
    .toLowerCase()
    .trim();
  return v === '1' || v === 'true' || v === 'yes';
}

/** Server imefungwa: lazima ADMIN_SECRET (isipokuwa ADMIN_AUTH_OPEN). */
function adminAuthLocked() {
  return !isAdminAuthOpen();
}

/** Imefungwa lakini hakuna BETMAKINI ID iliyowekwa — misconfig. */
function adminSetupError() {
  if (!adminAuthLocked()) return false;
  // Login mode: BETMAKINI IDs list. Kunaohitajika angalau ID moja.
  return !hasAnyBetmakiniId();
}

/** Kuna njia ya kuingia (UI / meta). */
function adminSecretConfigured() {
  return hasAnyBetmakiniId();
}

function getCronSecret() {
  return (process.env.CRON_SECRET || '').trim();
}

/**
 * Headers: IncomingHttpHeaders au object ya kawaida.
 * Inakubaliwa ikiwa header `x-admin-secret` (au `Authorization: Bearer …`)
 * ina BETMAKINI ID inayopatikana kwenye orodha (lib/betmakiniIds.js).
 */
function adminAuthorized(headers) {
  if (isAdminAuthOpen()) return true;
  if (!hasAnyBetmakiniId()) return false;
  const h = headers || {};
  const x = h['x-admin-secret'] || h['X-Admin-Secret'];
  if (x && isValidBetmakiniId(x)) return true;
  const auth = h.authorization || h.Authorization;
  if (auth && String(auth).startsWith('Bearer ')) {
    return isValidBetmakiniId(String(auth).slice(7));
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
  isScheduleStorageEphemeral,
  adminSecretConfigured,
  isAdminAuthOpen,
  adminAuthLocked,
  adminSetupError,
  getAdminSecret,
  getCronSecret,
  adminAuthorized,
  cronAuthorized,
};
