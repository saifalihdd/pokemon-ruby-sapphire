// Move bersifat TETAP per spesies (4 move). Efek status dibuat berbasis data (effect).
// effect: { kind: "statChange", target: "self" | "foe", stat, stages, chance? }
export const moves = [
  { id: "pound", name: "Pound", type: "Normal", power: 40, accuracy: 100 },
  { id: "scratch", name: "Scratch", type: "Normal", power: 40, accuracy: 100 },
  { id: "tackle", name: "Tackle", type: "Normal", power: 35, accuracy: 95 },
  { id: "headbutt", name: "Headbutt", type: "Normal", power: 70, accuracy: 100 },
  { id: "quickAttack", name: "Quick Attack", type: "Normal", power: 40, accuracy: 100, priority: 1 },
  { id: "growl", name: "Growl", type: "Normal", power: 0, accuracy: 100, effect: { kind: "statChange", target: "foe", stat: "atk", stages: -1 } },
  { id: "leer", name: "Leer", type: "Normal", power: 0, accuracy: 100, effect: { kind: "statChange", target: "foe", stat: "def", stages: -1 } },
  { id: "tailWhip", name: "Tail Whip", type: "Normal", power: 0, accuracy: 100, effect: { kind: "statChange", target: "foe", stat: "def", stages: -1 } },
  { id: "harden", name: "Harden", type: "Normal", power: 0, accuracy: 100, effect: { kind: "statChange", target: "self", stat: "def", stages: 1 } },
  { id: "defenseCurl", name: "Defense Curl", type: "Normal", power: 0, accuracy: 100, effect: { kind: "statChange", target: "self", stat: "def", stages: 1 } },
  { id: "howl", name: "Howl", type: "Normal", power: 0, accuracy: 100, effect: { kind: "statChange", target: "self", stat: "atk", stages: 1 } },
  { id: "doubleTeam", name: "Double Team", type: "Normal", power: 0, accuracy: 100, effect: { kind: "statChange", target: "self", stat: "evasion", stages: 1 } },
  { id: "sandAttack", name: "Sand-Attack", type: "Ground", power: 0, accuracy: 100, effect: { kind: "statChange", target: "foe", stat: "accuracy", stages: -1 } },
  { id: "stringShot", name: "String Shot", type: "Bug", power: 0, accuracy: 95, effect: { kind: "statChange", target: "foe", stat: "speed", stages: -1 } },
  { id: "absorb", name: "Absorb", type: "Grass", power: 20, accuracy: 100, drain: 0.5 },
  { id: "ember", name: "Ember", type: "Fire", power: 40, accuracy: 100 },
  { id: "peck", name: "Peck", type: "Flying", power: 35, accuracy: 100 },
  { id: "wingAttack", name: "Wing Attack", type: "Flying", power: 60, accuracy: 100 },
  { id: "waterGun", name: "Water Gun", type: "Water", power: 40, accuracy: 100 },
  { id: "bubble", name: "Bubble", type: "Water", power: 20, accuracy: 100 },
  { id: "mudSlap", name: "Mud-Slap", type: "Ground", power: 20, accuracy: 100, effect: { kind: "statChange", target: "foe", stat: "accuracy", stages: -1, chance: 100 } },
  { id: "bite", name: "Bite", type: "Dark", power: 60, accuracy: 100 },
  { id: "poisonSting", name: "Poison Sting", type: "Poison", power: 15, accuracy: 100 },
  { id: "acid", name: "Acid", type: "Poison", power: 40, accuracy: 100 },
  { id: "astonish", name: "Astonish", type: "Ghost", power: 30, accuracy: 100 },
  { id: "lick", name: "Lick", type: "Ghost", power: 20, accuracy: 100 },
  { id: "confusion", name: "Confusion", type: "Psychic", power: 50, accuracy: 100 },
  { id: "leechLife", name: "Leech Life", type: "Bug", power: 20, accuracy: 100, drain: 0.5 },
  { id: "armThrust", name: "Arm Thrust", type: "Fighting", power: 25, accuracy: 100 },
  { id: "rockThrow", name: "Rock Throw", type: "Rock", power: 50, accuracy: 90 },
  { id: "thunderShock", name: "Thunder Shock", type: "Electric", power: 40, accuracy: 100 },
  { id: "megaDrain", name: "Mega Drain", type: "Grass", power: 40, accuracy: 100, drain: 0.5 },
  { id: "leafBlade", name: "Leaf Blade", type: "Grass", power: 70, accuracy: 100 },
  { id: "flamethrower", name: "Flamethrower", type: "Fire", power: 95, accuracy: 100 },
  { id: "skyUppercut", name: "Sky Uppercut", type: "Fighting", power: 85, accuracy: 90 },
  { id: "brickBreak", name: "Brick Break", type: "Fighting", power: 75, accuracy: 100 },
  { id: "surf", name: "Surf", type: "Water", power: 95, accuracy: 100 },
  { id: "earthquake", name: "Earthquake", type: "Ground", power: 100, accuracy: 100 },
  { id: "crunch", name: "Crunch", type: "Dark", power: 80, accuracy: 100 },
  { id: "slash", name: "Slash", type: "Normal", power: 70, accuracy: 100 },
  { id: "bodySlam", name: "Body Slam", type: "Normal", power: 85, accuracy: 100 },
  { id: "aerialAce", name: "Aerial Ace", type: "Flying", power: 60, accuracy: 100 },
  { id: "psychic", name: "Psychic", type: "Psychic", power: 90, accuracy: 100 },
  { id: "thunderbolt", name: "Thunderbolt", type: "Electric", power: 95, accuracy: 100 },
  { id: "shadowBall", name: "Shadow Ball", type: "Ghost", power: 80, accuracy: 100 },
  { id: "rockSlide", name: "Rock Slide", type: "Rock", power: 75, accuracy: 90 },
  { id: "ironTail", name: "Iron Tail", type: "Steel", power: 100, accuracy: 75 },
  { id: "sludgeBomb", name: "Sludge Bomb", type: "Poison", power: 90, accuracy: 100 },
  { id: "fireBlast", name: "Fire Blast", type: "Fire", power: 120, accuracy: 85 },
  { id: "hydroPump", name: "Hydro Pump", type: "Water", power: 120, accuracy: 80 },
  { id: "iceBeam", name: "Ice Beam", type: "Ice", power: 95, accuracy: 100 },
  { id: "dragonClaw", name: "Dragon Claw", type: "Dragon", power: 80, accuracy: 100 },
  { id: "swordsDance", name: "Swords Dance", type: "Normal", power: 0, accuracy: 100, effect: { kind: "statChange", target: "self", stat: "atk", stages: 2 } },
  { id: "agility", name: "Agility", type: "Psychic", power: 0, accuracy: 100, effect: { kind: "statChange", target: "self", stat: "speed", stages: 2 } },
];

export const findMove = (id) => moves.find((move) => move.id === id);

// Aturan Gen 3: kategori ditentukan oleh TIPE move, bukan per move.
const SPECIAL_TYPES = ["Fire", "Water", "Grass", "Electric", "Ice", "Psychic", "Dragon", "Dark"];

export const getMoveCategory = (move) => {
  if (move.power === 0) return "status";
  return SPECIAL_TYPES.includes(move.type) ? "special" : "physical";
};
