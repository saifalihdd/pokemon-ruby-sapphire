// Warna ANSI truecolor (didukung terminal VS Code). Set NO_COLOR=1 untuk mematikan warna.
const useColor = !process.env.NO_COLOR;

export const RESET = useColor ? "\x1b[0m" : "";
export const paint = (text, [r, g, b]) => (useColor ? `\x1b[38;2;${r};${g};${b}m${text}${RESET}` : text);
export const bold = (text) => (useColor ? `\x1b[1m${text}\x1b[22m` : text);
export const dim = (text) => (useColor ? `\x1b[2m${text}\x1b[22m` : text);

export const GREEN = [96, 200, 96];
export const YELLOW = [240, 200, 60];
export const RED = [230, 70, 70];
export const GOLD = [255, 215, 0];

export const TYPE_COLORS = {
  Normal: [168, 168, 120], Fire: [240, 128, 48], Water: [104, 144, 240], Grass: [120, 200, 80],
  Electric: [248, 208, 48], Ice: [152, 216, 216], Fighting: [192, 48, 40], Poison: [160, 64, 160],
  Ground: [224, 192, 104], Flying: [168, 144, 240], Psychic: [248, 88, 136], Bug: [168, 184, 32],
  Rock: [184, 160, 56], Ghost: [112, 88, 152], Dragon: [112, 56, 248], Dark: [150, 120, 100],
  Steel: [184, 184, 208],
};

export const typeTag = (type, width = 0) => paint(`[${type}]`.padEnd(width), TYPE_COLORS[type] ?? [200, 200, 200]);

// Panjang teks yang terlihat (tanpa kode ANSI), dipakai untuk merapikan kotak.
export const stripAnsi = (text) => text.replace(/\x1b\[[0-9;]*m/g, "");
