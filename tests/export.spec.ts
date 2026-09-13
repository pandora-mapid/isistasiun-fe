import { test, expect } from "@playwright/test";

import { csvCell, namaBerkas, toCsv } from "../lib/export/csv";
import {
  KOLOM_ATRIBUT,
  barisAtribut,
  csvAtribut,
  namaBerkasAtribut,
  urutkan,
} from "../lib/export/rows";
import { ALL_CATEGORIES } from "../lib/data/dimensions";
import type {
  ObservationPointProps,
  PointAnalytics,
  SpendingGapPayload,
} from "../lib/data/types";

/**
 * Ekspor CSV & baris tabel atribut — tanpa browser, sama alasannya dengan
 * `select.spec.ts`: kesalahan di sini muncul sebagai **angka yang salah di
 * dalam berkas yang sudah diunduh orang**, bukan sebagai halaman rusak. Tidak
 * ada tangkapan layar maupun validator yang akan melihatnya.
 */

const NULL_RANGE = { p10: null, p50: null, p90: null };

function titik(over: Partial<PointAnalytics> & { point_id: number }): PointAnalytics {
  return {
    station_id: 1,
    total: { potensi: NULL_RANGE, tertangkap: NULL_RANGE, gap: NULL_RANGE },
    confidence: 0.9,
    sampel_tipis: false,
    sample_meta: { gerai_count: 3, blok_count: 2 },
    evidence: { struk_total: 0, struk_ambigu: 0, struk_terbaca: 0 },
    by_slot: [
      {
        slot: "pagi",
        gap: { p10: 100, p50: 200, p90: 300 },
        potensi: { p10: 400, p50: 500, p90: 600 },
        tertangkap: { p10: 200, p50: 300, p90: 400 },
        variables: { F: 1200, E: 0.08, C: 0.95, V: 25000 },
        sampel_tipis: false,
        by_category: [],
      },
    ],
    ...over,
  } as PointAnalytics;
}

const PAYLOAD: SpendingGapPayload = {
  generated_at: "2026-09-12T00:00:00Z",
  pipeline_version: "mock-1",
  day_type: "weekday",
  points: [
    titik({ point_id: 1 }),
    titik({
      point_id: 2,
      sampel_tipis: true,
      by_slot: [
        {
          slot: "pagi",
          gap: NULL_RANGE,
          potensi: NULL_RANGE,
          tertangkap: NULL_RANGE,
          variables: null,
          sampel_tipis: true,
          by_category: [],
        },
      ],
    }),
  ],
};

const ENTRANCES: ObservationPointProps[] = [
  { id: 1, station_id: 1, station_name: "Manggarai", point_label: "Pintu Bawah", type: "entrance" },
  { id: 2, station_id: 1, station_name: "Manggarai", point_label: "Pintu Atas", type: "entrance" },
];

test("sel yang mengandung koma dibungkus kutip", () => {
  // Nama petak Space KAI memang mengandung koma ("50,09M"), jadi tanpa
  // pembungkusan satu baris pecah jadi dua kolom di Excel.
  expect(csvCell("SPACE MANGGARAI 50,09M (CFC)")).toBe('"SPACE MANGGARAI 50,09M (CFC)"');
  expect(csvCell('dia bilang "ya"')).toBe('"dia bilang ""ya"""');
  expect(csvCell("biasa")).toBe("biasa");
});

test("nilai yang tidak diestimasi ditulis kosong, bukan nol", () => {
  // Sel kosong tidak ikut dijumlahkan atau dirata-rata di spreadsheet; `0` ikut,
  // dan diam-diam menyeret turun setiap ringkasan yang dibuat penerimanya.
  expect(csvCell(null)).toBe("");
  expect(csvCell(undefined)).toBe("");
  expect(csvCell(0)).toBe("0");
});

