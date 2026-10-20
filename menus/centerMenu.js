import { showMenu } from "./menuHelper.js";
import { manageMenu } from "./manageMenu.js";
import { nurseMenu } from "./nurseMenu.js";
import { shopMenu } from "./shopMenu.js";

// Pokemon Center = hub: kelola Pokemon, Nurse Joy, dan Poke Mart.
export const centerMenu = async (trainer) => {
  while (true) {
    const choice = await showMenu("POKEMON CENTER", ["Kelola Pokemon (tim & PC)", "Nurse Joy (heal / revive)", "Poke Mart (beli / jual)"]);
    switch (choice) {
      case 1:
        await manageMenu(trainer);
        break;
      case 2:
        await nurseMenu(trainer);
        break;
      case 3:
        await shopMenu(trainer);
        break;
      default:
        return;
    }
  }
};
