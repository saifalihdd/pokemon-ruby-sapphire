import { CONFIG } from "../data/config.js";
import { locatePokemon, updatePokemon } from "./trainerService.js";
import { expForLevel, getExp, withLevel } from "./pokemonFactory.js";

// Menambah EXP; naik level berulang jika EXP cukup. Mengembalikan jumlah level yang naik.
export const grantExp = (trainer, uid, amount) => {
  const found = locatePokemon(trainer, uid);
  if (!found) return { levelsGained: 0, pokemon: null };
  let pokemon = { ...found.pokemon, exp: getExp(found.pokemon) + amount };
  const startLevel = pokemon.level;
  while (pokemon.level < CONFIG.maxLevel && pokemon.exp >= expForLevel(pokemon.level + 1)) {
    pokemon = withLevel(pokemon, pokemon.level + 1);
  }
  updatePokemon(trainer, uid, () => pokemon);
  return { levelsGained: pokemon.level - startLevel, pokemon };
};

// EXP yang diperoleh dari mengalahkan lawan: dari total base stat, level lawan, dan jenis battle.
export const calcExpYield = (defeated, speciesBaseStats, isTrainer) => {
  const baseYield = Math.floor(Object.values(speciesBaseStats).reduce((sum, value) => sum + value, 0) / 4);
  return Math.floor((baseYield * defeated.level * (isTrainer ? 1.5 : 1) * CONFIG.expMultiplier) / 7);
};
