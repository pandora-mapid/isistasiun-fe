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
 * DUA sumber, bukan satu sakelar.
 *
 * Fase 2 berjalan per-endpoint, bukan sekaligus: sebagian data sudah punya
 * endpoint di Go API, sebagian belum punya sama sekali (geometri menunggu tile
 * vektor) atau bentuknya belum cocok. Karena itu setiap loader di bawah memilih
 * sumbernya sendiri lewat `fromApi` atau `fromMock`, dan tidak ada satu `BASE`
 * yang diam-diam berlaku untuk semuanya.
 *
 * Versi sebelumnya memakai satu `BASE`: begitu `NEXT_PUBLIC_API_BASE_URL`
 * diisi di CI, SELURUH loader ikut pindah ke sana — termasuk enam yang masih
 * meminta nama berkas contoh. Hasilnya `GET /api/v1/stations.json` dan lima
 * saudaranya menjawab 404 di situs dev, sementara `npm run dev` lokal (env
 * kosong) tetap mulus. Kegagalan yang cuma muncul di produksi.
 *
 * `NEXT_PUBLIC_API_BASE_URL` tetap wajib terisi di build produksi — login dan
 * dashboard premium membacanya lewat `lib/auth/client.ts`.
 *
 * Ditulis sebagai rujukan literal ke `process.env.NEXT_PUBLIC_…`, bukan lewat
 * variabel perantara: Next.js menyisipkan nilainya saat build dengan mencocokkan
 * teks, jadi rujukan dinamis tidak akan tergantikan dan hasilnya `undefined`.
 */
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
const MOCK_BASE = "/mock";

/** Apakah alamat API sudah diisi. Kalau belum, loader API ikut jatuh ke mock. */
const API_READY = API_BASE !== "";

/**
 * Alamat khusus AI Copilot — SENGAJA dipisah dari `API_BASE`.
 *
 * Rencana lomba: peta jalan di atas data beku (mock/GeoJSON) sementara copilot
 * hidup lewat BE→AI. Kalau copilot ikut `API_BASE`, mengisi `API_BASE` untuk
 * menyalakan copilot memaksa loader peta yang kontraknya belum cocok pindah ke
 * BE juga — mis. `/confidence-layer` yang per-zona (bukan per-titik) → layer
 * confidence peta jadi kosong. Dengan variabel sendiri, copilot bisa menunjuk
 * BE tanpa menyentuh sumber data peta. Jatuh ke `API_BASE` bila tak diisi,
 * jadi menyetel keduanya tetap sah.
 *
 * Rujukan literal ke `process.env.NEXT_PUBLIC_…` (Next.js menyisipkan saat build
 * dengan mencocokkan teks).
 */
