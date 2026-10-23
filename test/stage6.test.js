import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import path from "node:path";
import { createAudio, buildPlayerCommand } from "../ui/audio.js";

let passed = 0;
const test = (name, fn) => {
  fn();
  passed += 1;
  console.log(`  ok  ${name}`);
};

// Lingkungan palsu: tidak ada proses/ file sungguhan.
const makeEnv = ({ files = ["town.mp3", "battle_wild.mp3", "victory.mp3"], platform = "linux", enabled = true, available = () => true } = {}) => {
  const spawned = [];
  let clock = 0;
  const spawn = (cmd, args) => {
    const proc = new EventEmitter();
    proc.killed = false;
    proc.kill = () => { proc.killed = true; };
    spawned.push({ cmd, args, proc });
    return proc;
  };
  const audio = createAudio({ spawn, platform, isAvailable: available, fileExists: (f) => files.includes(path.basename(f)), musicDir: "/m", now: () => clock, enabled, volume: 0.5 });
  return { audio, spawned, tick: (ms) => { clock += ms; } };
};
const playingFile = (entry) => path.basename(entry.args.at(-1));

console.log("PERINTAH PEMUTAR PER OS");
test("macOS: afplay dengan volume", () => {
  const c = buildPlayerCommand({ platform: "darwin", file: "/m/town.mp3", volume: 0.5, loop: true, isAvailable: () => true });
  assert.deepEqual(c, { cmd: "afplay", args: ["-v", "0.5", "/m/town.mp3"] });
});
test("Windows: PowerShell -EncodedCommand berisi MediaPlayer, path, volume, dan loop (apostrof di-escape)", () => {
  const c = buildPlayerCommand({ platform: "win32", file: "C:\\Game's\\town.mp3", volume: 0.5, loop: true, isAvailable: () => true });
  assert.equal(c.cmd, "powershell");
  assert.ok(c.args.includes("-EncodedCommand"));
  const script = Buffer.from(c.args.at(-1), "base64").toString("utf16le");
  assert.ok(script.includes("System.Windows.Media.MediaPlayer"));
  assert.ok(script.includes("C:\\Game''s\\town.mp3"));
  assert.ok(script.includes("$p.Volume = 0.5"));
  assert.ok(script.includes("if ($true)"));
  const once = Buffer.from(buildPlayerCommand({ platform: "win32", file: "C:\\a.mp3", volume: 1, loop: false, isAvailable: () => true }).args.at(-1), "base64").toString("utf16le");
  assert.ok(once.includes("while ($false)"));
});
test("Linux: pilih pemutar yang cocok dengan format & tersedia", () => {
  const only = (...cmds) => (cmd) => cmds.includes(cmd);
  const run = (file, available) => buildPlayerCommand({ platform: "linux", file, volume: 0.5, loop: true, isAvailable: available });
  assert.equal(run("/m/a.mp3", only("ffplay", "mpg123")).cmd, "ffplay");
  assert.equal(run("/m/a.mp3", only("mpg123")).cmd, "mpg123");
  assert.equal(run("/m/a.wav", only("aplay")).cmd, "aplay");
  assert.equal(run("/m/a.mp3", only("aplay")), null); // aplay tidak bisa mp3
  assert.equal(run("/m/a.mp4", only("mpg123")), null); // mpg123 hanya mp3
  assert.equal(run("/m/a.mp3", only()), null);
});

