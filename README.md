# Pokemon Ruby & Sapphire (CLI)

Game petualangan Pokemon berbasis terminal yang dibangun dengan **Node.js murni** (tanpa library tambahan) untuk
**Mini Project Trial Study Club Backend Basic**. Seluruh data game disimpan dalam **Array of Objects**
dan dimanipulasi lewat operasi **CRUD**, dengan tema Pokemon Ruby & Sapphire (wilayah Hoenn).

> Proyek belajar non-komersial. Pokemon dan semua nama terkait adalah milik Nintendo / Game Freak / The Pokemon Company.

## Gambaran Umum

Kamu memulai sebagai trainer baru dan memilih satu dari tiga starter (**Treecko, Torchic, Mudkip**), persis seperti
di Ruby & Sapphire. Dari sana kamu bisa:

- **Menjelajah** 11 area dan bertemu Pokemon liar acak (level dan spesies mengikuti area; area terbuka seiring badge).
- **Battle ala Gen 3**: kelemahan tipe, STAB, critical hit, akurasi, urutan Speed, prioritas move, dan *stat stage* (-6 sampai +6)
  untuk move seperti Growl, Leer, Swords Dance. Setiap Pokemon punya **4 move tetap**.
- **Menangkap** Pokemon dengan rumus tangkap Gen 3 (HP rendah dan Great Ball meningkatkan peluang) beserta animasi bola.
- **Naik level dan berevolusi** (27 evolusi berbasis level, contoh Treecko → Grovyle → Sceptile).
- **Menantang 8 Gym Hoenn** secara berurutan dan mengumpulkan badge.
- **Mendapat uang dan item acak** dari setiap kemenangan, lalu membelanjakannya di **Poke Mart**.
- **Exp. Share**: ada di tas awal dan dipasang ke trainer lewat menu Tas (pilih lagi untuk melepas). Saat **aktif**,
  seluruh Pokemon hidup di tim ikut dapat EXP (50% dari bagian yang bertarung, bisa diubah lewat `expShareRatio`);
  Pokemon di PC tidak. Saat **nonaktif**, hanya Pokemon yang bertarung yang dapat EXP.
- **Pokemon Center**: kelola tim dan PC, heal gratis di Nurse Joy (revive berbayar), dan belanja.
- **Whiteout**: jika semua Pokemon pingsan, uang berkurang separuh dan tim pulih.
- **Autosave** ke `savegame.json` setelah setiap battle dan aksi menu.

## Cara Menjalankan (How to Run)

Prasyarat: **Node.js 18+** (diuji pada Node 22). Tidak perlu `npm install`.

```bash
git clone <url-repository-ini>
cd pokemon-ruby-sapphire
node main.js        # atau: npm start
```

Menjalankan tes otomatis:

```bash
npm test
```

Opsional (variabel lingkungan):

| Variabel | Fungsi |
|---|---|
| `NO_COLOR=1` | Matikan warna ANSI |
| `TEXT_DELAY=0` | Matikan jeda animasi (default 600 ms) |

Terminal VS Code disarankan agar warna dan karakter kotak tampil sempurna.

## Struktur Proyek

```
pokemon-ruby-sapphire/
├── main.js                 # entry point (load/new game)
├── data/                   # data statis (Array of Objects)
│   ├── pokedex.js  evolvedSpecies.js  evolutions.js
│   ├── moves.js    typeChart.js        items.js
│   ├── gyms.js     areas.js            config.js
├── services/               # logika murni (tanpa console.log): CRUD & battle
│   ├── trainerService.js   inventoryService.js   shopService.js
│   ├── nurseService.js     encounterService.js   battleService.js
│   ├── levelingService.js  evolutionService.js   rewardService.js
│   ├── gymService.js       equipmentService.js   pokemonFactory.js
├── menus/                  # alur menu & I/O terminal
├── ui/                     # warna, HP bar, kotak, animasi
├── utils/                  # input (readline), storage (JSON), validasi, RNG
└── test/                   # tes otomatis (stage1, stage2, stage3)
```

Pemisahan `services/` (logika) dan `menus/` (input/output) membuat logika bisa dites tanpa terminal.

## Format Data

Semua data utama berupa **Array of Objects**.

**Trainer** (disimpan di `savegame.json`):

```js
{
  name: "Nadia", money: 3000,
  party: [ /* maks 6 Pokemon */ ],
  pc:    [ /* Pokemon cadangan */ ],
  inventory: [ { itemId: "pokeball", qty: 5 } ],
  pokedexSeen: [252, 263], pokedexCaught: [252],
  badges: ["Stone Badge"], equipped: ["expShare"], nextUid: 3
}
```

