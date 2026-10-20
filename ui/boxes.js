import { stripAnsi, bold } from "./colors.js";

const padVisible = (text, width) => text + " ".repeat(Math.max(0, width - stripAnsi(text).length));

// Kotak berbingkai; lebar menyesuaikan baris terpanjang (kode warna tidak dihitung).
export const box = (lines, { title = "", minWidth = 30 } = {}) => {
  const inner = Math.max(minWidth, stripAnsi(title).length + 2, ...lines.map((line) => stripAnsi(line).length));
  const top = title ? `┌─ ${bold(title)} ${"─".repeat(Math.max(0, inner - stripAnsi(title).length - 1))}┐` : `┌${"─".repeat(inner + 2)}┐`;
  const body = lines.map((line) => `│ ${padVisible(line, inner)} │`);
  return [top, ...body, `└${"─".repeat(inner + 2)}┘`].join("\n");
};
