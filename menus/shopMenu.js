import { askNumber } from "../utils/input.js";
import { findItem } from "../data/items.js";
import { showMenu, printResult } from "./menuHelper.js";
import { getCatalog, getSellPrice, buyItem, sellItem } from "../services/shopService.js";
import { formatMoney } from "../ui/display.js";

const buyFlow = async (trainer) => {
  const catalog = getCatalog();
  console.log(`\nUangmu: ${formatMoney(trainer.money)}`);
  catalog.forEach((item, i) => console.log(` ${i + 1}. ${item.name.padEnd(14)} ${formatMoney(item.price).padEnd(7)} ${item.description}`));
  const choice = await askNumber("Beli nomor berapa (0 = batal): ", 0, catalog.length);
  if (choice === 0) return;
  const qty = await askNumber("Jumlah (1-99): ", 1, 99);
  printResult(buyItem(trainer, catalog[choice - 1].id, qty));
};

const sellFlow = async (trainer) => {
  const sellable = trainer.inventory
    .map((entry) => ({ ...findItem(entry.itemId), qty: entry.qty }))
    .filter((item) => item.price > 0);
  if (sellable.length === 0) {
    console.log("✖ Tidak ada item yang bisa dijual.");
    return;
  }
  sellable.forEach((item, i) => console.log(` ${i + 1}. ${item.name.padEnd(14)} x${item.qty}  jual ${formatMoney(getSellPrice(item))}/buah`));
  const choice = await askNumber("Jual nomor berapa (0 = batal): ", 0, sellable.length);
  if (choice === 0) return;
  const item = sellable[choice - 1];
  const qty = await askNumber(`Jumlah (1-${item.qty}): `, 1, item.qty);
  printResult(sellItem(trainer, item.id, qty));
};

export const shopMenu = async (trainer) => {
  console.log("\nKasir Poke Mart: \"Selamat datang! Ada yang bisa dibantu?\"");
  while (true) {
    const choice = await showMenu(`POKE MART  (Uang: ${formatMoney(trainer.money)})`, ["Beli", "Jual"]);
    if (choice === 1) await buyFlow(trainer);
    else if (choice === 2) await sellFlow(trainer);
    else return;
  }
};
