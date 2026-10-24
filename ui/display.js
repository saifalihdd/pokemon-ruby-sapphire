import { findSpecies } from "../data/pokedex.js";
import { findMove, getMoveCategory } from "../data/moves.js";
import { displayName } from "../services/pokemonFactory.js";
import { typeTag, bold, dim } from "./colors.js";
import { hpBar } from "./bars.js";
import { box } from "./boxes.js";
import { getSpriteRows, joinBlocks } from "./sprite.js";

export const formatMoney = (amount) => `₽${amount}`;

// Satu baris ringkas untuk daftar tim / PC.
export const formatPokemonLine = (pokemon) => {
  const species = findSpecies(pokemon.speciesId);
  const { level, hp, maxHp } = pokemon;
  const fainted = hp <= 0 ? " (PINGSAN)" : "";
  const nameText = pokemon.nickname ? `${pokemon.nickname} (${species.name})` : species.name;
  const typeText = species.type.map((t) => typeTag(t)).join("");
  const typePad = " ".repeat(Math.max(0, 16 - species.type.map((t) => `[${t}]`).join("").length));
  return `${nameText.padEnd(22)} Lv${String(level).padEnd(3)} ${typeText}${typePad} ${hpBar(hp, maxHp, 10)} ${hp}/${maxHp}${fainted}`;
};

export const printPokemonDetail = (pokemon) => {
  const species = findSpecies(pokemon.speciesId);
  const { level, hp, maxHp, stats } = pokemon;
  const moveLines = species.moves.map((id) => {
    const move = findMove(id);
    const power = move.power === 0 ? "-" : move.power;
    return ` - ${move.name.padEnd(14)} ${typeTag(move.type, 10)} ${getMoveCategory(move).padEnd(8)} Pow ${String(power).padEnd(3)} Acc ${move.accuracy}`;
  });
  const lines = [
    `${bold(displayName(pokemon))}${pokemon.nickname ? ` (${species.name})` : ""}  #${species.id}  ${pokemon.uid ? dim(pokemon.uid) : ""}`,
    `Tipe  : ${species.type.map(typeTag).join(" ")}`,
    `Level : ${level}`,
    `HP    : ${hpBar(hp, maxHp)} ${hp}/${maxHp}`,
    `ATK ${stats.atk}  DEF ${stats.def}  SpA ${stats.spAtk}  SpD ${stats.spDef}  SPD ${stats.speed}`,
    "Move  :",
    ...moveLines,
  ];
  const header = joinBlocks([getSpriteRows(pokemon.speciesId), lines.slice(0, 4)], { gap: 3, align: "center" });
  console.log(box([...header, ...lines.slice(4)], { title: "Detail Pokemon", minWidth: 50 }));
};
