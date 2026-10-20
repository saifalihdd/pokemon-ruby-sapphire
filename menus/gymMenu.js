import { askConfirm } from "../utils/input.js";
import { showMenu, printResult } from "./menuHelper.js";
import { listGyms, startGymBattle } from "../services/gymService.js";
import { runBattle } from "./battleMenu.js";
import { typeTag } from "../ui/colors.js";
import { box } from "../ui/boxes.js";
import { findSpecies } from "../data/pokedex.js";

const statusIcon = ({ beaten, unlocked }) => (beaten ? "●" : unlocked ? "○" : "✖");

export const gymMenu = async (trainer) => {
  while (true) {
    const entries = listGyms(trainer);
    const options = entries.map((entry) => {
      const { gym } = entry;
      const note = entry.beaten ? "(selesai - bisa tantang ulang)" : entry.unlocked ? "(siap ditantang)" : "(terkunci)";
      return `${statusIcon(entry)} ${gym.order}. ${gym.city.padEnd(16)} ${gym.leader.padEnd(12)} ${typeTag(gym.type, 10)} ${note}`;
    });
    const choice = await showMenu(`GYM HOENN  (Badge: ${trainer.badges.length}/8)`, options);
    if (choice === 0) return;

    const entry = entries[choice - 1];
    if (!entry.unlocked) {
      console.log("✖ Gym ini masih terkunci. Kalahkan gym sebelumnya terlebih dahulu!");
      continue;
    }
    const { gym } = entry;
    console.log(box([`Leader : ${gym.leader}`, `Tipe   : ${gym.type}`, `Badge  : ${gym.badge}`,
      `Tim    : ${gym.team.map((member) => `${findSpecies(member.speciesId).name} Lv${member.level}`).join(", ")}`], { title: gym.city, minWidth: 50 }));
    const question = entry.beaten ? "Tantang ulang? (uang separuh, tanpa badge/item)" : "Tantang gym ini?";
    if (!(await askConfirm(question))) continue;

    const started = startGymBattle(trainer, gym.order);
    if (!started.ok) {
      printResult(started);
      continue;
    }
    const outcome = await runBattle(trainer, started.battle);
    if (outcome === "lose") return; // whiteout: kembali ke menu utama
  }
};
