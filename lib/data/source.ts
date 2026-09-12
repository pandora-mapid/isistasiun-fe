/**
 * Satu-satunya tempat frontend mengambil data.
 *
 * Fase 0–1 membaca data contoh dari `public/mock/`. Fase 2 menukar isi berkas
 * ini dengan panggilan ke Go API — komponen peta dan panel tidak perlu
 * disentuh, karena semuanya hanya memanggil fungsi di bawah.
 *
 * Lihat ROADMAP.md §5 dan DATA_CONTRACT.md Bagian B.
 */
import type { FeatureCollection, Point, Polygon } from "geojson";
import type {
  ApiEnvelope,
  ConfidenceGridProps,
  ConfidenceLayerEntry,
  IsochroneProps,
  MockDemoData,
  ObservationPointProps,
  RentFlowIndexPayload,
  SpendingGapPayload,
  Station,
  RentalAsset,
  StationSummaryPayload,
} from "./types";
import { MOCK_DEMO_DATA } from "./demo";
import { MOCK_RENTAL_ASSETS } from "./rental-demo";

const PROTOTYPE_STATION_IDS = new Set([1, 2]);
const PROTOTYPE_POINT_IDS = new Set([11, 12, 13, 21, 22, 23, 24]);

/**
 * Alamat sumber data.
 *
 * Selama masih data contoh, nilainya `/mock`. Fase 2 cukup mengisi
 * `NEXT_PUBLIC_API_BASE_URL` dengan `…/api/v1` — tanpa menyentuh kode.
 *
 * Ditulis sebagai rujukan literal ke `process.env.NEXT_PUBLIC_…`, bukan lewat
 * variabel perantara: Next.js menyisipkan nilainya saat build dengan mencocokkan
 * teks, jadi rujukan dinamis tidak akan tergantikan dan hasilnya `undefined`.
 */
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/mock";
const USING_LOCAL_MOCK = BASE === "/mock";

/**
 * Token yang disisipkan ke setiap permintaan, kalau ada.
 *
 * ⚠️ Halaman Peta **tidak boleh** menuntut token. `02-BACKEND-SPEC.md` §1
 * memakai JWT untuk memisahkan tier gratis dari berbayar, tetapi
 * `04-VALUE-PROP-AND-MONETIZATION.md` §3 mewajibkan lapisan dasar tetap
 * terbuka demi equity UMKM. Jadi seluruh isi berkas ini harus tetap bekerja
 * ketika tokennya `null` — dan memang begitu adanya sekarang.
 *
 * Titik sisipnya disiapkan lebih dulu supaya saat fitur premium dibangun
 * (ROADMAP §6.1), yang berubah hanya satu berkas ini.
 */
let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

