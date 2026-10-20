import assert from "node:assert/strict";
import { setRng } from "../utils/random.js";
import { typeEffectiveness } from "../data/typeChart.js";
import { findMove } from "../data/moves.js";
import { findSpecies } from "../data/pokedex.js";
import { gyms } from "../data/gyms.js";
import { CONFIG } from "../data/config.js";
import { createPokemon, expForLevel, withLevel } from "../services/pokemonFactory.js";
import * as T from "../services/trainerService.js";
import * as I from "../services/inventoryService.js";
import * as B from "../services/battleService.js";
import { grantExp } from "../services/levelingService.js";
import { getEvolutionTarget, evolvePokemon } from "../services/evolutionService.js";
import { rollWildReward, rollGymReward } from "../services/rewardService.js";
import { applyWhiteout } from "../services/nurseService.js";
import { getGymStatus, startGymBattle } from "../services/gymService.js";

let passed = 0;
const test = (name, fn) => {
  setRng(Math.random);
  fn();
  passed += 1;
  console.log(`  ok  ${name}`);
};
const trainerWith = (speciesId = 252, level = 5) => {
  const t = T.createTrainer("Nadia");
  T.addPokemon(t, createPokemon(speciesId, level));
  return t;
};
const wildBattle = (t, foeSpecies = 263, foeLevel = 3) => B.createBattle(t, [createPokemon(foeSpecies, foeLevel)], { kind: "wild" });
const MAX_RNG = 0.999999; // rng "tinggi": tidak crit, acak damage maksimum, akurasi bisa gagal

console.log("TIPE & DAMAGE");
test("efektivitas tipe: super efektif, resist, immune, dual-type", () => {
  assert.equal(typeEffectiveness("Water", ["Fire"]), 2);
  assert.equal(typeEffectiveness("Fire", ["Water"]), 0.5);
  assert.equal(typeEffectiveness("Ground", ["Flying"]), 0);
  assert.equal(typeEffectiveness("Normal", ["Ghost"]), 0);
  assert.equal(typeEffectiveness("Grass", ["Water", "Ground"]), 4);
  assert.equal(typeEffectiveness("Fire", ["Grass", "Steel"]), 4);
  assert.equal(typeEffectiveness("Normal", ["Normal"]), 1);
});
test("stage multiplier & akurasi", () => {
  assert.equal(B.stageMultiplier(0), 1);
  assert.equal(B.stageMultiplier(1), 1.5);
  assert.equal(B.stageMultiplier(2), 2);
  assert.ok(Math.abs(B.stageMultiplier(-1) - 2 / 3) < 1e-9);
  assert.equal(B.stageMultiplier(-6), 0.25);
  assert.ok(Math.abs(B.accuracyMultiplier(-1) - 0.75) < 1e-9);
});
test("damage: STAB, super efektif, immune, stage Attack", () => {
  setRng(() => 0.5); // tidak crit
  const torchic = createPokemon(255, 20);
  const treecko = createPokemon(252, 20);
  const water = createPokemon(258, 20);
  const none = B.newStages();
  const ember = findMove("ember");
  const vsGrass = B.calcDamage(torchic, treecko, ember, none, none);
  const vsWater = B.calcDamage(torchic, water, ember, none, none);
  assert.equal(vsGrass.effectiveness, 2);
  assert.equal(vsWater.effectiveness, 0.5);
  assert.ok(vsGrass.damage > vsWater.damage * 3);
  const boosted = B.calcDamage(torchic, water, findMove("scratch"), { ...none, atk: 2 }, none);
  const plain = B.calcDamage(torchic, water, findMove("scratch"), none, none);
  assert.ok(boosted.damage > plain.damage * 1.7);
  const earthquake = B.calcDamage(createPokemon(260, 30), createPokemon(277, 30), findMove("earthquake"), none, none);
  assert.equal(earthquake.damage, 0); // Ground vs Flying
});

