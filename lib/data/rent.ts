/**
 * Menempelkan indeks sewa/arus pada inventaris petak.
 *
 * Backend menyajikannya sebagai dua endpoint, dan memang beda pemilik dan beda
 * arti: `/analytics/rental-assets` adalah inventaris petak (di mana, seberapa
 * luas, terisi atau kosong), `/analytics/rent-flow-index` adalah skor
 * sewa-per-arus. Peta butuh keduanya dalam satu fitur — bulatannya digambar
 * dari status petak, angkanya dari indeks — jadi penggabungan itu terjadi di
 * sini, sekali, bukan di dalam komponen.
 *
 * **Kenapa satu koleksi, bukan dua lapisan.** Keduanya sempat dibangun
 * terpisah dan masing-masing menggambar petak Space KAI yang sama, dengan
 * `source_id` yang sama pula — hasilnya peta menggambar satu petak fisik dua
 * kali, dua bulatan bertumpuk di koordinat yang identik. Inventarisnya satu,
 * jadi sumbernya juga harus satu; indeks menumpang di atasnya sebagai atribut
 * tambahan, bukan sebagai lapisan kedua.
 *
 * Petak tanpa baris indeks tetap ikut dengan `index: null`. Itu keadaan yang
 * lumrah dan bukan kesalahan: sewa in-station Sudirman tidak ada di API KAI,
 * dan listing pasar sekitar tidak punya denominator arus yang sepadan.
 * Mengisinya nol akan terbaca "sewanya gratis", bukan "belum terukur".
 */
import type { RentFlowIndexPayload, RentalAsset } from "./types";

/** Satu petak sewa siap gambar: inventaris + indeks (kalau ada). */
export type RentPlot = RentalAsset & {
  /** Sewa ditawarkan, rupiah/tahun. `null` bila sumber tak membukanya. */
  offered_rent: number | null;
  /** Arus terukur yang jadi penyebut indeks. `null` bila tak terukur. */
  measured_flow: number | null;
  /** `offered_rent / measured_flow`. `null` = belum terukur, bukan nol. */
  index: number | null;
  /**
   * Label siap tulis, HANYA ada kalau `index` ada.
   *
   * Disiapkan di sini sebagai properti fitur, bukan dirangkai di ekspresi
   * peta: `text-field` adalah properti *layout*, dan pemformatan rupiah bukan
   * urusan ekspresi MapLibre. Layer indeks menyaring `["has", "index_label"]`,
   * jadi ketiadaan kunci inilah yang membuat petak tanpa indeks tidak berlabel
   * sama sekali — alih-alih tertulis "Rp 0", yang berarti gratis.
   */
  index_label?: string;
  is_outlier: boolean;
};

export function gabungSewa(
  assets: RentalAsset[],
  indices: RentFlowIndexPayload[],
): RentPlot[] {
  // Dikunci pada `source_id`, bukan `id`: `plot_id` di rent-flow-index adalah
  // id petak dari sumbernya (blokid Space KAI), bukan primary key baris aset.
  const byPlot = new Map(indices.map((row) => [row.plot_id, row]));

  return assets.map((asset) => {
    const skor = byPlot.get(asset.source_id);
    const index = skor?.index ?? null;
    return {
      ...asset,
      offered_rent: skor?.offered_rent ?? null,
      measured_flow: skor?.measured_flow ?? null,
      index,
      ...(index == null ? {} : { index_label: labelIndeks(index) }),
      is_outlier: skor?.is_outlier ?? false,
    };
  });
}

/** Rupiah per orang lewat, dibulatkan untuk label peta ("Rp 9,6 jt"). */
export function labelIndeks(index: number | null): string {
  if (index == null) return "—";
  if (index >= 1_000_000)
    return `Rp ${(index / 1_000_000).toFixed(1).replace(".", ",")} jt`;
  if (index >= 1_000) return `Rp ${Math.round(index / 1_000)} rb`;
  return `Rp ${Math.round(index)}`;
}
