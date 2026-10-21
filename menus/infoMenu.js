import { pokedex } from "../data/pokedex.js";
import { typeTag, bold, dim } from "../ui/colors.js";
import { box } from "../ui/boxes.js";
import { formatMoney } from "../ui/display.js";
import { CONFIG } from "../data/config.js";
import { isEquipped } from "../services/equipmentService.js";

export const showTrainerCard = (trainer) => {
  const badgeSlots = Array.from({ length: 8 }, (_, i) => (i < trainer.badges.length ? "●" : "○")).join(" ");
  const total = trainer.party.length + trainer.pc.length;
  console.log(
    box(
      [
        `Trainer  : ${bold(trainer.name)}`,
        `Uang     : ${formatMoney(trainer.money)}`,
        `Badge    : ${badgeSlots}  (${trainer.badges.length}/8)`,
        ...(trainer.badges.length ? [`           ${trainer.badges.join(", ")}`] : []),
        `Pokedex  : dilihat ${trainer.pokedexSeen.length}, ditangkap ${trainer.pokedexCaught.length} / ${pokedex.length}`,
        `Pokemon  : tim ${trainer.party.length}/${CONFIG.partyMax}, PC ${trainer.pc.length} (total ${total})`,
        `Exp Share: ${isEquipped(trainer, "expShare") ? "AKTIF (seluruh tim dapat EXP)" : "nonaktif"}`,
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
};
