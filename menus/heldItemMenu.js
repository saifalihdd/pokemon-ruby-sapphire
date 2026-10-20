import { askConfirm } from "../utils/input.js";
import { findItem } from "../data/items.js";
import { showMenu, printResult, pickPokemon } from "./menuHelper.js";
import { equipItem, unequipItem } from "../services/heldItemService.js";
import { displayName } from "../services/pokemonFactory.js";

// Pasang / lepas item pegangan (Exp. Share) pada Pokemon di tim.
export const heldItemMenu = async (trainer) => {
  const pokemon = await pickPokemon(trainer.party, "Pilih Pokemon di tim");
  if (!pokemon) return;

  if (pokemon.heldItem) {
    const { name } = findItem(pokemon.heldItem);
    if (await askConfirm(`${displayName(pokemon)} memegang ${name}. Lepas?`)) printResult(unequipItem(trainer, pokemon.uid));
    return;
  }
  const helds = trainer.inventory.map((entry) => ({ ...findItem(entry.itemId), qty: entry.qty })).filter((item) => item.kind === "held");
  if (helds.length === 0) {
    console.log("✖ Tidak ada item pegangan di tas.");
    return;
  }
  const choice = await showMenu(`Pasang ke ${displayName(pokemon)}`, helds.map((item) => `${item.name} x${item.qty}  ${item.description}`), "Batal");
  if (choice !== 0) printResult(equipItem(trainer, helds[choice - 1].id, pokemon.uid));
};
