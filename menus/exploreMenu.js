import { areas } from "../data/areas.js";
import { findSpecies } from "../data/pokedex.js";
import { showMenu } from "./menuHelper.js";
import { rollWildPokemon } from "../services/encounterService.js";
import { registerSeen, hasUsablePokemon } from "../services/trainerService.js";
import { createBattle } from "../services/battleService.js";
import { runBattle } from "./battleMenu.js";
import { pause } from "../ui/animations.js";

export const exploreMenu = async (trainer) => {
  if (!hasUsablePokemon(trainer)) {
    console.log("✖ Semua Pokemon-mu pingsan! Pergi ke Pokemon Center dulu (Nurse Joy).");
    return;
  }
  const unlocked = areas.filter((area) => trainer.badges.length >= area.minBadges);
  const locked = areas.filter((area) => trainer.badges.length < area.minBadges);
  if (locked.length > 0) console.log(`\n(Area terkunci: ${locked.map((a) => `${a.name} [${a.minBadges} badge]`).join(", ")})`);

  const choice = await showMenu("PILIH AREA JELAJAH", unlocked.map((area) => `${area.name}  (Lv ${Math.min(...area.encounters.map((e) => e.minLevel))}-${Math.max(...area.encounters.map((e) => e.maxLevel))})`));
  if (choice === 0) return;
  const area = unlocked[choice - 1];

  while (true) {
    console.log(`\nKamu berjalan di rumput tinggi ${area.name}...`);
    await pause();
    const wild = rollWildPokemon(area.id);
    registerSeen(trainer, wild.speciesId);
    const action = await showMenu(`Pokemon liar terlihat di rumput: ${findSpecies(wild.speciesId).name} (Lv${wild.level})`, ["Lawan"], "Kabur");
    if (action === 1) {
      const outcome = await runBattle(trainer, createBattle(trainer, [wild], { kind: "wild" }));
      if (outcome === "lose") return; // whiteout: kembali ke menu utama
    } else {
      console.log(`Kamu kabur dari ${findSpecies(wild.speciesId).name}.`);
    }
    if (!hasUsablePokemon(trainer)) {
      console.log("✖ Semua Pokemon-mu pingsan! Pergi ke Pokemon Center dulu.");
      return;
    }
    const again = await showMenu(area.name, ["Cari Pokemon lagi"], "Pergi dari area ini");
    if (again === 0) return;
  }
};