**Pokemon milik trainer** (elemen `party` / `pc`):

```js
{ uid: "P001", speciesId: 252, nickname: "Rex", level: 16, exp: 4096,
  hp: 52, maxHp: 52, stats: { atk, def, spAtk, spDef, speed } }
```

**Spesies** (`pokedex`, 52 spesies):

```js
{ id: 252, name: "Treecko", type: ["Grass"], starter: true, catchRate: 45,
  baseStats: { hp: 40, atk: 45, def: 35, spAtk: 65, spDef: 55, speed: 70 },
  moves: ["pound", "leer", "absorb", "quickAttack"] }   // 4 move tetap
```

**Move**, **Item**, **Gym**, **Area**:

```js
{ id: "growl", name: "Growl", type: "Normal", power: 0, accuracy: 100,
  effect: { kind: "statChange", target: "foe", stat: "atk", stages: -1 } }
{ id: "potion", name: "Potion", kind: "heal", price: 300, heal: 20 }
{ order: 1, city: "Rustboro City", leader: "Roxanne", type: "Rock", badge: "Stone Badge",
  team: [{ speciesId: 74, level: 12 }, { speciesId: 299, level: 15 }] }
{ id: "route101", name: "Route 101", minBadges: 0,
  encounters: [{ speciesId: 263, weight: 40, minLevel: 2, maxLevel: 4 }] }
```

## Penjelasan Function CRUD

| Operasi | Fungsi utama (file) | Peran |
|---|---|---|
| **Create** | `addPokemon` (trainerService) | Menambah Pokemon hasil tangkapan/starter ke tim, atau ke PC jika tim penuh; mencatat Pokedex |
| | `createTrainer`, `createPokemon` | Membuat data trainer dan Pokemon baru (stat dihitung dari rumus Gen 3) |
| | `addItem`, `buyItem` (inventory/shopService) | Menambah item ke tas dari drop atau pembelian |
| **Read** | `locatePokemon`, `getAllPokemon`, `hasUsablePokemon` | Mencari/membaca Pokemon di tim dan PC |
| | `getQty`, `getCatalog`, `listGyms`, `getGymStatus` | Membaca tas, katalog toko, status gym |
| | menu Kelola Pokemon, Trainer Card, Pokedex, Tas | Menampilkan data ke terminal |
| **Update** | `updatePokemon`, `renamePokemon`, `swapParty` | Mengubah data Pokemon (immutable: objek baru lewat spread) |
| | `equipItem`, `unequipItem`, `toggleEquip` (equipmentService) | Memasang/melepas item ke trainer (Exp. Share); mengubah `trainer.equipped` |
| | `depositPokemon`, `withdrawPokemon` | Memindahkan Pokemon antara tim dan PC |
| | `healParty`, `revivePokemon`, `useItemOnPokemon` | Memulihkan HP, menghidupkan, memakai item |
| | `grantExp`, `evolvePokemon` | Menambah EXP, naik level, dan berevolusi |
| | `sellItem`, `applyReward` | Mengubah uang dan isi tas |
| **Delete** | `releasePokemon` | Melepas Pokemon (tim tidak boleh kosong) |
| | `removeItem`, `sellItem` | Mengurangi item; entri otomatis terhapus saat qty = 0 |

## Kriteria Mini Project

| Kriteria | Penerapan |
|---|---|
| CRUD (min. 4) | Tabel di atas |
| Array of Objects | `party`, `pc`, `inventory`, `pokedex`, `gyms`, `areas`, dst. |
| Modularisasi | ES Modules (`import` / `export`), 40+ file terpisah per tanggung jawab |
| I/O Node.js | `readline` (input) dan `console.log` (output) di terminal |
| `const` / `let`, percabangan, perulangan | `if/else`, `switch`, ternary, `for`, `for...of`, `while`; tanpa `var` |
| Arrow function | Semua fungsi memakai `() => {}` (tanpa kata kunci `function`) |
| Array methods (bonus) | `map`, `filter`, `reduce`, `some`, `every`, `find`, `findIndex`, `sort`, `includes` |
| Spread operator (bonus) | `{ ...pokemon, hp }`, `[...party, pokemon]` pada update tanpa mutasi |
| Destructuring (bonus) | `const { level, hp } = pokemon`, `[next[i], next[j]] = [next[j], next[i]]` |
| Template literals (bonus) | Seluruh teks output |
| Validasi (bonus) | Input angka/y-n, tim minimal 1 dan maksimal 6, uang/item tidak cukup, ID tidak ada, nickname, save rusak |
