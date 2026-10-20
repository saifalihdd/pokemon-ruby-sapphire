import { CONFIG } from "../data/config.js";
import { dropTables, findItem } from "../data/items.js";
import { chance, weightedPick } from "../utils/random.js";
import { addItem } from "./inventoryService.js";

// Hadiah mengalahkan Pokemon liar: uang kecil + peluang item acak.
export const rollWildReward = (foe) => ({
  money: foe.level * CONFIG.wildMoneyPerLevel,
  itemId: chance(CONFIG.wildDropChance) ? weightedPick(dropTables.wild).itemId : null,
});

// Hadiah gym: uang = level Pokemon terakhir x 100, plus 1 item pasti (kecuali tantang ulang).
export const rollGymReward = (gym, rematch = false) => {
  const lastLevel = gym.team.at(-1).level;
  const base = lastLevel * CONFIG.gymMoneyPerLevel;
  return {
    money: rematch ? Math.floor(base * CONFIG.rematchMoneyRatio) : base,
    itemId: rematch ? null : weightedPick(dropTables.gym).itemId,
  };
};

export const applyReward = (trainer, reward) => {
  trainer.money += reward.money;
  if (reward.itemId) addItem(trainer, reward.itemId, 1);
};

export const describeReward = (reward) =>
  [`₽${reward.money}`, reward.itemId ? findItem(reward.itemId).name : null].filter(Boolean).join(" + ");
