/**
 * SELURUH definisi gaya peta terkumpul di berkas ini.
 *
 * ROADMAP.md §1 mensyaratkan tampilan bisa diubah tanpa menyentuh logika.
 * Karena itu: mengubah warna, ukuran, atau ketebalan garis di peta cukup
 * dilakukan di sini — tidak boleh ada nilai warna/ukuran peta yang ditulis
 * langsung di dalam komponen.
 *
 * Nilai-nilainya diambil dari legenda yang sudah ada di `PetaScreen`, supaya
 * peta dan legenda tidak pernah berbeda.
 */
import type {
  CircleLayerSpecification,
  FillLayerSpecification,
  LineLayerSpecification,
  SymbolLayerSpecification,
} from "maplibre-gl";
import { LAYER, SOURCE } from "./config";

/* -------------------------------------------------------------------------
 * Skala kesenjangan belanja
 * ---------------------------------------------------------------------- */

/**
 * Lima tingkat warna, sama persis dengan legenda "Kesenjangan / hari" di
 * panel lapisan. Batas bawah dan atas mengikuti label "< Rp 1.000.000" dan
 * "> Rp 4.000.000".
 */
export const GAP_COLOR_STOPS: { at: number; color: string }[] = [
  { at: 0, color: "#EFF6FF" },
  { at: 1_000_000, color: "#93C5FD" },
  { at: 2_000_000, color: "#60A5FA" },
  { at: 3_000_000, color: "#3B82F6" },
  { at: 4_000_000, color: "#1D4ED8" },
];

/** Ukuran lingkaran (piksel) pada nilai gap terendah dan tertinggi. */
export const GAP_RADIUS = { min: 7, max: 22 } as const;

/** Warna titik yang sampelnya tipis — tidak diestimasi, jadi netral. */
export const THIN_SAMPLE_COLOR = "#94A3B8";

/**
 * Font untuk label titik.
 *
 * Wajib diisi eksplisit. Bawaan MapLibre adalah "Open Sans Regular", dan
 * basemap OpenFreeMap tidak menyediakannya — permintaan glyph-nya 404 dan
 * seluruh label hilang diam-diam tanpa pesan error. "Noto Sans Regular" ada
 * pada Liberty maupun basemap CARTO, jadi aman untuk keempat pilihan di
 * `BASEMAP_CHOICES`.
 *
 * Kalau basemap diganti ke GEO MAPID nanti, periksa ulang font apa yang
 * disediakan endpoint glyph-nya.
 */
export const LABEL_FONT = ["Noto Sans Regular"];

/** Warna isochrone, makin dekat makin pekat. */
export const ISOCHRONE_COLOR = "#2563EB";
export const ISOCHRONE_FILL_OPACITY: Record<number, number> = {
  3: 0.16,
  5: 0.1,
  10: 0.055,
};

/* -------------------------------------------------------------------------
 * Ekspresi MapLibre
 *
 * Semua membaca lewat ["feature-state", ...] — bukan ["get", ...] — karena
 * angka analitik datang terpisah dari geometri dan digabung memakai
 * setFeatureState. Ini sengaja disamakan dengan cara kerja Fase 2, supaya
 * saat backend siap ekspresi ini tidak perlu diubah sama sekali.
 * Lihat DATA_CONTRACT.md §7.
 * ---------------------------------------------------------------------- */

/** Warna lingkaran berdasarkan nilai gap. */
function gapColorExpression(): unknown[] {
  const scale: unknown[] = [
    "interpolate",
    ["linear"],
    ["coalesce", ["feature-state", "gap"], 0],
  ];
  for (const stop of GAP_COLOR_STOPS) scale.push(stop.at, stop.color);
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

/**
 * Ukuran lingkaran: mengikuti besar gap, ikut membesar saat zoom, dan tetap
 * kecil untuk titik bersampel tipis.
 *
 * ⚠️ `["zoom"]` hanya boleh menjadi masukan `interpolate`/`step` paling luar.
 * Karena itu urutannya interpolate-zoom di luar, `case` sampel tipis di dalam
 * — bukan sebaliknya. MapLibre menolak susunan yang terbalik.
 */
function circleRadiusExpression(): unknown[] {
  const first = GAP_COLOR_STOPS[0].at;
  const last = GAP_COLOR_STOPS[GAP_COLOR_STOPS.length - 1].at;

  /** Ukuran pada satu tingkat zoom, dengan pengali skala. */
  const atScale = (scale: number): unknown[] => [
    "case",
    IS_THIN,
    (GAP_RADIUS.min + 2) * scale,
    [
      "interpolate",
      ["linear"],
      ["coalesce", ["feature-state", "gap"], 0],
      first,
      GAP_RADIUS.min * scale,
      last,
      GAP_RADIUS.max * scale,
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
 */
export function pointCircleLayer(): CircleLayerSpecification {
  return {
    id: LAYER.pointCircle,
    type: "circle",
    source: SOURCE.points,
    paint: {
      "circle-color": [
        "case",
        IS_THIN,
        "#FFFFFF",
        gapColorExpression(),
      ] as unknown as string,
      "circle-opacity": ["case", IS_THIN, 0.5, 0.92] as unknown as number,
      "circle-radius": circleRadiusExpression() as unknown as number,
      "circle-stroke-color": [
        "case",
        IS_THIN,
        THIN_SAMPLE_COLOR,
        "#FFFFFF",
      ] as unknown as string,
      "circle-stroke-width": ["case", IS_THIN, 1.5, 2] as unknown as number,
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
      "text-color": "#334155",
      "text-halo-color": "#FFFFFF",
      "text-halo-width": 1.5,
    },
  };
}
