/**
 * Baris tabel atribut — satu titik pengamatan per baris, pada potongan
 * slot × kategori yang sedang aktif.
 *
 * Dipakai dua kali: tabel atribut di layar dan ekspor CSV. Keduanya membaca
 * fungsi yang sama supaya berkas yang diunduh tidak bisa berbeda isi dari
 * tabel yang baru saja dilihat orangnya — kalau masing-masing menyusun
 * barisnya sendiri, satu perubahan filter yang lupa diteruskan sudah cukup
 * untuk membuat keduanya berbeda tanpa ada yang sadar.
 *
 * Murni: tanpa React, tanpa DOM. Tidak ada angka yang dihitung di sini —
 * semuanya dipilih lewat `metricFor()`, aturan yang sama dengan peta dan
 * panel (ROADMAP §9 nomor 4).
 */
import type { CategoryFilter } from "@/lib/data/dimensions";
import { categoryLabel, slotLabel } from "@/lib/data/dimensions";
import { metricFor } from "@/lib/analytics/select";
import type {
  ObservationPointProps,
  SlotKey,
  SpendingGapPayload,
} from "@/lib/data/types";
import { namaBerkas, toCsv, type CsvValue } from "./csv";

export type BarisAtribut = {
  pointId: number;
  titik: string;
  stasiun: string;
  gapP10: number | null;
  gapP50: number | null;
  gapP90: number | null;
  potensiP50: number | null;
  tertangkapP50: number | null;
  F: number | null;
  E: number | null;
  C: number | null;
  V: number | null;
  confidence: number;
  sampelTipis: boolean;
};

/** Kolom tabel: kunci, judul, dan apakah isinya angka (rata kanan, sortir numerik). */
export const KOLOM_ATRIBUT: {
  key: keyof BarisAtribut;
  judul: string;
  angka: boolean;
}[] = [
  { key: "titik", judul: "Titik", angka: false },
  { key: "stasiun", judul: "Stasiun", angka: false },
  { key: "gapP10", judul: "Gap P10", angka: true },
  { key: "gapP50", judul: "Gap P50", angka: true },
  { key: "gapP90", judul: "Gap P90", angka: true },
  { key: "potensiP50", judul: "Potensi P50", angka: true },
  { key: "tertangkapP50", judul: "Tertangkap P50", angka: true },
  { key: "F", judul: "F (org/jam)", angka: true },
  { key: "E", judul: "E", angka: true },
  { key: "C", judul: "C", angka: true },
  { key: "V", judul: "V (Rp)", angka: true },
  { key: "confidence", judul: "Kepercayaan", angka: true },
  { key: "sampelTipis", judul: "Sampel tipis", angka: false },
];

/**
 * Susun baris untuk potongan aktif.
 *
 * Nama titik datang dari `entrances` (atribut), **bukan** dari daftar fitur
 * geometri — begitu geometri pindah ke tile vektor, browser hanya memegang
 * fitur yang kebetulan masuk layar, dan tabel akan menampilkan `#24` alih-alih
 * "Pintu 4" untuk titik di luar layar. Lihat ROADMAP §4.1.
 */
export function barisAtribut(
  payload: SpendingGapPayload,
  entrances: ObservationPointProps[],
  slot: SlotKey,
  category: CategoryFilter,
): BarisAtribut[] {
  const namaTitik = new Map(entrances.map((e) => [e.id, e]));

  return payload.points.map((point) => {
    const m = metricFor(point, slot, category);
    const info = namaTitik.get(point.point_id);
    return {
      pointId: point.point_id,
      titik: info?.point_label ?? `#${point.point_id}`,
      stasiun: info?.station_name ?? "—",
      gapP10: m.gap.p10,
      gapP50: m.gap.p50,
      gapP90: m.gap.p90,
      potensiP50: m.potensi.p50,
      tertangkapP50: m.tertangkap.p50,
      F: m.variables?.F ?? null,
      E: m.variables?.E ?? null,
      C: m.variables?.C ?? null,
      V: m.variables?.V ?? null,
      confidence: point.confidence,
      sampelTipis: m.sampelTipis,
    };
  });
}

export type Arah = "naik" | "turun";

/**
 * Urutkan baris menurut satu kolom.
 *
 * Nilai `null` (tidak diestimasi) selalu diletakkan di bawah, di kedua arah.
 * Memperlakukannya sebagai nol akan menempatkan titik yang tidak disurvei di
 * ujung "kesenjangan terkecil" — bacaan yang justru kebalikan dari keadaan
 * sebenarnya, dan kesalahan yang sama sudah pernah dihindari di peta (lihat
 * catatan "sampel tipis" di CLAUDE.md).
 */
export function urutkan(
  rows: BarisAtribut[],
  key: keyof BarisAtribut,
  arah: Arah,
): BarisAtribut[] {
  const faktor = arah === "naik" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const x = a[key];
    const y = b[key];
    if (x === null && y === null) return 0;
    if (x === null) return 1;
    if (y === null) return -1;
    if (typeof x === "number" && typeof y === "number") return (x - y) * faktor;
    return String(x).localeCompare(String(y), "id") * faktor;
  });
}

/** Teks CSV untuk potongan aktif, header memakai judul kolom yang sama. */
export function csvAtribut(rows: BarisAtribut[]): string {
  const header = KOLOM_ATRIBUT.map((k) => k.judul);
  const data: CsvValue[][] = rows.map((row) =>
    KOLOM_ATRIBUT.map((k) => row[k.key] as CsvValue),
  );
  return toCsv(header, data);
}

/**
 * Nama berkas yang membawa potongan filternya.
 *
 * `generated_at` dan `pipeline_version` ikut supaya dua ekspor dari dua kali
 * jalannya pipeline tidak bisa tertukar — provenance yang sama yang sudah
 * ditampilkan panel transparansi di layar.
 */
export function namaBerkasAtribut(
  payload: SpendingGapPayload,
  slot: SlotKey,
  category: CategoryFilter,
): string {
  return namaBerkas([
    "tabel-atribut",
    slotLabel(slot),
    categoryLabel(category),
    payload.pipeline_version,
  ]);
}
