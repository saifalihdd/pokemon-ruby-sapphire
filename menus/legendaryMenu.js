import { askConfirm } from "../utils/input.js";
import { CONFIG } from "../data/config.js";
import { findSpecies } from "../data/pokedex.js";
import { showMenu, printResult } from "./menuHelper.js";
import { listLegendaries, startLegendaryBattle, isLegendaryAreaUnlocked } from "../services/legendaryService.js";
import { runBattle } from "./battleMenu.js";
import { typeTag } from "../ui/colors.js";

const STATUS_LABEL = { available: "(siap ditemui)", caught: "(TERTANGKAP ★)", defeated: "(menghilang selamanya)" };

export const legendaryMenu = async (trainer) => {
  if (!isLegendaryAreaUnlocked(trainer)) {
    console.log(`✖ Lokasi Legendary terkunci. Kumpulkan ${CONFIG.legendaryMinBadges} badge dulu (kamu punya ${trainer.badges.length}).`);
    return;
  }
  while (true) {
    const entries = listLegendaries(trainer);
    const options = entries.map(({ legendary, status }) => {
      const species = findSpecies(legendary.speciesId);
      return `${species.name.padEnd(10)} Lv${String(legendary.level).padEnd(3)} ${species.type.map((type) => typeTag(type)).join("")}  ${legendary.place}  ${STATUS_LABEL[status]}`;
    });
    const choice = await showMenu("LOKASI LEGENDARY", options);
    if (choice === 0) return;

    const { legendary, status } = entries[choice - 1];
    if (status !== "available") {
      console.log(`✖ ${status === "caught" ? "Kamu sudah menangkap legendary ini." : "Legendary ini sudah menghilang selamanya."}`);
      continue;
    }
    if (CONFIG.legendaryPermanent) console.log("⚠ Jika legendary ini pingsan sebelum tertangkap, ia akan HILANG SELAMANYA. Gunakan Ball!");
    if (!(await askConfirm(`Hadapi ${findSpecies(legendary.speciesId).name} di ${legendary.place}?`))) continue;

    const started = startLegendaryBattle(trainer, legendary.id);
    if (!started.ok) {
      printResult(started);
      continue;
    }
    const outcome = await runBattle(trainer, started.battle);
    if (outcome === "lose") return; // whiteout: kembali ke menu utama
  }
};
