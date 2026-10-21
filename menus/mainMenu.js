import { showMenu } from "./menuHelper.js";
import { centerMenu } from "./centerMenu.js";
import { exploreMenu } from "./exploreMenu.js";
import { bagMenu } from "./bagMenu.js";
import { gymMenu } from "./gymMenu.js";
import { legendaryMenu } from "./legendaryMenu.js";
import { showTrainerCard, showPokedex } from "./infoMenu.js";
import { saveGame } from "../utils/storage.js";

export const mainMenu = async (trainer) => {
  while (true) {
    const choice = await showMenu(
      `MENU UTAMA - ${trainer.name}`,
      ["Jelajah (cari Pokemon liar)", "Tantang Gym", "Lokasi Legendary (butuh 8 badge)", "Pokemon Center", "Trainer Card", "Tas", "Pokedex", "Simpan game"],
      "Simpan & Keluar",
    );
    switch (choice) {
      case 1:
        await exploreMenu(trainer);
        break;
      case 2:
        await gymMenu(trainer);
        break;
      case 3:
        await legendaryMenu(trainer);
        break;
      case 4:
        await centerMenu(trainer);
        break;
      case 5:
        showTrainerCard(trainer);
        break;
      case 6:
        await bagMenu(trainer);
        break;
      case 7:
        showPokedex(trainer);
        break;
      case 8:
        saveGame(trainer);
        console.log("✔ Game tersimpan.");
        break;
      default:
        saveGame(trainer);
        console.log("✔ Game tersimpan. Sampai jumpa, Trainer!");
        return;
    }
    saveGame(trainer); // autosave setelah setiap aksi, supaya progres aman jika terminal ditutup
  }
};
