import { test, expect } from "@playwright/test";

import {
  biggestGapPoint,
  confidenceDomainOf,
  domainOf,
  findPoint,
  metricFor,
  metricsFor,
  missingCategories,
  pointsOfStation,
  posisiDalamRentang,
  type PointMetric,
} from "../lib/analytics/select";
import { ALL_CATEGORIES } from "../lib/data/dimensions";
import type {
  CategoryAnalytics,
  CategoryKey,
  PointAnalytics,
  Range,
  SlotAnalytics,
  SlotKey,
  SpendingGapPayload,
} from "../lib/data/types";

/**
 * Uji pemotong data — tanpa browser, jadi cepat.
 *
 * Berkas inilah yang memutuskan **angka mana** yang muncul untuk slot dan
 * kategori yang sedang dipilih, dan peta maupun panel sama-sama membacanya.
 * Artinya satu kesalahan di sini muncul serentak di dua tempat sekaligus,
 * sebagai angka yang salah — bukan sebagai halaman yang rusak. Kelas kesalahan
 * seperti itu tidak akan tertangkap tes tampilan, dan tidak akan tertangkap
 * validator style: keduanya melihat angka yang salah sebagai angka yang sah.
 *
 * Seluruh isinya fungsi murni tanpa React dan tanpa MapLibre, jadi diuji
 * langsung — tidak perlu menyalakan peta untuk memeriksa aritmetika.
 */

/* -------------------------------------------------------------------------
 * Penyusun data uji
 * ---------------------------------------------------------------------- */

/** Rentang P10–P90 ringkas: `r(100)` → sekitar 100, `r(null)` → tidak diestimasi. */
function r(p50: number | null): Range {
  if (p50 === null) return { p10: null, p50: null, p90: null };
  return { p10: p50 * 0.8, p50, p90: p50 * 1.4 };
}

function kategori(
  category: CategoryKey,
  opsi: Partial<CategoryAnalytics> & { gap?: Range } = {},
): CategoryAnalytics {
  return {
    category,
    gap: r(50_000),
    potensi: r(90_000),
    tertangkap: r(40_000),
    demand_share: 0.2,
    gerai_count: 4,
    nilai_transaksi: 30_000,
    sampel_tipis: false,
    ...opsi,
  };
}

function slot(
  key: SlotKey,
  opsi: Partial<SlotAnalytics> = {},
): SlotAnalytics {
  return {
    slot: key,
    gap: r(270_000),
    potensi: r(390_000),
    tertangkap: r(120_000),
    variables: { F: 380, E: 0.066, C: 0.63, V: 45_000 },
    sampel_tipis: false,
    by_category: [kategori("fnb"), kategori("ritel")],
    ...opsi,
  };
}

function titik(
  point_id: number,
  opsi: Partial<PointAnalytics> = {},
): PointAnalytics {
  return {
    point_id,
    station_id: 1,
    total: { potensi: r(1_010_000), tertangkap: r(310_000), gap: r(700_000) },
    confidence: 0.8,
    sampel_tipis: false,
    sample_meta: { gerai_count: 5, blok_count: 2 },
    evidence: { struk_total: 60, struk_ambigu: 4, struk_terbaca: 56 },
    by_slot: [slot("pagi")],
    ...opsi,
  };
}

function payload(points: PointAnalytics[]): SpendingGapPayload {
  return {
    generated_at: "2026-08-20T10:00:00Z",
    pipeline_version: "uji-0.1",
    day_type: "weekday",
    points,
  };
}

/** Metrik lepas, untuk menguji fungsi skala tanpa menyusun payload penuh. */
function metrik(gap: number | null, opsi: Partial<PointMetric> = {}): PointMetric {
  return {
    pointId: 1,
    stationId: 1,
    gap: r(gap),
    potensi: r(90_000),
    tertangkap: r(40_000),
    variables: null,
    sampelTipis: false,
    confidence: 0.8,
    kategori: null,
    arus: null,
    ...opsi,
  };
}

/* -------------------------------------------------------------------------
 * metricFor — aturan "angka mana yang ditampilkan"
 * ---------------------------------------------------------------------- */

test("tanpa kategori terpilih, angka yang dipakai adalah angka slot", () => {
  const m = metricFor(titik(11), "pagi", ALL_CATEGORIES);
  expect(m.gap.p50).toBe(270_000);
  expect(m.kategori).toBeNull();
});

test("dengan kategori terpilih, angka kategori itu yang menggantikan", () => {
  const p = titik(11, {
    by_slot: [
      slot("pagi", {
        by_category: [kategori("fnb", { gap: r(88_000) }), kategori("ritel")],
      }),
    ],
  });
  const m = metricFor(p, "pagi", "fnb");
  expect(m.gap.p50).toBe(88_000);
  expect(m.kategori?.category).toBe("fnb");
});

