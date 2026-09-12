/**
 * SELURUH definisi gaya peta terkumpul di berkas ini.
 *
 * ROADMAP.md §1 mensyaratkan tampilan bisa diubah tanpa menyentuh logika.
 * Karena itu: mengubah warna, ukuran, atau ketebalan garis di peta cukup
 * dilakukan di sini — tidak boleh ada nilai warna/ukuran peta yang ditulis
 * langsung di dalam komponen.
 *
 * Yang TIDAK tinggal di sini adalah rentang angkanya. Sejak ROADMAP 1.5 skala
 * mengikuti data yang sedang aktif, jadi `Domain` datang sebagai argumen dari
 * `lib/analytics/select.ts`. Berkas ini hanya menentukan warna dan ukurannya.
 */
import type {
  CircleLayerSpecification,
  FillLayerSpecification,
  LineLayerSpecification,
  SymbolLayerSpecification,
} from "maplibre-gl";
import type { Domain } from "@/lib/analytics/select";
import { LAYER, SOURCE } from "./config";

/* -------------------------------------------------------------------------
 * Skala kesenjangan belanja
 * ---------------------------------------------------------------------- */

/**
 * Lima tingkat warna, sama persis dengan legenda "Kesenjangan / hari" di
 * panel lapisan.
 *
 * Yang tetap hanya warnanya. Nilai batas tiap tingkat dihitung dari data yang
 * sedang ditampilkan — lihat `gapColorStops` — supaya legenda tidak pernah
 * menjanjikan rentang yang tidak ada isinya.
 */
export const GAP_RAMP = [
  "#EFF6FF",
  "#93C5FD",
  "#60A5FA",
  "#3B82F6",
  "#1D4ED8",
] as const;

/** Ukuran lingkaran (piksel) pada nilai gap terendah dan tertinggi. */
export const GAP_RADIUS = { min: 7, max: 22 } as const;

/**
 * Ukuran halo kepercayaan — selalu sedikit lebih besar dari lingkaran gap.
 *
 * Ditulis sebagai rentang tersendiri, bukan `["+", radiusGap, 9]`, karena
 * ekspresi gap sudah mengandung `["zoom"]` dan `["zoom"]` hanya sah sebagai
 * masukan `interpolate`/`step` paling luar. Membungkusnya dengan `+` membuat
 * MapLibre menolak seluruh layer — tanpa pesan error.
 */
export const CONFIDENCE_RADIUS = {
  min: GAP_RADIUS.min + 13,
  max: GAP_RADIUS.max + 20,
} as const;

/**
 * Diameter bulatan contoh di legenda, dalam piksel.
 *
 * Tinggal di sini bersama `GAP_RADIUS` supaya keduanya bergerak bersama:
 * legenda memakai bulatan yang ikut membesar justru karena di peta besar
 * lingkaran memang membawa arti, bukan hiasan. Kalau `GAP_RADIUS` diubah
 * tanpa menyesuaikan ini, legenda diam-diam berhenti mewakili petanya.
 */
export const LEGEND_DOT = { min: 6, max: 14 } as const;

/** Warna titik yang sampelnya tipis — tidak diestimasi, jadi netral. */
export const THIN_SAMPLE_COLOR = "#94A3B8";

/**
 * Warna halo kepercayaan.
 *
 * Lebih tua dari `THIN_SAMPLE_COLOR` dengan sengaja: halo digambar di BELAKANG
 * lingkaran dan di atas basemap yang sudah keabuan, jadi abu muda hilang
 * ditelan latar. Sempat memakai warna yang sama dan hasilnya tidak pernah
 * benar-benar terlihat.
 */
export const CONFIDENCE_COLOR = "#64748B";

/** Warna sel grid: merah = data tipis, hijau = data memadai. */
export const CONFIDENCE_GRID_RAMP = {
  thin: "#E76570",
  medium: "#E8BE55",
  strong: "#65A98A",
  empty: "#CBD5E1",
} as const;

/** Warna sorot dan pilih. Sengaja berbeda supaya keduanya tidak tertukar. */
export const HOVER_COLOR = "#1D4ED8";
export const SELECTED_COLOR = "#0F172A";

