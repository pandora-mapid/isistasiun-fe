import { test, expect } from "@playwright/test";

import spendingGapMock from "../public/mock/spending-gap.json";
import stationSummaryMock from "../public/mock/station-summary.json";
import {
  bandingkanSimpul,
  kategoriHilang,
  periksaBaris,
  ringkasanSimpul,
  SIMPUL_CAKUPAN,
} from "../lib/analytics/summary";
import { AMBANG_GERAI } from "../lib/analytics/select";
import type {
  SpendingGapPayload,
  StationSummaryPayload,
} from "../lib/data/types";

/**
 * Uji ringkasan & perbandingan antarsimpul — tanpa browser, jadi cepat.
 *
 * Dua hal yang dijaga di sini:
 *
 * 1. **`station-summary.json` tidak boleh menyimpang dari `spending-gap.json`.**
 *    Keduanya data contoh yang berdiri sendiri; kalau salah satu diedit dan
 *    yang lain tidak, strip "Ringkasan simpul" dan matriks di halaman Insight
 *    akan menampilkan angka yang berbeda untuk hal yang sama. Titik puncak,
 *    F/E/C/V-nya, dan jumlah gerai kategori dikunci sama persis di sini.
 * 2. **Angka simpul jujur.** `capture_rate` benar-benar `tertangkap/potensi`;
 *    `hilang` mengikuti ambang yang sama dengan `select.ts`; rentang Monte
 *    Carlo setingkat simpul lebih rapat dari rentang titik mana pun (efek
 *    diversifikasi) dan p50-nya mendekati jumlah titik yang diestimasi —
 *    bukan angka yang mengambang lepas dari datanya.
 */

const summary = (stationSummaryMock as { data: StationSummaryPayload }).data;
const gap = (spendingGapMock as { data: SpendingGapPayload }).data;

/* -------------------------------------------------------------------------
 * ringkasanSimpul — baris yang dipakai halaman
 * ---------------------------------------------------------------------- */

test("hanya simpul dalam cakupan, placeholder dibuang, terurut kesenjangan turun", () => {
  const baris = ringkasanSimpul(summary);
  expect(baris.map((s) => s.station_name)).toEqual(["Manggarai", "Sudirman"]);
  // Simpul ke-3 masih placeholder — tidak boleh muncul.
  expect(baris.some((s) => s.placeholder)).toBe(false);
  // Manggarai kesenjangan hariannya lebih besar → di atas.
  expect(baris[0].gap.p50).toBeGreaterThan(baris[1].gap.p50 ?? 0);
});

test("cakupan default adalah Manggarai + Sudirman", () => {
  expect([...SIMPUL_CAKUPAN].sort()).toEqual([1, 2]);
});

/* -------------------------------------------------------------------------
 * Konsistensi internal tiap baris
 * ---------------------------------------------------------------------- */

test("setiap baris ringkasan lolos periksa konsistensi", () => {
  for (const row of summary.stations) {
    expect(periksaBaris(row), row.station_name).toEqual([]);
  }
});

test("capture_rate benar-benar tertangkap.p50 / potensi.p50", () => {
  for (const row of ringkasanSimpul(summary)) {
    const rasio = (row.tertangkap.p50 ?? 0) / (row.potensi.p50 ?? 1);
    expect(row.capture_rate, row.station_name).toBeCloseTo(rasio, 2);
  }
});

test("'hilang' mengikuti ambang gerai yang sama dengan select.ts", () => {
  for (const row of summary.stations) {
    for (const c of row.composition) {
      expect(c.hilang, `${row.station_name}/${c.category}`).toBe(
        c.gerai_count < AMBANG_GERAI,
      );
    }
  }
});

/* -------------------------------------------------------------------------
 * Drift-guard: station-summary.json ⇄ spending-gap.json
 * ---------------------------------------------------------------------- */

test("titik puncak tiap simpul cocok dengan spending-gap.json", () => {
  for (const row of ringkasanSimpul(summary)) {
    const peak = row.peak;
    expect(peak, row.station_name).not.toBeNull();

    const point = gap.points.find((p) => p.point_id === peak!.point_id);
    expect(point, `titik ${peak!.point_id}`).toBeTruthy();

    // Titik puncak = titik berkesenjangan harian terbesar di simpul itu.
    const titikSimpul = gap.points.filter(
      (p) => p.station_id === row.station_id && !p.sampel_tipis,
    );
    const maxGap = Math.max(...titikSimpul.map((p) => p.total.gap.p50 ?? 0));
    expect(point!.total.gap.p50).toBe(maxGap);

    // F/E/C/V pada slot puncak identik dengan sumbernya.
    const slot = point!.by_slot.find((s) => s.slot === peak!.slot);
    expect(slot?.variables).toEqual(peak!.variables);
    expect(slot?.gap).toEqual(peak!.gap);
  }
});

