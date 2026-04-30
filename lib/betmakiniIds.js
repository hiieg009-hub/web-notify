/**
 * BETMAKINI IDs — orodha ya ID zinazoruhusiwa kuingia (login).
 *
 * Kila ID hapa hutumika kama "password" kwa mtumiaji mmoja.
 * Kuongeza/kufuta ID, hariri orodha hii kisha redeploy.
 *
 * Note: Comparison ni case-insensitive na inapuuza spaces zilizoanzia/mwisho.
 */

const RAW_BETMAKINI_IDS = [
  'BMK-MS74QV',
  'BMK-YNNQ18',
  'BMK-K3K33C',
  'BMK-F54XVU',
];

// Normalize once at load time: trim + uppercase, na ondoa duplicates.
const NORMALIZED_IDS = Array.from(
  new Set(
    RAW_BETMAKINI_IDS
      .map((s) => String(s || '').trim().toUpperCase())
      .filter(Boolean),
  ),
);

function getBetmakiniIds() {
  return NORMALIZED_IDS.slice();
}

function hasAnyBetmakiniId() {
  return NORMALIZED_IDS.length > 0;
}

function isValidBetmakiniId(value) {
  if (!value) return false;
  const v = String(value).trim().toUpperCase();
  if (!v) return false;
  return NORMALIZED_IDS.includes(v);
}

module.exports = {
  getBetmakiniIds,
  hasAnyBetmakiniId,
  isValidBetmakiniId,
};
