// Mesin battle Gen 3 yang MURNI: tidak ada console.log / input. Semua kejadian dikembalikan
// sebagai "events" (string, atau objek untuk animasi tangkap) agar UI yang memutuskan tampilannya.
import { findSpecies } from "../data/pokedex.js";
import { findMove, getMoveCategory } from "../data/moves.js";
import { findItem } from "../data/items.js";
import { typeEffectiveness } from "../data/typeChart.js";
import { chance, randInt } from "../utils/random.js";
import { displayName } from "./pokemonFactory.js";
import { locatePokemon, updatePokemon, addPokemon, isPartyWiped } from "./trainerService.js";
import { removeItem, useItemOnPokemon, getQty } from "./inventoryService.js";
import { attemptCatch } from "./encounterService.js";
import { grantExp, calcExpYield } from "./levelingService.js";
import { getEvolutionTarget } from "./evolutionService.js";
import { rollWildReward, rollGymReward, applyReward } from "./rewardService.js";
import { applyWhiteout } from "./nurseService.js";

// ---------------------------------------------------------------- stat stage
const STAGE_KEYS = ["atk", "def", "spAtk", "spDef", "speed", "accuracy", "evasion"];

export const STAT_NAMES = { atk: "Attack", def: "Defense", spAtk: "Sp. Atk", spDef: "Sp. Def", speed: "Speed", accuracy: "Akurasi", evasion: "Evasi" };

export const newStages = () => Object.fromEntries(STAGE_KEYS.map((key) => [key, 0]));

const clampStage = (value) => Math.max(-6, Math.min(6, value));

// Stat biasa: stage +1 = x1.5, -1 = x0.67, dst. Akurasi/evasi memakai basis 3.
export const stageMultiplier = (stage) => (stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage));
export const accuracyMultiplier = (stage) => (stage >= 0 ? (3 + stage) / 3 : 3 / (3 - stage));

export const effectiveStat = (pokemon, stages, key) => Math.max(1, Math.floor(pokemon.stats[key] * stageMultiplier(stages[key])));

const other = (side) => (side === "player" ? "foe" : "player");
const fail = (message) => ({ ok: false, events: [message] });

// ---------------------------------------------------------------- damage
// Rumus Gen 3: floor(floor(floor(2L/5+2) x Power x A / D) / 50) + 2, lalu x crit x STAB x tipe x acak.
export const calcDamage = (attacker, defender, move, attackerStages, defenderStages) => {
  const physical = getMoveCategory(move) === "physical";
  const attack = effectiveStat(attacker, attackerStages, physical ? "atk" : "spAtk");
  const defense = effectiveStat(defender, defenderStages, physical ? "def" : "spDef");
  const base = Math.floor(Math.floor((Math.floor((2 * attacker.level) / 5) + 2) * move.power * attack / defense) / 50) + 2;

  const stab = findSpecies(attacker.speciesId).type.includes(move.type) ? 1.5 : 1;
  const effectiveness = typeEffectiveness(move.type, findSpecies(defender.speciesId).type);
  const crit = chance(1 / 16);
  const randomFactor = randInt(85, 100) / 100;

  const damage = effectiveness === 0 ? 0 : Math.max(1, Math.floor(base * (crit ? 2 : 1) * stab * effectiveness * randomFactor));
  return { damage, effectiveness, crit };
};

// ---------------------------------------------------------------- setup
export const createBattle = (trainer, foeTeam, { kind = "wild", foeName = null, gym = null, rematch = false } = {}) => {
  const lead = trainer.party.find((pokemon) => pokemon.hp > 0);
  return {
    kind, // "wild" | "trainer"
    foeName,
    gym,
    rematch,
    foeTeam: foeTeam.map((pokemon) => ({ ...pokemon })),
    foeIndex: 0,
    foe: { ...foeTeam[0] }, // salinan kerja Pokemon lawan yang sedang aktif
    player: { ...lead }, // salinan kerja Pokemon kita; disinkronkan ke trainer lewat commitPlayer
    stages: { player: newStages(), foe: newStages() },
    participants: [lead.uid], // yang ikut bertarung melawan lawan saat ini (untuk bagi EXP)
    fleeAttempts: 0,
    needSwitch: false,
    over: false,
    result: null, // "win" | "lose" | "caught" | "ran"
    caught: null,
    pendingEvolutions: [],
  };
};

export const foesRemaining = (battle) => battle.foeTeam.length - battle.foeIndex - 1;

