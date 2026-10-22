// Hadiah milestone Pokedex: diberikan otomatis sekali saat jumlah spesies tertangkap mencapai target.
// Catatan: hanya 46 spesies non-legendary yang bisa didapat (2 starter lain tidak bisa ditangkap liar),
// ditambah 8 legendary = 54 maksimum. Jangan buat target di atas itu.
export const pokedexRewards = [
  { id: "dex15", caught: 15, itemId: "greatball", qty: 5 },
  { id: "dex25", caught: 25, itemId: "ultraBall", qty: 5 },
  { id: "dex30", caught: 30, itemId: "masterBall", qty: 1 },
  { id: "dex40", caught: 40, itemId: "masterBall", qty: 1 },
];
