import assert from "node:assert/strict";
import { setRng } from "../utils/random.js";
import { findItem } from "../data/items.js";
import { findSpecies } from "../data/pokedex.js";
import { createPokemon, getExp } from "../services/pokemonFactory.js";
import * as T from "../services/trainerService.js";
import * as I from "../services/inventoryService.js";
import * as H from "../services/heldItemService.js";
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
// Tim 2 Pokemon: A (lead, bertarung) dan B (cadangan).
const teamOfTwo = () => {
  const t = T.createTrainer("Nadia");
  T.addPokemon(t, createPokemon(252, 20));
  T.addPokemon(t, createPokemon(255, 20));
  return t;
};
const killFoe = (t, foeSpecies = 263, foeLevel = 5) => {
  const b = B.createBattle(t, [{ ...createPokemon(foeSpecies, foeLevel), hp: 1 }], { kind: "wild" });
  setRng(() => 0);
  B.resolveTurn(b, t, { type: "move", moveId: "pound" });
  assert.equal(b.result, "win");
  return b;
};
const expTotal = (foeSpecies = 263, foeLevel = 5) => calcExpYield({ level: foeLevel }, findSpecies(foeSpecies).baseStats, false);

console.log("ITEM & EQUIP");
test("Exp. Share ada di tas awal, bertipe 'held', tidak dijual", () => {
  const t = T.createTrainer("Nadia");
  assert.equal(I.getQty(t, "expShare"), 1);
  assert.equal(findItem("expShare").kind, "held");
  assert.equal(getCatalog().some((item) => item.id === "expShare"), false);
  assert.equal(sellItem(t, "expShare", 1).ok, false);
});
test("equip: item keluar dari tas, masuk ke Pokemon; unequip mengembalikannya", () => {
  const t = teamOfTwo();
  const uid = t.party[1].uid;
  assert.ok(H.equipItem(t, "expShare", uid).ok);
  assert.equal(t.party[1].heldItem, "expShare");
  assert.equal(I.getQty(t, "expShare"), 0);
  assert.equal(t.inventory.some((e) => e.itemId === "expShare"), false);
  assert.ok(H.unequipItem(t, uid).ok);
  assert.equal(t.party[1].heldItem, null);
  assert.equal(I.getQty(t, "expShare"), 1);
});
test("equip ditolak: tidak punya item / bukan item pegangan / di PC / sudah memegang", () => {
  const t = teamOfTwo();
  assert.equal(H.equipItem(t, "potion", t.party[0].uid).ok, false);
  assert.equal(H.equipItem(t, "expShare", "P999").ok, false);
  assert.ok(H.equipItem(t, "expShare", t.party[0].uid).ok);
  assert.equal(H.equipItem(t, "expShare", t.party[0].uid).ok, false); // sudah memegang & tas kosong
  I.addItem(t, "expShare", 1);
  assert.equal(H.equipItem(t, "expShare", t.party[0].uid).ok, false); // satu Pokemon satu item
  T.depositPokemon(t, t.party[1].uid);
  assert.equal(H.equipItem(t, "expShare", t.pc[0].uid).ok, false); // hanya Pokemon di tim
});
test("unequip ditolak jika tidak memegang apa pun", () => {
  const t = teamOfTwo();
  assert.equal(H.unequipItem(t, t.party[0].uid).ok, false);
  assert.equal(H.unequipItem(t, "P999").ok, false);
});
test("release Pokemon pemegang: item kembali ke tas", () => {
  const t = teamOfTwo();
  H.equipItem(t, "expShare", t.party[1].uid);
  assert.equal(I.getQty(t, "expShare"), 0);
  assert.ok(T.releasePokemon(t, t.party[1].uid).ok);
  assert.equal(I.getQty(t, "expShare"), 1);
});
test("Pokemon save lama (tanpa field heldItem) tetap aman", () => {
  const t = teamOfTwo();
  delete t.party[0].heldItem;
  assert.ok(H.equipItem(t, "expShare", t.party[0].uid).ok);
  assert.ok(H.unequipItem(t, t.party[0].uid).ok);
});

console.log("PEMBAGIAN EXP");
test("tanpa Exp. Share: yang bertarung dapat EXP penuh, cadangan nol", () => {
  const t = teamOfTwo();
  const [a0, b0] = [getExp(t.party[0]), getExp(t.party[1])];
  killFoe(t);
  assert.equal(getExp(t.party[0]) - a0, expTotal());
  assert.equal(getExp(t.party[1]), b0);
});
test("dengan Exp. Share di cadangan: bertarung dapat separuh, pemegang dapat sisanya", () => {
  const t = teamOfTwo();
  H.equipItem(t, "expShare", t.party[1].uid);
  const [a0, b0] = [getExp(t.party[0]), getExp(t.party[1])];
  const total = expTotal();
  killFoe(t);
  assert.equal(getExp(t.party[0]) - a0, Math.floor(total / 2));
  assert.equal(getExp(t.party[1]) - b0, total - Math.floor(total / 2));
});
test("pemegang yang juga bertarung dapat kedua bagian (total penuh)", () => {
  const t = teamOfTwo();
  H.equipItem(t, "expShare", t.party[0].uid);
  const [a0, b0] = [getExp(t.party[0]), getExp(t.party[1])];
  killFoe(t);
  assert.equal(getExp(t.party[0]) - a0, expTotal());
  assert.equal(getExp(t.party[1]), b0);
});
test("pemegang pingsan tidak dapat EXP", () => {
  const t = teamOfTwo();
  H.equipItem(t, "expShare", t.party[1].uid);
  T.updatePokemon(t, t.party[1].uid, (p) => ({ ...p, hp: 0 }));
  const b0 = getExp(t.party[1]);
  killFoe(t);
  assert.equal(getExp(t.party[1]), b0);
});
test("pemegang di PC tidak dapat EXP", () => {
  const t = teamOfTwo();
  T.addPokemon(t, createPokemon(258, 20));
  H.equipItem(t, "expShare", t.party[2].uid);
  T.depositPokemon(t, t.party[2].uid); // item ikut ke PC
  const b0 = getExp(t.pc[0]);
  killFoe(t);
  assert.equal(getExp(t.pc[0]), b0);
});
test("pemegang cadangan bisa naik level & memicu evolusi via Exp. Share", () => {
  const t = T.createTrainer("Nadia");
  T.addPokemon(t, createPokemon(252, 20));
  T.addPokemon(t, createPokemon(255, 15));
  H.equipItem(t, "expShare", t.party[1].uid);
  T.updatePokemon(t, t.party[1].uid, (p) => ({ ...p, exp: 16 ** 3 - 1 })); // 1 EXP lagi menuju Lv16
  const b = killFoe(t);
  assert.equal(t.party[1].level, 16);
  assert.ok(b.pendingEvolutions.includes(t.party[1].uid));
});
test("event battle menandai EXP dari Exp. Share", () => {
  const t = teamOfTwo();
  H.equipItem(t, "expShare", t.party[1].uid);
  const b = B.createBattle(t, [{ ...createPokemon(263, 5), hp: 1 }], { kind: "wild" });
  setRng(() => 0);
  const { events } = B.resolveTurn(b, t, { type: "move", moveId: "pound" });
  assert.ok(events.some((e) => typeof e === "string" && e.includes("(Exp. Share)")));
});

console.log(`\n${passed} tes lolos.`);
