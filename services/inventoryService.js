import { findItem } from "../data/items.js";
import { isPositiveInteger } from "../utils/validation.js";
import { locatePokemon, updatePokemon } from "./trainerService.js";
import { displayName, isFainted, withLevel } from "./pokemonFactory.js";
import { CONFIG } from "../data/config.js";

const ok = (message, extra = {}) => ({ ok: true, message, ...extra });
const fail = (message) => ({ ok: false, message });

// ---------- READ ----------
export const getQty = (trainer, itemId) => trainer.inventory.find((entry) => entry.itemId === itemId)?.qty ?? 0;

// ---------- CREATE ----------
export const addItem = (trainer, itemId, qty) => {
  if (!findItem(itemId)) return fail(`Item ${itemId} tidak dikenal.`);
  if (!isPositiveInteger(qty)) return fail("Jumlah harus bilangan bulat positif.");
  const exists = trainer.inventory.some((entry) => entry.itemId === itemId);
  trainer.inventory = exists
    ? trainer.inventory.map((entry) => (entry.itemId === itemId ? { ...entry, qty: entry.qty + qty } : entry))
    : [...trainer.inventory, { itemId, qty }];
  return ok(`${findItem(itemId).name} x${qty} ditambahkan ke tas.`);
};

// ---------- DELETE (otomatis hapus entri jika qty jadi 0) ----------
export const removeItem = (trainer, itemId, qty) => {
  if (!isPositiveInteger(qty)) return fail("Jumlah harus bilangan bulat positif.");
  if (getQty(trainer, itemId) < qty) return fail("Jumlah item tidak cukup.");
  trainer.inventory = trainer.inventory
    .map((entry) => (entry.itemId === itemId ? { ...entry, qty: entry.qty - qty } : entry))
    .filter((entry) => entry.qty > 0);
  return ok("Item dikurangi.");
};

// ---------- UPDATE: pakai item pada Pokemon (di luar battle) ----------
export const useItemOnPokemon = (trainer, itemId, uid) => {
  const item = findItem(itemId);
  const found = locatePokemon(trainer, uid);
  if (!item) return fail("Item tidak dikenal.");
  if (!found) return fail("Pokemon tidak ditemukan.");
  if (getQty(trainer, itemId) < 1) return fail(`Kamu tidak punya ${item.name}.`);

  const { pokemon } = found;
  const name = displayName(pokemon);

  switch (item.kind) {
    case "heal": {
      if (isFainted(pokemon)) return fail(`${name} pingsan! Gunakan Revive atau ke Nurse Joy.`);
      if (pokemon.hp === pokemon.maxHp) return fail(`HP ${name} sudah penuh.`);
      const newHp = Math.min(pokemon.maxHp, pokemon.hp + item.heal);
      updatePokemon(trainer, uid, (p) => ({ ...p, hp: newHp }));
      removeItem(trainer, itemId, 1);
      return ok(`${name} pulih ${newHp - pokemon.hp} HP (${newHp}/${pokemon.maxHp}).`);
    }
    case "revive": {
      if (!isFainted(pokemon)) return fail(`${name} tidak pingsan.`);
      const newHp = Math.max(1, Math.floor(pokemon.maxHp / 2));
      updatePokemon(trainer, uid, (p) => ({ ...p, hp: newHp }));
      removeItem(trainer, itemId, 1);
      return ok(`${name} hidup kembali dengan ${newHp} HP!`);
    }
    case "candy": {
      if (isFainted(pokemon)) return fail(`${name} pingsan, tidak bisa memakai Rare Candy.`);
      if (pokemon.level >= CONFIG.maxLevel) return fail(`${name} sudah level maksimal.`);
      updatePokemon(trainer, uid, (p) => withLevel(p, p.level + 1));
      removeItem(trainer, itemId, 1);
      return ok(`${name} naik ke level ${pokemon.level + 1}!`);
    }
    default:
      return fail(`${item.name} tidak bisa dipakai di sini.`);
  }
};
