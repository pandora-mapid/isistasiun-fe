/**
 * Menyalin worker MapLibre ke `public/maplibre/` agar bisa disajikan sendiri.
 *
 * KENAPA INI PERLU
 * ----------------
 * MapLibre GL v6 memisahkan worker ke berkas tersendiri (di v5 ke bawah
 * worker-nya menyatu di dalam bundle). Alamat worker itu dihitung sendiri oleh
 * MapLibre dari `import.meta.url`:
 *
 *     let e = import.meta.url;
 *     if (!/^https?:/.test(e)) return "";              // ← string kosong
 *     return new URL("./maplibre-gl-worker.mjs", e).href;
 *
 * Di bawah Turbopack (Next.js 16), `import.meta.url` bukan URL http(s), jadi
 * fungsi itu mengembalikan string kosong dan MapLibre memanggil `new Worker("")`
 * — yang menunjuk ke halaman itu sendiri. Worker-nya lalu menjalankan HTML,
 * bukan kode MapLibre. Akibatnya: tidak ada satu pun tile diminta, GeoJSON
 * tidak pernah diproses, dan peta tampil kosong tanpa pesan error apa pun.
 *
 * Solusinya memakai `setWorkerUrl()` yang memang disediakan MapLibre v6,
 * menunjuk ke salinan yang kita sajikan sendiri dari `public/`.
 * Lihat `components/MapCanvas.tsx`.
 *
 * Skrip ini dijalankan otomatis lewat `predev` dan `prebuild`, sehingga
 * salinannya ikut terbarui ketika versi MapLibre dinaikkan.
 */
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const from = join(root, "node_modules", "maplibre-gl", "dist");
const to = join(root, "public", "maplibre");

// Worker mengimpor "./maplibre-gl-shared.mjs" secara relatif, jadi keduanya
// harus berada di direktori yang sama.
const FILES = ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"];

mkdirSync(to, { recursive: true });

for (const file of FILES) {
  const src = join(from, file);
  if (!existsSync(src)) {
    console.error(
      `[maplibre] ${file} tidak ditemukan di ${from}\n` +
        `Struktur dist MapLibre mungkin berubah — periksa ulang versi paketnya.`,
    );
    process.exit(1);
  }
  copyFileSync(src, join(to, file));
}

console.log(`[maplibre] worker disalin ke public/maplibre/ (${FILES.length} berkas)`);
