import { test, expect } from "@playwright/test";

import { scaleBarFor } from "../lib/map/scale";
import { jarak } from "../lib/format";

/**
 * Uji batang skala — tanpa browser, jadi cepat.
 *
 * Skala lama ditulis mati ("0 150 300 m") dan tidak pernah salah *terlihat*,
 * hanya selalu salah *nilainya*. Kelas kesalahan seperti itu tidak akan
 * tertangkap tes tampilan, jadi aritmetikanya diuji langsung di sini.
 */

test("batang tidak pernah melebihi ruang yang tersedia", () => {
  for (const mpp of [0.1, 0.5, 1, 2.4, 9.7, 38, 152, 1200, 9800]) {
    const bar = scaleBarFor(mpp, 96);
    expect(bar, `mpp ${mpp} tidak menghasilkan batang`).not.toBeNull();
    expect(bar!.widthPx, `mpp ${mpp} meluber`).toBeLessThanOrEqual(96);
    expect(bar!.widthPx).toBeGreaterThan(0);
  }
});

test("jaraknya selalu angka bulat 1/2/5 × 10ⁿ", () => {
  for (const mpp of [0.3, 1.7, 4.2, 23, 88, 640, 5100]) {
    const { meters } = scaleBarFor(mpp, 96)!;
    const pangkat = 10 ** Math.floor(Math.log10(meters));
    const mantissa = Math.round(meters / pangkat);
    expect([1, 2, 5], `${meters} m bukan angka bulat`).toContain(mantissa);
  }
});

test("batang memakai ruang sebaik mungkin, tidak menciut sia-sia", () => {
  // Kalau ada angka bulat yang lebih besar dan masih muat, itu yang seharusnya
  // dipakai — batang sependek 10px di ruang 96px tidak memberi tahu apa pun.
  for (const mpp of [0.7, 3.3, 46, 910]) {
    const { widthPx } = scaleBarFor(mpp, 96)!;
    expect(widthPx, `mpp ${mpp} menyisakan terlalu banyak ruang`).toBeGreaterThan(
      96 / 5.001,
    );
  }
});

test("masukan tak masuk akal ditolak, bukan menghasilkan NaN", () => {
  expect(scaleBarFor(0, 96)).toBeNull();
  expect(scaleBarFor(-3, 96)).toBeNull();
  expect(scaleBarFor(Number.NaN, 96)).toBeNull();
  expect(scaleBarFor(Number.POSITIVE_INFINITY, 96)).toBeNull();
  expect(scaleBarFor(12, 0)).toBeNull();
});

test("jarak diformat dengan satuan yang wajar", () => {
  expect(jarak(50)).toBe("50 m");
  expect(jarak(500)).toBe("500 m");
  expect(jarak(1000)).toBe("1 km");
  expect(jarak(2000)).toBe("2 km");
  expect(jarak(1500)).toBe("1,5 km");
});
