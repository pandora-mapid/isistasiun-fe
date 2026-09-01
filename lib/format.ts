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