function headers(): HeadersInit | undefined {
  if (!authToken) return undefined;
  return { Authorization: `Bearer ${authToken}` };
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/${path}`, {
    cache: "no-store",
    headers: headers(),
  });
  if (!res.ok) {
    throw new Error(`Gagal memuat ${path}: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

/**
 * Membuka bungkus `{ success, data, error }` milik backend.
 *
 * Dipisah menjadi fungsi sendiri supaya kalau backend ternyata memakai bentuk
 * lain, hanya bagian ini yang berubah.
 */
function unwrap<T>(envelope: ApiEnvelope<T>): T {
  if (!envelope.success || envelope.data === null) {
    throw new Error(envelope.error?.message ?? "Response tidak berhasil");
  }
  return envelope.data;
}

/** Geometri titik pengamatan. Fase 2: diganti tile vektor. */
export function loadObservationPoints(): Promise<
  FeatureCollection<Point, ObservationPointProps>
> {
  return getJson<FeatureCollection<Point, ObservationPointProps>>("observation-points.geojson")
    .then((collection) => ({
      ...collection,
      features: collection.features.filter((feature) =>
        PROTOTYPE_STATION_IDS.has(feature.properties.station_id),
      ),
    }));
}

/** Geometri isochrone. Fase 2: diganti tile vektor. */
export function loadIsochrones(): Promise<
  FeatureCollection<Polygon, IsochroneProps>
> {
  return getJson<FeatureCollection<Polygon, IsochroneProps>>("isochrones.geojson")
    .then((collection) => ({
      ...collection,
      features: collection.features.filter((feature) =>
        PROTOTYPE_POINT_IDS.has(feature.properties.point_id),
      ),
    }));
}

/** Hasil analisis. Fase 2: `GET /api/v1/analytics/spending-gap`. */
export async function loadSpendingGap(): Promise<SpendingGapPayload> {
  const payload = unwrap(await getJson<ApiEnvelope<SpendingGapPayload>>("spending-gap.json"));
  return {
    ...payload,
    points: payload.points.filter((point) => PROTOTYPE_STATION_IDS.has(point.station_id)),
  };
}

/** Mutu data per titik dan slot. Fase API: `GET /api/v1/confidence-layer`. */
export async function loadConfidenceLayer(): Promise<ConfidenceLayerEntry[]> {
  const rows = unwrap(
    await getJson<ApiEnvelope<ConfidenceLayerEntry[]>>(
      USING_LOCAL_MOCK ? "confidence-layer.json" : "confidence-layer",
    ),
  );
  return rows
    .filter((row) => PROTOTYPE_POINT_IDS.has(row.point_id))
    .map((row) => ({
      ...row,
      confidence_score: Math.max(0, Math.min(1, row.confidence_score)),
    }));
}

/** Geometri grid mock. Fase API: ikut tile/GeoJSON zona confidence. */
export async function loadConfidenceGrid(): Promise<
  FeatureCollection<Polygon, ConfidenceGridProps>
> {
  return getJson<FeatureCollection<Polygon, ConfidenceGridProps>>(
    "confidence-grid.geojson",
  );
}

/**
 * Ringkasan per stasiun + bahan perbandingan antarsimpul.
 *
 * Fase 2: `GET /api/v1/analytics/station-summary`. Bentuknya di
 * `DATA_CONTRACT.md` §B "Ringkasan simpul"; angkanya adalah hasil simulasi
 * Monte Carlo setingkat simpul, bukan penjumlahan titik.
 */
export async function loadStationSummary(): Promise<StationSummaryPayload> {
  return unwrap(
    await getJson<ApiEnvelope<StationSummaryPayload>>("station-summary.json"),
  );
}

/**
 * Indeks sewa/arus per petak — sewa ditawarkan dibagi arus terukur.
 *
 * Isinya hanya petak Manggarai: sewa in-station Sudirman tidak ada di API KAI
 * (sudah diperiksa per koordinat), dan listing pasar sekitar tidak punya
 * denominator arus yang sepadan. Petak tanpa baris di sini memang belum punya
 * indeks — jangan diisi nol, karena nol berarti "gratis", bukan "tak terukur".
 *
 * Fase 2: `GET /api/v1/analytics/rent-flow-index`.
 */
export async function loadRentFlowIndex(): Promise<RentFlowIndexPayload[]> {
  return unwrap(
    await getJson<ApiEnvelope<RentFlowIndexPayload[]>>("rent-flow-index.json"),
  );
}

/** Daftar stasiun. Fase 2: `GET /api/v1/stations`. */
export async function loadStations(): Promise<Station[]> {
  return unwrap(await getJson<ApiEnvelope<Station[]>>("stations.json"))
    .filter((station) => PROTOTYPE_STATION_IDS.has(station.id));
}

/**
 * Daftar titik pengamatan beserta namanya — **atribut, bukan geometri**.
 *
 * Ini yang membuat panel tidak lagi bergantung pada geometri untuk mengetahui
 * nama sebuah titik. Selama geometri masih GeoJSON, browser kebetulan memegang
 * seluruh daftar fitur sehingga namanya bisa dibaca dari sana. Begitu geometri
 * pindah ke tile vektor, browser hanya menerima fitur yang kebetulan masuk
 * layar — dan nama titik di luar layar menghilang. Gejalanya menyesatkan:
 * panel menampilkan `#24` alih-alih "Pintu 4". Lihat ROADMAP §4.1.
 *
 * Fase 2: `GET /api/v1/stations/:id/entrances`. Kalau backend hanya menyediakan
 * bentuk per stasiun, panggil sekali per stasiun lalu gabungkan di sini —
 * pemanggilnya tidak perlu tahu.
 */
export async function loadEntrances(): Promise<ObservationPointProps[]> {
  return unwrap(await getJson<ApiEnvelope<ObservationPointProps[]>>("entrances.json"))
    .filter((entrance) => PROTOTYPE_STATION_IDS.has(entrance.station_id));
}

type ApiRentalAsset = Omit<RentalAsset, "station_id"> & {
  station_id: string;
};

const STATION_ID_BY_CODE: Record<string, number> = { MRI: 1, SUD: 2 };

/** Inventaris titik sewa; atribut datang dari `/analytics/rental-assets`. */
export async function loadRentalAssets(): Promise<RentalAsset[]> {
  if (USING_LOCAL_MOCK) return MOCK_RENTAL_ASSETS;

  const rows = unwrap(
    await getJson<ApiEnvelope<ApiRentalAsset[]>>("analytics/rental-assets"),
  );
  return rows
    .map((row) => ({
      ...row,
      station_id: STATION_ID_BY_CODE[row.station_code] ?? 0,
    }))
    .filter((asset) => asset.station_id !== 0);
}

/** Data presentasi Tahap 1. Fase API mengganti implementasi fungsi ini saja. */
export async function loadDemoData(): Promise<MockDemoData> {
  return MOCK_DEMO_DATA;
}
