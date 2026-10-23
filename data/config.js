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
  // --- musik (opsional; game tetap jalan tanpa file musik)
  music: {
    enabled: process.env.MUSIC !== "off", // MUSIC=off untuk mematikan
    volume: Math.min(1, Math.max(0, Number(process.env.MUSIC_VOLUME ?? 0.5))), // 0.0 - 1.0
  },
  // --- battle & ekonomi (Tahap 2)
  legendaryMinBadges: 8, // badge minimal untuk membuka Lokasi Legendary
  legendaryPermanent: true, // true: legendary yang dikalahkan (pingsan) sebelum ditangkap hilang selamanya
  expShareRatio: 0.5, // saat Exp. Share aktif: Pokemon yang tidak bertarung dapat 50% dari bagian yang bertarung
  expMultiplier: 2, // pengali EXP agar progres tidak terlalu lama
  wildMoneyPerLevel: 15, // uang dari Pokemon liar = level x ini
  gymMoneyPerLevel: 100, // uang gym = level Pokemon terakhir x ini
  rematchMoneyRatio: 0.5, // tantang ulang gym: uang separuh, tanpa badge/item
  wildDropChance: 0.25, // peluang Pokemon liar menjatuhkan item
  whiteoutMoneyLossRatio: 0.5, // uang hilang saat semua Pokemon pingsan
};
