import assert from "node:assert/strict";
import { setRng } from "../utils/random.js";
import { CONFIG } from "../data/config.js";
import { pokedex, findSpecies } from "../data/pokedex.js";
import { findMove } from "../data/moves.js";
import { gyms } from "../data/gyms.js";
import { legendaries } from "../data/legendaries.js";
import { typeEffectiveness } from "../data/typeChart.js";
import { createPokemon } from "../services/pokemonFactory.js";
import * as T from "../services/trainerService.js";
import * as I from "../services/inventoryService.js";
import * as B from "../services/battleService.js";
import * as L from "../services/legendaryService.js";
import { calcCatchValue, attemptCatch } from "../services/encounterService.js";
import { getCatalog, sellItem } from "../services/shopService.js";
import { startGymBattle } from "../services/gymService.js";
import { findItem } from "../data/items.js";

let passed = 0;
const test = (name, fn) => {
  setRng(Math.random);
  CONFIG.legendaryPermanent = true;
  fn();
  passed += 1;
  console.log(`  ok  ${name}`);
};
const withBadges = (count, level = 100) => {
  const t = T.createTrainer("Nadia");
  T.addPokemon(t, createPokemon(252, level));
  t.badges = gyms.slice(0, count).map((gym) => gym.badge);
  return t;
};
const fightUntilOver = (battle, t) => {
  setRng(() => 0);
  let guard = 0;
  while (!battle.over && guard++ < 80) B.resolveTurn(battle, t, { type: "move", moveId: "pound" });
};

console.log("DATA LEGENDARY");
test("8 legendary: spesies valid, catch rate 3, 4 move sah, stat besar", () => {
  const species = pokedex.filter((s) => s.legendary);
  assert.equal(species.length, 8);
  assert.equal(pokedex.length, 60);
  species.forEach((s) => {
    assert.equal(s.catchRate, 3, s.name);
    assert.equal(s.moves.length, 4, s.name);
    s.moves.forEach((id) => assert.ok(findMove(id), `${s.name}:${id}`));
    assert.ok(Object.values(s.baseStats).reduce((a, b) => a + b, 0) >= 580, s.name);
  });
  assert.deepEqual(species.map((s) => s.name).sort(), ["Groudon", "Kyogre", "Latias", "Latios", "Rayquaza", "Regice", "Regirock", "Registeel"]);
});
test("encounter legendary merujuk spesies legendary; Rayquaza paling tinggi", () => {
  assert.equal(legendaries.length, 8);
  legendaries.forEach((l) => assert.equal(findSpecies(l.speciesId).legendary, true));
  assert.equal(Math.max(...legendaries.map((l) => l.level)), legendaries.find((l) => l.id === "rayquaza").level);
});
test("tipe baru bekerja: Ice vs Dragon/Flying = 4x, Ground vs Steel = 2x", () => {
  assert.equal(typeEffectiveness("Ice", ["Dragon", "Flying"]), 4);
  assert.equal(typeEffectiveness("Ground", ["Steel"]), 2);
});

console.log("MASTER BALL & ULTRA BALL");
test("Master Ball: pasti tertangkap meski HP penuh & rng paling buruk", () => {
  const rayquaza = createPokemon(384, 70);
  setRng(() => 0.999999);
  assert.deepEqual(attemptCatch(rayquaza, findItem("masterBall")), { caught: true, shakes: 3 });
  assert.equal(attemptCatch(rayquaza, findItem("greatball")).caught, false);
});
test("Master Ball tidak dijual & tidak bisa dijual; Ultra Ball dijual ₽1200 dan lebih kuat dari Great Ball", () => {
  const t = withBadges(0);
  I.addItem(t, "masterBall", 1);
  assert.equal(sellItem(t, "masterBall", 1).ok, false);
  assert.equal(getCatalog().some((i) => i.id === "masterBall"), false);
  assert.equal(getCatalog().find((i) => i.id === "ultraBall").price, 1200);
  const wild = createPokemon(384, 70);
  assert.ok(calcCatchValue(wild, findItem("ultraBall")) > calcCatchValue(wild, findItem("greatball")));
});

console.log("HADIAH GYM 8");
test("gym 8 punya bonus Master Ball; gym lain tidak", () => {
  assert.equal(gyms[7].bonusItemId, "masterBall");
  assert.equal(gyms.slice(0, 7).some((g) => g.bonusItemId), false);
});
test("menang gym 8 pertama kali → dapat Master Ball; rematch → tidak dapat lagi", () => {
  const t = withBadges(7);
  const first = startGymBattle(t, 8);
  assert.ok(first.ok);
  fightUntilOver(first.battle, t);
  assert.equal(first.battle.result, "win");
  const summary = B.concludeBattle(first.battle, t);
  assert.equal(summary.bonusItemId, "masterBall");
  assert.equal(I.getQty(t, "masterBall"), 1);
  assert.equal(t.badges.length, 8);

  t.party = t.party.map((p) => ({ ...p, hp: p.maxHp })); // pulihkan dulu, seperti ke Nurse Joy
  const again = startGymBattle(t, 8);
  assert.equal(again.rematch, true);
  fightUntilOver(again.battle, t);
  assert.equal(B.concludeBattle(again.battle, t).bonusItemId, null);
  assert.equal(I.getQty(t, "masterBall"), 1);
});

