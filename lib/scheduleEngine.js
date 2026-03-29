const { DateTime } = require('luxon');
const { sendFcmFromBody } = require('./fcmSend');
const { getScheduleTz } = require('./config');
const store = require('./scheduleStore');

function isDueOnce(item) {
  if (item.lastSentAt) return false;
  const runAt = DateTime.fromISO(item.runAt);
  if (!runAt.isValid) return false;
  return DateTime.now().toMillis() >= runAt.toMillis();
}

function isDueDaily(item, nowInTz) {
  const target = (item.hour ?? 0) * 60 + (item.minute ?? 0);
  const cur = nowInTz.hour * 60 + nowInTz.minute;
  if (cur < target) return false;
  if (item.lastSentAt) {
    const last = DateTime.fromISO(item.lastSentAt).setZone(nowInTz.zoneName);
    if (last.isValid && last.hasSame(nowInTz, 'day')) return false;
  }
  return true;
}

/**
 * @returns {Promise<{ sent: number, errors: Array<{ id: string, error: string }> }>}
 */
async function processDueSchedules() {
  const tz = getScheduleTz();
  const nowZoned = DateTime.now().setZone(tz);

  const errors = [];
  let sent = 0;

  await store.readModifyWrite(async (data) => {
    for (const item of data.items) {
      if (!item.enabled) continue;

      const dataPayload = {
        title: item.title || '',
        body: item.body || '',
        image: item.image || '',
      };
      const hasContent =
        dataPayload.title.trim() ||
        dataPayload.body.trim() ||
        dataPayload.image.trim();
      if (!hasContent) continue;

      let due = false;
      if (item.mode === 'once') due = isDueOnce(item);
      else if (item.mode === 'daily') due = isDueDaily(item, nowZoned);
      else continue;

      if (!due) continue;

      const r = await sendFcmFromBody(dataPayload);
      if (!r.ok) {
        errors.push({ id: item.id, error: r.error || String(r.status) });
        continue;
      }

      item.lastSentAt = new Date().toISOString();
      if (item.mode === 'once') item.enabled = false;
      sent += 1;
    }
  });

  return { sent, errors };
}

module.exports = { processDueSchedules };
