/**
 * Menyatukan dua sumber sewa menjadi satu koleksi yang siap digambar.
 *
 * Backend menyajikannya terpisah, dan memang beda pemilik dan beda arti:
 * `rental-assets` adalah inventaris petak (di mana, seberapa luas, terisi atau
 * kosong), `rent-flow-index` adalah skor sewa-per-arus. Peta butuh keduanya
 * dalam satu fitur — kotak digambar dari status petak, angkanya dari indeks —
 * jadi penggabungan itu terjadi di sini, sekali, bukan di dalam komponen.
 *
 * Petak tanpa baris indeks tetap ikut dengan `index: null`. Itu keadaan yang
 * lumrah dan bukan kesalahan: sewa in-station Sudirman tidak ada di API KAI,
 * dan listing pasar sekitar tidak punya denominator arus yang sepadan.
 * Mengisinya nol akan terbaca "sewanya gratis", bukan "belum terukur".
 */
import type { FeatureCollection, Point } from "geojson";
import type {
  AvailabilityStatus,
  RentFlowIndexPayload,
  RentalAssetPayload,
} from "./types";

/** Satu petak sewa siap gambar: inventaris + indeks (kalau ada). */
export type RentPlot = {
  id: string;
  station_id: string;
  station_name: string;
  plot_name: string;
  data_source: RentalAssetPayload["data_source"];
  availability_status: AvailabilityStatus;
  rented: boolean;
  land_area: number | null;
  note: string | null;
  /** Sewa ditawarkan, rupiah/tahun. `null` bila sumber tak membukanya. */
  offered_rent: number | null;
  /** Arus terukur yang jadi penyebut indeks. `null` bila tak terukur. */
  measured_flow: number | null;
  /** `offered_rent / measured_flow`. `null` = belum terukur, bukan nol. */
  index: number | null;
  is_outlier: boolean;
};

export function gabungSewa(
  assets: RentalAssetPayload[],
  indices: RentFlowIndexPayload[],
): RentPlot[] {
  // Dikunci pada `source_id`, bukan `id`: `plot_id` di rent-flow-index adalah
  // id petak dari sumbernya (blokid Space KAI), bukan primary key baris aset.
  const byPlot = new Map(indices.map((row) => [row.plot_id, row]));

  return assets.map((asset) => {
    const index = byPlot.get(asset.source_id);
    return {
      id: asset.id,
      station_id: asset.station_id,
      station_name: asset.station_name,
      plot_name: asset.plot_name,
      data_source: asset.data_source,
      availability_status: asset.availability_status,
      rented: asset.rented,
      land_area: asset.land_area,
      note: asset.note,
      offered_rent: index?.offered_rent ?? null,
      measured_flow: index?.measured_flow ?? null,
      index: index?.index ?? null,
      is_outlier: index?.is_outlier ?? false,
    };
  });
}

/**
 * GeoJSON untuk layer peta.
 *
 * Koordinat diambil dari aset, karena indeks tidak membawa geometri sama
 * sekali. Petak tanpa koordinat tidak bisa digambar — listing pasar sekitar
 * (99.co) semuanya begitu, sumbernya hanya memberi level kawasan. Petak itu
 * disaring di sini alih-alih ditaruh di koordinat karangan.
 */
export function sewaGeoJSON(
  assets: RentalAssetPayload[],
  plots: RentPlot[],
): FeatureCollection<Point, RentPlot & { index_label?: string }> {
  const byID = new Map(plots.map((plot) => [plot.id, plot]));

  return {
    type: "FeatureCollection",
    features: assets.flatMap((asset) => {
      const plot = byID.get(asset.id);
      if (!plot) return [];
      if (asset.latitude == null || asset.longitude == null) return [];
      // `index_label` ikut sebagai PROPERTI, bukan dirangkai di ekspresi peta:
      // `text-field` adalah properti layout, dan MapLibre tidak memformat
      // rupiah. Petak tanpa indeks tidak mendapat kuncinya sama sekali —
      // layernya menyaring dengan `["has", "index_label"]`, jadi ketiadaan
      // kunci itulah yang membuat labelnya absen alih-alih tertulis "Rp 0".
      const properties =
        plot.index == null
          ? plot
          : { ...plot, index_label: labelIndeks(plot.index) };
      return [
        {
          type: "Feature" as const,
          id: asset.id,
          properties,
          geometry: {
            type: "Point" as const,
            coordinates: [asset.longitude, asset.latitude],
          },
        },
      ];
    }),
  };
}

/** Rupiah per orang lewat, dibulatkan untuk label peta ("Rp 9,6 jt/org"). */
export function labelIndeks(index: number | null): string {
  if (index == null) return "—";
  if (index >= 1_000_000) return `Rp ${(index / 1_000_000).toFixed(1).replace(".", ",")} jt`;
  if (index >= 1_000) return `Rp ${Math.round(index / 1_000)} rb`;
  return `Rp ${Math.round(index)}`;
}
