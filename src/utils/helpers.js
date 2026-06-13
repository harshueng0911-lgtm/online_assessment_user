export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

// ── Seeded shuffle ───────────────────────────────────────────────────────────
// Deterministically shuffles an array based on a string seed, so the same
// user always sees the same order for the same assessment (stable across
// reloads / resumes), but different users get different orders.

// Simple 32-bit string hash (djb2 variant) used to derive a numeric seed.
function hashStringToSeed(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0; // force unsigned 32-bit
}

// Mulberry32 PRNG — small, fast, deterministic given a numeric seed.
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Returns a new array with items shuffled using a Fisher-Yates shuffle
 * driven by a deterministic PRNG seeded from `seed`.
 *
 * @param {Array} array - items to shuffle (not mutated)
 * @param {string} seed - any string, e.g. `${userId}:${assessmentId}`
 */
export function seededShuffle(array, seed) {
  const result = [...array];
  const rand = mulberry32(hashStringToSeed(String(seed)));

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

export function formatDuration(min) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
