import { findItem } from "../data/items.js";
import { showMenu, printResult, pickPokemon } from "./menuHelper.js";
import { useItemOnPokemon } from "../services/inventoryService.js";
import { getAllPokemon } from "../services/trainerService.js";
import { handleEvolutions } from "./evolutionMenu.js";
import { toggleEquip, isEquipped } from "../services/equipmentService.js";

export const bagMenu = async (trainer) => {
  while (true) {
    const entries = trainer.inventory.map(({ itemId, qty }) => ({ ...findItem(itemId), qty }));
    if (entries.length === 0) {
      console.log("\nTasmu kosong.");
      return;
    }
    const choice = await showMenu(
      "TAS (pilih item untuk dipakai)",
      entries.map((item) => `${item.name.padEnd(14)} x${String(item.qty).padEnd(3)} ${isEquipped(trainer, item.id) ? "[AKTIF] " : ""}${item.description}`),
    );
    if (choice === 0) return;

    const item = entries[choice - 1];
    if (item.kind === "ball") {
      console.log(`✖ ${item.name} hanya bisa dipakai saat encounter Pokemon liar.`);
      continue;
    }
    if (item.kind === "equip") {
      printResult(toggleEquip(trainer, item.id)); // pilih lagi untuk melepas
      continue;
    }
    const pokemon = await pickPokemon(getAllPokemon(trainer), `Pakai ${item.name} pada siapa`);
    if (!pokemon) continue;
    const result = useItemOnPokemon(trainer, item.id, pokemon.uid);
    printResult(result);
    if (result.ok && item.kind === "candy") await handleEvolutions(trainer, [pokemon.uid]);
  }
};
