// Menggambar sprite pixel-art di terminal dengan karakter setengah-blok: satu karakter = 2 pixel vertikal.
// Atas+bawah -> '▀' (warna depan = atas, latar = bawah); hanya atas -> '▀'; hanya bawah -> '▄'.
import { PALETTE, sprites } from "../data/sprites.js";
import { findSpecies } from "../data/pokedex.js";
import { CONFIG } from "../data/config.js";
import { TYPE_COLORS, stripAnsi, colorEnabled } from "./colors.js";

const RESET = "\x1b[0m";
const rgbCode = ([r, g, b], layer) => `\x1b[${layer};2;${r};${g};${b}m`;

export const flipRows = (rows) => rows.map((row) => [...row].reverse().join(""));

// grid: array string (satu huruf = satu warna di palette). Mengembalikan baris teks (2 baris pixel per baris teks).
export const renderPixels = (grid, palette = PALETTE, { color = colorEnabled } = {}) => {
  const lines = [];
  for (let y = 0; y < grid.length; y += 2) {
    let line = "";
    for (let x = 0; x < grid[y].length; x++) {
      const top = palette[grid[y][x]] ?? null;
      const bottom = palette[grid[y + 1]?.[x]] ?? null;
      if (!color) line += top && bottom ? "█" : top ? "▀" : bottom ? "▄" : " ";
      else if (top && bottom) line += `${rgbCode(top, 38)}${rgbCode(bottom, 48)}▀${RESET}`;
      else if (top) line += `${rgbCode(top, 38)}▀${RESET}`;
      else if (bottom) line += `${rgbCode(bottom, 38)}▄${RESET}`;
      else line += " ";
    }
    lines.push(line);
  }
  return lines;
};

// Cadangan untuk spesies tanpa sprite: bola berwarna sesuai tipe pertamanya.
export const placeholderGrid = (size = 16) =>
  Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x) => {
      const distance = Math.hypot(x - (size - 1) / 2, y - (size - 1) / 2);
      if (distance > 6.4) return ".";
      if (distance > 5.3) return "k";
      if (Math.hypot(x - 5.5, y - 5.5) < 1.6) return "h";
      return y > size * 0.62 ? "d" : "a";
    }).join(""),
  );

const placeholderPalette = (type) => {
  const base = TYPE_COLORS[type] ?? [180, 180, 190];
  return { k: PALETTE.k, a: base, d: base.map((v) => Math.round(v * 0.65)), h: base.map((v) => Math.min(255, v + 70)) };
};

// Baris teks sprite untuk sebuah spesies. flip=true untuk Pokemon milik pemain (menghadap kanan).
// Mengembalikan [] jika sprite dimatikan (SPRITES=off), sehingga pemanggil cukup menampilkan teks.
export const getSpriteRows = (speciesId, { flip = false, color = colorEnabled } = {}) => {
  if (!CONFIG.sprites.enabled) return [];
  const grid = sprites[speciesId];
  if (grid) return renderPixels(flip ? flipRows(grid) : grid, PALETTE, { color });
  const type = findSpecies(speciesId)?.type[0];
  return renderPixels(flip ? flipRows(placeholderGrid()) : placeholderGrid(), placeholderPalette(type), { color });
};

// Menyusun beberapa blok baris berdampingan (lebar dihitung tanpa kode warna).
export const joinBlocks = (blocks, { gap = 3, align = "top" } = {}) => {
  const usable = blocks.filter((block) => block.length > 0);
  if (usable.length === 0) return [];
  const height = Math.max(...usable.map((block) => block.length));
  const widths = usable.map((block) => Math.max(...block.map((line) => stripAnsi(line).length)));
  return Array.from({ length: height }, (_, row) =>
    usable
      .map((block, i) => {
        const offset = align === "center" ? Math.floor((height - block.length) / 2) : 0;
        const line = block[row - offset] ?? "";
        return line + " ".repeat(widths[i] - stripAnsi(line).length);
      })
      .join(" ".repeat(gap))
      .trimEnd(),
  );
};