/**
 * Font untuk label titik.
 *
 * Wajib diisi eksplisit. Bawaan MapLibre adalah "Open Sans Regular", dan
 * basemap OpenFreeMap tidak menyediakannya — permintaan glyph-nya 404 dan
 * seluruh label hilang diam-diam tanpa pesan error.
 *
 * "Noto Sans Regular" sudah diperiksa tersedia pada Liberty, basemap CARTO,
 * **dan GEO MAPID** (style `basic` memakainya sendiri, bersama keluarga
 * Roboto). Jadi aman untuk seluruh pilihan di `BASEMAP_NAMES`.
 *
 * Kalau basemap diganti lagi, periksa ulang: `tests/peta.spec.ts` gagal pada
 * respons 4xx/5xx apa pun, jadi glyph yang hilang akan tertangkap di sana —
 * bukan muncul sebagai label yang diam-diam raib.
 */
export const LABEL_FONT = ["Noto Sans Regular"];

/** Warna isochrone, makin dekat makin pekat. */
export const ISOCHRONE_COLOR = "#2563EB";
export const ISOCHRONE_FILL_OPACITY: Record<number, number> = {
  3: 0.16,
  5: 0.1,
  10: 0.055,
};

/**
 * Kepekatan halo kepercayaan, dari yang paling lemah ke paling kuat.
 *
 * Sengaja terbalik dari nalar biasa: makin RENDAH kepercayaannya, makin
 * terlihat halonya. Yang perlu diperiksa pembaca adalah angka yang lemah,
 * bukan yang kuat.
 */
export const CONFIDENCE_OPACITY = { lemah: 0.72, kuat: 0.2 } as const;

/** Kepekatan halo untuk titik yang memang tidak diestimasi sama sekali. */
export const THIN_HALO_OPACITY = 0.82;

/**
 * Rentang cadangan sebelum data termuat. Layer harus tetap sah dipasang
 * walaupun angkanya belum ada — kalau tidak, MapLibre menolak seluruh layer.
 */
export const DOMAIN_AWAL: Domain = { min: 0, max: 4_000_000 };

/** Satu tingkat pada legenda: warna beserta rentang nilai yang diwakilinya. */
export type LegendStop = { color: string; at: number };

/**
 * Menjamin rentang punya lebar, karena `interpolate` MapLibre menuntut nilai
 * masukannya menaik tegas.
 *
 * Rentang berlebar nol bukan kasus mengada-ada: begitu satu kategori disaring
 * dan hanya tersisa satu titik yang punya estimasi, min dan max jadi sama.
 * Tanpa penjagaan ini seluruh paint ditolak dan titiknya hilang dari peta —
 * tanpa satu pun pesan error.
 */
function amankanDomain(domain: Domain): Domain {
  if (domain.max > domain.min) return domain;
  // Lebar tambahannya mengikuti besaran nilainya, bukan angka tetap: skala di
  // berkas ini dipakai untuk rupiah (ratusan ribu) MAUPUN skor kepercayaan
  // (0–1). Melebarkan sebesar 1 akan benar untuk rupiah tapi meledak untuk
  // skor. Kalau nilainya nol, barulah 1 dipakai sebagai jalan keluar.
  const tambahan = Math.abs(domain.min) * 0.1 || 1;
  // Dilebarkan ke atas, bukan ke bawah, supaya nilai satu-satunya itu jatuh di
  // ujung bawah skala dan tidak terbaca sebagai "paling besar".
  return { min: domain.min, max: domain.min + tambahan };
}

/**
 * Batas nilai tiap warna, dibagi rata di sepanjang rentang data aktif.
 *
 * Legenda di layar dan ekspresi warna di peta sama-sama membaca fungsi ini —
 * itulah yang membuat keduanya mustahil berbeda (ROADMAP 1.5).
 */
export function gapColorStops(domain: Domain): LegendStop[] {
  const aman = amankanDomain(domain);
  const langkah = (aman.max - aman.min) / (GAP_RAMP.length - 1);
  return GAP_RAMP.map((color, i) => ({
    color,
    at: aman.min + langkah * i,
  }));
}

