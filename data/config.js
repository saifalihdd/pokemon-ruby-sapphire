// Semua angka "balancing" game ada di sini supaya mudah disetel.
export const CONFIG = {
  partyMax: 6,
  maxLevel: 100,
  startMoney: 3000,
  startItems: [
    { itemId: "pokeball", qty: 5 },
    { itemId: "potion", qty: 2 },
    { itemId: "expShare", qty: 1 },
  ],
  nurseHealCost: 0, // heal semua Pokemon di tim: gratis
  nurseReviveCost: 300, // revive per Pokemon pingsan: berbayar
  sellRatio: 0.5, // harga jual = 50% harga beli
  nicknameMaxLength: 12,
  textDelayMs: Number(process.env.TEXT_DELAY ?? 600), // jeda animasi (0 = instan)
  saveFile: "savegame.json",
  // --- battle & ekonomi (Tahap 2)
  expMultiplier: 2, // pengali EXP agar progres tidak terlalu lama
  wildMoneyPerLevel: 15, // uang dari Pokemon liar = level x ini
  gymMoneyPerLevel: 100, // uang gym = level Pokemon terakhir x ini
  rematchMoneyRatio: 0.5, // tantang ulang gym: uang separuh, tanpa badge/item
  wildDropChance: 0.25, // peluang Pokemon liar menjatuhkan item
  whiteoutMoneyLossRatio: 0.5, // uang hilang saat semua Pokemon pingsan
};
