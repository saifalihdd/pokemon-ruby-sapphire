import fs from "node:fs";
import { CONFIG } from "../data/config.js";
import { isValidSave } from "./validation.js";

const savePath = new URL(`../${CONFIG.saveFile}`, import.meta.url);

export const hasSave = () => fs.existsSync(savePath);

export const saveGame = (trainer) => {
  fs.writeFileSync(savePath, JSON.stringify(trainer, null, 2));
};

// Mengembalikan null jika file tidak ada / rusak.
export const loadGame = () => {
  if (!hasSave()) return null;
  try {
    const data = JSON.parse(fs.readFileSync(savePath, "utf-8"));
    return isValidSave(data) ? data : null;
  } catch {
    return null;
  }
};

export const deleteSave = () => {
  if (hasSave()) fs.unlinkSync(savePath);
};
