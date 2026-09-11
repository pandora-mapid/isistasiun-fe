/**
 * Pemformatan angka untuk layar.
 *
 * Semuanya memakai locale `id-ID` supaya pemisah ribuan memakai titik dan
 * desimal memakai koma — sama dengan seluruh tulisan di aplikasi ini.
 *
 * `null` berarti "tidak diestimasi" (sampel tipis), bukan nol. Perbedaan itu
 * dijaga di sini supaya tidak ada satu pun tempat yang diam-diam
 * menampilkannya sebagai "Rp 0" — lihat DATA_CONTRACT §C1.
 */
import type { Range } from "./data/types";

/** Tulisan yang dipakai konsisten untuk nilai yang memang tidak diestimasi. */
export const TIDAK_DIESTIMASI = "tidak diestimasi";

const RIBUAN = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

export function ribuan(value: number): string {
  return RIBUAN.format(value);
}

export function rupiah(value: number | null | undefined): string {
  if (value === null || value === undefined) return TIDAK_DIESTIMASI;
  return `Rp ${RIBUAN.format(Math.round(value))}`;
}

/**
 * Bentuk ringkas untuk legenda dan sumbu, tempat lebar kolom terbatas:
 * `Rp 1,8 jt`. Angka penuh tetap dipakai di panel supaya bisa diperiksa.
 */
export function rupiahRingkas(value: number | null | undefined): string {
  if (value === null || value === undefined) return TIDAK_DIESTIMASI;
  const juta = value / 1_000_000;
  if (Math.abs(juta) >= 1) {
    const teks = new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: juta >= 10 ? 0 : 1,
    }).format(juta);
    return `Rp ${teks} jt`;
  }
  return `Rp ${RIBUAN.format(Math.round(value / 1000))} rb`;
}

/**
 * Rentang P10–P90 dengan satuan ditulis sekali: `Rp 2,3 – 4,0 jt`.
 *
 * Menulis `rupiahRingkas()` dua kali menghasilkan "Rp 2,3 jt – Rp 4 jt", yang
 * pada ukuran display terbaca sebagai dua harga terpisah, bukan sebagai satu
 * rentang. Hanya digabung kalau kedua ujungnya memang berada pada satuan yang
 * sama; kalau tidak, keduanya ditulis penuh supaya tidak menyesatkan.
 */
export function rentangRingkas(range: Range | null | undefined): string {
  if (!range || range.p10 === null || range.p90 === null) return TIDAK_DIESTIMASI;
  const juta = (v: number) =>
    new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: Math.abs(v) / 1_000_000 >= 10 ? 0 : 1,
      maximumFractionDigits: Math.abs(v) / 1_000_000 >= 10 ? 0 : 1,
    }).format(v / 1_000_000);

  if (Math.abs(range.p10) >= 1_000_000 && Math.abs(range.p90) >= 1_000_000) {
    return `Rp ${juta(range.p10)} – ${juta(range.p90)} jt`;
  }
  return `${rupiahRingkas(range.p10)} – ${rupiahRingkas(range.p90)}`;
}

/** Pecahan 0–1 menjadi persen. `0.064` → `6,4%`. */
export function persen(value: number | null | undefined, digit = 1): string {
  if (value === null || value === undefined) return "—";
  return `${new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: digit,
    maximumFractionDigits: digit,
  }).format(value * 100)}%`;
}

/** Jarak untuk batang skala peta: `500 m`, `1,5 km`. */
export function jarak(meter: number): string {
  if (meter >= 1000) {
    const km = new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: 1,
    }).format(meter / 1000);
    return `${km} km`;
  }
  return `${RIBUAN.format(meter)} m`;
}

/** Angka desimal biasa, mis. skor kepercayaan `0,91`. */
export function desimal(value: number, digit = 2): string {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: digit,
    maximumFractionDigits: digit,
  }).format(value);
}
