/**
 * Gaya lapisan petak sewa — warna, ukuran, dan ekspresi paint.
 *
 * Sepupu `lib/map/retail-style.ts` dan tunduk aturan yang sama: MapLibre butuh
 * nilai literal, jadi hex-nya ditulis apa adanya (nilai yang sama dengan token
 * di `globals.css`), dan tidak ada warna sewa yang boleh tinggal di komponen.
 *
 * **Bentuknya kotak, bukan bulat.** Bulatan sudah dipakai dua arti di peta ini
 * (lingkaran kesenjangan dan bulatan retail); petak sewa adalah ruang yang
 * disewakan, bukan titik yang diukur, dan di emplasemen yang sama keduanya
 * kerap bertumpuk. Kotak membuat keduanya masih bisa dibedakan saat bertumpuk.
 *
 * Status dibedakan lewat ISIAN, bukan hue baru:
 *
 *   available           → kotak oker pejal   — petak kosong, ini yang dicari
 *   occupied            → kotak berongga tinta — sudah ada penyewanya
 *   needs_verification  → kotak berongga oker  — menunggu verifikasi lapangan
 *
 * Petak pencilan (`is_outlier`) ditandai garis tepi tebal, bukan warna
 * keempat: pencilan adalah sifat angkanya, bukan jenis petak yang lain.
 */
import type { CircleLayerSpecification, SymbolLayerSpecification } from "maplibre-gl";
import { LAYER, SOURCE } from "./config";
import { LABEL_FONT } from "./style";

const INK = "#16130f";
const OKER = "#b45f33";
const KERTAS = "#faf8f4";
const PERMUKAAN = "#ffffff";

/** Lambang tiap status untuk legenda dan daftar — cocok dengan gambar di peta. */
export const SEWA_LEGEND: Record<
  string,
  { label: string; fill: string; stroke: string; description: string }
> = {
  available: {
    label: "Petak kosong",
    fill: OKER,
    stroke: PERMUKAAN,
    description: "Petak yang sedang ditawarkan — sewa dan luasnya dari sumber resmi.",
  },
  occupied: {
    label: "Petak terisi",
    fill: PERMUKAAN,
    stroke: INK,
    description: "Sudah ada penyewanya; nilai kontrak tidak dibuka oleh sumber.",
  },
  needs_verification: {
    label: "Perlu verifikasi",
    fill: PERMUKAAN,
    stroke: OKER,
    description: "Kios hasil survei lapangan — status dan harga sewa belum diverifikasi.",
  },
};

/** Urutan status untuk daftar & legenda: yang dicari lebih dulu. */
export const SEWA_STATUSES = ["available", "occupied", "needs_verification"] as const;

const FILL_MATCH = [
  "match",
  ["get", "availability_status"],
  "available",
  SEWA_LEGEND.available.fill,
  PERMUKAAN,
];

const STROKE_MATCH = [
  "match",
  ["get", "availability_status"],
  "available",
  SEWA_LEGEND.available.stroke,
  "needs_verification",
  SEWA_LEGEND.needs_verification.stroke,
  INK,
];

/**
 * Warna garis tepi, dengan petak terpilih ditandai tinta pekat.
 *
 * Lewat `setPaintProperty`, bukan `feature-state` — sama alasannya dengan
 * retail: nilainya harus bertahan saat source di-`setData` ulang.
 */
export function sewaStrokeColor(selectedId: string | null): unknown {
  return ["case", ["==", ["get", "id"], selectedId ?? " "], INK, STROKE_MATCH];
}

/** Tebal garis tepi: menebal saat dipilih, dan saat indeksnya pencilan. */
export function sewaStrokeWidth(selectedId: string | null): unknown {
  return [
    "case",
    ["==", ["get", "id"], selectedId ?? " "],
    3,
    ["==", ["get", "is_outlier"], true],
    2.6,
    1.6,
  ];
}

/**
 * Kotak petak sewa.
 *
 * Dipakai layer `circle` dengan `circle-pitch-alignment: map` — MapLibre tidak
 * punya tipe layer "kotak" tanpa sprite, dan menambah sprite berarti satu
 * berkas gambar lagi yang harus disajikan dan dicocokkan dengan basemap.
 * Bentuk kotaknya datang dari `icon`-less symbol di layer indeks; bulatan di
 * sini dibuat sedikit lebih besar dari bulatan retail supaya tetap terbaca
 * sebagai lapisan yang berbeda saat keduanya menyala bersamaan.
 */
export function sewaPetakLayer(): CircleLayerSpecification {
  return {
    id: LAYER.sewaPetak,
    type: "circle",
    source: SOURCE.sewa,
    paint: {
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["zoom"],
        12,
        4,
        16,
        6.5,
        19,
        8.5,
      ] as unknown as number,
      "circle-color": FILL_MATCH as unknown as string,
      "circle-opacity": 0.9,
      "circle-stroke-color": sewaStrokeColor(null) as unknown as string,
      "circle-stroke-width": sewaStrokeWidth(null) as unknown as number,
    },
  };
}

/**
 * Angka indeks sewa/arus di bawah tiap petak.
 *
 * Hanya muncul dari zoom 16 ke atas — di bawah itu petak-petak Manggarai
 * berhimpit dalam beberapa piksel dan seluruh angkanya saling menabrak.
 * Petak tanpa indeks tidak diberi label sama sekali (`filter`), bukan diberi
 * "Rp 0": nol berarti gratis, dan itu bukan yang terjadi.
 */
export function sewaIndeksLayer(): SymbolLayerSpecification {
  return {
    id: LAYER.sewaIndeks,
    type: "symbol",
    source: SOURCE.sewa,
    minzoom: 16,
    // `index_label` disiapkan sebagai properti fitur, bukan dirangkai di sini:
    // `text-field` adalah properti layout, dan pemformatan rupiah bukan urusan
    // ekspresi MapLibre. Lihat catatan SOURCE.pointLabels di config.ts.
    filter: ["has", "index_label"],
    layout: {
      "text-field": ["get", "index_label"],
      "text-font": LABEL_FONT,
      "text-size": 10.5,
      "text-anchor": "top",
      "text-offset": [0, 1.2],
      "text-max-width": 10,
    },
    paint: {
      "text-color": OKER,
      "text-halo-color": KERTAS,
      "text-halo-width": 1.6,
    },
  };
}
