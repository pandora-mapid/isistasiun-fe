/**
 * Ringkasan & perbandingan antarsimpul — pemilih tingkat stasiun.
 *
 * Sepupu `select.ts`: kalau `select.ts` memutuskan "angka mana untuk satu
 * titik pada slot × kategori", berkas ini memutuskan "angka mana untuk satu
 * **stasiun** sebagai kawasan", lalu menyandingkan dua simpul dan menghitung
 * selisihnya — kebutuhan inti Persona 2 (pengusaha memilih simpul).
 *
 * Semua fungsi murni: tanpa React, tanpa MapLibre. Rasio yang diturunkan
 * (`capture_rate`, `gap_ratio`, dst.) mengikuti preseden `capturePersen` di
 * Insight — rasio dari angka yang memang ada, bukan angka baru yang dikarang.
 * Tidak ada penjumlahan titik di sini: angka simpul datang sudah jadi dari
 * `StationSummaryPayload` (hasil Monte Carlo setingkat simpul).
 */
import { AMBANG_GERAI } from "@/lib/analytics/select";
import type {
  CategoryComposition,
  CategoryKey,
  StationSummaryPayload,
  StationSummaryRow,
} from "@/lib/data/types";

/** Simpul yang masuk cakupan studi (Manggarai + Sudirman). */
export const SIMPUL_CAKUPAN: readonly number[] = [1, 2];

/**
 * Baris ringkasan simpul yang benar-benar dipakai halaman: dalam cakupan,
 * bukan placeholder, terurut dari kesenjangan harian terbesar.
 */
export function ringkasanSimpul(
  payload: StationSummaryPayload,
  cakupan: readonly number[] = SIMPUL_CAKUPAN,
): StationSummaryRow[] {
  return payload.stations
    .filter((s) => !s.placeholder && cakupan.includes(s.station_id))
    .sort((a, b) => (b.gap.p50 ?? -1) - (a.gap.p50 ?? -1));
}

/** Kategori yang permintaannya terbaca tapi gerainya di bawah ambang. */
export function kategoriHilang(row: StationSummaryRow): CategoryComposition[] {
  return row.composition
    .filter((c) => c.hilang)
    .sort((a, b) => b.demand_share - a.demand_share);
}

/**
 * Entry ratio (E) pada titik puncak — angka yang membedakan simpul "transit"
 * (orang menunggu, singgah) dari "pass-through" (orang lewat, buru-buru).
 */
export function entryRatioPuncak(row: StationSummaryRow): number | null {
  return row.peak?.variables?.E ?? null;
}

/** Arus pejalan (F) pada titik puncak, org/jam. */
export function arusPuncak(row: StationSummaryRow): number | null {
  return row.peak?.variables?.F ?? null;
}

export type BandingSimpul = {
  a: StationSummaryRow;
  b: StationSummaryRow;
  /** `a.gap.p50 / b.gap.p50` — berapa kali kesenjangan A dibanding B. */
  gapRatio: number | null;
  /** Selisih porsi tertangkap dalam poin persen (`a − b`). */
  captureRateSelisih: number | null;
  entryRatio: { a: number | null; b: number | null };
  arus: { a: number | null; b: number | null };
  /** Kategori yang hilang di KEDUA simpul — peluang yang berlaku di mana saja. */
  hilangBersama: CategoryKey[];
};

/**
 * Sandingkan dua simpul. `a` dan `b` diambil apa adanya (pemanggil yang
 * memutuskan urutannya — biasanya kesenjangan terbesar dulu).
 */
export function bandingkanSimpul(
  a: StationSummaryRow,
  b: StationSummaryRow,
): BandingSimpul {
  const gapA = a.gap.p50;
  const gapB = b.gap.p50;
  const eA = entryRatioPuncak(a);
  const eB = entryRatioPuncak(b);

  const hilangA = new Set(kategoriHilang(a).map((c) => c.category));
  const hilangB = new Set(kategoriHilang(b).map((c) => c.category));
  const hilangBersama = [...hilangA].filter((c) => hilangB.has(c));

  return {
    a,
    b,
    gapRatio: gapA !== null && gapB ? gapA / gapB : null,
    captureRateSelisih:
      a.capture_rate !== null && b.capture_rate !== null
        ? (a.capture_rate - b.capture_rate) * 100
        : null,
    entryRatio: { a: eA, b: eB },
    arus: { a: arusPuncak(a), b: arusPuncak(b) },
    hilangBersama,
  };
}

/**
 * Cek konsistensi internal satu baris ringkasan — dipakai `tests/summary.spec.ts`
 * dan aman dipanggil di dev untuk menangkap data contoh yang menyimpang.
 *
 * `hilang` harus mengikuti ambang yang sama dengan `select.ts`
 * (`AMBANG_GERAI`), dan `capture_rate` harus benar-benar rasio
 * `tertangkap.p50 / potensi.p50`.
 */
export function periksaBaris(row: StationSummaryRow): string[] {
  const masalah: string[] = [];

  for (const c of row.composition) {
    const harusHilang = c.gerai_count < AMBANG_GERAI;
    if (c.hilang !== harusHilang) {
      masalah.push(
        `${row.station_name}/${c.category}: hilang=${c.hilang} tapi gerai=${c.gerai_count} (ambang ${AMBANG_GERAI})`,
      );
    }
  }

  if (
    row.capture_rate !== null &&
    row.potensi.p50 !== null &&
    row.tertangkap.p50 !== null
  ) {
    const rasio = row.tertangkap.p50 / row.potensi.p50;
    if (Math.abs(rasio - row.capture_rate) > 0.01) {
      masalah.push(
        `${row.station_name}: capture_rate ${row.capture_rate} ≠ tertangkap/potensi ${rasio.toFixed(4)}`,
      );
    }
  }

  if (row.pintu_ditahan > row.pintu_dicacah) {
    masalah.push(
      `${row.station_name}: pintu_ditahan ${row.pintu_ditahan} > pintu_dicacah ${row.pintu_dicacah}`,
    );
  }

  return masalah;
}
