import { findItem } from "../data/items.js";
import { locatePokemon, updatePokemon, returnHeldItem } from "./trainerService.js";
import { getQty, removeItem } from "./inventoryService.js";
import { displayName } from "./pokemonFactory.js";

const ok = (message) => ({ ok: true, message });
const fail = (message) => ({ ok: false, message });

// Pasang item pegangan (mis. Exp. Share) ke Pokemon di tim. Satu Pokemon = satu item.
export const equipItem = (trainer, itemId, uid) => {
  const item = findItem(itemId);
  const found = locatePokemon(trainer, uid);
  if (!item || item.kind !== "held") return fail("Item itu bukan item pegangan.");
  if (!found) return fail("Pokemon tidak ditemukan.");
  if (found.where !== "party") return fail("Item hanya bisa dipasang ke Pokemon yang ada di tim.");
  if (found.pokemon.heldItem) return fail(`${displayName(found.pokemon)} sudah memegang ${findItem(found.pokemon.heldItem).name}. Lepas dulu.`);
  if (getQty(trainer, itemId) < 1) return fail(`Kamu tidak punya ${item.name} di tas.`);

  removeItem(trainer, itemId, 1);
  updatePokemon(trainer, uid, (pokemon) => ({ ...pokemon, heldItem: itemId }));
  return ok(`${item.name} dipasang ke ${displayName(found.pokemon)}.`);
};

// Lepas item pegangan: item kembali ke tas.
export const unequipItem = (trainer, uid) => {
  const found = locatePokemon(trainer, uid);
  if (!found) return fail("Pokemon tidak ditemukan.");
  if (!found.pokemon.heldItem) return fail(`${displayName(found.pokemon)} tidak memegang item apa pun.`);

  const { name } = findItem(found.pokemon.heldItem);
  returnHeldItem(trainer, found.pokemon);
  updatePokemon(trainer, uid, (pokemon) => ({ ...pokemon, heldItem: null }));
  return ok(`${name} dilepas dari ${displayName(found.pokemon)} dan kembali ke tas.`);
};
