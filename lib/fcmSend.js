const fs = require('fs');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');

const FCM_SCOPE = 'https://www.googleapis.com/auth/cloud-platform';

function normalizePrivateKey(key) {
  let k = String(key).trim();
  // If wrapped in quotes (common when copying from JSON), strip them.
  if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) {
    k = k.slice(1, -1);
  }
  // Convert literal \n sequences into real newlines.
  if (k.includes('\\n')) k = k.replace(/\\n/g, '\n');
  return k;
}

function getServiceAccount() {
  // 1) Three separate env vars (recommended on Vercel).
  const projectId =
    (process.env.FCM_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || '').trim();
  const clientEmail =
    (process.env.FCM_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL || '').trim();
  const privateKeyRaw =
    process.env.FCM_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY || '';

  if (projectId && clientEmail && privateKeyRaw) {
    return {
      type: 'service_account',
      project_id: projectId,
      client_email: clientEmail,
      private_key: normalizePrivateKey(privateKeyRaw),
    };
  }

  // 2) Full JSON in a single env var.
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (raw && String(raw).trim()) {
    try {
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.');
    }
  }

  // 3) Path to a JSON file (local development).
  const gac = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (gac && String(gac).trim()) {
    const t = String(gac).trim();
    if (t.startsWith('{')) {
      try {
        return JSON.parse(t);
      } catch {
        throw new Error(
          'GOOGLE_APPLICATION_CREDENTIALS looks like JSON but is invalid. On Vercel use FIREBASE_SERVICE_ACCOUNT_JSON or the FCM_* trio.'
        );
      }
    }
    const resolved = path.isAbsolute(t) ? t : path.join(process.cwd(), t);
    if (fs.existsSync(resolved)) {
      return JSON.parse(fs.readFileSync(resolved, 'utf8'));
    }
  }

  throw new Error(
    'Firebase credentials missing. Set either FCM_PROJECT_ID + FCM_CLIENT_EMAIL + FCM_PRIVATE_KEY, or FIREBASE_SERVICE_ACCOUNT_JSON (full JSON string). For local dev you can use GOOGLE_APPLICATION_CREDENTIALS=./path/to/file.json.'
  );
}

async function getAccessToken(credentials) {
  const auth = new GoogleAuth({
    credentials,
    scopes: [FCM_SCOPE],
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const token = tokenResponse.token;
  if (!token) throw new Error('Haikuweza kupata access token.');
  return token;
}

function buildDataPayload({ title, body, image }) {
  const data = {};
  if (title) data.title = String(title);
  if (body) data.body = String(body);
  if (image) data.image = String(image);
  return data;
}

/** Topic inatoka tu kwenye server (FCM_TOPIC au chaguo-msingi BETMAKINI) — si kutoka kwa ombi la mteja. */
function getFixedTopic() {
  return (process.env.FCM_TOPIC || 'BETMAKINI').trim();
}

/**
 * @param {object} body - { title, body, image } (topic kwenye ombi hutelekezwa kwa usalama)
 * @returns {Promise<{ ok: true, status: number, body: string } | { ok: false, status: number, error: string }>}
 */
async function sendFcmFromBody(body) {
  const topic = getFixedTopic();
  if (!topic) {
    return { ok: false, status: 500, error: 'FCM_TOPIC si halali.' };
  }

  const title = (body.title || '').trim();
  const bodyText = (body.body || '').trim();
  const image = (body.image || '').trim();

  const data = buildDataPayload({ title, body: bodyText, image });
  if (Object.keys(data).length === 0) {
    return {
      ok: false,
      status: 400,
      error: 'Weka angalau title, body, au image.',
    };
  }

  let credentials;
  try {
    credentials = getServiceAccount();
  } catch (e) {
    return { ok: false, status: 500, error: e.message };
  }

  const projectId = credentials.project_id;
  if (!projectId) {
    return {
      ok: false,
      status: 500,
      error: 'project_id haipo kwenye service account.',
    };
  }

  let accessToken;
  try {
    accessToken = await getAccessToken(credentials);
  } catch (e) {
    return { ok: false, status: 500, error: 'Token: ' + e.message };
  }

  const message = { topic, data };
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  try {
    const fcmRes = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({ message }),
    });
    const text = await fcmRes.text();
    if (!fcmRes.ok) {
      return { ok: false, status: fcmRes.status, error: text || fcmRes.statusText };
    }
    return { ok: true, status: 200, body: text };
  } catch (e) {
    return {
      ok: false,
      status: 500,
      error: e.message || String(e),
    };
  }
}

module.exports = { sendFcmFromBody, getServiceAccount, getFixedTopic };
