import { gyms, findGym } from "../data/gyms.js";
import { createPokemon } from "./pokemonFactory.js";
import { hasUsablePokemon, registerSeen } from "./trainerService.js";
import { createBattle } from "./battleService.js";

// Gym harus dikalahkan berurutan: gym ke-N terbuka jika badge gym ke-(N-1) sudah dimiliki.
export const getGymStatus = (trainer, gym) => ({
  beaten: trainer.badges.includes(gym.badge),
  unlocked: gym.order === 1 || trainer.badges.includes(findGym(gym.order - 1).badge),
});

export const listGyms = (trainer) => gyms.map((gym) => ({ gym, ...getGymStatus(trainer, gym) }));

export const startGymBattle = (trainer, order) => {
  const gym = findGym(order);
  if (!gym) return { ok: false, message: "Gym tidak ditemukan." };
  const { beaten, unlocked } = getGymStatus(trainer, gym);
  if (!unlocked) return { ok: false, message: `Gym ${gym.city} masih terkunci. Kalahkan gym sebelumnya dulu!` };
  if (!hasUsablePokemon(trainer)) return { ok: false, message: "Semua Pokemon-mu pingsan! Ke Pokemon Center dulu." };

  const team = gym.team.map(({ speciesId, level }) => createPokemon(speciesId, level));
  team.forEach((pokemon) => registerSeen(trainer, pokemon.speciesId));
  return { ok: true, gym, rematch: beaten, battle: createBattle(trainer, team, { kind: "trainer", foeName: gym.leader, gym, rematch: beaten }) };
};