test("kategori yang tidak ada di data jatuh kembali ke angka slot", () => {
  // Bukan nol dan bukan crash: kategorinya memang tidak dicacah di titik ini.
  const m = metricFor(titik(11), "pagi", "apotek");
  expect(m.gap.p50).toBe(270_000);
  expect(m.kategori).toBeNull();
});

test("slot yang tidak ada di data menghasilkan 'tidak diestimasi', bukan nol", () => {
  // Perbedaan ini yang menjaga panel tidak pernah menulis "Rp 0" untuk sesuatu
  // yang sebenarnya tidak pernah dihitung.
  const m = metricFor(titik(11), "malam", ALL_CATEGORIES);
  expect(m.gap.p50).toBeNull();
  expect(m.variables).toBeNull();
  expect(m.arus).toBeNull();
});

test("sampel tipis menular dari titik, slot, maupun kategori", () => {
  const dariTitik = metricFor(titik(11, { sampel_tipis: true }), "pagi", ALL_CATEGORIES);
  expect(dariTitik.sampelTipis).toBe(true);

  const dariSlot = metricFor(
    titik(11, { by_slot: [slot("pagi", { sampel_tipis: true })] }),
    "pagi",
    ALL_CATEGORIES,
  );
  expect(dariSlot.sampelTipis).toBe(true);

  const dariKategori = metricFor(
    titik(11, {
      by_slot: [
        slot("pagi", { by_category: [kategori("fnb", { sampel_tipis: true })] }),
      ],
    }),
    "pagi",
    "fnb",
  );
  expect(dariKategori.sampelTipis).toBe(true);
});

test("arus pintu selalu diambil dari F setingkat simpul, bukan per kategori", () => {
  // Label arus di peta memakai nilai ini; kalau ikut menyempit saat kategori
  // dipilih, angkanya jadi salah tanpa ada yang terlihat rusak.
  const m = metricFor(titik(11), "pagi", "fnb");
  expect(m.arus).toBe(380);
  expect(m.variables?.F).toBe(380);
});

test("metricsFor mengunci hasilnya berdasarkan id titik", () => {
  const map = metricsFor(payload([titik(11), titik(12)]), "pagi", ALL_CATEGORIES);
  expect([...map.keys()].sort()).toEqual([11, 12]);
  expect(map.get(12)?.pointId).toBe(12);
});

test("findPoint mengembalikan null untuk id yang tidak ada", () => {
  const p = payload([titik(11)]);
  expect(findPoint(p, 11)?.point_id).toBe(11);
  expect(findPoint(p, 99)).toBeNull();
  expect(findPoint(p, null)).toBeNull();
});

/* -------------------------------------------------------------------------
 * domainOf — rentang skala warna dan ukuran
 * ---------------------------------------------------------------------- */

test("rentang dibulatkan ke angka yang enak dibaca", () => {
  // 270.000 dan 830.000 keduanya di atas 100.000, jadi kelipatannya 50.000.
  const d = domainOf([metrik(270_000), metrik(830_000)]);
  expect(d).toEqual({ min: 250_000, max: 850_000 });
});

test("titik bersampel tipis dan yang tidak diestimasi tidak ikut menggeser rentang", () => {
  const d = domainOf([
    metrik(270_000),
    metrik(9_000_000, { sampelTipis: true }),
    metrik(null),
  ]);
  // Kalau yang tipis ikut dihitung, batas atasnya melompat ke 9 juta dan
  // seluruh titik sungguhan menumpuk di ujung bawah skala.
  expect(d.max).toBeLessThan(1_000_000);
});

test("satu nilai tunggal tetap menghasilkan rentang yang punya lebar", () => {
  // `interpolate` MapLibre menuntut masukan menaik tegas — rentang berlebar nol
  // membuat seluruh paint ditolak dan titiknya hilang tanpa pesan error.
  const d = domainOf([metrik(270_000)]);
  expect(d.min).toBe(0);
  expect(d.max).toBeGreaterThan(d.min);
});

test("tanpa satu pun nilai terestimasi, rentang cadangan tetap sah", () => {
  const d = domainOf([metrik(null), metrik(500_000, { sampelTipis: true })]);
  expect(d.max).toBeGreaterThan(d.min);
  expect(Number.isFinite(d.min)).toBe(true);
});

test("domainOf bisa diarahkan ke besaran lain, bukan hanya gap", () => {
  const d = domainOf([metrik(270_000), metrik(830_000)], (m) => m.potensi);
  expect(d.max).toBeLessThan(200_000); // potensi di data uji ini 90.000
});

