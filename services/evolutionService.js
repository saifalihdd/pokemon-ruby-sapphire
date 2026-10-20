import { evolutions } from "../data/evolutions.js";
import { findSpecies } from "../data/pokedex.js";
import { locatePokemon, updatePokemon } from "./trainerService.js";
import { displayName, withSpecies } from "./pokemonFactory.js";

const ok = (message, extra = {}) => ({ ok: true, message, ...extra });
const fail = (message) => ({ ok: false, message });

// Mengembalikan spesies tujuan jika Pokemon sudah memenuhi level evolusi, selain itu null.
export const getEvolutionTarget = (pokemon) => {
  const evolution = evolutions[pokemon.speciesId];
  return evolution && pokemon.level >= evolution.level ? findSpecies(evolution.to) : null;
};

export const evolvePokemon = (trainer, uid) => {
  const found = locatePokemon(trainer, uid);
  if (!found) return fail("Pokemon tidak ditemukan.");
  const target = getEvolutionTarget(found.pokemon);
  if (!target) return fail(`${displayName(found.pokemon)} belum bisa berevolusi.`);

  const from = findSpecies(found.pokemon.speciesId);
  updatePokemon(trainer, uid, (p) => withSpecies(p, target.id));
  trainer.pokedexSeen = trainer.pokedexSeen.includes(target.id) ? trainer.pokedexSeen : [...trainer.pokedexSeen, target.id];
  trainer.pokedexCaught = trainer.pokedexCaught.includes(target.id) ? trainer.pokedexCaught : [...trainer.pokedexCaught, target.id];
  return ok(`${from.name} berevolusi menjadi ${target.name}!`, { from, to: target });
};