console.log("BATTLE");
test("createBattle: lead = Pokemon hidup pertama, stage nol", () => {
  const t = trainerWith();
  const b = wildBattle(t);
  assert.equal(b.player.uid, t.party[0].uid);
  assert.equal(b.over, false);
  assert.ok(Object.values(b.stages.player).every((v) => v === 0));
});
test("move: damage mengurangi HP lawan, giliran lawan membalas", () => {
  const t = trainerWith();
  const b = wildBattle(t, 263, 3);
  setRng(() => 0.5);
  const startHp = b.foe.hp;
  const r = B.resolveTurn(b, t, { type: "move", moveId: "pound" });
  assert.ok(r.ok);
  assert.ok(b.foe.hp < startHp);
  assert.ok(r.events.some((e) => typeof e === "string" && e.includes("menggunakan Pound")));
});
test("move tidak dimiliki → ditolak tanpa memakai giliran", () => {
  const t = trainerWith();
  const b = wildBattle(t);
  const hp = b.foe.hp;
  const r = B.resolveTurn(b, t, { type: "move", moveId: "surf" });
  assert.equal(r.ok, false);
  assert.equal(b.foe.hp, hp);
});
test("efek stat: Growl menurunkan Attack lawan sampai batas -6", () => {
  const t = trainerWith(255, 5); // Torchic punya Growl
  const b = wildBattle(t, 263, 50); // lawan sangat kuat? pakai lv rendah agar tidak pingsan
  const strong = B.createBattle(t, [{ ...createPokemon(263, 3), hp: 9999, maxHp: 9999 }], { kind: "wild" });
  setRng(() => 0); // semua akurat
  for (let i = 0; i < 8; i++) {
    strong.player.hp = strong.player.maxHp = 9999; // agar player tidak pingsan
    B.resolveTurn(strong, t, { type: "move", moveId: "growl" });
  }
  assert.equal(strong.stages.foe.atk, -6);
  assert.ok(b);
});
test("move self-buff: Swords Dance +2 Attack diri sendiri", () => {
  const t = trainerWith(257, 40); // Blaziken punya Swords Dance
  const b = B.createBattle(t, [{ ...createPokemon(263, 3), hp: 9999, maxHp: 9999 }], { kind: "wild" });
  setRng(() => 0);
  B.resolveTurn(b, t, { type: "move", moveId: "swordsDance" });
  assert.equal(b.stages.player.atk, 2);
});
test("prioritas: Quick Attack mendahului lawan yang lebih cepat", () => {
  const t = trainerWith(252, 5); // Treecko punya Quick Attack
  const fast = createPokemon(261, 30); // Poochyena lv30: jauh lebih cepat, tanpa Quick Attack
  const b = B.createBattle(t, [{ ...fast, hp: 9999, maxHp: 9999 }], { kind: "wild" });
  setRng(() => 0.5);
  const { events } = B.resolveTurn(b, t, { type: "move", moveId: "quickAttack" });
  const firstMove = events.find((e) => typeof e === "string" && e.includes("menggunakan"));
  assert.ok(firstMove.startsWith(b.player.nickname ?? "Treecko"), firstMove);
});
test("drain: Absorb memulihkan HP penyerang", () => {
  const t = trainerWith(252, 10);
  const b = B.createBattle(t, [{ ...createPokemon(263, 3), hp: 500, maxHp: 500 }], { kind: "wild" });
  b.player.hp = 5;
  setRng(() => 0.5);
  const { events } = B.resolveTurn(b, t, { type: "move", moveId: "absorb" });
  assert.ok(events.some((e) => typeof e === "string" && e.includes("menyerap")));
});
test("kalahkan lawan: EXP, level up, battle selesai 'win'", () => {
  const t = trainerWith(252, 5);
  const b = B.createBattle(t, [{ ...createPokemon(263, 3), hp: 1, maxHp: 13 }], { kind: "wild" });
  setRng(() => 0);
  const { events } = B.resolveTurn(b, t, { type: "move", moveId: "pound" });
  assert.equal(b.over, true);
  assert.equal(b.result, "win");
  assert.ok(events.some((e) => typeof e === "string" && e.includes("EXP")));
  assert.ok(t.party[0].exp > expForLevel(5));
});
test("pingsan: ganti paksa, lalu lawan TIDAK menyerang", () => {
  const t = trainerWith(252, 5);
  T.addPokemon(t, createPokemon(263, 5));
  const b = B.createBattle(t, [{ ...createPokemon(262, 30), hp: 9999, maxHp: 9999 }], { kind: "wild" });
  b.player.hp = 1;
  setRng(() => 0);
  B.resolveTurn(b, t, { type: "move", moveId: "leer" });
  assert.equal(b.needSwitch, true);
  assert.equal(B.resolveTurn(b, t, { type: "move", moveId: "pound" }).ok, false); // harus ganti dulu
  const hpBefore = t.party[1].hp;
  const r = B.resolveTurn(b, t, { type: "switch", uid: t.party[1].uid });
  assert.ok(r.ok);
  assert.equal(b.needSwitch, false);
  assert.equal(t.party[1].hp, hpBefore);
});
test("semua Pokemon pingsan → result 'lose' + whiteout", () => {
  const t = trainerWith(252, 5);
  const b = B.createBattle(t, [{ ...createPokemon(262, 30), hp: 9999, maxHp: 9999 }], { kind: "wild" });
  b.player.hp = 1;
  t.money = 1000;
  setRng(() => 0);
  B.resolveTurn(b, t, { type: "move", moveId: "leer" });
  assert.equal(b.result, "lose");
  const summary = B.concludeBattle(b, t);
  assert.equal(summary.outcome, "lose");
  assert.equal(t.money, 500);
  assert.equal(t.party[0].hp, t.party[0].maxHp);
});
test("switch sukarela: tidak boleh ke Pokemon pingsan / yang sedang bertarung", () => {
  const t = trainerWith(252, 5);
  T.addPokemon(t, createPokemon(263, 5));
  T.updatePokemon(t, t.party[1].uid, (p) => ({ ...p, hp: 0 }));
  const b = wildBattle(t);
  assert.equal(B.resolveTurn(b, t, { type: "switch", uid: t.party[1].uid }).ok, false);
  assert.equal(B.resolveTurn(b, t, { type: "switch", uid: t.party[0].uid }).ok, false);
});
test("tangkap di battle: HP rendah + rng 0 → tertangkap & masuk tim", () => {
  const t = trainerWith(252, 5);
  const b = B.createBattle(t, [{ ...createPokemon(309, 8), hp: 1 }], { kind: "wild" });
  setRng(() => 0);
  const r = B.resolveTurn(b, t, { type: "ball", itemId: "pokeball" });
  assert.ok(r.ok);
  assert.equal(b.result, "caught");
  assert.equal(t.party.length, 2);
  assert.equal(I.getQty(t, "pokeball"), 4);
});
test("Ball: ditolak untuk trainer & saat tidak punya Ball", () => {
  const t = trainerWith();
  const trainerBattle = B.createBattle(t, [createPokemon(263, 3)], { kind: "trainer", foeName: "X", gym: gyms[0] });
  assert.equal(B.resolveTurn(trainerBattle, t, { type: "ball", itemId: "pokeball" }).ok, false);
  I.removeItem(t, "pokeball", 5);
  assert.equal(B.resolveTurn(wildBattle(t), t, { type: "ball", itemId: "pokeball" }).ok, false);
});
test("kabur: wild berhasil (lebih cepat), trainer ditolak", () => {
  const t = trainerWith(252, 20);
  const b = B.createBattle(t, [createPokemon(265, 2)], { kind: "wild" });
  assert.ok(B.resolveTurn(b, t, { type: "run" }).ok);
  assert.equal(b.result, "ran");
  const tb = B.createBattle(t, [createPokemon(263, 3)], { kind: "trainer", foeName: "X", gym: gyms[0] });
  assert.equal(B.resolveTurn(tb, t, { type: "run" }).ok, false);
});
test("item di battle: Potion menyembuhkan & memakai giliran; HP penuh ditolak", () => {
  const t = trainerWith(252, 5);
  const b = wildBattle(t);
  assert.equal(B.resolveTurn(b, t, { type: "item", itemId: "potion", uid: t.party[0].uid }).ok, false);
  b.player.hp = 3;
  T.updatePokemon(t, b.player.uid, (p) => ({ ...p, hp: 3 }));
  setRng(() => 0.5);
  const r = B.resolveTurn(b, t, { type: "item", itemId: "potion", uid: t.party[0].uid });
  assert.ok(r.ok);
  assert.equal(I.getQty(t, "potion"), 1);
  assert.equal(B.resolveTurn(b, t, { type: "item", itemId: "pokeball", uid: t.party[0].uid }).ok, false);
});