/* -------------------------------------------------------------------------
 * Ekspresi MapLibre
 *
 * Semua membaca lewat ["feature-state", ...] — bukan ["get", ...] — karena
 * angka analitik datang terpisah dari geometri dan digabung memakai
 * setFeatureState. Ini sengaja disamakan dengan cara kerja Fase 2, supaya
 * saat backend siap ekspresi ini tidak perlu diubah sama sekali.
 * Lihat DATA_CONTRACT.md §7.
 * ---------------------------------------------------------------------- */

/** Warna lingkaran berdasarkan nilai gap yang sedang ditampilkan. */
function gapColorExpression(domain: Domain): unknown[] {
  const scale: unknown[] = [
    "interpolate",
    ["linear"],
    ["coalesce", ["feature-state", "gap"], 0],
  ];
  for (const stop of gapColorStops(domain)) scale.push(stop.at, stop.color);
  return scale;
}

/**
 * Benar untuk titik yang sampelnya tipis (tidak diestimasi).
 *
 * ⚠️ Hanya boleh dipakai di dalam `paint`, TIDAK BOLEH di dalam `filter`.
 * MapLibre menolak ekspresi `feature-state` pada filter — itulah sebabnya
 * sampel tipis dibedakan lewat warna dan ukuran, bukan dengan menyaring
 * fitur ke layer terpisah. Lihat DATA_CONTRACT.md §7.
 */
const IS_THIN: unknown[] = ["==", ["feature-state", "sampel_tipis"], true];

/** Titik yang sedang dipilih, dan titik yang sedang disorot kursor. */
const IS_SELECTED: unknown[] = ["==", ["feature-state", "terpilih"], true];
const IS_HOVER: unknown[] = ["==", ["feature-state", "hover"], true];

/**
 * Ukuran lingkaran: mengikuti besar nilai, ikut membesar saat zoom, dan tetap
 * kecil untuk titik bersampel tipis.
 *
 * ⚠️ `["zoom"]` hanya boleh menjadi masukan `interpolate`/`step` paling luar.
 * Karena itu urutannya interpolate-zoom di luar, `case` sampel tipis di dalam
 * — bukan sebaliknya. MapLibre menolak susunan yang terbalik.
 */
function radiusExpression(
  stateKey: string,
  domain: Domain,
  radius: { min: number; max: number },
): unknown[] {
  const aman = amankanDomain(domain);

  /** Ukuran pada satu tingkat zoom, dengan pengali skala. */
  const atScale = (scale: number): unknown[] => [
    "case",
    IS_THIN,
    (radius.min + 2) * scale,
    [
      "interpolate",
      ["linear"],
      ["coalesce", ["feature-state", stateKey], 0],
      aman.min,
      radius.min * scale,
      aman.max,
      radius.max * scale,
    ],
  ];

  return ["interpolate", ["linear"], ["zoom"], 11, atScale(0.7), 16, atScale(1)];
}

/* -------------------------------------------------------------------------
 * Spesifikasi layer
 * ---------------------------------------------------------------------- */

export function isochroneFillLayer(): FillLayerSpecification {
  return {
    id: LAYER.isochroneFill,
    type: "fill",
    source: SOURCE.isochrones,
    paint: {
      "fill-color": ISOCHRONE_COLOR,
      "fill-opacity": [
        "match",
        ["get", "duration_min"],
        3,
        ISOCHRONE_FILL_OPACITY[3],
        5,
        ISOCHRONE_FILL_OPACITY[5],
        10,
        ISOCHRONE_FILL_OPACITY[10],
        0.06,
      ] as unknown as number,
    },
  };
}

export function isochroneLineLayer(): LineLayerSpecification {
  return {
    id: LAYER.isochroneLine,
    type: "line",
    source: SOURCE.isochrones,
    paint: {
      "line-color": ISOCHRONE_COLOR,
      "line-opacity": 0.55,
      "line-width": 1.25,
      "line-dasharray": [5, 5],
    },
  };
}

