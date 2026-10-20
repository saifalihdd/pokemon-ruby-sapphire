import { ask, askNumber, askConfirm } from "../utils/input.js";
import { isValidTrainerName } from "../utils/validation.js";
import { getStarters } from "../data/pokedex.js";
import { createPokemon } from "../services/pokemonFactory.js";
import { createTrainer, addPokemon, renamePokemon } from "../services/trainerService.js";
import { printPokemonDetail } from "../ui/display.js";
import { printResult } from "./menuHelper.js";
import { pause } from "../ui/animations.js";

const askTrainerName = async () => {
  while (true) {
    const name = await ask("Siapa namamu? (maks 12 huruf/angka): ");
    if (isValidTrainerName(name)) return name;
    console.log("Nama tidak valid. Gunakan huruf/angka/spasi, 1-12 karakter.");
  }
};

const chooseStarter = async () => {
  const starters = getStarters();
  while (true) {
    console.log("\nProf. Birch: \"Ada tiga Pokemon di tas ini. Pilih satu sebagai partnermu!\"");
    starters.forEach((species, index) => console.log(` ${index + 1}. ${species.name} (${species.type.join("/")})`));
    const choice = await askNumber("> Pilih starter (1-3): ", 1, starters.length);
    const species = starters[choice - 1];
    printPokemonDetail(createPokemon(species.id, 5));
    if (await askConfirm(`Pilih ${species.name}?`)) return species;
  }
};

// Alur game baru: Prof. Birch → nama → starter → nickname.
export const runNewGame = async () => {
  console.log("\nProf. Birch: \"Selamat datang di dunia Pokemon di wilayah Hoenn!\"");
  await pause();
  const trainer = createTrainer(await askTrainerName());
  const starter = await chooseStarter();
  const { pokemon } = addPokemon(trainer, createPokemon(starter.id, 5));

  if (await askConfirm(`Beri nickname untuk ${starter.name}?`)) {
    while (true) {
      const result = renamePokemon(trainer, pokemon.uid, await ask("Nickname: "));
      printResult(result);
      if (result.ok) break;
    }
  }
  console.log(`\nProf. Birch: "Kerja bagus, ${trainer.name}! Ini bekal untukmu: 5 Poke Ball, 2 Potion, dan ₽${trainer.money}."`);
  console.log("Perjalananmu di Hoenn dimulai sekarang!");
  return trainer;
};