export const labelOf = (battle, side) => {
  if (side === "player") return displayName(battle.player);
  const name = findSpecies(battle.foe.speciesId).name;
  return battle.kind === "wild" ? `${name} liar` : `${name} milik ${battle.foeName}`;
};

// ---------------------------------------------------------------- sinkronisasi dengan trainer
const commitPlayer = (trainer, battle) => {
  updatePokemon(trainer, battle.player.uid, () => ({ ...battle.player }));
};

const reloadPlayer = (trainer, battle) => {
  battle.player = { ...locatePokemon(trainer, battle.player.uid).pokemon };
};

// ---------------------------------------------------------------- move
const applyStatChange = (battle, side, effect) => {
  const targetSide = effect.target === "self" ? side : other(side);
  const stages = battle.stages[targetSide];
  const current = stages[effect.stat];
  const next = clampStage(current + effect.stages);
  const direction = effect.stages > 0 ? "naik" : "turun";
  const name = `${STAT_NAMES[effect.stat]} ${labelOf(battle, targetSide)}`;
  if (next === current) return [`${name} tidak bisa ${direction} lagi!`];
  stages[effect.stat] = next;
  return [`${name} ${direction}${Math.abs(effect.stages) >= 2 ? " drastis" : ""}!`];
};

const performMove = (battle, side, moveId) => {
  const events = [];
  const attacker = battle[side];
  const target = battle[other(side)];
  const move = findMove(moveId);
  events.push(`${labelOf(battle, side)} menggunakan ${move.name}!`);

  // Move yang hanya mempengaruhi diri sendiri tidak bisa meleset.
  const selfOnly = move.power === 0 && move.effect?.target === "self";
  if (!selfOnly) {
    const stage = clampStage(battle.stages[side].accuracy - battle.stages[other(side)].evasion);
    if (!chance((move.accuracy * accuracyMultiplier(stage)) / 100)) {
      events.push("Serangannya meleset!");
      return events;
    }
  }

  if (move.power > 0) {
    const { damage, effectiveness, crit } = calcDamage(attacker, target, move, battle.stages[side], battle.stages[other(side)]);
    if (effectiveness === 0) {
      events.push(`Tidak berpengaruh pada ${labelOf(battle, other(side))}...`);
      return events;
    }
    target.hp = Math.max(0, target.hp - damage);
    if (crit) events.push("Serangan kritis!");
    if (effectiveness > 1) events.push("Sangat efektif!");
    if (effectiveness < 1) events.push("Kurang efektif...");
    events.push(`${labelOf(battle, other(side))} kehilangan ${damage} HP.`);
    if (move.drain) {
      const healed = Math.max(1, Math.floor(damage * move.drain));
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + healed);
      events.push(`${labelOf(battle, side)} menyerap ${healed} HP.`);
    }
  }

  const { effect } = move;
  const effectApplies = effect && (effect.target === "self" || target.hp > 0) && (move.power === 0 || chance((effect.chance ?? 100) / 100));
  if (effectApplies && effect.kind === "statChange") events.push(...applyStatChange(battle, side, effect));
  return events;
};

const pickFoeMove = (battle) => {
  const ids = findSpecies(battle.foe.speciesId).moves;
  return ids[randInt(0, ids.length - 1)];
};

// Urutan: prioritas move dulu, lalu Speed (setelah stage), seri diacak.
const decideOrder = (battle, playerMoveId, foeMoveId) =>
  [
    { side: "player", moveId: playerMoveId, priority: findMove(playerMoveId).priority ?? 0, speed: effectiveStat(battle.player, battle.stages.player, "speed") },
    { side: "foe", moveId: foeMoveId, priority: findMove(foeMoveId).priority ?? 0, speed: effectiveStat(battle.foe, battle.stages.foe, "speed") },
  ].sort((a, b) => b.priority - a.priority || b.speed - a.speed || (chance(0.5) ? -1 : 1));

