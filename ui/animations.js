import { CONFIG } from "../data/config.js";

export const sleep = (ms) => (ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve());

export const pause = (factor = 1) => sleep(CONFIG.textDelayMs * factor);

// Animasi bola bergoyang ala game: "( ● ) ... goyang 1... 2... 3..."
export const playCatchAnimation = async (ballName, wildName, { caught, shakes }) => {
  console.log(`\nKamu melempar ${ballName}! ( ● )`);
  await pause();
  for (let i = 1; i <= shakes; i++) {
    console.log(`   ...bola bergoyang (${i})`);
    await pause();
  }
  if (caught) {
    console.log(`\n★ Gotcha! ${wildName} berhasil ditangkap! ★`);
  } else {
    console.log(`\nOh tidak! ${wildName} lolos dari bola!`);
  }
  await pause(0.5);
};
