// Pemutar musik TANPA library: memanfaatkan pemutar bawaan sistem lewat child_process.
// Semua kegagalan (tidak ada pemutar / file hilang / error) ditelan secara diam-diam: game tetap jalan tanpa suara.
import { spawn as nodeSpawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CONFIG } from "../data/config.js";
import { TRACK_FILES, JINGLE_FILES, MUSIC_FALLBACKS, MUSIC_EXTENSIONS } from "../data/music.js";

const DEFAULT_MUSIC_DIR = process.env.MUSIC_DIR ?? fileURLToPath(new URL("../assets/music/", import.meta.url));
const FILE_NAMES = { ...TRACK_FILES, ...JINGLE_FILES };

// Pemutar Linux, diurutkan dari yang paling umum. formats: null = semua format.
const LINUX_PLAYERS = [
  { cmd: "ffplay", formats: null, args: (file, volume) => ["-nodisp", "-autoexit", "-loglevel", "quiet", "-volume", String(Math.round(volume * 100)), file] },
  { cmd: "mpg123", formats: ["mp3"], args: (file, volume) => ["-q", "-f", String(Math.round(volume * 32768)), file] },
  { cmd: "cvlc", formats: null, args: (file) => ["--play-and-exit", "--quiet", file] },
  { cmd: "paplay", formats: ["wav", "ogg"], args: (file) => [file] },
  { cmd: "aplay", formats: ["wav"], args: (file) => ["-q", file] },
];

// Skrip PowerShell (Windows) memakai MediaPlayer bawaan; loop dilakukan di dalam skrip agar mulus.
const windowsScript = (file, volume, loop) => `Add-Type -AssemblyName presentationCore
$p = New-Object System.Windows.Media.MediaPlayer
$p.Open([uri]'${file.replace(/'/g, "''")}')
$p.Volume = ${volume}
$p.Play()
while (-not $p.NaturalDuration.HasTimeSpan) { Start-Sleep -Milliseconds 100 }
$ms = [int]$p.NaturalDuration.TimeSpan.TotalMilliseconds
do {
  Start-Sleep -Milliseconds $ms
  if (${loop ? "$true" : "$false"}) { $p.Position = [TimeSpan]::Zero; $p.Play() }
} while (${loop ? "$true" : "$false"})`;

const defaultIsAvailable = (() => {
  const cache = new Map();
  return (cmd) => {
    if (!cache.has(cmd)) cache.set(cmd, spawnSync("which", [cmd], { stdio: "ignore" }).status === 0);
    return cache.get(cmd);
  };
})();

// Menyusun perintah pemutar sesuai OS. Mengembalikan null jika tidak ada pemutar yang cocok.
export const buildPlayerCommand = ({ platform, file, volume, loop, isAvailable }) => {
  const extension = path.extname(file).slice(1).toLowerCase();
  if (platform === "darwin") return { cmd: "afplay", args: ["-v", String(volume), file] };
  if (platform === "win32") {
    const encoded = Buffer.from(windowsScript(file, volume, loop), "utf16le").toString("base64");
    return { cmd: "powershell", args: ["-NoProfile", "-NonInteractive", "-EncodedCommand", encoded] };
  }
  const player = LINUX_PLAYERS.find((candidate) => (!candidate.formats || candidate.formats.includes(extension)) && isAvailable(candidate.cmd));
  return player ? { cmd: player.cmd, args: player.args(file, volume) } : null;
};

export const createAudio = ({
  spawn = nodeSpawn,
  platform = process.platform,
  isAvailable = defaultIsAvailable,
  fileExists = fs.existsSync,
  musicDir = DEFAULT_MUSIC_DIR,
  now = Date.now,
  enabled = CONFIG.music.enabled,
  volume = CONFIG.music.volume,
} = {}) => {
  let on = enabled;
  let broken = false; // true jika pemutar bermasalah: musik dimatikan untuk sisa sesi
  let desired = null; // lagu yang DIINGINKAN menu saat ini (nama logis)
  let bgm = null; // { file, proc } lagu latar yang sedang berjalan
  let jingle = null; // { proc } jingle yang sedang berjalan
  let quickFailures = 0;

  const findFile = (name) => {
    const base = FILE_NAMES[name];
    if (!base) return null;
    const ext = MUSIC_EXTENSIONS.find((candidate) => fileExists(path.join(musicDir, `${base}.${candidate}`)));
    return ext ? path.join(musicDir, `${base}.${ext}`) : null;
  };

  // Lagu diminta -> cari file-nya; jika tidak ada, coba lagu cadangan.
  const resolveFile = (name) => [name, ...(MUSIC_FALLBACKS[name] ?? [])].map(findFile).find(Boolean) ?? null;

  const launch = (file, loop) => {
    const command = buildPlayerCommand({ platform, file, volume, loop, isAvailable });
    if (!command) return null;
    try {
      return spawn(command.cmd, command.args, { stdio: "ignore", windowsHide: true });
    } catch {
      return null;
    }
  };

  const stopBgm = () => {
    if (!bgm) return;
    const { proc } = bgm;
    bgm = null; // dikosongkan DULU agar handler 'close' tahu ini penghentian sengaja
    proc.kill();
  };

  const stopJingle = () => {
    if (!jingle) return;
    const { proc } = jingle;
    jingle = null;
    proc.kill();
  };

  const startBgm = () => {
    if (!on || broken || !desired || jingle) return;
    const file = resolveFile(desired);
    if (!file) return stopBgm();
    if (bgm?.file === file) return; // file yang sama sudah berputar: jangan diulang dari awal
    stopBgm();

    const startedAt = now();
    const proc = launch(file, true);
    if (!proc) return;
    bgm = { file, proc };
    proc.on("error", () => {
      broken = true;
      if (bgm?.proc === proc) bgm = null;
    });
    proc.on("close", () => {
      if (bgm?.proc !== proc) return; // dihentikan sengaja
      bgm = null;
      // Loop: putar ulang. Jika berhenti terlalu cepat 2x berturut-turut, anggap rusak (cegah loop tanpa henti).
      if (now() - startedAt < 1500) {
        quickFailures += 1;
        if (quickFailures >= 2) {
          broken = true;
          return;
        }
      } else {
        quickFailures = 0;
      }
      startBgm();
    });
  };

  const playMusic = (name) => {
    desired = name;
    startBgm();
  };

  // Jingle: hentikan BGM, putar sekali; setelah selesai, lagu yang diinginkan menu dilanjutkan.
  const playJingle = (name) => {
    if (!on || broken) return false;
    const file = findFile(name);
    if (!file) return false;
    stopBgm();
    stopJingle();
    const proc = launch(file, false);
    if (!proc) return false;
    jingle = { proc };
    const finish = () => {
      if (jingle?.proc !== proc) return;
      jingle = null;
      startBgm();
    };
    proc.on("close", finish);
    proc.on("error", () => {
      broken = true;
      finish();
    });
    return true;
  };

  const stopAll = () => {
    stopBgm();
    stopJingle();
  };

  const setEnabled = (value) => {
    on = value;
    if (on) startBgm();
    else stopAll();
    return on;
  };

  return {
    playMusic,
    playJingle,
    stopAll,
    setEnabled,
    isEnabled: () => on,
    isBroken: () => broken,
    state: () => ({ desired, playing: bgm?.file ?? null, jingle: jingle !== null }),
  };
};

export const audio = createAudio();
process.on("exit", () => audio.stopAll()); // jangan tinggalkan pemutar yatim saat game ditutup
