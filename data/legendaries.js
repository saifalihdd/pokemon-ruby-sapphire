// Encounter legendary TETAP (bukan acak): satu Pokemon, satu level, satu lokasi.
export const legendaries = [
  { id: "regirock", speciesId: 377, level: 40, place: "Desert Ruins" },
  { id: "regice", speciesId: 378, level: 40, place: "Island Cave" },
  { id: "registeel", speciesId: 379, level: 40, place: "Ancient Tomb" },
  { id: "latias", speciesId: 380, level: 40, place: "Southern Island" },
  { id: "latios", speciesId: 381, level: 40, place: "Southern Island" },
  { id: "kyogre", speciesId: 382, level: 45, place: "Marine Cave" },
  { id: "groudon", speciesId: 383, level: 45, place: "Terra Cave" },
  { id: "rayquaza", speciesId: 384, level: 70, place: "Sky Pillar" },
];

export const findLegendary = (id) => legendaries.find((legendary) => legendary.id === id);
