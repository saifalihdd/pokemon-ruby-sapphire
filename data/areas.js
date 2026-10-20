// minBadges: jumlah badge minimal untuk masuk area (diaktifkan setelah sistem gym di Tahap 2).
export const areas = [
  { id: "route101", name: "Route 101", minBadges: 0, encounters: [
    { speciesId: 263, weight: 40, minLevel: 2, maxLevel: 4 },
    { speciesId: 261, weight: 40, minLevel: 2, maxLevel: 4 },
    { speciesId: 265, weight: 20, minLevel: 2, maxLevel: 3 },
  ] },
  { id: "route102", name: "Route 102", minBadges: 0, encounters: [
    { speciesId: 263, weight: 20, minLevel: 3, maxLevel: 5 },
    { speciesId: 261, weight: 20, minLevel: 3, maxLevel: 5 },
    { speciesId: 265, weight: 15, minLevel: 3, maxLevel: 5 },
    { speciesId: 270, weight: 15, minLevel: 3, maxLevel: 5 },
    { speciesId: 273, weight: 15, minLevel: 3, maxLevel: 5 },
    { speciesId: 280, weight: 5, minLevel: 4, maxLevel: 5 },
  ] },
  { id: "petalburgWoods", name: "Petalburg Woods", minBadges: 0, encounters: [
    { speciesId: 265, weight: 25, minLevel: 5, maxLevel: 6 },
    { speciesId: 285, weight: 20, minLevel: 5, maxLevel: 6 },
    { speciesId: 287, weight: 20, minLevel: 5, maxLevel: 6 },
    { speciesId: 276, weight: 20, minLevel: 5, maxLevel: 6 },
    { speciesId: 263, weight: 15, minLevel: 5, maxLevel: 6 },
  ] },
  { id: "graniteCave", name: "Granite Cave", minBadges: 0, encounters: [
    { speciesId: 41, weight: 25, minLevel: 6, maxLevel: 9 },
    { speciesId: 74, weight: 25, minLevel: 6, maxLevel: 9 },
    { speciesId: 296, weight: 20, minLevel: 6, maxLevel: 9 },
    { speciesId: 304, weight: 15, minLevel: 6, maxLevel: 9 },
    { speciesId: 299, weight: 15, minLevel: 6, maxLevel: 9 },
  ] },
  { id: "route110", name: "Route 110", minBadges: 1, encounters: [
    { speciesId: 309, weight: 25, minLevel: 8, maxLevel: 11 },
    { speciesId: 316, weight: 20, minLevel: 8, maxLevel: 11 },
    { speciesId: 300, weight: 15, minLevel: 8, maxLevel: 11 },
    { speciesId: 307, weight: 10, minLevel: 8, maxLevel: 11 },
    { speciesId: 322, weight: 10, minLevel: 8, maxLevel: 11 },
    { speciesId: 278, weight: 20, minLevel: 8, maxLevel: 11 },
  ] },
  { id: "route104Pantai", name: "Route 104 (Pantai)", minBadges: 0, encounters: [
    { speciesId: 278, weight: 45, minLevel: 6, maxLevel: 9 },
    { speciesId: 320, weight: 30, minLevel: 6, maxLevel: 9 },
    { speciesId: 283, weight: 25, minLevel: 6, maxLevel: 9 },
  ] },
  { id: "route111", name: "Route 111", minBadges: 2, encounters: [
    { speciesId: 309, weight: 20, minLevel: 14, maxLevel: 18 },
    { speciesId: 322, weight: 15, minLevel: 14, maxLevel: 18 },
    { speciesId: 316, weight: 15, minLevel: 14, maxLevel: 18 },
    { speciesId: 287, weight: 15, minLevel: 14, maxLevel: 18 },
    { speciesId: 307, weight: 10, minLevel: 14, maxLevel: 18 },
    { speciesId: 74, weight: 15, minLevel: 14, maxLevel: 18 },
    { speciesId: 41, weight: 10, minLevel: 14, maxLevel: 18 },
  ] },
  { id: "jaggedPass", name: "Jagged Pass", minBadges: 3, encounters: [
    { speciesId: 322, weight: 30, minLevel: 20, maxLevel: 24 },
    { speciesId: 42, weight: 25, minLevel: 20, maxLevel: 24 },
    { speciesId: 307, weight: 20, minLevel: 20, maxLevel: 24 },
    { speciesId: 296, weight: 25, minLevel: 20, maxLevel: 24 },
  ] },
  { id: "route119", name: "Route 119", minBadges: 4, encounters: [
    { speciesId: 264, weight: 25, minLevel: 24, maxLevel: 28 },
    { speciesId: 276, weight: 20, minLevel: 24, maxLevel: 28 },
    { speciesId: 317, weight: 20, minLevel: 24, maxLevel: 28 },
    { speciesId: 310, weight: 15, minLevel: 24, maxLevel: 28 },
    { speciesId: 281, weight: 10, minLevel: 24, maxLevel: 28 },
    { speciesId: 42, weight: 10, minLevel: 24, maxLevel: 28 },
  ] },
  { id: "meteorFalls", name: "Meteor Falls", minBadges: 5, encounters: [
    { speciesId: 42, weight: 30, minLevel: 30, maxLevel: 36 },
    { speciesId: 75, weight: 25, minLevel: 30, maxLevel: 36 },
    { speciesId: 305, weight: 15, minLevel: 30, maxLevel: 36 },
    { speciesId: 308, weight: 10, minLevel: 30, maxLevel: 36 },
    { speciesId: 281, weight: 10, minLevel: 30, maxLevel: 36 },
    { speciesId: 323, weight: 10, minLevel: 30, maxLevel: 36 },
  ] },
  { id: "route128Laut", name: "Route 128 (Laut)", minBadges: 6, encounters: [
    { speciesId: 279, weight: 35, minLevel: 36, maxLevel: 42 },
    { speciesId: 284, weight: 30, minLevel: 36, maxLevel: 42 },
    { speciesId: 321, weight: 15, minLevel: 36, maxLevel: 42 },
    { speciesId: 277, weight: 20, minLevel: 36, maxLevel: 42 },
  ] },
];

export const findArea = (id) => areas.find((area) => area.id === id);
