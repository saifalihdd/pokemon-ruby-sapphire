import { CONFIG } from "../data/config.js";
import { locatePokemon, updatePokemon } from "./trainerService.js";
import { displayName, isFainted } from "./pokemonFactory.js";

const ok = (message) => ({ ok: true, message });
const fail = (message) => ({ ok: false, message });

// Heal semua Pokemon di tim yang masih hidup (gratis). Yang pingsan perlu di-revive.
export const healParty = (trainer) => {
  const needHeal = trainer.party.filter((p) => !isFainted(p) && p.hp < p.maxHp);
  if (needHeal.length === 0) return fail("Semua Pokemon di timmu sudah sehat.");
  const cost = CONFIG.nurseHealCost * needHeal.length;
  if (trainer.money < cost) return fail(`Uang tidak cukup (butuh ₽${cost}).`);
  trainer.money -= cost;
  trainer.party = trainer.party.map((p) => (!isFainted(p) ? { ...p, hp: p.maxHp } : p));
  return ok(`${needHeal.length} Pokemon pulih sepenuhnya! Kami harap bisa bertemu lagi!`);
};

// Revive satu Pokemon pingsan di tim: berbayar, HP kembali penuh.
export const revivePokemon = (trainer, uid) => {
  const found = locatePokemon(trainer, uid);
  if (!found || found.where !== "party") return fail("Pokemon itu tidak ada di tim.");
  if (!isFainted(found.pokemon)) return fail(`${displayName(found.pokemon)} tidak pingsan.`);
  if (trainer.money < CONFIG.nurseReviveCost) {
    return fail(`Uang tidak cukup. Revive butuh ₽${CONFIG.nurseReviveCost}.`);
  }
  trainer.money -= CONFIG.nurseReviveCost;
  updatePokemon(trainer, uid, (p) => ({ ...p, hp: p.maxHp }));
  return ok(`${displayName(found.pokemon)} dihidupkan kembali dengan HP penuh! (-₽${CONFIG.nurseReviveCost})`);
};

// Semua Pokemon pingsan: uang berkurang, tim dipulihkan penuh (kembali ke Pokemon Center).
export const applyWhiteout = (trainer) => {
  const lost = Math.floor(trainer.money * CONFIG.whiteoutMoneyLossRatio);
  trainer.money -= lost;
  trainer.party = trainer.party.map((p) => ({ ...p, hp: p.maxHp }));
  return { lost };
};

// Revive semua Pokemon pingsan di tim sekaligus (berbayar per Pokemon, HP kembali penuh).
// Jika uang tidak cukup untuk semua, yang dihidupkan sebanyak yang mampu dibayar (urutan tim).
export const reviveAll = (trainer) => {
  const fainted = trainer.party.filter(isFainted);
  if (fainted.length === 0) return fail("Tidak ada Pokemon pingsan di timmu.");
  const affordable = Math.floor(trainer.money / CONFIG.nurseReviveCost);
  if (affordable === 0) return fail(`Uang tidak cukup. Revive butuh ₽${CONFIG.nurseReviveCost} per Pokemon.`);

  const revivedIds = fainted.slice(0, affordable).map((pokemon) => pokemon.uid);
  const cost = revivedIds.length * CONFIG.nurseReviveCost;
  trainer.money -= cost;
  trainer.party = trainer.party.map((pokemon) => (revivedIds.includes(pokemon.uid) ? { ...pokemon, hp: pokemon.maxHp } : pokemon));
  const remaining = fainted.length - revivedIds.length;
  return ok(`${revivedIds.length} Pokemon dihidupkan kembali dengan HP penuh! (-₽${cost})${remaining > 0 ? ` ${remaining} Pokemon belum, uang tidak cukup.` : ""}`);
};
