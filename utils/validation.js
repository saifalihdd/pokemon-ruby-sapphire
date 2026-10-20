import { CONFIG } from "../data/config.js";

export const isPositiveInteger = (value) => Number.isInteger(value) && value > 0;

export const isValidTrainerName = (name) => /^[A-Za-z0-9 ]{1,12}$/.test(name.trim()) && name.trim() !== "";

// Nickname boleh kosong (artinya: hapus nickname), selain itu 1..maks karakter.
export const isValidNickname = (name) => name.length <= CONFIG.nicknameMaxLength && /^[A-Za-z0-9 _-]*$/.test(name);

export const isIndexInRange = (index, length) => Number.isInteger(index) && index >= 0 && index < length;

// Cek bentuk minimal data save agar file rusak tidak membuat program crash.
export const isValidSave = (data) =>
  data !== null &&
  typeof data === "object" &&
  typeof data.name === "string" &&
  typeof data.money === "number" &&
  Array.isArray(data.party) &&
  Array.isArray(data.pc) &&
  Array.isArray(data.inventory) &&
  Array.isArray(data.pokedexSeen) &&
  Array.isArray(data.pokedexCaught) &&
  Array.isArray(data.badges) &&
  typeof data.nextUid === "number";
