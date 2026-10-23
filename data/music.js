// Nama logis -> nama file (tanpa ekstensi) di assets/music/. Ekstensi dicari otomatis (mp3, wav, ogg, m4a, mp4).
export const TRACK_FILES = {
  title: "title", // layar awal & intro
  town: "town", // menu utama, gym, lokasi legendary
  route: "route", // menjelajah
  pokemonCenter: "pokemon_center",
  battleWild: "battle_wild",
  battleGym: "battle_gym",
  battleLegendary: "battle_legendary",
};

// Jingle = musik pendek yang diputar sekali (BGM berhenti sebentar lalu lanjut).
export const JINGLE_FILES = {
  victory: "victory",
  catch: "catch",
  evolution: "evolution",
  whiteout: "whiteout",
};

// Jika file sebuah lagu tidak ada, pakai lagu cadangan ini (urut). Jadi cukup menyediakan sebagian file saja.
export const MUSIC_FALLBACKS = {
  title: ["town"],
  route: ["town"],
  pokemonCenter: ["town"],
  battleGym: ["battleWild"],
  battleLegendary: ["battleGym", "battleWild"],
};

export const MUSIC_EXTENSIONS = ["mp3", "wav", "ogg", "m4a", "mp4"];