console.log("EXP, LEVEL & EVOLUSI");
test("grantExp: naik level berulang & HP bertambah", () => {
  const t = trainerWith(252, 5);
  const before = t.party[0];
  const { levelsGained, pokemon } = grantExp(t, before.uid, expForLevel(8) - before.exp);
  assert.equal(levelsGained, 3);
  assert.equal(pokemon.level, 8);
  assert.ok(pokemon.maxHp > before.maxHp);
  assert.equal(t.party[0].level, 8);
});
test("getEvolutionTarget: tepat pada level evolusi", () => {
  assert.equal(getEvolutionTarget(createPokemon(252, 15)), null);
  assert.equal(getEvolutionTarget(createPokemon(252, 16)).name, "Grovyle");
  assert.equal(getEvolutionTarget(createPokemon(254, 90)), null); // bentuk akhir
});
test("evolvePokemon: spesies & stat berubah, nickname tetap, Pokedex tercatat", () => {
  const t = trainerWith(252, 16);
  T.renamePokemon(t, t.party[0].uid, "Rex");
  const before = t.party[0];
  const r = evolvePokemon(t, before.uid);
  assert.ok(r.ok);
  const after = t.party[0];
  assert.equal(after.speciesId, 253);
  assert.equal(after.nickname, "Rex");
  assert.equal(after.level, 16);
  assert.ok(after.stats.spAtk > before.stats.spAtk);
  assert.ok(t.pokedexCaught.includes(253));
  assert.equal(before.speciesId, 252); // objek lama tidak dimutasi
  assert.equal(evolvePokemon(t, after.uid).ok, false); // belum level 36
});
test("evolusi berantai: Treecko Lv36 → Grovyle → Sceptile", () => {
  const t = trainerWith(252, 36);
  evolvePokemon(t, t.party[0].uid);
  assert.equal(t.party[0].speciesId, 253);
  evolvePokemon(t, t.party[0].uid);
  assert.equal(t.party[0].speciesId, 254);
});
test("menang battle → pendingEvolutions terisi saat level evolusi tercapai", () => {
  const t = trainerWith(252, 15);
  T.updatePokemon(t, t.party[0].uid, (p) => ({ ...p, exp: expForLevel(16) - 1 }));
  const b = B.createBattle(t, [{ ...createPokemon(263, 3), hp: 1 }], { kind: "wild" });
  setRng(() => 0);
  B.resolveTurn(b, t, { type: "move", moveId: "pound" });
  assert.equal(t.party[0].level, 16);
  assert.deepEqual(b.pendingEvolutions, [t.party[0].uid]);
});
test("Rare Candy menaikkan level & EXP konsisten", () => {
  const t = trainerWith(252, 15);
  I.addItem(t, "rareCandy", 1);
  I.useItemOnPokemon(t, "rareCandy", t.party[0].uid);
  assert.equal(t.party[0].level, 16);
  assert.ok(t.party[0].exp >= expForLevel(16));
  assert.ok(getEvolutionTarget(t.party[0]));
});
test("save lama tanpa field exp tetap aman", () => {
  const legacy = { ...createPokemon(252, 10), exp: undefined };
  assert.equal(withLevel(legacy, 11).exp, expForLevel(11));
});

