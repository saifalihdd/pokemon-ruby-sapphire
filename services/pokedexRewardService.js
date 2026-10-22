import { pokedexRewards } from "../data/pokedexRewards.js";
import { addItem } from "./inventoryService.js";

const getClaimed = (trainer) => trainer.claimedRewards ?? []; // save lama belum punya field ini

// Daftar milestone beserta status: sudah tercapai? sudah diklaim?
export const getRewardProgress = (trainer) =>
  pokedexRewards.map((reward) => ({
    ...reward,
    reached: trainer.pokedexCaught.length >= reward.caught,
    claimed: getClaimed(trainer).includes(reward.id),
  }));

// Memberikan semua hadiah yang sudah tercapai tapi belum diklaim. Mengembalikan daftar hadiah baru.
export const claimPokedexRewards = (trainer) => {
  const due = getRewardProgress(trainer).filter((reward) => reward.reached && !reward.claimed);
  due.forEach((reward) => {
    addItem(trainer, reward.itemId, reward.qty);
    trainer.claimedRewards = [...getClaimed(trainer), reward.id];
  });
  return due;
};
