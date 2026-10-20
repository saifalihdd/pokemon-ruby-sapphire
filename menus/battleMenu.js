import { ask, askConfirm } from "../utils/input.js";
import { findSpecies } from "../data/pokedex.js";
import { findMove, getMoveCategory } from "../data/moves.js";
import { findItem } from "../data/items.js";
import { showMenu, printResult, pickPokemon } from "./menuHelper.js";
import { handleEvolutions } from "./evolutionMenu.js";
import { resolveTurn, concludeBattle } from "../services/battleService.js";
import { getBalls } from "../services/encounterService.js";
import { renamePokemon } from "../services/trainerService.js";
import { displayName } from "../services/pokemonFactory.js";
import { describeReward } from "../services/rewardService.js";
import { saveGame } from "../utils/storage.js";
import { renderBattle } from "../ui/battleScreen.js";
import { typeTag } from "../ui/colors.js";
import { pause, playCatchAnimation } from "../ui/animations.js";

const printEvents = async (events) => {
  for (const event of events) {
    if (typeof event === "string") {
      console.log(`  ${event}`);
      await pause(0.6);
    } else if (event.type === "catch") {
      await playCatchAnimation(event.ballName, event.wildName, event.result);
    }
  }
};

const chooseMove = async (battle) => {
  const moveIds = findSpecies(battle.player.speciesId).moves;
  const options = moveIds.map((id) => {
    const move = findMove(id);
    const power = move.power === 0 ? "-" : move.power;
    return `${move.name.padEnd(14)} ${typeTag(move.type, 10)} ${getMoveCategory(move).padEnd(8)} Pow ${String(power).padEnd(3)} Acc ${move.accuracy}`;
  });
  const choice = await showMenu("Pilih move", options, "Batal");
  return choice === 0 ? null : { type: "move", moveId: moveIds[choice - 1] };
};

const chooseBall = async (trainer) => {
  const balls = getBalls(trainer);
  if (balls.length === 0) {
    console.log("✖ Kamu tidak punya Ball! Beli di Poke Mart.");
    return null;
  }
  const choice = await showMenu("Pakai Ball apa?", balls.map((ball) => `${ball.name} x${ball.qty}`), "Batal");
  return choice === 0 ? null : { type: "ball", itemId: balls[choice - 1].id };
};

const chooseItem = async (trainer) => {
  const usable = trainer.inventory.map((entry) => ({ ...findItem(entry.itemId), qty: entry.qty })).filter((item) => ["heal", "revive"].includes(item.kind));
  if (usable.length === 0) {
    console.log("✖ Tidak ada item pemulih di tas.");
    return null;
  }
  const choice = await showMenu("Pakai item apa?", usable.map((item) => `${item.name} x${item.qty}  ${item.description}`), "Batal");
  if (choice === 0) return null;
  const pokemon = await pickPokemon(trainer.party, `Pakai ${usable[choice - 1].name} pada siapa`);
  return pokemon ? { type: "item", itemId: usable[choice - 1].id, uid: pokemon.uid } : null;
};

const chooseSwitch = async (trainer, battle, forced) => {
  while (true) {
    const pokemon = await pickPokemon(trainer.party, forced ? "Kirim Pokemon mana" : "Ganti dengan siapa");
    if (pokemon) return { type: "switch", uid: pokemon.uid };
    if (!forced) return null;
    console.log("Kamu harus memilih Pokemon pengganti!");
  }
};

const chooseAction = async (trainer, battle) => {
  const options = ["Serang", "Ball", "Item", "Ganti Pokemon", "Kabur"];
  const choice = await showMenu(`Apa yang akan dilakukan ${displayName(battle.player)}?`, options, "Tampilkan ulang layar");
  switch (choice) {
    case 1: return chooseMove(battle);
    case 2: return chooseBall(trainer);
    case 3: return chooseItem(trainer);
    case 4: return chooseSwitch(trainer, battle, false);
    case 5: return { type: "run" };
    default: return null;
  }
};

const offerNickname = async (trainer, pokemon) => {
  if (!(await askConfirm(`Beri nickname untuk ${displayName(pokemon)}?`))) return;
  while (true) {
    const result = renamePokemon(trainer, pokemon.uid, await ask("Nickname: "));
    printResult(result);
    if (result.ok) return;
  }
};

// Menjalankan satu battle sampai selesai. Mengembalikan hasil akhir ("win" | "lose" | "caught" | "ran").
export const runBattle = async (trainer, battle) => {
  if (battle.kind === "wild") {
    console.log(`\nSeekor ${findSpecies(battle.foe.speciesId).name} liar muncul!`);
  } else {
    console.log(`\n${battle.gym.leader}: "${battle.gym.quote}"`);
    console.log(`${battle.foeName} mengirim ${findSpecies(battle.foe.speciesId).name}!`);
  }
  await pause();
  console.log(`Ayo, ${displayName(battle.player)}!`);

  while (!battle.over) {
    renderBattle(battle);
    const action = battle.needSwitch ? await chooseSwitch(trainer, battle, true) : await chooseAction(trainer, battle);
    if (!action) continue;
    const { ok, events } = resolveTurn(battle, trainer, action);
    if (!ok) {
      console.log(`✖ ${events[0]}`);
      continue;
    }
    await printEvents(events);
  }

  const summary = concludeBattle(battle, trainer);
  saveGame(trainer); // autosave tepat setelah battle: hadiah/badge/whiteout langsung aman
  switch (summary.outcome) {
    case "win":
      console.log(battle.kind === "wild" ? "\n★ Kamu menang! ★" : `\n★ Kamu mengalahkan ${battle.foeName}! ★`);
      console.log(`Hadiah: ${describeReward(summary.reward)}`);
      if (summary.newBadge) console.log(`★ Kamu mendapat ${summary.newBadge}! ★`);
      break;
    case "lose":
      console.log("\nSemua Pokemon-mu pingsan... Matamu menjadi gelap!");
      console.log(`Kamu kehilangan ₽${summary.lost} dan dibawa ke Pokemon Center. Timmu sudah pulih.`);
      break;
    case "caught":
      console.log(`${displayName(battle.caught.pokemon)} ${battle.caught.destination === "party" ? "bergabung ke timmu!" : "dikirim ke PC (tim penuh)."}`);
      await offerNickname(trainer, battle.caught.pokemon);
      break;
    default:
      break;
  }
  if (summary.outcome !== "lose") await handleEvolutions(trainer, battle.pendingEvolutions);
  saveGame(trainer);
  return summary.outcome;
};
