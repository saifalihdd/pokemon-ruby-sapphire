import assert from "node:assert/strict";
import { CONFIG } from "../data/config.js";
import { areas } from "../data/areas.js";
import { evolutions } from "../data/evolutions.js";
import { pokedex } from "../data/pokedex.js";
import { gyms } from "../data/gyms.js";
import { pokedexRewards } from "../data/pokedexRewards.js";
import { findItem } from "../data/items.js";
import { createPokemon } from "../services/pokemonFactory.js";
import * as T from "../services/trainerService.js";
import * as I from "../services/inventoryService.js";
import { reviveAll } from "../services/nurseService.js";
import { getRewardProgress, claimPokedexRewards } from "../services/pokedexRewardService.js";

let passed = 0;
const test = (name, fn) => {
  fn();
  passed += 1;
  console.log(`  ok  ${name}`);
};
const COST = CONFIG.nurseReviveCost;
// Tim 4 Pokemon dengan jumlah pingsan tertentu (urutan: yang pingsan di depan).
const teamWith = (faintedCount, money) => {
  const t = T.createTrainer("Nadia");
  [252, 255, 258, 263].forEach((id) => T.addPokemon(t, createPokemon(id, 10)));
  t.party = t.party.map((p, i) => (i < faintedCount ? { ...p, hp: 0 } : p));
  t.money = money;
  return t;
};
const withCaught = (count) => {
  const t = T.createTrainer("Nadia");
  t.pokedexCaught = Array.from({ length: count }, (_, i) => i + 1);
  return t;
};

console.log("REVIVE ALL");
test("menghidupkan semua yang pingsan sekaligus, HP penuh, uang dipotong per Pokemon", () => {
  const t = teamWith(3, 2000);
  const r = reviveAll(t);
  assert.ok(r.ok);
  assert.equal(t.money, 2000 - 3 * COST);
  assert.ok(t.party.every((p) => p.hp === p.maxHp));
});
test("uang tidak cukup untuk semua → yang dihidupkan sebanyak yang mampu (urutan tim), sisanya tetap pingsan", () => {
  const t = teamWith(3, 2 * COST + 50);
  const r = reviveAll(t);
  assert.ok(r.ok);
  assert.ok(r.message.includes("1 Pokemon belum"));
  assert.equal(t.money, 50);
  assert.deepEqual(t.party.map((p) => p.hp > 0), [true, true, false, true]);
});
test("ditolak: tidak ada yang pingsan / uang kurang dari 1 revive", () => {
  const healthy = teamWith(0, 5000);
  assert.equal(reviveAll(healthy).ok, false);
  assert.equal(healthy.money, 5000);
  const broke = teamWith(2, COST - 1);
  assert.equal(reviveAll(broke).ok, false);
  assert.equal(broke.party[0].hp, 0);
  assert.equal(broke.money, COST - 1);
});
test("Pokemon pingsan di PC tidak ikut di-revive, yang sehat tidak berubah", () => {
  const t = teamWith(0, 5000);
  T.addPokemon(t, createPokemon(309, 5));
  T.addPokemon(t, createPokemon(309, 5));
  t.pc = [{ ...createPokemon(300, 5), uid: "PCX", hp: 0 }];
  t.party = t.party.map((p, i) => (i === 1 ? { ...p, hp: 3 } : p));
  reviveAll(t); // tidak ada yang pingsan di tim
  assert.equal(t.pc[0].hp, 0);
  assert.equal(t.party[1].hp, 3);
});

console.log("HADIAH POKEDEX & MASTER BALL");
test("data: target menaik, ≤ jumlah spesies yang BISA didapat, item valid", () => {
  const wild = new Set(areas.flatMap((a) => a.encounters.map((e) => e.speciesId)));
  const reach = new Set([...wild, 252]); // satu starter
  for (let grew = true; grew; ) {
    grew = false;
    [...reach].forEach((id) => {
      const evo = evolutions[id];
      if (evo && !reach.has(evo.to)) { reach.add(evo.to); grew = true; }
    });
  }
  const obtainable = reach.size + pokedex.filter((s) => s.legendary).length;
  const targets = pokedexRewards.map((r) => r.caught);
  assert.deepEqual(targets, [...targets].sort((a, b) => a - b));
  assert.ok(Math.max(...targets) <= obtainable, `target ${Math.max(...targets)} > ${obtainable}`);
  assert.equal(new Set(pokedexRewards.map((r) => r.id)).size, pokedexRewards.length);
  pokedexRewards.forEach((r) => assert.ok(findItem(r.itemId)));
});
test("Master Ball punya lebih dari satu sumber (gym 8 + milestone Pokedex)", () => {
  const fromDex = pokedexRewards.filter((r) => r.itemId === "masterBall").reduce((sum, r) => sum + r.qty, 0);
  const fromGym = gyms.filter((g) => g.bonusItemId === "masterBall").length;
  assert.ok(fromDex >= 1);
  assert.equal(fromGym, 1);
  assert.ok(fromDex + fromGym >= 3);
});
test("belum mencapai target → tidak ada hadiah; progress menandai tercapai/diklaim", () => {
  const t = withCaught(14);
  assert.deepEqual(claimPokedexRewards(t), []);
  assert.ok(getRewardProgress(t).every((r) => !r.reached && !r.claimed));
});
test("mencapai target → hadiah masuk tas sekali saja (tidak bisa diklaim ulang)", () => {
  const t = withCaught(15);
  const before = I.getQty(t, "greatball");
  const first = claimPokedexRewards(t);
  assert.equal(first.length, 1);
  assert.equal(I.getQty(t, "greatball"), before + 5);
  assert.deepEqual(claimPokedexRewards(t), []);
  assert.equal(I.getQty(t, "greatball"), before + 5);
  assert.deepEqual(t.claimedRewards, ["dex15"]);
});
test("Master Ball didapat di 30 dan 40 spesies tertangkap", () => {
  const t = withCaught(30);
  claimPokedexRewards(t);
  assert.equal(I.getQty(t, "masterBall"), 1);
  t.pokedexCaught = Array.from({ length: 40 }, (_, i) => i + 1);
  const added = claimPokedexRewards(t);
  assert.equal(added.length, 1);
  assert.equal(I.getQty(t, "masterBall"), 2);
});
test("lompat banyak target sekaligus → semua hadiah diklaim", () => {
  const t = withCaught(40);
  assert.equal(claimPokedexRewards(t).length, pokedexRewards.length);
  assert.equal(I.getQty(t, "masterBall"), 2);
  assert.equal(I.getQty(t, "ultraBall"), 5);
});
test("save lama tanpa field claimedRewards tetap aman", () => {
  const t = withCaught(15);
  delete t.claimedRewards;
  assert.equal(claimPokedexRewards(t).length, 1);
  assert.deepEqual(t.claimedRewards, ["dex15"]);
});

console.log(`\n${passed} tes lolos.`);
