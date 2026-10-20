import { findArea } from "../data/areas.js";
import { findSpecies } from "../data/pokedex.js";
import { findItem } from "../data/items.js";
import { createPokemon } from "./pokemonFactory.js";
import { randInt, weightedPick } from "../utils/random.js";

// Memunculkan Pokemon liar acak berdasarkan area (bobot spesies + level acak).
export const rollWildPokemon = (areaId) => {
  const area = findArea(areaId);
  if (!area) throw new Error(`Area ${areaId} tidak ditemukan`);
  const entry = weightedPick(area.encounters);
  return createPokemon(entry.speciesId, randInt(entry.minLevel, entry.maxLevel));
};

export const getBalls = (trainer) =>
  trainer.inventory
    .filter((entry) => findItem(entry.itemId)?.kind === "ball")
    .map((entry) => ({ ...findItem(entry.itemId), qty: entry.qty }));

// Rumus tangkap Gen 3: nilai "a" (0-255). Makin rendah HP & makin tinggi catchRate, makin mudah.
export const calcCatchValue = (wild, ball) => {
  const { catchRate } = findSpecies(wild.speciesId);
  const a = ((3 * wild.maxHp - 2 * wild.hp) * catchRate * ball.ballBonus) / (3 * wild.maxHp);
  return Math.min(255, a);
};

// Hasil: { caught, shakes } — shakes = berapa kali bola bergoyang (0-3).
export const attemptCatch = (wild, ball) => {
  const a = calcCatchValue(wild, ball);
  if (a >= 255) return { caught: true, shakes: 3 };
  const b = Math.floor(1048560 / Math.sqrt(Math.sqrt(16711680 / a)));
  for (let shake = 0; shake < 4; shake++) {
    if (randInt(0, 65535) >= b) return { caught: false, shakes: shake };
  }
  return { caught: true, shakes: 3 };
};
