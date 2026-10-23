import { hasSave, loadGame, deleteSave } from "./utils/storage.js";
import { closeInput, askConfirm } from "./utils/input.js";
import { showMenu } from "./menus/menuHelper.js";
import { runNewGame } from "./menus/introMenu.js";
import { mainMenu } from "./menus/mainMenu.js";
import { box } from "./ui/boxes.js";
import { bold } from "./ui/colors.js";
import { audio } from "./ui/audio.js";

const printBanner = () => {
  console.log(box(["", `   ${bold("P O K E M O N   R U B Y  &  S A P P H I R E")}`, "   Versi CLI - Mini Project TSC Backend Basic", ""], { minWidth: 44 }));
};

const start = async () => {
  printBanner();
  audio.playMusic("title");
  let trainer = null;

  if (hasSave()) {
    const choice = await showMenu("Data tersimpan ditemukan", ["Lanjutkan petualangan", "Game baru (menimpa save lama)"], "Keluar");
    if (choice === 0) {
      closeInput();
      return;
    }
    if (choice === 1) {
      trainer = loadGame();
      if (!trainer) console.log("✖ File save rusak, memulai game baru.");
    } else if (!(await askConfirm("Save lama akan terhapus. Lanjut?"))) {
      closeInput();
      return;
    } else {
      deleteSave();
    }
  }

  if (!trainer) trainer = await runNewGame();
  await mainMenu(trainer);
  audio.stopAll();
  closeInput();
};

start();