// ---------------------------------------------------------------- pingsan, EXP, giliran
const awardExp = (battle, trainer, events) => {
  const fighters = battle.participants.filter((uid) => locatePokemon(trainer, uid)?.pokemon.hp > 0);
  // Pemegang Exp. Share (hanya yang di tim dan masih hidup) dapat bagian walau tidak bertarung.
  const holders = trainer.party.filter((pokemon) => pokemon.hp > 0 && pokemon.heldItem === "expShare").map((pokemon) => pokemon.uid);
  if (fighters.length === 0 && holders.length === 0) return;

  const total = calcExpYield(battle.foe, findSpecies(battle.foe.speciesId).baseStats, battle.kind === "trainer");
  // Aturan Gen 3: jika ada pemegang Exp. Share, separuh EXP untuk yang bertarung, separuh untuk pemegang.
  const fighterPool = holders.length > 0 ? Math.floor(total / 2) : total;
  const holderPool = total - fighterPool;

  const gains = new Map();
  const add = (uid, amount) => gains.set(uid, (gains.get(uid) ?? 0) + Math.max(1, amount));
  fighters.forEach((uid) => add(uid, Math.floor(fighterPool / fighters.length)));
  holders.forEach((uid) => add(uid, Math.floor(holderPool / holders.length)));

  gains.forEach((amount, uid) => {
    const { levelsGained, pokemon } = grantExp(trainer, uid, amount);
    const viaShare = holders.includes(uid) && !fighters.includes(uid) ? " (Exp. Share)" : "";
    events.push(`${displayName(pokemon)} mendapat ${amount} EXP!${viaShare}`);
    if (levelsGained > 0) events.push(`${displayName(pokemon)} naik ke level ${pokemon.level}!`);
    if (getEvolutionTarget(pokemon) && !battle.pendingEvolutions.includes(uid)) battle.pendingEvolutions.push(uid);
  });
};

const handleFoeFaint = (battle, trainer, events) => {
  events.push(`${labelOf(battle, "foe")} pingsan!`);
  commitPlayer(trainer, battle);
  awardExp(battle, trainer, events);
  reloadPlayer(trainer, battle);

  battle.foeIndex += 1;
  if (battle.foeIndex < battle.foeTeam.length) {
    battle.foe = { ...battle.foeTeam[battle.foeIndex] };
    battle.stages.foe = newStages();
    battle.participants = [battle.player.uid];
    events.push(`${battle.foeName} mengirim ${findSpecies(battle.foe.speciesId).name}!`);
  } else {
    battle.over = true;
    battle.result = "win";
  }
};

const handlePlayerFaint = (battle, trainer, events) => {
  events.push(`${displayName(battle.player)} pingsan!`);
  commitPlayer(trainer, battle);
  if (isPartyWiped(trainer)) {
    battle.over = true;
    battle.result = "lose";
  } else {
    battle.needSwitch = true;
  }
};

// Mengembalikan true jika ada yang pingsan (giliran langsung berakhir).
const resolveFaints = (battle, trainer, events) => {
  if (battle.foe.hp <= 0) {
    handleFoeFaint(battle, trainer, events);
    return true;
  }
  if (battle.player.hp <= 0) {
    handlePlayerFaint(battle, trainer, events);
    return true;
  }
  return false;
};

const foeAttack = (battle, trainer, events) => {
  if (battle.over || battle.foe.hp <= 0) return;
  events.push(...performMove(battle, "foe", pickFoeMove(battle)));
  resolveFaints(battle, trainer, events);
};

// ---------------------------------------------------------------- aksi pemain
const doSwitch = (battle, trainer, uid, events) => {
  const found = locatePokemon(trainer, uid);
  if (!found || found.where !== "party") return fail("Pokemon itu tidak ada di tim.");
  if (found.pokemon.hp <= 0) return fail(`${displayName(found.pokemon)} pingsan dan tidak bisa bertarung!`);
  if (uid === battle.player.uid && battle.player.hp > 0) return fail(`${displayName(found.pokemon)} sudah sedang bertarung!`);

  if (battle.player.hp > 0) {
    commitPlayer(trainer, battle);
    events.push(`Kembali, ${displayName(battle.player)}!`);
  }
  battle.player = { ...found.pokemon };
  battle.stages.player = newStages();
  if (!battle.participants.includes(uid)) battle.participants.push(uid);
  events.push(`Ayo, ${displayName(battle.player)}!`);
  return { ok: true };
};