test("sebaran kepercayaan mengikuti skor yang benar-benar ada", () => {
  // Dipatok mati 0,4–0,9 dulu membuat seluruh titik jatuh di ujung "kuat" dan
  // halonya tidak pernah terlihat sama sekali.
  const d = confidenceDomainOf([
    metrik(270_000, { confidence: 0.77 }),
    metrik(270_000, { confidence: 0.92 }),
    metrik(null, { confidence: 0.1, sampelTipis: true }),
  ]);
  expect(d).toEqual({ min: 0.77, max: 0.92 });
});

test("tanpa titik terestimasi, sebaran kepercayaan jatuh ke 0–1", () => {
  const d = confidenceDomainOf([metrik(null, { sampelTipis: true })]);
  expect(d).toEqual({ min: 0, max: 1 });
});

/* -------------------------------------------------------------------------
 * Turunan untuk panel
 * ---------------------------------------------------------------------- */

test("kategori hilang diurutkan dari permintaan terbesar", () => {
  const p = titik(11, {
    by_slot: [
      slot("pagi", {
        by_category: [
          kategori("fnb", { gerai_count: 4, demand_share: 0.5 }), // cukup, dibuang
          kategori("jasa", { gerai_count: 2, demand_share: 0.1 }),
          kategori("apotek", { gerai_count: 0, demand_share: 0.3 }),
          kategori("ritel", { gerai_count: 1, demand_share: 0.2 }),
        ],
      }),
    ],
  });
  expect(missingCategories(p, "pagi").map((c) => c.category)).toEqual([
    "apotek",
    "ritel",
    "jasa",
  ]);
});

test("kategori hilang kosong kalau slotnya tidak ada", () => {
  expect(missingCategories(titik(11), "malam")).toEqual([]);
});

test("titik pembuka adalah kesenjangan terbesar yang benar-benar diestimasi", () => {
  const p = payload([
    titik(11, { total: { potensi: r(1), tertangkap: r(1), gap: r(500_000) } }),
    titik(12, { total: { potensi: r(1), tertangkap: r(1), gap: r(700_000) } }),
    // Sampel tipis: angkanya besar tapi tidak diestimasi, jadi tidak boleh
    // terpilih — kalau terpilih, halaman terbuka pada titik yang justru tidak
    // punya angka untuk ditampilkan.
    titik(13, {
      sampel_tipis: true,
      total: { potensi: r(1), tertangkap: r(1), gap: r(9_000_000) },
    }),
  ]);
  expect(biggestGapPoint(p)).toBe(12);
});

test("kalau semua titik tipis, tetap ada titik pembuka", () => {
  const p = payload([titik(21, { sampel_tipis: true }), titik(22, { sampel_tipis: true })]);
  expect(biggestGapPoint(p)).toBe(21);
});

test("titik satu stasiun terurut menurun, yang tidak diestimasi di bawah", () => {
  const metrics = metricsFor(
    payload([
      titik(11, { by_slot: [slot("pagi", { gap: r(300_000) })] }),
      titik(12, { by_slot: [slot("pagi", { gap: r(800_000) })] }),
      titik(13, { by_slot: [slot("pagi", { gap: r(null) })] }),
      titik(21, { station_id: 2 }),
    ]),
    "pagi",
    ALL_CATEGORIES,
  );

  const urutan = pointsOfStation(metrics, 1).map((m) => m.pointId);
  expect(urutan).toEqual([12, 11, 13]);
});

test("posisi dalam rentang dijepit di kedua ujung", () => {
  const rentang: Range = { p10: 100, p50: 150, p90: 200 };
  expect(posisiDalamRentang(rentang, 150)).toBeCloseTo(0.5);
  expect(posisiDalamRentang(rentang, 100)).toBe(0);
  expect(posisiDalamRentang(rentang, 200)).toBe(1);
  // Di luar rentang: penanda tidak boleh keluar dari barnya.
  expect(posisiDalamRentang(rentang, -50)).toBe(0);
  expect(posisiDalamRentang(rentang, 9_999)).toBe(1);
});

test("posisi jatuh ke tengah kalau rentangnya tidak bisa dibaca", () => {
  expect(posisiDalamRentang({ p10: 100, p50: 150, p90: 200 }, null)).toBe(0.5);
  expect(posisiDalamRentang({ p10: null, p50: null, p90: null }, 150)).toBe(0.5);
  // Lebar nol: membaginya akan menghasilkan Infinity, bukan penanda di ujung.
  expect(posisiDalamRentang({ p10: 100, p50: 100, p90: 100 }, 100)).toBe(0.5);
});
