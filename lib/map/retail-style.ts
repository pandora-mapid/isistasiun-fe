/**
 * Gaya lapisan retail & potensi toko — warna, ukuran, dan ekspresi paint.
 *
 * Sepupu `lib/map/style.ts`: MapLibre butuh nilai literal, jadi hex-nya
 * ditulis apa adanya (nilai yang sama dengan token `--ink`/`--field`/`--surface`
 * di `globals.css`). Komponen tidak boleh menaruh warna retail di tempat lain.
 *
 * Tiga jenis dibedakan lewat ISIAN, bukan tiga hue baru — sistem kertas
 * sengaja sempit (tinta + satu biru data + satu oker lapangan + satu emas
 * chrome, masing-masing satu arti):
 *
 *   existing  → bulatan tinta pejal   — gerai yang memang sudah ada
 *   potential → bulatan berongga tinta — kandidat, baru hipotesis
 *   shopfront → bulatan berongga oker  — ruko, menunggu survei properti
 */
import type { CircleLayerSpecification, SymbolLayerSpecification } from "maplibre-gl";
import type { RetailKind } from "@/lib/data/retail";
import { LAYER, SOURCE } from "./config";
import { LABEL_FONT } from "./style";

const INK = "#16130f";
const OKER = "#b45f33";
const KERTAS = "#faf8f4";
const PERMUKAAN = "#ffffff";

/** Lambang tiap jenis untuk legenda dan daftar — cocok dengan gambar di peta. */
export const RETAIL_LEGEND: Record<
  RetailKind,
  { label: string; fill: string; stroke: string; description: string }
> = {
  existing: {
    label: "Retail tersedia",
    fill: INK,
    stroke: PERMUKAAN,
    description: "Gerai yang sudah beroperasi di kawasan stasiun.",
  },
  potential: {
    label: "Potensi toko",
    fill: PERMUKAAN,
    stroke: INK,
    description: "Lokasi kandidat toko — estimasi potensi pendapatan belum tersedia.",
  },
  shopfront: {
    label: "Ruko depan stasiun",
    fill: PERMUKAAN,
    stroke: OKER,
    description: "Ruko depan stasiun — status ketersediaan dan sewa menunggu survei properti.",
  },
};

/** Urutan jenis untuk daftar & legenda. */
export const RETAIL_KINDS: RetailKind[] = ["existing", "potential", "shopfront"];

/** Warna isian per jenis. */
const FILL_MATCH = [
  "match",
  ["get", "kind"],
  "existing",
  RETAIL_LEGEND.existing.fill,
  PERMUKAAN,
];

/** Warna garis tepi per jenis — dipakai saat titik tidak sedang dipilih. */
const STROKE_MATCH = [
  "match",
  ["get", "kind"],
  "shopfront",
  RETAIL_LEGEND.shopfront.stroke,
  INK,
];

/**
 * Warna garis tepi, dengan titik terpilih ditandai tinta pekat.
 *
 * `selectedId` dari retail berupa string; kalau `null` perbandingannya selalu
 * salah dan ekspresi jatuh ke warna per-jenis. Dipakai `MapCanvas` lewat
 * `setPaintProperty` — bukan `feature-state`, supaya bertahan saat source
 * di-`setData` ulang (pemuatan/filter).
 */
export function retailStrokeColor(selectedId: string | null): unknown {
  return ["case", ["==", ["get", "id"], selectedId ?? " "], INK, STROKE_MATCH];
}

/** Tebal garis tepi, menebal saat titik dipilih. */
export function retailStrokeWidth(selectedId: string | null): unknown {
  return ["case", ["==", ["get", "id"], selectedId ?? " "], 3, 1.6];
}

export function retailCircleLayer(): CircleLayerSpecification {
  return {
    id: LAYER.retailCircle,
    type: "circle",
    source: SOURCE.retail,
    paint: {
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["zoom"],
        12,
        3.5,
        16,
        5.5,
        19,
        7,
      ] as unknown as number,
      "circle-color": FILL_MATCH as unknown as string,
      "circle-stroke-color": retailStrokeColor(null) as unknown as string,
      "circle-stroke-width": retailStrokeWidth(null) as unknown as number,
    },
  };
}

export function retailLabelLayer(): SymbolLayerSpecification {
  return {
    id: LAYER.retailLabel,
    type: "symbol",
    source: SOURCE.retail,
    minzoom: 16,
    layout: {
      "text-field": ["get", "name"],
      "text-font": LABEL_FONT,
      "text-size": 11,
      "text-anchor": "top",
      "text-offset": [0, 1.1],
      "text-max-width": 12,
    },
    paint: {
      "text-color": INK,
      "text-halo-color": KERTAS,
      "text-halo-width": 1.6,
    },
  };
}