/** Sel grid confidence per kawasan. */
export function confidenceFillLayer(): FillLayerSpecification {
  return {
    id: LAYER.confidenceFill,
    type: "fill",
    source: SOURCE.confidenceGrid,
    paint: {
      "fill-color": [
        "case",
        ["==", ["get", "sample_count"], 0],
        CONFIDENCE_GRID_RAMP.empty,
        [
          "step",
          ["coalesce", ["get", "confidence_score"], 0],
          CONFIDENCE_GRID_RAMP.thin,
          0.65,
          CONFIDENCE_GRID_RAMP.medium,
          0.8,
          CONFIDENCE_GRID_RAMP.strong,
        ],
      ] as unknown as string,
      "fill-opacity": 0.38,
    },
  };
}

/** Garis batas antar-zona, seperti peta grid contoh. */
export function confidenceBoundaryLayer(): LineLayerSpecification {
  return {
    id: LAYER.confidenceBoundary,
    type: "line",
    source: SOURCE.confidenceGrid,
    paint: {
      "line-color": "#334155",
      "line-opacity": 0.72,
      "line-width": 1,
    },
  };
}

/**
 * Lapisan "Kepercayaan data" — halo abu di belakang titik.
 *
 * Sengaja dibuat terbalik dari nalar biasa: makin **rendah** kepercayaannya,
 * makin terlihat halonya. Yang perlu diperhatikan pembaca adalah angka yang
 * lemah, bukan angka yang kuat. Titik bersampel tipis mendapat halo paling
 * tebal karena memang tidak diestimasi sama sekali.
 */
export function pointConfidenceLayer(
  domain: Domain,
  confidenceDomain: Domain,
): CircleLayerSpecification {
  return {
    id: LAYER.pointConfidence,
    type: "circle",
    source: SOURCE.points,
    paint: {
      "circle-color": CONFIDENCE_COLOR,
      "circle-radius": radiusExpression(
        "gap",
        domain,
        CONFIDENCE_RADIUS,
      ) as unknown as number,
      "circle-opacity": confidenceOpacityExpression(
        confidenceDomain,
      ) as unknown as number,
      "circle-stroke-color": CONFIDENCE_COLOR,
      "circle-stroke-width": 1.5,
      "circle-stroke-opacity": confidenceOpacityExpression(
        confidenceDomain,
      ) as unknown as number,
      "circle-blur": 0.08,
    },
  };
}

/** Kepekatan halo, direntangkan ke sebaran skor yang benar-benar ada. */
function confidenceOpacityExpression(confidenceDomain: Domain): unknown[] {
  const aman = amankanDomain(confidenceDomain);
  return [
    "case",
    IS_THIN,
    THIN_HALO_OPACITY,
    [
      "interpolate",
      ["linear"],
      ["coalesce", ["feature-state", "confidence"], aman.max],
      aman.min,
      CONFIDENCE_OPACITY.lemah,
      aman.max,
      CONFIDENCE_OPACITY.kuat,
    ],
  ];
}

/**
 * Titik pengamatan — satu layer untuk semua titik.
 *
 * Titik bersampel tipis TIDAK dipisah ke layer sendiri, karena memisahkannya
 * menuntut `filter` berbasis `feature-state` dan MapLibre menolak itu.
 * Sebagai gantinya, perbedaannya dinyatakan lewat warna, ukuran, dan garis:
 *
 * - punya estimasi → lingkaran terisi, warna & ukuran mengikuti besar gap
 * - sampel tipis   → lingkaran nyaris kosong bergaris abu-abu, ukuran tetap
 *
 * Konvensi desainnya garis putus-putus, tapi layer `circle` tidak mendukung
 * garis putus. Yang penting terbaca sebagai "tidak diestimasi", bukan sebagai
 * gap terkecil.
 *
 * Keadaan sorot dan pilih ikut di sini, pada garis tepinya — bukan pada isinya
 * — supaya warna isi tetap murni membawa arti "besar kesenjangan".
 */
