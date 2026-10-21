// 8 gym Hoenn (versi Ruby/Sapphire) memakai spesies yang ada di Pokedex game ini.
export const gyms = [
  { order: 1, city: "Rustboro City", leader: "Roxanne", type: "Rock", badge: "Stone Badge",
    quote: "Aku akan menunjukkan kekuatan batu padamu!",
    team: [{ speciesId: 74, level: 12 }, { speciesId: 299, level: 15 }] },
  { order: 2, city: "Dewford Town", leader: "Brawly", type: "Fighting", badge: "Knuckle Badge",
    quote: "Ombak besar pun tak akan menggoyahkanku!",
    team: [{ speciesId: 296, level: 16 }, { speciesId: 296, level: 19 }] },
  { order: 3, city: "Mauville City", leader: "Wattson", type: "Electric", badge: "Dynamo Badge",
    quote: "Wahahaha! Bersiaplah tersengat listrik!",
    team: [{ speciesId: 309, level: 20 }, { speciesId: 309, level: 20 }, { speciesId: 310, level: 24 }] },
  { order: 4, city: "Lavaridge Town", leader: "Flannery", type: "Fire", badge: "Heat Badge",
    quote: "Kakekku mengajariku semangat api yang membara!",
    team: [{ speciesId: 322, level: 26 }, { speciesId: 322, level: 26 }, { speciesId: 323, level: 29 }] },
  { order: 5, city: "Petalburg City", leader: "Norman", type: "Normal", badge: "Balance Badge",
    quote: "Sebagai ayahmu pun, aku tidak akan mengalah!",
    team: [{ speciesId: 288, level: 28 }, { speciesId: 288, level: 30 }, { speciesId: 289, level: 31 }] },
  { order: 6, city: "Fortree City", leader: "Winona", type: "Flying", badge: "Feather Badge",
    quote: "Aku terbang bersama Pokemon burung yang anggun!",
    team: [{ speciesId: 279, level: 29 }, { speciesId: 277, level: 31 }, { speciesId: 277, level: 33 }] },
  { order: 7, city: "Mossdeep City", leader: "Tate & Liza", type: "Psychic", badge: "Mind Badge",
    quote: "Kami berdua adalah satu pikiran!",
    team: [{ speciesId: 281, level: 36 }, { speciesId: 308, level: 38 }, { speciesId: 282, level: 41 }] },
  { order: 8, city: "Sootopolis City", leader: "Juan", type: "Water", badge: "Rain Badge", bonusItemId: "masterBall",
    quote: "Air menyimpan keindahan dan kekuatan. Tunjukkan padaku!",
    team: [{ speciesId: 279, level: 41 }, { speciesId: 284, level: 41 }, { speciesId: 321, level: 43 }, { speciesId: 260, level: 46 }] },
];

export const findGym = (order) => gyms.find((gym) => gym.order === order);