console.log("LAGU LATAR");
test("playMusic memulai pemutar; lagu yang sama tidak diulang; lagu lain menghentikan yang lama", () => {
  const { audio, spawned } = makeEnv();
  audio.playMusic("town");
  assert.equal(spawned.length, 1);
  assert.equal(playingFile(spawned[0]), "town.mp3");
  audio.playMusic("town");
  assert.equal(spawned.length, 1);
  audio.playMusic("battleWild");
  assert.equal(spawned.length, 2);
  assert.equal(spawned[0].proc.killed, true);
  assert.equal(playingFile(spawned[1]), "battle_wild.mp3");
});
test("file tidak ada / dimatikan → senyap tanpa error", () => {
  const missing = makeEnv({ files: [] });
  assert.doesNotThrow(() => missing.audio.playMusic("town"));
  assert.equal(missing.spawned.length, 0);
  const off = makeEnv({ enabled: false });
  off.audio.playMusic("town");
  assert.equal(off.spawned.length, 0);
});
test("tidak ada pemutar di Linux → senyap tanpa error", () => {
  const { audio, spawned } = makeEnv({ available: () => false });
  assert.doesNotThrow(() => audio.playMusic("town"));
  assert.equal(spawned.length, 0);
});
test("lagu cadangan: route memakai town; berpindah route→town tidak memulai ulang", () => {
  const { audio, spawned } = makeEnv();
  audio.playMusic("route");
  assert.equal(playingFile(spawned[0]), "town.mp3");
  audio.playMusic("town");
  assert.equal(spawned.length, 1);
  audio.playMusic("battleGym"); // cadangan: battleWild
  assert.equal(playingFile(spawned.at(-1)), "battle_wild.mp3");
});
test("ekstensi: mp3 diprioritaskan; mp4 dipakai jika hanya itu yang ada", () => {
  const both = makeEnv({ files: ["town.mp4", "town.mp3"] });
  both.audio.playMusic("town");
  assert.equal(playingFile(both.spawned[0]), "town.mp3");
  const mp4 = makeEnv({ files: ["town.mp4"] });
  mp4.audio.playMusic("town");
  assert.equal(playingFile(mp4.spawned[0]), "town.mp4");
});
test("loop: lagu yang selesai diputar ulang otomatis", () => {
  const { audio, spawned, tick } = makeEnv();
  audio.playMusic("town");
  tick(60000);
  spawned[0].proc.emit("close");
  assert.equal(spawned.length, 2);
  tick(60000);
  spawned[1].proc.emit("close");
  assert.equal(spawned.length, 3);
});
test("pemutar langsung mati 2x berturut-turut → musik dimatikan (tanpa loop tak berujung)", () => {
  const { audio, spawned, tick } = makeEnv();
  audio.playMusic("town");
  tick(100);
  spawned[0].proc.emit("close");
  assert.equal(spawned.length, 2);
  tick(100);
  spawned[1].proc.emit("close");
  assert.equal(spawned.length, 2);
  assert.equal(audio.isBroken(), true);
});
test("error spawn (mis. pemutar tidak ditemukan) → ditandai rusak, tidak melempar", () => {
  const { audio, spawned } = makeEnv();
  audio.playMusic("town");
  assert.doesNotThrow(() => spawned[0].proc.emit("error", new Error("ENOENT")));
  assert.equal(audio.isBroken(), true);
  audio.playMusic("battleWild");
  assert.equal(spawned.length, 1);
});

console.log("JINGLE & SAKLAR");
test("jingle menghentikan lagu latar; lagu yang diminta saat jingle ditunda; lanjut setelah jingle selesai", () => {
  const { audio, spawned } = makeEnv();
  audio.playMusic("battleWild");
  assert.equal(audio.playJingle("victory"), true);
  assert.equal(spawned[0].proc.killed, true);
  assert.equal(playingFile(spawned[1]), "victory.mp3");
  audio.playMusic("town"); // diminta saat jingle masih berjalan
  assert.equal(spawned.length, 2);
  spawned[1].proc.emit("close"); // jingle selesai
  assert.equal(spawned.length, 3);
  assert.equal(playingFile(spawned[2]), "town.mp3");
});
test("jingle tanpa file → false dan lagu latar tetap berjalan", () => {
  const { audio, spawned } = makeEnv();
  audio.playMusic("town");
  assert.equal(audio.playJingle("evolution"), false);
  assert.equal(audio.playJingle(undefined), false);
  assert.equal(spawned[0].proc.killed, false);
});
test("setEnabled(false) menghentikan semua; setEnabled(true) melanjutkan lagu yang diinginkan", () => {
  const { audio, spawned } = makeEnv();
  audio.playMusic("town");
  audio.setEnabled(false);
  assert.equal(spawned[0].proc.killed, true);
  audio.playMusic("battleWild");
  assert.equal(spawned.length, 1);
  audio.setEnabled(true);
  assert.equal(spawned.length, 2);
  assert.equal(playingFile(spawned[1]), "battle_wild.mp3");
});
test("stopAll menghentikan lagu dan jingle", () => {
  const { audio, spawned } = makeEnv();
  audio.playMusic("town");
  audio.playJingle("victory");
  audio.stopAll();
  assert.ok(spawned.every((s) => s.proc.killed));
  assert.deepEqual(audio.state(), { desired: "town", playing: null, jingle: false });
});

console.log(`\n${passed} tes lolos.`);