export function pointCircleLayer(
  domain: Domain = DOMAIN_AWAL,
): CircleLayerSpecification {
  return {
    id: LAYER.pointCircle,
    type: "circle",
    source: SOURCE.points,
    paint: {
      "circle-color": [
        "case",
        IS_THIN,
        "#FFFFFF",
        gapColorExpression(domain),
      ] as unknown as string,
      "circle-opacity": ["case", IS_THIN, 0.5, 0.92] as unknown as number,
      "circle-radius": radiusExpression(
        "gap",
        domain,
        GAP_RADIUS,
      ) as unknown as number,
      "circle-stroke-color": [
        "case",
        IS_SELECTED,
        SELECTED_COLOR,
        IS_HOVER,
        HOVER_COLOR,
        IS_THIN,
        THIN_SAMPLE_COLOR,
        "#FFFFFF",
      ] as unknown as string,
      "circle-stroke-width": [
        "case",
        IS_SELECTED,
        3.5,
        IS_HOVER,
        3,
        IS_THIN,
        1.5,
        2,
      ] as unknown as number,
    },
  };
}

export function pointLabelLayer(): SymbolLayerSpecification {
  return {
    id: LAYER.pointLabel,
    type: "symbol",
    source: SOURCE.points,
    minzoom: 13.5,
    layout: {
      "text-field": ["get", "point_label"],
      "text-font": LABEL_FONT,
      "text-size": 11,
      "text-offset": [0, 1.6],
      "text-anchor": "top",
      "text-allow-overlap": false,
    },
    paint: {
      "text-color": [
        "case",
        IS_SELECTED,
        SELECTED_COLOR,
        "#334155",
      ] as unknown as string,
      "text-halo-color": "#FFFFFF",
      "text-halo-width": 1.5,
    },
  };
}

/**
 * Paint yang perlu disetel ulang saat rentang data berubah.
 *
 * Dikumpulkan menjadi satu daftar supaya `MapCanvas` tidak perlu tahu properti
 * mana saja yang bergantung pada skala — ia cukup menerapkan apa yang
 * diberikan berkas ini.
 */
export function scaleDependentPaint(
  domain: Domain,
  confidenceDomain: Domain,
): { layer: string; property: string; value: unknown }[] {
  return [
    {
      layer: LAYER.pointCircle,
      property: "circle-color",
      value: ["case", IS_THIN, "#FFFFFF", gapColorExpression(domain)],
    },
    {
      layer: LAYER.pointCircle,
      property: "circle-radius",
      value: radiusExpression("gap", domain, GAP_RADIUS),
    },
    {
      layer: LAYER.pointConfidence,
      property: "circle-radius",
      value: radiusExpression("gap", domain, CONFIDENCE_RADIUS),
    },
    {
      layer: LAYER.pointConfidence,
      property: "circle-opacity",
      value: confidenceOpacityExpression(confidenceDomain),
    },
  ];
}

/* -------------------------------------------------------------------------
 * Label angka — arus pintu
 *
 * Membaca dari ["get", ...], BUKAN ["feature-state", ...], dan itu wajib:
 * `text-field` adalah properti layout, dan MapLibre menolak ekspresi
 * feature-state di sana. Angkanya karena itu ikut sebagai properti fitur pada
 * source `point-label-values`, yang diperbarui tiap kali slot berganti.
 * ---------------------------------------------------------------------- */

/** Warna tulisan arus pintu — netral, karena ia keterangan, bukan penilaian. */
export const ARUS_COLOR = "#475569";

/** Angka arus pintu (F), tulisan kecil di bawah nama titik. */
export function pointArusLayer(): SymbolLayerSpecification {
  return {
    id: LAYER.pointArus,
    type: "symbol",
    source: SOURCE.pointLabels,
    minzoom: 13.5,
    filter: ["has", "arus_teks"],
    layout: {
      "text-field": ["get", "arus_teks"],
      "text-font": LABEL_FONT,
      "text-size": 10,
      // Cukup rendah supaya kotak teksnya tidak bersenggolan dengan nama titik
      // di atasnya — termasuk `text-padding` bawaan MapLibre.
      "text-offset": [0, 3.6],
      "text-anchor": "top",
      "text-allow-overlap": false,
    },
    paint: {
      "text-color": ARUS_COLOR,
      "text-halo-color": "#FFFFFF",
      "text-halo-width": 1.5,
    },
  };
}