console.log("LOKASI LEGENDARY");
test("terkunci sebelum 8 badge, terbuka setelahnya", () => {
  const t = withBadges(7);
  assert.equal(L.isLegendaryAreaUnlocked(t), false);
  assert.equal(L.startLegendaryBattle(t, "groudon").ok, false);
  const open = withBadges(8);
  assert.equal(L.isLegendaryAreaUnlocked(open), true);
  assert.ok(L.startLegendaryBattle(open, "groudon").ok);
});
test("encounter tetap: spesies & level sesuai data, tercatat di Pokedex, id tak dikenal ditolak", () => {
  const t = withBadges(8);
  const { battle } = L.startLegendaryBattle(t, "rayquaza");
  assert.equal(battle.foe.speciesId, 384);
  assert.equal(battle.foe.level, 70);
  assert.equal(battle.legendaryId, "rayquaza");
  assert.ok(t.pokedexSeen.includes(384));
  assert.equal(L.startLegendaryBattle(t, "mew").ok, false);
});
test("ditangkap dengan Master Ball → status 'caught', masuk tim, tidak bisa ditemui lagi", () => {
  const t = withBadges(8);
  I.addItem(t, "masterBall", 1);
  const { battle } = L.startLegendaryBattle(t, "groudon");
  setRng(() => 0.999999);
  assert.ok(B.resolveTurn(battle, t, { type: "ball", itemId: "masterBall" }).ok);
  assert.equal(B.concludeBattle(battle, t).outcome, "caught");
  assert.equal(t.legendaries.groudon, "caught");
  assert.ok(t.party.some((p) => p.speciesId === 383));
  assert.ok(t.pokedexCaught.includes(383));
  assert.equal(L.countCaughtLegendaries(t), 1);
  assert.equal(L.startLegendaryBattle(t, "groudon").ok, false);
  assert.equal(I.getQty(t, "masterBall"), 0);
});
test("dikalahkan sebelum ditangkap → 'defeated' (hilang selamanya)", () => {
  const t = withBadges(8);
  const { battle } = L.startLegendaryBattle(t, "regirock");
  battle.foe.hp = 1;
  fightUntilOver(battle, t);
  assert.equal(battle.result, "win");
  B.concludeBattle(battle, t);
  assert.equal(t.legendaries.regirock, "defeated");
  assert.equal(L.startLegendaryBattle(t, "regirock").ok, false);
});
test("legendaryPermanent=false → legendary yang dikalahkan masih bisa ditemui lagi", () => {
  const t = withBadges(8);
  CONFIG.legendaryPermanent = false;
  const { battle } = L.startLegendaryBattle(t, "regirock");
  battle.foe.hp = 1;
  fightUntilOver(battle, t);
  B.concludeBattle(battle, t);
  assert.equal(t.legendaries?.regirock, undefined);
  assert.ok(L.startLegendaryBattle(t, "regirock").ok);
});
test("kabur → tidak ada perubahan status, bisa ditemui lagi", () => {
  const t = withBadges(8);
  const { battle } = L.startLegendaryBattle(t, "regirock");
  setRng(() => 0);
  assert.ok(B.resolveTurn(battle, t, { type: "run" }).ok);
  assert.equal(battle.result, "ran");
  B.concludeBattle(battle, t);
  assert.equal(t.legendaries?.regirock, undefined);
  assert.ok(L.startLegendaryBattle(t, "regirock").ok);
});
test("kalah (whiteout) → tidak ada perubahan status", () => {
  const t = withBadges(8, 5);
  const { battle } = L.startLegendaryBattle(t, "rayquaza");
  battle.player.hp = 1;
  setRng(() => 0);
  B.resolveTurn(battle, t, { type: "move", moveId: "leer" });
  assert.equal(battle.result, "lose");
  B.concludeBattle(battle, t);
  assert.equal(t.legendaries?.rayquaza, undefined);
});
test("save lama tanpa field 'legendaries' tetap aman", () => {
  const t = withBadges(8);
  delete t.legendaries;
  assert.equal(L.countCaughtLegendaries(t), 0);
  assert.equal(L.listLegendaries(t).every((entry) => entry.status === "available"), true);
});

console.log(`\n${passed} tes lolos.`);
