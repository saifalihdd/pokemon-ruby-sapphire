import { CONFIG } from "../data/config.js";
import { legendaries, findLegendary } from "../data/legendaries.js";
import { createPokemon } from "./pokemonFactory.js";
import { hasUsablePokemon, registerSeen } from "./trainerService.js";
import { createBattle } from "./battleService.js";

// Status satu legendary: "available" (belum ditemui/ bisa ditemui lagi), "caught", atau "defeated" (hilang selamanya).
export const getLegendaryStatus = (trainer, legendary) => trainer.legendaries?.[legendary.id] ?? "available";

export const isLegendaryAreaUnlocked = (trainer) => trainer.badges.length >= CONFIG.legendaryMinBadges;

export const listLegendaries = (trainer) => legendaries.map((legendary) => ({ legendary, status: getLegendaryStatus(trainer, legendary) }));

export const countCaughtLegendaries = (trainer) => Object.values(trainer.legendaries ?? {}).filter((status) => status === "caught").length;

export const startLegendaryBattle = (trainer, legendaryId) => {
  const legendary = findLegendary(legendaryId);
  if (!legendary) return { ok: false, message: "Legendary tidak ditemukan." };
  if (!isLegendaryAreaUnlocked(trainer)) {
    return { ok: false, message: `Lokasi ini terkunci. Kumpulkan ${CONFIG.legendaryMinBadges} badge dulu (kamu punya ${trainer.badges.length}).` };
  }
  const status = getLegendaryStatus(trainer, legendary);
  if (status === "caught") return { ok: false, message: "Kamu sudah menangkap legendary ini." };
  if (status === "defeated") return { ok: false, message: "Legendary ini sudah menghilang selamanya setelah kamu kalahkan." };
  if (!hasUsablePokemon(trainer)) return { ok: false, message: "Semua Pokemon-mu pingsan! Ke Pokemon Center dulu." };

  const foe = createPokemon(legendary.speciesId, legendary.level);
  registerSeen(trainer, foe.speciesId);
  return { ok: true, legendary, battle: createBattle(trainer, [foe], { kind: "wild", legendaryId: legendary.id }) };
};
