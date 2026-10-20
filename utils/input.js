import readline from "node:readline";

// Antrian baris via async iterator: aman untuk input interaktif maupun piped.
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });
const lines = rl[Symbol.asyncIterator]();

export const ask = async (prompt) => {
  process.stdout.write(prompt);
  const { value, done } = await lines.next();
  if (done) {
    console.log("\n(input selesai, keluar)");
    process.exit(0);
  }
  return value.trim();
};

// Terus bertanya sampai pengguna memasukkan angka bulat dalam rentang [min, max].
export const askNumber = async (prompt, min, max) => {
  while (true) {
    const raw = await ask(prompt);
    const value = Number(raw);
    if (raw !== "" && Number.isInteger(value) && value >= min && value <= max) return value;
    console.log(`Masukkan angka antara ${min} sampai ${max}.`);
  }
};

export const askConfirm = async (prompt) => {
  while (true) {
    const answer = (await ask(`${prompt} (y/n): `)).toLowerCase();
    if (answer === "y" || answer === "ya") return true;
    if (answer === "n" || answer === "tidak") return false;
    console.log("Jawab dengan y atau n.");
  }
};

export const closeInput = () => rl.close();
