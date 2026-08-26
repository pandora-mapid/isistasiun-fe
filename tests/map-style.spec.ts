import { test, expect } from "@playwright/test";
import { validateStyleMin } from "@maplibre/maplibre-gl-style-spec";

import { SOURCE } from "../lib/map/config";
import {
  isochroneFillLayer,
  isochroneLineLayer,
  pointCircleLayer,
  pointLabelLayer,
} from "../lib/map/style";

/**
 * Validasi spesifikasi layer peta — tanpa browser, jadi cepat.
 *
 * Tes ini ada karena satu kelas kesalahan yang sudah pernah terjadi: memakai
 * ekspresi `feature-state` di dalam `filter`. MapLibre menolaknya saat
 * runtime, layer gagal dipasang, dan peta tampak kosong tanpa pesan apa pun.
 * Validator resmi menangkapnya di sini, sebelum sampai ke browser.
 */

const EMPTY_FC = { type: "FeatureCollection" as const, features: [] };

function styleWith(layers: unknown[]) {
  return {
    version: 8,
    name: "uji",
    glyphs: "https://example.com/{fontstack}/{range}.pbf",
    sources: {
      [SOURCE.points]: { type: "geojson", data: EMPTY_FC },
      [SOURCE.isochrones]: { type: "geojson", data: EMPTY_FC },
    },
    layers,
  };
}

const LAYERS: { nama: string; buat: () => unknown }[] = [
  { nama: "isochrone-fill", buat: isochroneFillLayer },
  { nama: "isochrone-line", buat: isochroneLineLayer },
  { nama: "point-circle", buat: pointCircleLayer },
  { nama: "point-label", buat: pointLabelLayer },
];

for (const { nama, buat } of LAYERS) {
  test(`layer ${nama} lolos validasi style spec`, () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errors = validateStyleMin(styleWith([buat()]) as any);
    expect(
      errors.map((e) => `${e.message}`),
      `layer ${nama} ditolak MapLibre`,
    ).toEqual([]);
  });
}

test("seluruh layer bisa dipasang bersamaan", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const errors = validateStyleMin(styleWith(LAYERS.map((l) => l.buat())) as any);
  expect(errors.map((e) => `${e.message}`)).toEqual([]);
});

test("tidak ada feature-state di dalam filter", () => {
  // Penjaga eksplisit: `feature-state` sah di paint, terlarang di filter.
  for (const { nama, buat } of LAYERS) {
    const layer = buat() as { filter?: unknown };
    if (!layer.filter) continue;
    expect(
      JSON.stringify(layer.filter),
      `layer ${nama} memakai feature-state di filter`,
    ).not.toContain("feature-state");
  }
});
