import assert from "node:assert/strict";
import { setRng } from "../utils/random.js";
import { findItem } from "../data/items.js";
import { findSpecies } from "../data/pokedex.js";
import { CONFIG } from "../data/config.js";
import { createPokemon, getExp } from "../services/pokemonFactory.js";
import * as T from "../services/trainerService.js";
import * as I from "../services/inventoryService.js";
import * as E from "../services/equipmentService.js";
import * as B from "../services/battleService.js";
import { getCatalog, sellItem } from "../services/shopService.js";
import { calcExpYield } from "../services/levelingService.js";

let passed = 0;
const test = (name, fn) => {
  setRng(Math.random);
  fn();
  passed += 1;
  console.log(`  ok  ${name}`);
};
// Tim 3 Pokemon: A (bertarung), B dan C (cadangan di tim).
const team = () => {
  const t = T.createTrainer("Nadia");
  [252, 255, 258].forEach((id) => T.addPokemon(t, createPokemon(id, 20)));
  return t;
};
const killFoe = (t, foeLevel = 5) => {
  const b = B.createBattle(t, [{ ...createPokemon(263, foeLevel), hp: 1 }], { kind: "wild" });
  setRng(() => 0);
  B.resolveTurn(b, t, { type: "move", moveId: "pound" });
  assert.equal(b.result, "win");
  return b;
};
const total = (foeLevel = 5) => calcExpYield({ level: foeLevel }, findSpecies(263).baseStats, false);
const gain = (t, i, before) => getExp(t.party[i]) - before[i];
const snapshot = (t) => t.party.map(getExp);

console.log("ITEM & EQUIP (ke trainer)");
test("Exp. Share ada di tas awal, bertipe 'equip', tidak dijual, awalnya nonaktif", () => {
  const t = T.createTrainer("Nadia");
  assert.equal(I.getQty(t, "expShare"), 1);
  assert.equal(findItem("expShare").kind, "equip");
  assert.equal(getCatalog().some((item) => item.id === "expShare"), false);
  assert.equal(sellItem(t, "expShare", 1).ok, false);
  assert.equal(E.isEquipped(t, "expShare"), false);
});
test("equip & unequip mengubah status; item TETAP ada di tas", () => {
  const t = T.createTrainer("Nadia");
  assert.ok(E.equipItem(t, "expShare").ok);
  assert.equal(E.isEquipped(t, "expShare"), true);
  assert.equal(I.getQty(t, "expShare"), 1);
  assert.ok(E.unequipItem(t, "expShare").ok);
  assert.equal(E.isEquipped(t, "expShare"), false);
  assert.equal(I.getQty(t, "expShare"), 1);
});
test("toggleEquip bolak-balik", () => {
  const t = T.createTrainer("Nadia");
  E.toggleEquip(t, "expShare");
  assert.equal(E.isEquipped(t, "expShare"), true);
  E.toggleEquip(t, "expShare");
  assert.equal(E.isEquipped(t, "expShare"), false);
});
test("validasi: dobel equip, unequip saat belum terpasang, bukan item equip, tidak punya item", () => {
  const t = T.createTrainer("Nadia");
  assert.equal(E.unequipItem(t, "expShare").ok, false);
  E.equipItem(t, "expShare");
  assert.equal(E.equipItem(t, "expShare").ok, false);
  assert.equal(E.equipItem(t, "potion").ok, false);
  assert.equal(E.equipItem(t, "ghost").ok, false);
  const empty = T.createTrainer("X");
  I.removeItem(empty, "expShare", 1);
  assert.equal(E.equipItem(empty, "expShare").ok, false);
});
test("save lama tanpa field 'equipped' tetap aman", () => {
  const t = T.createTrainer("Nadia");
  delete t.equipped;
  assert.equal(E.isEquipped(t, "expShare"), false);
  assert.ok(E.equipItem(t, "expShare").ok);
  delete t.equipped;
  assert.equal(E.unequipItem(t, "expShare").ok, false);
});

