import assert from "node:assert/strict";
import { pokedex, findSpecies } from "../data/pokedex.js";
import { moves, findMove, getMoveCategory } from "../data/moves.js";
import { areas } from "../data/areas.js";
import { CONFIG } from "../data/config.js";
import { createPokemon, calcMaxHp } from "../services/pokemonFactory.js";
import * as T from "../services/trainerService.js";
import * as I from "../services/inventoryService.js";
import * as S from "../services/shopService.js";
import * as N from "../services/nurseService.js";
import * as E from "../services/encounterService.js";
import { setRng } from "../utils/random.js";

let passed = 0;
const test = (name, fn) => {
  fn();
  passed += 1;
  console.log(`  ok  ${name}`);
};
const newTrainer = () => {
  const t = T.createTrainer("Nadia");
  T.addPokemon(t, createPokemon(252, 5));
  return t;
};

console.log("DATA");
test("setiap spesies punya tepat 4 move yang valid", () => {
  pokedex.forEach((s) => {
    assert.equal(s.moves.length, 4, s.name);
    s.moves.forEach((id) => assert.ok(findMove(id), `${s.name}: move ${id}`));
  });
});
test("id spesies & id move unik", () => {
  assert.equal(new Set(pokedex.map((s) => s.id)).size, pokedex.length);
  assert.equal(new Set(moves.map((m) => m.id)).size, moves.length);
});
test("encounter area merujuk spesies yang ada & level valid", () => {
  areas.forEach((a) => a.encounters.forEach((e) => {
    assert.ok(findSpecies(e.speciesId), `${a.name}: ${e.speciesId}`);
    assert.ok(e.minLevel <= e.maxLevel);
  }));
});
test("ada tepat 3 starter", () => assert.equal(pokedex.filter((s) => s.starter).length, 3));
test("kategori move mengikuti tipe (Gen 3)", () => {
  assert.equal(getMoveCategory(findMove("ember")), "special");
  assert.equal(getMoveCategory(findMove("tackle")), "physical");
  assert.equal(getMoveCategory(findMove("growl")), "status");
});
test("rumus HP Gen 3: Treecko Lv5 = 19", () => assert.equal(calcMaxHp(40, 5), 19));

console.log("TRAINER (CRUD Pokemon)");
test("addPokemon: tim dulu, lalu PC jika penuh", () => {
  const t = newTrainer();
  for (let i = 0; i < 5; i++) T.addPokemon(t, createPokemon(263, 3));
  assert.equal(t.party.length, 6);
  const r = T.addPokemon(t, createPokemon(261, 3));
  assert.equal(r.destination, "pc");
  assert.equal(t.pc.length, 1);
});
test("uid unik & pokedex tercatat", () => {
  const t = newTrainer();
  T.addPokemon(t, createPokemon(263, 3));
  assert.notEqual(t.party[0].uid, t.party[1].uid);
  assert.deepEqual(t.pokedexCaught.sort(), [252, 263]);
});
test("rename valid, kosong = hapus, terlalu panjang ditolak", () => {
  const t = newTrainer();
  const uid = t.party[0].uid;
  assert.ok(T.renamePokemon(t, uid, "Rex").ok);
  assert.equal(t.party[0].nickname, "Rex");
  assert.ok(T.renamePokemon(t, uid, "").ok);
  assert.equal(t.party[0].nickname, null);
  assert.equal(T.renamePokemon(t, uid, "x".repeat(30)).ok, false);
  assert.equal(T.renamePokemon(t, "P999", "A").ok, false);
});
test("swapParty valid & invalid", () => {
  const t = newTrainer();
  T.addPokemon(t, createPokemon(263, 3));
  const [a, b] = t.party;
  assert.ok(T.swapParty(t, 0, 1).ok);
  assert.deepEqual([t.party[0].uid, t.party[1].uid], [b.uid, a.uid]);
  assert.equal(T.swapParty(t, 0, 0).ok, false);
  assert.equal(T.swapParty(t, 0, 9).ok, false);
});
test("deposit: tim tidak boleh kosong; withdraw: tim penuh ditolak", () => {
  const t = newTrainer();
  assert.equal(T.depositPokemon(t, t.party[0].uid).ok, false);
  T.addPokemon(t, createPokemon(263, 3));
  const uid = t.party[1].uid;
  assert.ok(T.depositPokemon(t, uid).ok);
  assert.equal(t.pc.length, 1);
  assert.ok(T.withdrawPokemon(t, uid).ok);
  for (let i = 0; i < 5; i++) T.addPokemon(t, createPokemon(263, 3)); // tim jadi 6, sisanya PC
  assert.equal(T.withdrawPokemon(t, t.pc[0].uid).ok, false);
});
test("release: Pokemon terakhir di tim dilarang", () => {
  const t = newTrainer();
  assert.equal(T.releasePokemon(t, t.party[0].uid).ok, false);
  T.addPokemon(t, createPokemon(263, 3));
  assert.ok(T.releasePokemon(t, t.party[1].uid).ok);
  assert.equal(t.party.length, 1);
});

