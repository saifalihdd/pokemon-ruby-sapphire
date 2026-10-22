import { pokedex } from "../data/pokedex.js";
import { typeTag, bold, dim } from "../ui/colors.js";
import { box } from "../ui/boxes.js";
import { formatMoney } from "../ui/display.js";
import { CONFIG } from "../data/config.js";
import { isEquipped } from "../services/equipmentService.js";
import { countCaughtLegendaries } from "../services/legendaryService.js";
import { getRewardProgress, claimPokedexRewards } from "../services/pokedexRewardService.js";
import { findItem } from "../data/items.js";
import { legendaries } from "../data/legendaries.js";

export const showTrainerCard = (trainer) => {
  const badgeSlots = Array.from({ length: 8 }, (_, i) => (i < trainer.badges.length ? "●" : "○")).join(" ");
  const total = trainer.party.length + trainer.pc.length;
  // Nama badge dipecah per 3 agar kotak tidak melebar saat badge sudah banyak.
  const badgeNameLines = Array.from({ length: Math.ceil(trainer.badges.length / 3) }, (_, i) => `           ${trainer.badges.slice(i * 3, i * 3 + 3).join(", ")}`);
  console.log(
    box(
      [
        `Trainer  : ${bold(trainer.name)}`,
        `Uang     : ${formatMoney(trainer.money)}`,
        `Badge    : ${badgeSlots}  (${trainer.badges.length}/8)`,
        ...badgeNameLines,
        `Pokedex  : dilihat ${trainer.pokedexSeen.length}, ditangkap ${trainer.pokedexCaught.length} / ${pokedex.length}`,
        `Pokemon  : tim ${trainer.party.length}/${CONFIG.partyMax}, PC ${trainer.pc.length} (total ${total})`,
        `Exp Share: ${isEquipped(trainer, "expShare") ? "AKTIF (seluruh tim dapat EXP)" : "nonaktif"}`,
        `Legendary: ${countCaughtLegendaries(trainer)}/${legendaries.length} tertangkap`,
      ],
      { title: "TRAINER CARD", minWidth: 44 },
    ),
  );
};

export const showPokedex = (trainer) => {
  const { pokedexSeen, pokedexCaught } = trainer;
  const lines = [...pokedex]
    .sort((a, b) => a.id - b.id)
    .map((species) => {
      const id = `#${String(species.id).padStart(3, "0")}`;
      if (pokedexCaught.includes(species.id)) return `● ${id} ${species.name.padEnd(10)} ${species.type.map(typeTag).join("")}`;
      if (pokedexSeen.includes(species.id)) return `◐ ${id} ${species.name.padEnd(10)} ${dim("(dilihat)")}`;
      return `○ ${id} ??????`;
    });
  console.log(box(lines, { title: `POKEDEX  ● tangkap ◐ lihat ○ belum`, minWidth: 40 }));
  const rewardLines = getRewardProgress(trainer).map(
    (reward) => `${reward.claimed ? "✔" : "○"} ${String(reward.caught).padStart(2)} spesies → ${findItem(reward.itemId).name} x${reward.qty}${reward.claimed ? "" : `  (kurang ${Math.max(0, reward.caught - pokedexCaught.length)})`}`,
  );
  console.log(box(rewardLines, { title: `HADIAH POKEDEX  (tertangkap ${pokedexCaught.length})`, minWidth: 40 }));
};

// Memberi hadiah Pokedex yang baru tercapai dan mengumumkannya.
export const announcePokedexRewards = (trainer) => {
  claimPokedexRewards(trainer).forEach((reward) => {
    console.log(`\n★ Hadiah Pokedex (${reward.caught} spesies tertangkap): ${findItem(reward.itemId).name} x${reward.qty}! ★`);
  });
};
