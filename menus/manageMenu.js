import { ask, askNumber, askConfirm } from "../utils/input.js";
import { CONFIG } from "../data/config.js";
import { showMenu, printResult, pickPokemon } from "./menuHelper.js";
import { displayName } from "../services/pokemonFactory.js";
import { renamePokemon, swapParty, depositPokemon, withdrawPokemon, releasePokemon, getAllPokemon } from "../services/trainerService.js";
import { printPokemonDetail, formatPokemonLine } from "../ui/display.js";
import { box } from "../ui/boxes.js";
import { heldItemMenu } from "./heldItemMenu.js";

const showList = (title, list) => {
  console.log(box(list.length ? list.map((p, i) => `${i + 1}. ${formatPokemonLine(p)}`) : ["(kosong)"], { title, minWidth: 60 }));
};

export const manageMenu = async (trainer) => {
  while (true) {
    const choice = await showMenu("KELOLA POKEMON", [
      "Lihat tim",
      "Lihat PC",
      "Detail Pokemon",
      "Tukar posisi tim",
      "Deposit ke PC",
      "Withdraw dari PC",
      "Ganti nickname",
      "Release Pokemon",
      "Item pegangan (pasang / lepas Exp. Share)",
    ]);

    switch (choice) {
      case 1:
        showList(`TIM (${trainer.party.length}/${CONFIG.partyMax})`, trainer.party);
        break;
      case 2:
        showList(`PC (${trainer.pc.length})`, trainer.pc);
        break;
      case 3: {
        const pokemon = await pickPokemon(getAllPokemon(trainer), "Lihat detail siapa");
        if (pokemon) printPokemonDetail(pokemon);
        break;
      }
      case 4: {
        if (trainer.party.length < 2) {
          console.log("✖ Butuh minimal 2 Pokemon di tim untuk bertukar posisi.");
          break;
        }
        showList("TIM", trainer.party);
        const first = await askNumber("Posisi pertama: ", 1, trainer.party.length);
        const second = await askNumber("Posisi kedua  : ", 1, trainer.party.length);
        printResult(swapParty(trainer, first - 1, second - 1));
        break;
      }
      case 5: {
        const pokemon = await pickPokemon(trainer.party, "Deposit siapa");
        if (pokemon) printResult(depositPokemon(trainer, pokemon.uid));
        break;
      }
      case 6: {
        const pokemon = await pickPokemon(trainer.pc, "Withdraw siapa");
        if (pokemon) printResult(withdrawPokemon(trainer, pokemon.uid));
        break;
      }
      case 7: {
        const pokemon = await pickPokemon(getAllPokemon(trainer), "Ganti nickname siapa");
        if (pokemon) {
          const name = await ask("Nickname baru (kosongkan untuk menghapus): ");
          printResult(renamePokemon(trainer, pokemon.uid, name));
        }
        break;
      }
      case 8: {
        const pokemon = await pickPokemon(getAllPokemon(trainer), "Release siapa");
        if (pokemon && (await askConfirm(`Yakin melepas ${displayName(pokemon)}? Ini permanen`))) {
          printResult(releasePokemon(trainer, pokemon.uid));
        }
        break;
      }
      case 9:
        await heldItemMenu(trainer);
        break;
      default:
        return;
    }
  }
};
