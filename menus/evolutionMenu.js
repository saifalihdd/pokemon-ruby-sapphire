import { askConfirm } from "../utils/input.js";
import { locatePokemon } from "../services/trainerService.js";
import { getEvolutionTarget, evolvePokemon } from "../services/evolutionService.js";
import { displayName } from "../services/pokemonFactory.js";
import { findMove } from "../data/moves.js";
import { box } from "../ui/boxes.js";
import { getSpriteRows, joinBlocks } from "../ui/sprite.js";
import { bold, typeTag } from "../ui/colors.js";
import { pause } from "../ui/animations.js";
import { printResult } from "./menuHelper.js";
import { audio } from "../ui/audio.js";

// Menawarkan evolusi untuk daftar uid. Pemain boleh membatalkan (seperti menekan B di game asli).
export const handleEvolutions = async (trainer, uids) => {
  for (const uid of uids) {
    // while: setelah evolusi, bentuk baru bisa langsung memenuhi syarat evolusi berikutnya.
    while (true) {
      const pokemon = locatePokemon(trainer, uid)?.pokemon;
      const target = pokemon && getEvolutionTarget(pokemon);
      if (!target) break;

      console.log(`\nEh? ${bold(displayName(pokemon))} sedang berevolusi!`);
      if (!(await askConfirm(`Biarkan ${displayName(pokemon)} berevolusi menjadi ${target.name}?`))) {
        console.log(`${displayName(pokemon)} berhenti berevolusi.`);
        break;
      }
      audio.playJingle("evolution");
      for (let i = 0; i < 3; i++) {
        console.log("   . . .");
        await pause(0.7);
      }
      const result = evolvePokemon(trainer, uid);
      printResult(result);
      if (result.ok) {
        const { from, to } = result;
        const art = joinBlocks([getSpriteRows(from.id), ["", "", "  ───►  ", ""], getSpriteRows(to.id)], { gap: 1, align: "center" });
        if (art.length > 0) console.log(box(art, { title: "EVOLUSI!", minWidth: 44 }));
        console.log(box([`${bold(displayName(locatePokemon(trainer, uid).pokemon))}  ${to.type.map((type) => typeTag(type)).join("")}`,
          `Stat dasar baru: HP ${to.baseStats.hp}  ATK ${to.baseStats.atk}  DEF ${to.baseStats.def}`,
          `                 SpA ${to.baseStats.spAtk}  SpD ${to.baseStats.spDef}  SPD ${to.baseStats.speed}`,
          `Move baru: ${to.moves.map((id) => findMove(id).name).join(", ")}`], { title: "Pokemon baru", minWidth: 44 }));
      }
      await pause();
    }
  }
};
