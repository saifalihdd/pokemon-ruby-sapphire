// RNG dibungkus supaya bisa diganti saat testing (setRng).
let rng = Math.random;

export const setRng = (fn) => {
  rng = fn;
};

export const randInt = (min, max) => Math.floor(rng() * (max - min + 1)) + min;

export const chance = (probability) => rng() < probability;

// Memilih satu elemen berdasarkan bobot (weight).
export const weightedPick = (list) => {
  const total = list.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = rng() * total;
  for (const entry of list) {
    roll -= entry.weight;
    if (roll < 0) return entry;
  }
  return list[list.length - 1];
};