test("jumlah gerai kategori diambil dari titik puncak, bukan dikarang", () => {
  for (const row of ringkasanSimpul(summary)) {
    const point = gap.points.find((p) => p.point_id === row.peak!.point_id)!;
    const catSlot = point.by_slot.find((s) => s.slot === row.peak!.slot)!;
    for (const c of row.composition) {
      const src = catSlot.by_category.find((x) => x.category === c.category);
      expect(c.gerai_count, `${row.station_name}/${c.category}`).toBe(
        src?.gerai_count ?? 0,
      );
      expect(c.demand_share).toBeCloseTo(src?.demand_share ?? 0, 4);
    }
  }
});

test("struk terbaca simpul = jumlah struk seluruh titiknya", () => {
  for (const row of ringkasanSimpul(summary)) {
    const total = gap.points
      .filter((p) => p.station_id === row.station_id)
      .reduce((t, p) => t + p.evidence.struk_terbaca, 0);
    expect(row.struk_terbaca, row.station_name).toBe(total);
  }
});

test("pintu dicacah & ditahan cocok dengan spending-gap.json", () => {
  for (const row of ringkasanSimpul(summary)) {
    const titik = gap.points.filter((p) => p.station_id === row.station_id);
    expect(row.pintu_dicacah, row.station_name).toBe(titik.length);
    expect(row.pintu_ditahan).toBe(titik.filter((p) => p.sampel_tipis).length);
  }
});

test("rentang Monte Carlo simpul rapat dan p50-nya dekat jumlah titik", () => {
  for (const row of ringkasanSimpul(summary)) {
    expect(row.basis).toBe("monte-carlo-simpul");

    const titik = gap.points.filter(
      (p) => p.station_id === row.station_id && !p.sampel_tipis,
    );
    for (const k of ["gap", "potensi", "tertangkap"] as const) {
      const jumlah = titik.reduce((t, p) => t + (p.total[k].p50 ?? 0), 0);
      const p50 = row[k].p50 ?? 0;
      // p50 simpul mendekati jumlah titik (±12%) — tidak mengambang lepas.
      expect(Math.abs(p50 - jumlah) / jumlah, `${row.station_name}.${k}`).toBeLessThan(
        0.12,
      );
      // Rentang lebih rapat dari sebaran titik tunggal (~0,78–1,40).
      expect((row[k].p10 ?? 0) / p50).toBeGreaterThan(0.83);
      expect((row[k].p90 ?? 0) / p50).toBeLessThan(1.37);
    }
  }
});

/* -------------------------------------------------------------------------
 * bandingkanSimpul
 * ---------------------------------------------------------------------- */

test("perbandingan: rasio kesenjangan, selisih capture, entry ratio, arus", () => {
  const [a, b] = ringkasanSimpul(summary);
  const d = bandingkanSimpul(a, b);

  expect(d.gapRatio).toBeGreaterThan(1); // Manggarai > Sudirman
  expect(d.gapRatio).toBeCloseTo(
    (a.gap.p50 ?? 0) / (b.gap.p50 ?? 1),
    5,
  );
  expect(d.entryRatio.a).toBe(a.peak?.variables?.E ?? null);
  expect(d.entryRatio.b).toBe(b.peak?.variables?.E ?? null);
  expect(d.arus.a).toBe(a.peak?.variables?.F ?? null);

  // Di data contoh keduanya cuma punya cukup gerai F&B — sisanya hilang di
  // dua-duanya. Itu contoh konkret value prop Persona 2.
  expect(d.hilangBersama.sort()).toEqual(["apotek", "jasa", "lainnya", "ritel"]);
});

test("kategori hilang diurutkan dari permintaan terbesar", () => {
  for (const row of ringkasanSimpul(summary)) {
    const hilang = kategoriHilang(row);
    const shares = hilang.map((c) => c.demand_share);
    expect(shares).toEqual([...shares].sort((x, y) => y - x));
    expect(hilang.every((c) => c.gerai_count < AMBANG_GERAI)).toBe(true);
  }
});
