// Menjalankan main.js dengan RNG terkunci (0) agar alur tes deterministik.
import { setRng } from "../utils/random.js";
setRng(() => 0);
await import("../main.js");