const doBall = (battle, trainer, itemId, events) => {
  if (battle.kind !== "wild") return fail("Kamu tidak bisa menangkap Pokemon milik trainer lain!");
  const ball = findItem(itemId);
  if (!ball || ball.kind !== "ball") return fail("Itu bukan Ball.");
  if (getQty(trainer, itemId) < 1) return fail(`Kamu tidak punya ${ball.name}.`);

  removeItem(trainer, itemId, 1);
  const result = attemptCatch(battle.foe, ball);
  events.push({ type: "catch", ballName: ball.name, wildName: findSpecies(battle.foe.speciesId).name, result });
  if (result.caught) {
    commitPlayer(trainer, battle);
    battle.caught = addPokemon(trainer, { ...battle.foe, uid: null });
    battle.over = true;
    battle.result = "caught";
  } else {
    foeAttack(battle, trainer, events);
  }
  return { ok: true };
};

const doRun = (battle, trainer, events) => {
  if (battle.kind !== "wild") return fail("Kamu tidak bisa kabur dari pertarungan melawan trainer!");
  battle.fleeAttempts += 1;
  const playerSpeed = effectiveStat(battle.player, battle.stages.player, "speed");
  const foeSpeed = effectiveStat(battle.foe, battle.stages.foe, "speed");
  const odds = Math.floor((playerSpeed * 128) / foeSpeed) + 30 * battle.fleeAttempts;
  if (playerSpeed >= foeSpeed || odds > randInt(0, 255)) {
    commitPlayer(trainer, battle);
    events.push("Kamu berhasil kabur!");
    battle.over = true;
    battle.result = "ran";
  } else {
    events.push("Tidak bisa kabur!");
    foeAttack(battle, trainer, events);
  }
  return { ok: true };
};

// Titik masuk satu giliran. action: { type: "move"|"switch"|"item"|"ball"|"run", ... }
// Mengembalikan { ok, events }. ok=false berarti aksi ditolak dan giliran TIDAK terpakai.
export const resolveTurn = (battle, trainer, action) => {
  if (battle.over) return fail("Pertarungan sudah selesai.");
  const events = [];

  if (battle.needSwitch) {
    if (action.type !== "switch") return fail("Pilih Pokemon pengganti dulu!");
    const result = doSwitch(battle, trainer, action.uid, events);
    if (!result.ok) return result;
    battle.needSwitch = false; // ganti paksa setelah pingsan: lawan tidak menyerang
    return { ok: true, events };
  }

  switch (action.type) {
    case "move": {
      if (!findSpecies(battle.player.speciesId).moves.includes(action.moveId)) return fail("Move itu tidak dimiliki Pokemon ini.");
      for (const { side, moveId } of decideOrder(battle, action.moveId, pickFoeMove(battle))) {
        if (battle[side].hp <= 0) continue;
        events.push(...performMove(battle, side, moveId));
        if (resolveFaints(battle, trainer, events)) break;
      }
      break;
    }
    case "switch": {
      const result = doSwitch(battle, trainer, action.uid, events);
      if (!result.ok) return result;
      foeAttack(battle, trainer, events);
      break;
    }
    case "item": {
      const item = findItem(action.itemId);
      if (!item || !["heal", "revive"].includes(item.kind)) return fail("Item itu tidak bisa dipakai saat battle.");
      commitPlayer(trainer, battle);
      const result = useItemOnPokemon(trainer, action.itemId, action.uid);
      if (!result.ok) return fail(result.message);
      reloadPlayer(trainer, battle);
      events.push(result.message);
      foeAttack(battle, trainer, events);
      break;
    }
    case "ball": {
      const result = doBall(battle, trainer, action.itemId, events);
      if (!result.ok) return result;
      break;
    }
    case "run": {
      const result = doRun(battle, trainer, events);
      if (!result.ok) return result;
      break;
    }
    default:
      return fail("Aksi tidak dikenal.");
  }
  if (!battle.over && !battle.needSwitch) commitPlayer(trainer, battle);
  return { ok: true, events };
};

// ---------------------------------------------------------------- akhir battle
// Menerapkan hadiah / badge / whiteout. Dipanggil sekali setelah battle.over.
export const concludeBattle = (battle, trainer) => {
  if (battle.result === "win") {
    const reward = battle.kind === "wild" ? rollWildReward(battle.foeTeam[0]) : rollGymReward(battle.gym, battle.rematch);
    applyReward(trainer, reward);
    const newBadge = battle.gym && !battle.rematch && !trainer.badges.includes(battle.gym.badge) ? battle.gym.badge : null;
    if (newBadge) trainer.badges = [...trainer.badges, newBadge];
    return { outcome: "win", reward, newBadge };
  }
  if (battle.result === "lose") return { outcome: "lose", ...applyWhiteout(trainer) };
  return { outcome: battle.result };
};