console.log("INVENTORY & SHOP");
test("start inventory sesuai config; addItem/removeItem hapus entri qty 0", () => {
  const t = newTrainer();
  assert.equal(I.getQty(t, "pokeball"), 5);
  I.removeItem(t, "potion", 2);
  assert.equal(I.getQty(t, "potion"), 0);
  assert.equal(t.inventory.some((e) => e.itemId === "potion"), false);
  assert.equal(I.removeItem(t, "potion", 1).ok, false);
  assert.equal(I.addItem(t, "ghost", 1).ok, false);
  assert.equal(I.addItem(t, "potion", -1).ok, false);
  assert.equal(I.addItem(t, "potion", 1.5).ok, false);
});
test("potion: heal, tolak jika HP penuh / pingsan", () => {
  const t = newTrainer();
  const uid = t.party[0].uid;
  assert.equal(I.useItemOnPokemon(t, "potion", uid).ok, false); // HP penuh
  T.updatePokemon(t, uid, (p) => ({ ...p, hp: 5 }));
  assert.ok(I.useItemOnPokemon(t, "potion", uid).ok);
  assert.equal(t.party[0].hp, t.party[0].maxHp); // min(maxHp, 5+20)
  assert.equal(I.getQty(t, "potion"), 1);
  T.updatePokemon(t, uid, (p) => ({ ...p, hp: 0 }));
  assert.equal(I.useItemOnPokemon(t, "potion", uid).ok, false);
});
test("revive & rare candy", () => {
  const t = newTrainer();
  const uid = t.party[0].uid;
  I.addItem(t, "revive", 1);
  I.addItem(t, "rareCandy", 1);
  assert.equal(I.useItemOnPokemon(t, "revive", uid).ok, false); // tidak pingsan
  const before = t.party[0];
  assert.ok(I.useItemOnPokemon(t, "rareCandy", uid).ok);
  assert.equal(t.party[0].level, 6);
  assert.ok(t.party[0].maxHp > before.maxHp);
  assert.equal(before.level, 5); // objek lama tidak dimutasi
  T.updatePokemon(t, uid, (p) => ({ ...p, hp: 0 }));
  assert.ok(I.useItemOnPokemon(t, "revive", uid).ok);
  assert.equal(t.party[0].hp, Math.floor(t.party[0].maxHp / 2));
});
test("beli: uang kurang ditolak, sukses mengurangi uang", () => {
  const t = newTrainer();
  assert.equal(S.buyItem(t, "revive", 99).ok, false);
  assert.equal(S.buyItem(t, "rareCandy", 1).ok, false); // tidak dijual
  assert.equal(S.buyItem(t, "pokeball", 0).ok, false);
  assert.ok(S.buyItem(t, "pokeball", 3).ok);
  assert.equal(t.money, CONFIG.startMoney - 600);
  assert.equal(I.getQty(t, "pokeball"), 8);
});
test("jual: harga setengah, tidak bisa jual melebihi stok", () => {
  const t = newTrainer();
  assert.equal(S.sellItem(t, "potion", 3).ok, false);
  assert.ok(S.sellItem(t, "potion", 2).ok);
  assert.equal(t.money, CONFIG.startMoney + 300);
});

console.log("NURSE JOY");
test("heal gratis hanya untuk yang hidup; tolak jika semua sehat", () => {
  const t = newTrainer();
  assert.equal(N.healParty(t).ok, false);
  T.updatePokemon(t, t.party[0].uid, (p) => ({ ...p, hp: 3 }));
  assert.ok(N.healParty(t).ok);
  assert.equal(t.party[0].hp, t.party[0].maxHp);
  assert.equal(t.money, CONFIG.startMoney);
});
test("revive berbayar; uang kurang ditolak", () => {
  const t = newTrainer();
  const uid = t.party[0].uid;
  assert.equal(N.revivePokemon(t, uid).ok, false); // tidak pingsan
  T.updatePokemon(t, uid, (p) => ({ ...p, hp: 0 }));
  t.money = 100;
  assert.equal(N.revivePokemon(t, uid).ok, false);
  t.money = 1000;
  assert.ok(N.revivePokemon(t, uid).ok);
  assert.equal(t.money, 1000 - CONFIG.nurseReviveCost);
  assert.equal(t.party[0].hp, t.party[0].maxHp);
});

console.log("ENCOUNTER & CATCH");
test("rollWildPokemon: spesies & level sesuai area", () => {
  for (let i = 0; i < 200; i++) {
    const w = E.rollWildPokemon("route101");
    assert.ok([263, 261, 265].includes(w.speciesId));
    assert.ok(w.level >= 2 && w.level <= 4);
    assert.equal(w.hp, w.maxHp);
  }
});
test("rumus catch: HP rendah & Great Ball meningkatkan nilai", () => {
  const ball = { ballBonus: 1 };
  const great = { ballBonus: 1.5 };
  const full = createPokemon(309, 8); // Electrike, catchRate 120
  const hurt = { ...full, hp: 1 };
  assert.ok(E.calcCatchValue(hurt, ball) > E.calcCatchValue(full, ball));
  assert.ok(E.calcCatchValue(full, great) > E.calcCatchValue(full, ball));
  assert.equal(E.calcCatchValue(createPokemon(263, 3), { ballBonus: 255 }), 255);
});
test("attemptCatch deterministik: rng 0 → tertangkap, rng ~1 → gagal 0 goyangan", () => {
  const w = createPokemon(309, 8);
  setRng(() => 0);
  assert.deepEqual(E.attemptCatch(w, { ballBonus: 1 }), { caught: true, shakes: 3 });
  setRng(() => 0.999999);
  assert.deepEqual(E.attemptCatch(w, { ballBonus: 1 }), { caught: false, shakes: 0 });
  setRng(Math.random);
});
test("statistik: Zigzagoon full HP + Poke Ball tertangkap ±33% (sesuai rumus Gen 3)", () => {
  let caught = 0;
  const N_TRY = 20000;
  for (let i = 0; i < N_TRY; i++) if (E.attemptCatch(createPokemon(263, 3), { ballBonus: 1 }).caught) caught++;
  const rate = caught / N_TRY;
  assert.ok(rate > 0.30 && rate < 0.37, `rate=${rate}`);
});

console.log(`\n${passed} tes lolos.`);
