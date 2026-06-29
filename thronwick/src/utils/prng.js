/**
 * Seeded PRNG (mulberry32) for deterministic world layout.
 */
export function createPRNG(seed) {
  let s = seed | 0;
  return function next() {
    s |= 0;
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 15), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randItem(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

export function randFloat(min, max, rng) {
  return min + rng() * (max - min);
}