console.log("PEMBAGIAN EXP");
test("NONAKTIF: hanya yang bertarung dapat EXP", () => {
  const t = team();
  const before = snapshot(t);
  killFoe(t);
  assert.equal(gain(t, 0, before), total());
  assert.equal(gain(t, 1, before), 0);
  assert.equal(gain(t, 2, before), 0);
});
test("AKTIF: seluruh Pokemon hidup di tim dapat EXP; penyerta dapat 50% dari yang bertarung", () => {
  const t = team();
  E.equipItem(t, "expShare");
  const before = snapshot(t);
  killFoe(t);
  assert.equal(gain(t, 0, before), total());
  assert.equal(gain(t, 1, before), Math.floor(total() * CONFIG.expShareRatio));
  assert.equal(gain(t, 2, before), Math.floor(total() * CONFIG.expShareRatio));
});
test("AKTIF: Pokemon pingsan di tim tidak dapat EXP", () => {
  const t = team();
  E.equipItem(t, "expShare");
  T.updatePokemon(t, t.party[1].uid, (p) => ({ ...p, hp: 0 }));
  const before = snapshot(t);
  killFoe(t);
  assert.equal(gain(t, 1, before), 0);
  assert.ok(gain(t, 2, before) > 0);
});
test("AKTIF: Pokemon di PC TIDAK dapat EXP", () => {
  const t = team();
  E.equipItem(t, "expShare");
  T.depositPokemon(t, t.party[2].uid);
  const pcBefore = getExp(t.pc[0]);
  killFoe(t);
  assert.equal(getExp(t.pc[0]), pcBefore);
});
test("AKTIF lalu dilepas: kembali hanya yang bertarung", () => {
  const t = team();
  E.equipItem(t, "expShare");
  E.unequipItem(t, "expShare");
  const before = snapshot(t);
  killFoe(t);
  assert.equal(gain(t, 1, before), 0);
});
test("jika yang bertarung ganti-ganti: peserta dapat bagian penuh dibagi rata, sisanya 50%", () => {
  const t = team();
  E.equipItem(t, "expShare");
  const b = B.createBattle(t, [{ ...createPokemon(263, 5), hp: 1 }], { kind: "wild" });
  B.resolveTurn(b, t, { type: "switch", uid: t.party[1].uid }); // A dan B sama-sama ikut
  const before = snapshot(t);
  setRng(() => 0);
  B.resolveTurn(b, t, { type: "move", moveId: "scratch" });
  assert.equal(b.result, "win");
  const perFighter = Math.floor(total() / 2);
  assert.equal(gain(t, 0, before), perFighter);
  assert.equal(gain(t, 1, before), perFighter);
  assert.equal(gain(t, 2, before), Math.floor(perFighter * CONFIG.expShareRatio));
});
test("penerima Exp. Share bisa naik level & memicu evolusi", () => {
  const t = T.createTrainer("Nadia");
  T.addPokemon(t, createPokemon(252, 20));
  T.addPokemon(t, createPokemon(255, 15));
  E.equipItem(t, "expShare");
  T.updatePokemon(t, t.party[1].uid, (p) => ({ ...p, exp: 16 ** 3 - 1 }));
  const b = killFoe(t);
  assert.equal(t.party[1].level, 16);
  assert.ok(b.pendingEvolutions.includes(t.party[1].uid));
});
test("event battle menandai EXP dari Exp. Share", () => {
  const t = team();
  E.equipItem(t, "expShare");
  const b = B.createBattle(t, [{ ...createPokemon(263, 5), hp: 1 }], { kind: "wild" });
  setRng(() => 0);
  const { events } = B.resolveTurn(b, t, { type: "move", moveId: "pound" });
  assert.equal(events.filter((e) => typeof e === "string" && e.includes("(Exp. Share)")).length, 2);
});

console.log(`\n${passed} tes lolos.`);