const AI_BASE =
  (process.env.NEXT_PUBLIC_AI_BASE_URL || "").replace(/\/$/, "") || API_BASE;

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

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    cache: "no-store",
    headers: headers(),
  });
  if (!res.ok) {
    throw new Error(`Gagal memuat ${url}: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

/** Data contoh yang ikut di repo (`public/mock/`), disajikan origin ini sendiri. */
function fromMock<T>(file: string): Promise<T> {
  return getJson<T>(`${MOCK_BASE}/${file}`);
}

/** Endpoint Go API yang sudah benar-benar ada. */
function fromApi<T>(path: string): Promise<T> {
  return getJson<T>(`${API_BASE}/${path}`);
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

/** Geometri titik pengamatan. Mock: Go API tidak menyajikan geometri sama sekali — Fase 2 menggantinya dengan tile vektor. */
export function loadObservationPoints(): Promise<
  FeatureCollection<Point, ObservationPointProps>
> {
  return fromMock<FeatureCollection<Point, ObservationPointProps>>("observation-points.geojson")
    .then((collection) => ({
      ...collection,
      features: collection.features.filter((feature) =>
        PROTOTYPE_STATION_IDS.has(feature.properties.station_id),
      ),
    }));
}

/** Geometri isochrone. Mock: sama seperti titik pengamatan, belum ada endpoint geometri. */
export function loadIsochrones(): Promise<
  FeatureCollection<Polygon, IsochroneProps>
> {
  return fromMock<FeatureCollection<Polygon, IsochroneProps>>("isochrones.geojson")
    .then((collection) => ({
      ...collection,
      features: collection.features.filter((feature) =>
        PROTOTYPE_POINT_IDS.has(feature.properties.point_id),
      ),
    }));
}

/**
 * Hasil analisis. Masih mock.
 *
 * `GET /api/v1/analytics/spending-gap` sudah hidup, tapi bentuknya belum bisa
 * dipakai di sini: ia menjawab per stasiun × slot, sedangkan peta butuh per
 * titik × slot × kategori berikut P50 dan blok `variables` F/E/C/V. Menukarnya
 * sekarang berarti mengarang angka yang tidak ada di jawabannya.
 */
export async function loadSpendingGap(): Promise<SpendingGapPayload> {
  const payload = unwrap(await fromMock<ApiEnvelope<SpendingGapPayload>>("spending-gap.json"));
  return {
    ...payload,
    points: payload.points.filter((point) => PROTOTYPE_STATION_IDS.has(point.station_id)),
  };
}

/** Mutu data per titik dan slot. Fase API: `GET /api/v1/confidence-layer`. */
export async function loadConfidenceLayer(): Promise<ConfidenceLayerEntry[]> {
  const rows = unwrap(
    await (API_READY
      ? fromApi<ApiEnvelope<ConfidenceLayerEntry[]>>("confidence-layer")
      : fromMock<ApiEnvelope<ConfidenceLayerEntry[]>>("confidence-layer.json")),
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
  return fromMock<FeatureCollection<Polygon, ConfidenceGridProps>>(
    "confidence-grid.geojson",
  );
}

/**
 * Ringkasan per stasiun + bahan perbandingan antarsimpul.
 *
 * Masih mock. `GET /api/v1/analytics/station-summary` sudah hidup dan bentuknya
 * ada di `DATA_CONTRACT.md` §B "Ringkasan simpul", tapi ia memakai `station_id`
 * UUID — sama seperti `/stations` di bawah, jadi keduanya ikut penukaran yang
 * sama, bukan sebelumnya. Angkanya hasil simulasi Monte Carlo setingkat simpul,
 * bukan penjumlahan titik.
 */
export async function loadStationSummary(): Promise<StationSummaryPayload> {
  return unwrap(
    await fromMock<ApiEnvelope<StationSummaryPayload>>("station-summary.json"),
  );
}

/**
 * Indeks sewa/arus per petak — sewa ditawarkan dibagi arus terukur.
 *
 * `GET /api/v1/analytics/rent-flow-index` sudah hidup dan aman dipakai
 * langsung — beda dari `stations`/`station-summary`/`entrances` di bawah,
 * `station_id` pada jawabannya tidak pernah dibaca di sisi frontend:
 * `gabungSewa()` (`lib/data/rent.ts`) mencocokkan tiap baris ke inventaris
 * petak lewat `plot_id`, bukan `station_id`, jadi UUID vs integer tidak jadi
 * masalah di sini. Tetap jatuh ke mock saat `NEXT_PUBLIC_API_BASE_URL` kosong
 * (dev lokal tanpa backend), sama seperti `loadConfidenceLayer`.
 *
 * Isinya hanya petak Manggarai: sewa in-station Sudirman tidak ada di API KAI
 * (sudah diperiksa per koordinat), dan listing pasar sekitar tidak punya
 * denominator arus yang sepadan. Petak tanpa baris di sini memang belum punya
 * indeks — jangan diisi nol, karena nol berarti "gratis", bukan "tak terukur".
 */
export async function loadRentFlowIndex(): Promise<RentFlowIndexPayload[]> {
  return unwrap(
    await (API_READY
      ? fromApi<ApiEnvelope<RentFlowIndexPayload[]>>("analytics/rent-flow-index")
      : fromMock<ApiEnvelope<RentFlowIndexPayload[]>>("rent-flow-index.json")),
  );
}

/**
 * Daftar stasiun. Masih mock.
 *
 * `GET /api/v1/stations` sudah hidup, tapi `id`-nya UUID sementara seluruh
 * frontend — `PROTOTYPE_STATION_IDS`, `station_id` di titik pengamatan,
 * `STATION_ID_BY_CODE` di bawah — memakai integer. Menukar endpoint ini saja
 * akan memutus sambungan titik ⇄ stasiun di peta tanpa satu pun error.
 */
export async function loadStations(): Promise<Station[]> {
  return unwrap(await fromMock<ApiEnvelope<Station[]>>("stations.json"))
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
 * Masih mock. `GET /api/v1/stations/:id/entrances` ada, tapi per stasiun dan
 * ber-`id` UUID: penukarannya berarti memanggil sekali per stasiun lalu
 * menggabungkannya di sini, dan itu baru masuk akal setelah `/stations` ikut
 * ditukar — pemanggilnya tidak perlu tahu.
 */
export async function loadEntrances(): Promise<ObservationPointProps[]> {
  return unwrap(await fromMock<ApiEnvelope<ObservationPointProps[]>>("entrances.json"))
    .filter((entrance) => PROTOTYPE_STATION_IDS.has(entrance.station_id));
}

type ApiRentalAsset = Omit<RentalAsset, "station_id"> & {
  station_id: string;
};

const STATION_ID_BY_CODE: Record<string, number> = { MRI: 1, SUD: 2 };

/** Inventaris titik sewa; atribut datang dari `/analytics/rental-assets`. */
export async function loadRentalAssets(): Promise<RentalAsset[]> {
  if (!API_READY) return MOCK_RENTAL_ASSETS;

  const rows = unwrap(
    await fromApi<ApiEnvelope<ApiRentalAsset[]>>("analytics/rental-assets"),
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

/** Bentuk jawaban AI Copilot — cermin `copilot/dto.go` di backend. */
export interface CopilotAnswer {
  answer: string;
  suggested_layers: string[] | null;
  spatial_filter: {
    station_id?: string;
    category?: string;
    time_slot?: string;
  } | null;
}

/**
 * AI Copilot "Tanya Data" — `POST /api/v1/copilot/query`.
 *
 * Beda dari fungsi lain di berkas ini: ini **POST**, dan hanya berfungsi saat
 * `NEXT_PUBLIC_API_BASE_URL` menunjuk ke backend nyata — endpoint copilot tidak
 * ada di data `/mock`. Backend **selalu** balas 200 dengan jawaban deterministik
 * saat layanan AI mati (`answer` tetap terisi, ada catatan "mode ringkas"),
 * jadi pemanggil tak perlu menangani matinya AI secara khusus — cukup tangani
 * kegagalan jaringan biasa. Lihat isi-stasiun-ai-integration.md §2.1.
 */
export async function askCopilot(
  query: string,
  stationId?: string,
): Promise<CopilotAnswer> {
  if (!AI_BASE) {
    // Tanpa alamat, fetch("/copilot/query") menembak origin Next sendiri dan
    // 404 — gejalanya "Gagal menghubungi layanan data". Beri pesan jelas.
    throw new Error(
      "Copilot belum tersambung: isi NEXT_PUBLIC_AI_BASE_URL (atau NEXT_PUBLIC_API_BASE_URL) ke alamat backend.",
    );
  }
  const res = await fetch(`${AI_BASE}/copilot/query`, {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...(headers() ?? {}) },
    body: JSON.stringify({ query, station_id: stationId ?? null }),
  });
  if (!res.ok) {
    throw new Error(`Gagal memuat copilot/query: ${res.status} ${res.statusText}`);
  }
  return unwrap((await res.json()) as ApiEnvelope<CopilotAnswer>);
}
