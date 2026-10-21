// kind: "ball" | "heal" | "revive" | "candy" | "equip"
export const items = [
  { id: "pokeball", name: "Poke Ball", kind: "ball", price: 200, ballBonus: 1, description: "Bola untuk menangkap Pokemon liar." },
  { id: "greatball", name: "Great Ball", kind: "ball", price: 600, ballBonus: 1.5, description: "Bola dengan peluang tangkap lebih baik." },
  { id: "potion", name: "Potion", kind: "heal", price: 300, heal: 20, description: "Memulihkan 20 HP." },
  { id: "superPotion", name: "Super Potion", kind: "heal", price: 700, heal: 50, description: "Memulihkan 50 HP." },
  { id: "revive", name: "Revive", kind: "revive", price: 1500, description: "Menghidupkan Pokemon pingsan dengan setengah HP." },
  { id: "expShare", name: "Exp. Share", kind: "equip", price: 0, description: "Dipasang ke trainer: seluruh Pokemon hidup di tim ikut dapat EXP (PC tidak)." },
  { id: "rareCandy", name: "Rare Candy", kind: "candy", price: 0, description: "Menaikkan 1 level. Tidak dijual, hanya drop." },
];

export const findItem = (id) => items.find((item) => item.id === id);

// Tabel drop berbobot (weight makin besar = makin sering).
export const dropTables = {
  wild: [
    { itemId: "potion", weight: 45 },
    { itemId: "pokeball", weight: 35 },
    { itemId: "superPotion", weight: 15 },
    { itemId: "rareCandy", weight: 5 },
  ],
  gym: [
    { itemId: "superPotion", weight: 30 },
    { itemId: "greatball", weight: 30 },
    { itemId: "revive", weight: 20 },
    { itemId: "rareCandy", weight: 20 },
  ],
};