console.log("HADIAH, WHITEOUT & GYM");
test("hadiah liar: uang = level x per-level, item sesuai peluang", () => {
  setRng(() => 0); // chance true → pasti drop
  const reward = rollWildReward(createPokemon(263, 4));
  assert.equal(reward.money, 4 * CONFIG.wildMoneyPerLevel);
  assert.ok(reward.itemId);
  setRng(() => 0.99); // tidak drop
  assert.equal(rollWildReward(createPokemon(263, 4)).itemId, null);
});
test("hadiah gym: uang level terakhir x100, rematch separuh tanpa item", () => {
  const gym = gyms[0];
  assert.equal(rollGymReward(gym).money, 1500);
  assert.ok(rollGymReward(gym).itemId);
  const re = rollGymReward(gym, true);
  assert.equal(re.money, 750);
  assert.equal(re.itemId, null);
});
test("menang wild → uang bertambah via concludeBattle", () => {
  const t = trainerWith(252, 5);
  const b = B.createBattle(t, [{ ...createPokemon(263, 3), hp: 1 }], { kind: "wild" });
  setRng(() => 0);
  B.resolveTurn(b, t, { type: "move", moveId: "pound" });
  const before = t.money;
  const s = B.concludeBattle(b, t);
  assert.equal(s.outcome, "win");
  assert.equal(t.money, before + 3 * CONFIG.wildMoneyPerLevel);
});
test("whiteout: uang separuh, tim pulih", () => {
  const t = trainerWith();
  t.money = 999;
  T.updatePokemon(t, t.party[0].uid, (p) => ({ ...p, hp: 0 }));
  const { lost } = applyWhiteout(t);
  assert.equal(lost, 499);
  assert.equal(t.money, 500);
  assert.equal(t.party[0].hp, t.party[0].maxHp);
});
test("gym berurutan: hanya gym 1 terbuka di awal; badge membuka berikutnya", () => {
  const t = trainerWith();
  assert.equal(getGymStatus(t, gyms[0]).unlocked, true);
  assert.equal(getGymStatus(t, gyms[1]).unlocked, false);
  assert.equal(startGymBattle(t, 2).ok, false);
  t.badges = ["Stone Badge"];
  assert.equal(getGymStatus(t, gyms[1]).unlocked, true);
  assert.equal(getGymStatus(t, gyms[0]).beaten, true);
});
test("kalahkan gym: badge diberikan sekali, rematch tanpa badge", () => {
  const t = trainerWith(252, 50);
  setRng(() => 0);
  const started = startGymBattle(t, 1);
  assert.ok(started.ok);
  const { battle } = started;
  assert.equal(battle.kind, "trainer");
  let guard = 0;
  while (!battle.over && guard++ < 30) B.resolveTurn(battle, t, { type: "move", moveId: "pound" });
  assert.equal(battle.result, "win");
  const s = B.concludeBattle(battle, t);
  assert.equal(s.newBadge, "Stone Badge");
  assert.deepEqual(t.badges, ["Stone Badge"]);

  const again = startGymBattle(t, 1);
  assert.equal(again.rematch, true);
  guard = 0;
  while (!again.battle.over && guard++ < 30) B.resolveTurn(again.battle, t, { type: "move", moveId: "pound" });
  const s2 = B.concludeBattle(again.battle, t);
  assert.equal(s2.newBadge, null);
  assert.equal(t.badges.length, 1);
});
test("tim gym lengkap: 8 gym berurutan, tim valid", () => {
  assert.equal(gyms.length, 8);
  gyms.forEach((g, i) => {
    assert.equal(g.order, i + 1);
    g.team.forEach((m) => assert.ok(findSpecies(m.speciesId)));
  });
});

console.log(`\n${passed} tes lolos.`);
