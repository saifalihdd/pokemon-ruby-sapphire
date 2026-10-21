// 8 Pokemon legendaris Gen 3 (stat dasar asli). catchRate 3 = sangat sulit ditangkap tanpa Master Ball.
const stats = (hp, atk, def, spAtk, spDef, speed) => ({ hp, atk, def, spAtk, spDef, speed });

export const legendarySpecies = [
  { id: 377, name: "Regirock", type: ["Rock"], legendary: true, catchRate: 3, baseStats: stats(80, 100, 200, 50, 100, 50), moves: ["rockSlide", "earthquake", "brickBreak", "harden"] },
  { id: 378, name: "Regice", type: ["Ice"], legendary: true, catchRate: 3, baseStats: stats(80, 50, 100, 100, 200, 50), moves: ["iceBeam", "thunderbolt", "bodySlam", "defenseCurl"] },
  { id: 379, name: "Registeel", type: ["Steel"], legendary: true, catchRate: 3, baseStats: stats(80, 75, 150, 75, 150, 50), moves: ["ironTail", "brickBreak", "rockSlide", "harden"] },
  { id: 380, name: "Latias", type: ["Dragon", "Psychic"], legendary: true, catchRate: 3, baseStats: stats(80, 80, 90, 110, 130, 110), moves: ["psychic", "dragonClaw", "shadowBall", "agility"] },
  { id: 381, name: "Latios", type: ["Dragon", "Psychic"], legendary: true, catchRate: 3, baseStats: stats(80, 90, 80, 130, 110, 110), moves: ["psychic", "dragonClaw", "shadowBall", "doubleTeam"] },
  { id: 382, name: "Kyogre", type: ["Water"], legendary: true, catchRate: 3, baseStats: stats(100, 100, 90, 150, 140, 90), moves: ["hydroPump", "iceBeam", "surf", "waterGun"] },
  { id: 383, name: "Groudon", type: ["Ground"], legendary: true, catchRate: 3, baseStats: stats(100, 150, 140, 100, 90, 90), moves: ["earthquake", "fireBlast", "rockSlide", "slash"] },
  { id: 384, name: "Rayquaza", type: ["Dragon", "Flying"], legendary: true, catchRate: 3, baseStats: stats(105, 150, 90, 150, 90, 95), moves: ["dragonClaw", "aerialAce", "crunch", "swordsDance"] },
];
