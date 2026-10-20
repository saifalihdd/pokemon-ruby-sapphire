import { CONFIG } from "../data/config.js";
import { items, findItem } from "../data/items.js";
import { isPositiveInteger } from "../utils/validation.js";
import { addItem, removeItem, getQty } from "./inventoryService.js";

const ok = (message) => ({ ok: true, message });
const fail = (message) => ({ ok: false, message });

export const getCatalog = () => items.filter((item) => item.price > 0);

export const getSellPrice = (item) => Math.floor(item.price * CONFIG.sellRatio);

export const buyItem = (trainer, itemId, qty) => {
  const item = getCatalog().find((entry) => entry.id === itemId);
  if (!item) return fail("Item itu tidak dijual di Poke Mart.");
  if (!isPositiveInteger(qty)) return fail("Jumlah harus bilangan bulat positif.");
  const total = item.price * qty;
  if (trainer.money < total) return fail(`Uang tidak cukup. Butuh ₽${total}, kamu punya ₽${trainer.money}.`);
  trainer.money -= total;
  addItem(trainer, itemId, qty);
  return ok(`Membeli ${item.name} x${qty} seharga ₽${total}.`);
};

export const sellItem = (trainer, itemId, qty) => {
  const item = findItem(itemId);
  if (!item || item.price <= 0) return fail("Item itu tidak bisa dijual.");
  if (!isPositiveInteger(qty)) return fail("Jumlah harus bilangan bulat positif.");
  if (getQty(trainer, itemId) < qty) return fail("Jumlah item di tas tidak cukup.");
  const total = getSellPrice(item) * qty;
  removeItem(trainer, itemId, qty);
  trainer.money += total;
  return ok(`Menjual ${item.name} x${qty} seharga ₽${total}.`);
};
