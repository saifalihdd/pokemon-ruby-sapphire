import { evolvedSpecies } from "./evolvedSpecies.js";

// 25 spesies dasar Hoenn + bentuk evolusinya (evolvedSpecies.js). baseStats memakai nilai asli Gen 3.
const stats = (hp, atk, def, spAtk, spDef, speed) => ({ hp, atk, def, spAtk, spDef, speed });

const baseSpecies = [
  { id: 41, name: "Zubat", type: ["Poison", "Flying"], baseStats: stats(40, 45, 35, 30, 40, 55), catchRate: 255, moves: ["bite", "leechLife", "wingAttack", "acid"] },
  { id: 74, name: "Geodude", type: ["Rock", "Ground"], baseStats: stats(40, 80, 100, 30, 30, 20), catchRate: 255, moves: ["tackle", "defenseCurl", "rockThrow", "mudSlap"] },
  { id: 252, name: "Treecko", type: ["Grass"], baseStats: stats(40, 45, 35, 65, 55, 70), catchRate: 45, starter: true, moves: ["pound", "leer", "absorb", "quickAttack"] },
  { id: 255, name: "Torchic", type: ["Fire"], baseStats: stats(45, 60, 40, 70, 50, 45), catchRate: 45, starter: true, moves: ["scratch", "growl", "ember", "peck"] },
  { id: 258, name: "Mudkip", type: ["Water"], baseStats: stats(50, 70, 50, 50, 50, 40), catchRate: 45, starter: true, moves: ["tackle", "growl", "mudSlap", "waterGun"] },
  { id: 261, name: "Poochyena", type: ["Dark"], baseStats: stats(35, 55, 35, 30, 30, 35), catchRate: 255, moves: ["tackle", "howl", "sandAttack", "bite"] },
  { id: 263, name: "Zigzagoon", type: ["Normal"], baseStats: stats(38, 30, 41, 30, 41, 60), catchRate: 255, moves: ["tackle", "growl", "sandAttack", "headbutt"] },
  { id: 265, name: "Wurmple", type: ["Bug"], baseStats: stats(45, 45, 35, 20, 30, 20), catchRate: 255, moves: ["tackle", "stringShot", "poisonSting", "harden"] },
  { id: 270, name: "Lotad", type: ["Water", "Grass"], baseStats: stats(40, 30, 30, 40, 50, 30), catchRate: 255, moves: ["astonish", "growl", "absorb", "waterGun"] },
  { id: 273, name: "Seedot", type: ["Grass"], baseStats: stats(40, 40, 50, 30, 30, 30), catchRate: 255, moves: ["tackle", "harden", "absorb", "quickAttack"] },
  { id: 276, name: "Taillow", type: ["Normal", "Flying"], baseStats: stats(40, 55, 30, 30, 30, 85), catchRate: 200, moves: ["peck", "growl", "quickAttack", "wingAttack"] },
  { id: 278, name: "Wingull", type: ["Water", "Flying"], baseStats: stats(40, 30, 30, 55, 30, 85), catchRate: 190, moves: ["growl", "waterGun", "wingAttack", "quickAttack"] },
  { id: 280, name: "Ralts", type: ["Psychic"], baseStats: stats(28, 25, 25, 45, 35, 40), catchRate: 235, moves: ["growl", "confusion", "doubleTeam", "quickAttack"] },
  { id: 283, name: "Surskit", type: ["Bug", "Water"], baseStats: stats(40, 30, 32, 50, 52, 65), catchRate: 200, moves: ["bubble", "quickAttack", "waterGun", "leechLife"] },
  { id: 285, name: "Shroomish", type: ["Grass"], baseStats: stats(60, 40, 60, 40, 60, 35), catchRate: 255, moves: ["tackle", "growl", "absorb", "headbutt"] },
  { id: 287, name: "Slakoth", type: ["Normal"], baseStats: stats(60, 60, 60, 35, 35, 30), catchRate: 255, moves: ["scratch", "growl", "headbutt", "leer"] },
  { id: 296, name: "Makuhita", type: ["Fighting"], baseStats: stats(72, 60, 30, 20, 30, 25), catchRate: 180, moves: ["tackle", "leer", "armThrust", "headbutt"] },
  { id: 299, name: "Nosepass", type: ["Rock"], baseStats: stats(30, 45, 135, 45, 90, 30), catchRate: 255, moves: ["tackle", "harden", "rockThrow", "leer"] },
  { id: 300, name: "Skitty", type: ["Normal"], baseStats: stats(50, 45, 45, 35, 35, 50), catchRate: 255, moves: ["tackle", "growl", "tailWhip", "quickAttack"] },
  { id: 304, name: "Aron", type: ["Steel", "Rock"], baseStats: stats(50, 70, 100, 40, 40, 30), catchRate: 180, moves: ["tackle", "harden", "mudSlap", "headbutt"] },
  { id: 307, name: "Meditite", type: ["Fighting", "Psychic"], baseStats: stats(30, 40, 55, 40, 55, 60), catchRate: 180, moves: ["armThrust", "confusion", "leer", "quickAttack"] },
  { id: 309, name: "Electrike", type: ["Electric"], baseStats: stats(40, 45, 40, 65, 40, 65), catchRate: 120, moves: ["tackle", "thunderShock", "leer", "quickAttack"] },
  { id: 316, name: "Gulpin", type: ["Poison"], baseStats: stats(70, 43, 53, 43, 53, 40), catchRate: 225, moves: ["pound", "acid", "poisonSting", "lick"] },
  { id: 320, name: "Wailmer", type: ["Water"], baseStats: stats(130, 70, 35, 70, 35, 60), catchRate: 125, moves: ["tackle", "growl", "waterGun", "defenseCurl"] },
  { id: 322, name: "Numel", type: ["Fire", "Ground"], baseStats: stats(60, 60, 40, 65, 45, 35), catchRate: 255, moves: ["tackle", "growl", "ember", "mudSlap"] },
];

export const pokedex = [...baseSpecies, ...evolvedSpecies];

export const findSpecies = (id) => pokedex.find((species) => species.id === id);
export const getStarters = () => pokedex.filter((species) => species.starter);
