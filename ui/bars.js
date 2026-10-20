import { paint, dim, GREEN, YELLOW, RED } from "./colors.js";

export const hpBar = (hp, maxHp, width = 16) => {
  const ratio = maxHp > 0 ? hp / maxHp : 0;
  const filled = hp > 0 ? Math.max(1, Math.round(ratio * width)) : 0;
  const color = ratio > 0.5 ? GREEN : ratio > 0.2 ? YELLOW : RED;
  return `[${paint("█".repeat(filled), color)}${dim("░".repeat(width - filled))}]`;
};
