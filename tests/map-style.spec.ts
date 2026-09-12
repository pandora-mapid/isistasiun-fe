import { test, expect } from "@playwright/test";
import { validateStyleMin } from "@maplibre/maplibre-gl-style-spec";

import { SOURCE } from "../lib/map/config";
import {
  isochroneFillLayer,
  isochroneLineLayer,
  pointArusLayer,
  pointCircleLayer,
  pointConfidenceLayer,
  pointLabelLayer,
  scaleDependentPaint,
} from "../lib/map/style";
import { retailCircleLayer, retailLabelLayer } from "../lib/map/retail-style";
import { sewaIndeksLayer, sewaPetakLayer } from "../lib/map/rent-style";
import type { Domain } from "../lib/analytics/select";

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
      [SOURCE.pointLabels]: { type: "geojson", data: EMPTY_FC },
      [SOURCE.retail]: { type: "geojson", data: EMPTY_FC },
      [SOURCE.sewa]: { type: "geojson", data: EMPTY_FC },
    },
    layers,
  };
}

/**
 * Rentang yang dipakai menyusun ekspresi. Sejak ROADMAP 1.5 skala mengikuti
 * data, jadi yang diuji bukan satu susunan tetap melainkan beberapa bentuk
 * rentang yang mungkin muncul — termasuk yang berujung sama, yang membuat
 * MapLibre menolak `interpolate` kalau tidak dijaga.
 */
const DOMAINS: { nama: string; domain: Domain }[] = [
  { nama: "rentang wajar", domain: { min: 0, max: 4_000_000 } },
  { nama: "rentang sempit", domain: { min: 450_000, max: 500_000 } },
  { nama: "rentang rata", domain: { min: 700_000, max: 700_000 } },
];

const DOMAIN_UJI: Domain = DOMAINS[0].domain;
/** Sebaran skor kepercayaan — 0–1, bukan rupiah. */
const CONF_UJI: Domain = { min: 0.77, max: 0.92 };

const LAYERS: { nama: string; buat: () => unknown }[] = [
  { nama: "isochrone-fill", buat: isochroneFillLayer },
  { nama: "isochrone-line", buat: isochroneLineLayer },
  { nama: "point-confidence", buat: () => pointConfidenceLayer(DOMAIN_UJI, CONF_UJI) },
  { nama: "point-circle", buat: () => pointCircleLayer(DOMAIN_UJI) },
  { nama: "point-label", buat: pointLabelLayer },
  { nama: "point-arus", buat: pointArusLayer },
  { nama: "retail-circle", buat: retailCircleLayer },
  { nama: "retail-label", buat: retailLabelLayer },
  { nama: "sewa-petak", buat: sewaPetakLayer },
  { nama: "sewa-indeks", buat: sewaIndeksLayer },
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

for (const { nama, domain } of DOMAINS) {
  test(`layer titik tetap sah pada ${nama}`, () => {
    const layers = [
      pointConfidenceLayer(domain, CONF_UJI),
      pointCircleLayer(domain),
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errors = validateStyleMin(styleWith(layers) as any);
    expect(errors.map((e) => `${e.message}`)).toEqual([]);
  });

  test(`paint yang disetel ulang sah pada ${nama}`, () => {
    // `setPaintProperty` tidak divalidasi MapLibre saat runtime — kalau
    // ekspresinya cacat, layer diam-diam berhenti menggambar. Jadi hasil
    // `scaleDependentPaint` dipasang ke layer tiruan lalu divalidasi di sini.
    const perubahan = scaleDependentPaint(domain, CONF_UJI);
    expect(perubahan.length).toBeGreaterThan(0);

    for (const { layer, property, value } of perubahan) {
      const spec = {
        id: layer,
        type: "circle",
        source: SOURCE.points,
        paint: { [property]: value },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errors = validateStyleMin(styleWith([spec]) as any);
      expect(
        errors.map((e) => `${e.message}`),
        `${layer}.${property} ditolak MapLibre`,
      ).toEqual([]);
    }
  });
}

for (const conf of [
  { nama: "sebaran wajar", domain: { min: 0.77, max: 0.92 } },
  { nama: "sebaran rata", domain: { min: 0.8, max: 0.8 } },
  { nama: "sebaran nol", domain: { min: 0, max: 0 } },
]) {
  test(`halo kepercayaan sah pada ${conf.nama}`, () => {
    // Skor kepercayaan hidup di 0–1, jauh lebih kecil dari rupiah. Penjaga
    // rentang berlebar nol harus melebarkannya secara proporsional; kalau ia
    // menambahkan angka tetap, skalanya meleset jauh keluar 0–1.
    const layer = pointConfidenceLayer(DOMAIN_UJI, conf.domain);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errors = validateStyleMin(styleWith([layer]) as any);
    expect(errors.map((e) => `${e.message}`)).toEqual([]);

    const opacity = JSON.stringify(
      (layer as { paint: Record<string, unknown> }).paint["circle-opacity"],
    );
    for (const n of JSON.parse(opacity).flat(9).filter(
      (v: unknown) => typeof v === "number",
    ) as number[]) {
      expect(n, `nilai ${n} keluar dari rentang 0–1`).toBeLessThanOrEqual(1);
      expect(n).toBeGreaterThanOrEqual(0);
    }
  });
}

test("ekspresi zoom tidak pernah bersarang di dalam case", () => {
  // `["zoom"]` hanya sah sebagai masukan interpolate/step paling luar. Kalau
  // tersembunyi di dalam `case` atau `+`, MapLibre menolak seluruh paint tanpa
  // pesan apa pun dan titiknya hilang begitu saja.
  const cari = (node: unknown, didalam: boolean): boolean => {
    if (!Array.isArray(node)) return false;
    if (node[0] === "zoom") return didalam;
    const luar = node[0] === "interpolate" || node[0] === "step";
    return node.some((anak, i) =>
      // Argumen pertama interpolate/step adalah masukannya — di situ `zoom`
      // masih sah; di argumen lain tidak.
      cari(anak, didalam || !luar || i > 2),
    );
  };

  for (const { nama, buat } of LAYERS) {
    const layer = buat() as { paint?: Record<string, unknown> };
    for (const [prop, value] of Object.entries(layer.paint ?? {})) {
      expect(cari(value, false), `${nama}.${prop} menyarangkan ["zoom"]`).toBe(
        false,
      );
    }
  }
});
