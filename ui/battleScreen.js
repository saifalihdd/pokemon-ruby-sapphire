import { findSpecies } from "../data/pokedex.js";
import { typeTag, bold, dim } from "./colors.js";
import { hpBar } from "./bars.js";
import { box } from "./boxes.js";
import { getSpriteRows, joinBlocks } from "./sprite.js";
import { displayName } from "../services/pokemonFactory.js";
import { foesRemaining, STAT_NAMES } from "../services/battleService.js";

const stageLine = (stages) => {
  const changes = Object.entries(stages)
    .filter(([, value]) => value !== 0)
    .map(([key, value]) => `${STAT_NAMES[key]} ${value > 0 ? "+" : ""}${value}`);
  return changes.length ? dim(`Stat: ${changes.join("  ")}`) : null;
};

const pokemonLines = (pokemon, name, stages) => {
  const species = findSpecies(pokemon.speciesId);
  return [
    `${bold(name)}  Lv${pokemon.level}  ${species.type.map((type) => typeTag(type)).join("")}`,
    `HP ${hpBar(pokemon.hp, pokemon.maxHp, 20)} ${pokemon.hp}/${pokemon.maxHp}`,
    stageLine(stages),
  ].filter(Boolean);
};

// Layar battle: lawan di atas (sprite di kanan), kita di bawah (sprite menghadap kanan di kiri).
export const renderBattle = (battle) => {
  const foeName = findSpecies(battle.foe.speciesId).name;
  const foeLines = pokemonLines(battle.foe, foeName, battle.stages.foe);
  if (battle.kind === "trainer") foeLines.push(dim(`Sisa Pokemon lawan: ${"● ".repeat(foesRemaining(battle) + 1).trim()}`));
  const foeTitle = battle.legendaryId ? "LEGENDARY" : battle.kind === "wild" ? "POKEMON LIAR" : `${battle.gym.leader.toUpperCase()}  (${battle.gym.type})`;

  const foeBlock = joinBlocks([foeLines, getSpriteRows(battle.foe.speciesId)], { gap: 3, align: "center" });
  const playerBlock = joinBlocks(
    [getSpriteRows(battle.player.speciesId, { flip: true }), pokemonLines(battle.player, displayName(battle.player), battle.stages.player)],
    { gap: 3, align: "center" },
  );
  console.log();
  console.log(box(foeBlock, { title: foeTitle, minWidth: 56 }));
  console.log(box(playerBlock, { title: "KAMU", minWidth: 56 }));
};