test("CSV diawali BOM dan memakai CRLF", () => {
  const csv = toCsv(["a", "b"], [[1, null]]);
  expect(csv.startsWith("﻿")).toBe(true);
  expect(csv).toContain("\r\n");
  expect(csv).toContain("1,");
});

test("desimal memakai titik, bukan koma ala id-ID", () => {
  // `1,5` di CSV pecah jadi dua kolom. Tulisan untuk manusia tetap id-ID di layar.
  expect(csvCell(1.5)).toBe("1.5");
  expect(toCsv(["x"], [[0.95]])).toContain("0.95");
});

test("baris atribut memakai nama titik dari entrances, bukan id mentah", () => {
  // Begitu geometri pindah ke tile vektor, daftar fitur lengkap tidak lagi ada
  // di browser — nama harus datang dari atribut. Lihat ROADMAP §4.1.
  const rows = barisAtribut(PAYLOAD, ENTRANCES, "pagi", ALL_CATEGORIES);
  expect(rows.map((r) => r.titik)).toEqual(["Pintu Bawah", "Pintu Atas"]);
  expect(rows[0].stasiun).toBe("Manggarai");
});

test("titik bersampel tipis membawa null, bukan nol", () => {
  const rows = barisAtribut(PAYLOAD, ENTRANCES, "pagi", ALL_CATEGORIES);
  const tipis = rows.find((r) => r.pointId === 2)!;
  expect(tipis.sampelTipis).toBe(true);
  expect(tipis.gapP50).toBeNull();
  expect(tipis.F).toBeNull();

  // Dan di CSV kolomnya benar-benar kosong.
  const csv = csvAtribut([tipis]);
  expect(csv).not.toContain(",0,");
});

test("F/E/C/V ikut terbawa untuk titik yang dicacah", () => {
  const rows = barisAtribut(PAYLOAD, ENTRANCES, "pagi", ALL_CATEGORIES);
  const utuh = rows.find((r) => r.pointId === 1)!;
  expect(utuh.F).toBe(1200);
  expect(utuh.E).toBe(0.08);
  expect(utuh.C).toBe(0.95);
  expect(utuh.V).toBe(25000);
});

test("null selalu di bawah, di kedua arah urutan", () => {
  // Memperlakukannya sebagai nol akan menempatkan titik yang tidak disurvei di
  // ujung "kesenjangan terkecil" — kebalikan dari keadaan sebenarnya.
  const rows = barisAtribut(PAYLOAD, ENTRANCES, "pagi", ALL_CATEGORIES);
  expect(urutkan(rows, "gapP50", "turun").map((r) => r.pointId)).toEqual([1, 2]);
  expect(urutkan(rows, "gapP50", "naik").map((r) => r.pointId)).toEqual([1, 2]);
});

test("header CSV sama persis dengan kolom tabel", () => {
  // Kalau keduanya boleh menyimpang, berkas yang diunduh bisa berbeda isi dari
  // tabel yang baru saja dilihat orangnya.
  const csv = csvAtribut(barisAtribut(PAYLOAD, ENTRANCES, "pagi", ALL_CATEGORIES));
  const header = csv.replace("﻿", "").split("\r\n")[0];
  expect(header).toBe(KOLOM_ATRIBUT.map((k) => k.judul).join(","));
});

test("nama berkas membawa potongan filter dan versi pipeline", () => {
  // Penerima berkas tidak punya layar yang menunjukkan filter aktif, jadi
  // namanya yang harus membawanya.
  const nama = namaBerkasAtribut(PAYLOAD, "pagi", ALL_CATEGORIES);
  expect(nama).toContain("tabel-atribut");
  expect(nama).toContain("semua");
  expect(nama).toContain("mock-1");
  expect(nama.endsWith(".csv")).toBe(true);
});

test("nama berkas tidak pernah mengandung spasi atau tanda baca", () => {
  expect(namaBerkas(["Tabel Atribut", "06–09", null, ""])).toBe(
    "isi-stasiun_tabel-atribut_06-09.csv",
  );
});
