const fs = require('fs');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');

const FCM_SCOPE = 'https://www.googleapis.com/auth/cloud-platform';

function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (raw && String(raw).trim()) {
    try {
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON si JSON halali.');
    }
  }
  const filePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (filePath) {
    const resolved = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath);
    if (fs.existsSync(resolved)) {
      return JSON.parse(fs.readFileSync(resolved, 'utf8'));
    }
  }
  throw new Error(
    'Weka FIREBASE_SERVICE_ACCOUNT_JSON au GOOGLE_APPLICATION_CREDENTIALS (ona .env.example).'
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
