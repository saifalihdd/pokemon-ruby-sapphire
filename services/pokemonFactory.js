import { findSpecies } from "../data/pokedex.js";
import { CONFIG } from "../data/config.js";

// Rumus stat Gen 3 (tanpa IV/EV/nature agar sederhana).
export const calcStat = (base, level) => Math.floor((2 * base * level) / 100) + 5;
export const calcMaxHp = (base, level) => Math.floor((2 * base * level) / 100) + level + 10;

export const calcStats = (species, level) => {
  const { atk, def, spAtk, spDef, speed } = species.baseStats;
  return {
    atk: calcStat(atk, level),
    def: calcStat(def, level),
    spAtk: calcStat(spAtk, level),
    spDef: calcStat(spDef, level),
    speed: calcStat(speed, level),
  };
};

// Kurva EXP "Medium Fast": total EXP untuk mencapai sebuah level = level^3.
export const expForLevel = (level) => level ** 3;
export const getExp = (pokemon) => pokemon.exp ?? expForLevel(pokemon.level); // save lama belum punya exp

// Pokemon baru (uid diisi saat dimiliki trainer).
export const createPokemon = (speciesId, level, nickname = null) => {
  const species = findSpecies(speciesId);
  if (!species) throw new Error(`Spesies ${speciesId} tidak ditemukan`);
  const maxHp = calcMaxHp(species.baseStats.hp, level);
  return { uid: null, speciesId, nickname, level, exp: expForLevel(level), hp: maxHp, maxHp, stats: calcStats(species, level) };
};

export const displayName = (pokemon) => pokemon.nickname ?? findSpecies(pokemon.speciesId).name;

export const isFainted = (pokemon) => pokemon.hp <= 0;

// Naik level tanpa mutasi: mengembalikan objek baru, HP bertambah sebesar selisih maxHp.
export const withLevel = (pokemon, newLevel) => {
  const species = findSpecies(pokemon.speciesId);
  const level = Math.min(newLevel, CONFIG.maxLevel);
  const maxHp = calcMaxHp(species.baseStats.hp, level);
  const gained = maxHp - pokemon.maxHp;
  return {
    ...pokemon,
    level,
    exp: Math.max(getExp(pokemon), expForLevel(level)),
    maxHp,
    hp: pokemon.hp > 0 ? pokemon.hp + gained : 0,
    stats: calcStats(species, level),
  };
};

// Ganti spesies (evolusi) tanpa mutasi: stat dihitung ulang, HP bertambah sebesar selisih maxHp.
export const withSpecies = (pokemon, newSpeciesId) => {
  const species = findSpecies(newSpeciesId);
  const maxHp = calcMaxHp(species.baseStats.hp, pokemon.level);
  const gained = maxHp - pokemon.maxHp;
  return {
    ...pokemon,
    speciesId: newSpeciesId,
    maxHp,
    hp: pokemon.hp > 0 ? Math.min(maxHp, pokemon.hp + gained) : 0,
    stats: calcStats(species, pokemon.level),
  };
};
