/**
 * Perhitungan batang skala jarak.
 *
 * Murni aritmetika: tidak menyentuh React maupun MapLibre, jadi bisa diuji
 * tanpa browser. Yang dibutuhkan dari peta hanya satu angka — berapa meter
 * yang diwakili satu piksel layar — dan itu dihitung `MapCanvas` dengan
 * mengukur jarak bumi sungguhan antara dua titik di kanvas.
 *
 * Sebelumnya batang skala di legenda ditulis mati: tiga ruas `22px` dan teks
 * "0 150 300 m" yang tidak pernah berubah, di zoom mana pun. Itu bukan sekadar
 * kurang rapi — angkanya salah di hampir setiap tingkat zoom.
 */

/**
 * Angka yang enak dibaca di batang skala. Sengaja hanya 1, 2, dan 5 — kelipatan
 * seperti 3 atau 7 membuat pembaca harus menghitung, bukan melirik.
 */
const LANGKAH = [1, 2, 5] as const;

export type ScaleBar = {
  /** Jarak yang diwakili batang, dalam meter. */
  meters: number;
  /** Lebar batang di layar, dalam piksel. */
  widthPx: number;
};

/**
 * Batang skala terpanjang yang masih muat dalam `maxWidthPx`, dibulatkan ke
 * jarak yang enak dibaca.
 *
 * Yang dikunci adalah **jaraknya**, bukan lebarnya: batang boleh lebih pendek
 * dari ruang yang tersedia asalkan angkanya bulat. Kebalikannya — lebar tetap,
 * angka sisa — persis yang membuat skala lama tidak berguna.
 */
export function scaleBarFor(
  metersPerPixel: number,
  maxWidthPx: number,
): ScaleBar | null {
  if (!Number.isFinite(metersPerPixel) || metersPerPixel <= 0) return null;
  if (!Number.isFinite(maxWidthPx) || maxWidthPx <= 0) return null;

  const maxMeters = metersPerPixel * maxWidthPx;
  const meters = jarakBulatDibawah(maxMeters);
  return { meters, widthPx: meters / metersPerPixel };
}

/** Nilai 1/2/5 × 10ⁿ terbesar yang masih ≤ `max`. */
function jarakBulatDibawah(max: number): number {
  const pangkat = Math.floor(Math.log10(max));
  const kandidat = [
    ...LANGKAH.map((m) => m * 10 ** pangkat),
    10 ** (pangkat + 1),
  ];

  let terpilih = kandidat[0];
  for (const nilai of kandidat) {
    if (nilai <= max) terpilih = nilai;
  }
  return terpilih;
}
