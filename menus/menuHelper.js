import { askNumber } from "../utils/input.js";
import { bold } from "../ui/colors.js";
import { formatPokemonLine } from "../ui/display.js";

// Menampilkan menu bernomor, mengembalikan pilihan (0 = kembali).
export const showMenu = async (title, options, backLabel = "Kembali") => {
  console.log(`\n${bold(title)}`);
  options.forEach((option, index) => console.log(` ${index + 1}. ${option}`));
  console.log(` 0. ${backLabel}`);
  return askNumber("> Pilih: ", 0, options.length);
};

export const printResult = ({ ok, message }) => console.log(ok ? `✔ ${message}` : `✖ ${message}`);

// Memilih satu Pokemon dari daftar. Mengembalikan Pokemon atau null jika batal.
export const pickPokemon = async (list, prompt = "Pilih Pokemon") => {
  if (list.length === 0) {
    console.log("(kosong)");
    return null;
  }
  list.forEach((pokemon, index) => console.log(` ${index + 1}. ${formatPokemonLine(pokemon)}`));
  const choice = await askNumber(`${prompt} (0 = batal): `, 0, list.length);
  return choice === 0 ? null : list[choice - 1];
};
