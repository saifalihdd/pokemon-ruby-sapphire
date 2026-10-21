import { findItem } from "../data/items.js";
import { getQty } from "./inventoryService.js";

const ok = (message) => ({ ok: true, message });
const fail = (message) => ({ ok: false, message });

// Item "equip" dipasang ke TRAINER (bukan ke Pokemon). Item tetap ada di tas, hanya status aktifnya yang berubah.
export const isEquipped = (trainer, itemId) => (trainer.equipped ?? []).includes(itemId);

export const equipItem = (trainer, itemId) => {
  const item = findItem(itemId);
  if (!item || item.kind !== "equip") return fail("Item itu tidak bisa dipasang.");
  if (getQty(trainer, itemId) < 1) return fail(`Kamu tidak punya ${item.name} di tas.`);
  if (isEquipped(trainer, itemId)) return fail(`${item.name} sudah terpasang.`);
  trainer.equipped = [...(trainer.equipped ?? []), itemId];
  return ok(`${item.name} dipasang (AKTIF).`);
};

export const unequipItem = (trainer, itemId) => {
  const item = findItem(itemId);
  if (!item || item.kind !== "equip") return fail("Item itu tidak bisa dilepas.");
  if (!isEquipped(trainer, itemId)) return fail(`${item.name} belum terpasang.`);
  trainer.equipped = trainer.equipped.filter((id) => id !== itemId);
  return ok(`${item.name} dilepas (nonaktif).`);
};

export const toggleEquip = (trainer, itemId) => (isEquipped(trainer, itemId) ? unequipItem(trainer, itemId) : equipItem(trainer, itemId));
