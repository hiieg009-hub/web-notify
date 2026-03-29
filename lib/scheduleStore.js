const fs = require('fs').promises;
const path = require('path');
const { getScheduleDbPath } = require('./config');

let chain = Promise.resolve();

async function readDbRaw() {
  const filePath = getScheduleDbPath();
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data.items)) data.items = [];
    return data;
  } catch (e) {
    if (e.code === 'ENOENT') return { items: [] };
    throw e;
  }
}

async function writeDbRaw(data) {
  const filePath = getScheduleDbPath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tmp = filePath + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tmp, filePath);
}

function withLock(fn) {
  const run = chain.then(fn, fn);
  chain = run.catch(() => {}).then(() => {});
  return run;
}

async function read() {
  return withLock(readDbRaw);
}

async function write(data) {
  return withLock(() => writeDbRaw(data));
}

async function readModifyWrite(updater) {
  return withLock(async () => {
    const data = await readDbRaw();
    await updater(data);
    await writeDbRaw(data);
    return data;
  });
}

module.exports = { read, write, readModifyWrite };
