import { CONFIG } from "../data/config.js";
import { showMenu, printResult, pickPokemon } from "./menuHelper.js";
import { healParty, revivePokemon } from "../services/nurseService.js";
import { isFainted } from "../services/pokemonFactory.js";
import { formatMoney } from "../ui/display.js";

export const nurseMenu = async (trainer) => {
  console.log("\nNurse Joy: \"Selamat datang di Pokemon Center! Mau memulihkan Pokemonmu?\"");
  while (true) {
    const choice = await showMenu("NURSE JOY", [
      `Heal semua Pokemon di tim (${CONFIG.nurseHealCost === 0 ? "gratis" : formatMoney(CONFIG.nurseHealCost)})`,
      `Revive Pokemon pingsan (${formatMoney(CONFIG.nurseReviveCost)} per Pokemon)`,
    ]);
    switch (choice) {
      case 1:
        printResult(healParty(trainer));
        break;
      case 2: {
        const fainted = trainer.party.filter(isFainted);
        if (fainted.length === 0) {
          console.log("✖ Tidak ada Pokemon pingsan di timmu.");
          break;
        }
        console.log(`Uangmu: ${formatMoney(trainer.money)}`);
        const pokemon = await pickPokemon(fainted, "Revive siapa");
        if (pokemon) printResult(revivePokemon(trainer, pokemon.uid));
        break;
      }
      default:
        console.log("Nurse Joy: \"Kami harap bisa bertemu lagi!\"");
        return;
    }
  }
};
