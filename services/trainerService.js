import { CONFIG } from "../data/config.js";
import { displayName } from "./pokemonFactory.js";
import { isValidNickname, isIndexInRange } from "../utils/validation.js";

const ok = (message, extra = {}) => ({ ok: true, message, ...extra });
const fail = (message) => ({ ok: false, message });

// Mengembalikan item yang dipegang sebuah Pokemon ke tas (dipakai saat unequip / release).
export const returnHeldItem = (trainer, pokemon) => {
  if (!pokemon.heldItem) return;
  const exists = trainer.inventory.some((entry) => entry.itemId === pokemon.heldItem);
  trainer.inventory = exists
    ? trainer.inventory.map((entry) => (entry.itemId === pokemon.heldItem ? { ...entry, qty: entry.qty + 1 } : entry))
    : [...trainer.inventory, { itemId: pokemon.heldItem, qty: 1 }];
};

const addUnique = (list, value) => (list.includes(value) ? list : [...list, value]);

// ---------- CREATE ----------
export const createTrainer = (name) => ({
  name: name.trim(),
  money: CONFIG.startMoney,
  party: [],
  pc: [],
  inventory: CONFIG.startItems.map((item) => ({ ...item })),
  pokedexSeen: [],
  pokedexCaught: [],
  badges: [],
  nextUid: 1,
});

export const registerSeen = (trainer, speciesId) => {
  trainer.pokedexSeen = addUnique(trainer.pokedexSeen, speciesId);
};

// Menambah Pokemon ke tim (jika ada slot) atau ke PC.
export const addPokemon = (trainer, pokemon) => {
  const uid = `P${String(trainer.nextUid).padStart(3, "0")}`;
  const owned = { ...pokemon, uid };
  trainer.nextUid += 1;
  const destination = trainer.party.length < CONFIG.partyMax ? "party" : "pc";
  trainer[destination] = [...trainer[destination], owned];
  trainer.pokedexSeen = addUnique(trainer.pokedexSeen, owned.speciesId);
  trainer.pokedexCaught = addUnique(trainer.pokedexCaught, owned.speciesId);
  return { pokemon: owned, destination };
};

// ---------- READ ----------
export const locatePokemon = (trainer, uid) => {
  for (const where of ["party", "pc"]) {
    const index = trainer[where].findIndex((p) => p.uid === uid);
    if (index !== -1) return { where, index, pokemon: trainer[where][index] };
  }
  return null;
};

export const getAllPokemon = (trainer) => [...trainer.party, ...trainer.pc];

export const hasUsablePokemon = (trainer) => trainer.party.some((p) => p.hp > 0);

// Whiteout: SEMUA Pokemon di tim sudah pingsan.
export const isPartyWiped = (trainer) => trainer.party.every((p) => p.hp <= 0);

// ---------- UPDATE ----------
// Mengganti satu Pokemon (di tim atau PC) dengan hasil updater, tanpa mutasi objek lama.
export const updatePokemon = (trainer, uid, updater) => {
  const found = locatePokemon(trainer, uid);
  if (!found) return fail(`Pokemon dengan ID ${uid} tidak ditemukan.`);
  trainer[found.where] = trainer[found.where].map((p) => (p.uid === uid ? updater(p) : p));
  return ok("Data Pokemon diperbarui.");
};

export const renamePokemon = (trainer, uid, rawName) => {
  const name = rawName.trim();
  if (!isValidNickname(name)) {
    return fail(`Nickname maksimal ${CONFIG.nicknameMaxLength} karakter (huruf, angka, spasi, _ atau -).`);
  }
  const result = updatePokemon(trainer, uid, (p) => ({ ...p, nickname: name === "" ? null : name }));
  if (!result.ok) return result;
  return ok(name === "" ? "Nickname dihapus." : `Nickname diganti menjadi ${name}.`);
};

export const swapParty = (trainer, i, j) => {
  const { party } = trainer;
  if (!isIndexInRange(i, party.length) || !isIndexInRange(j, party.length)) return fail("Posisi tidak valid.");
  if (i === j) return fail("Pilih dua posisi yang berbeda.");
  const next = [...party];
  [next[i], next[j]] = [next[j], next[i]];
  trainer.party = next;
  return ok(`${displayName(party[i])} dan ${displayName(party[j])} bertukar posisi.`);
};

export const depositPokemon = (trainer, uid) => {
  const found = locatePokemon(trainer, uid);
  if (!found || found.where !== "party") return fail("Pokemon itu tidak ada di tim.");
  if (trainer.party.length <= 1) return fail("Tim tidak boleh kosong! Simpan minimal 1 Pokemon di tim.");
  trainer.party = trainer.party.filter((p) => p.uid !== uid);
  trainer.pc = [...trainer.pc, found.pokemon];
  return ok(`${displayName(found.pokemon)} dikirim ke PC.`);
};

export const withdrawPokemon = (trainer, uid) => {
  const found = locatePokemon(trainer, uid);
  if (!found || found.where !== "pc") return fail("Pokemon itu tidak ada di PC.");
  if (trainer.party.length >= CONFIG.partyMax) return fail(`Tim sudah penuh (maks ${CONFIG.partyMax}).`);
  trainer.pc = trainer.pc.filter((p) => p.uid !== uid);
  trainer.party = [...trainer.party, found.pokemon];
  return ok(`${displayName(found.pokemon)} diambil dari PC ke tim.`);
};

// ---------- DELETE ----------
export const releasePokemon = (trainer, uid) => {
  const found = locatePokemon(trainer, uid);
  if (!found) return fail("Pokemon tidak ditemukan.");
  if (found.where === "party" && trainer.party.length <= 1) {
    return fail("Tidak bisa melepas Pokemon terakhir di tim!");
  }
  returnHeldItem(trainer, found.pokemon);
  trainer[found.where] = trainer[found.where].filter((p) => p.uid !== uid);
  return ok(`${displayName(found.pokemon)} dilepas ke alam liar. Selamat tinggal!`);
};
