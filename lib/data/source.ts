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
  IsochroneProps,
  ObservationPointProps,
  SpendingGapPayload,
  Station,
} from "./types";

/**
 * ⚠️ SEMENTARA — data contoh, bukan hasil survei.
 *
 * Fase 2: ganti menjadi base URL Go API, mis. `/api/v1`.
 */
const BASE = "/mock";

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/${path}`, { cache: "no-store" });
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
  return getJson("observation-points.geojson");
}

/** Geometri isochrone. Fase 2: diganti tile vektor. */
export function loadIsochrones(): Promise<
  FeatureCollection<Polygon, IsochroneProps>
> {
  return getJson("isochrones.geojson");
}

/** Hasil analisis. Fase 2: `GET /api/v1/analytics/spending-gap`. */
export async function loadSpendingGap(): Promise<SpendingGapPayload> {
  return unwrap(await getJson<ApiEnvelope<SpendingGapPayload>>("spending-gap.json"));
}

/** Daftar stasiun. Fase 2: `GET /api/v1/stations`. */
export async function loadStations(): Promise<Station[]> {
  return unwrap(await getJson<ApiEnvelope<Station[]>>("stations.json"));
}
