/**
 * Angka NYATA hasil survei lapangan + pipeline — sumber kebenaran untuk
 * halaman naratif (Insight, Metodologi, Rekomendasi).
 *
 * Beda dari `public/mock/` (model peta per-titik yang masih prototipe): berkas
 * ini hanya memuat granularitas yang benar-benar TERUKUR — **per stasiun ×
 * slot**, kategori, dan arus per gerbang. Persis mencerminkan `isistasiun-be`
 * seed (`backend/seed/isi_stasiun_seed.sql`) = `isistasiun-ai` fixtures, yang
 * diturunkan pipeline dari `isistasiun-ai/data/source/field/`
 * (13 foto tally-counter + koordinat lapangan).
 *
 * ⚠️ CAVEAT WAJIB DITAMPILKAN: semua slot masih **sampel tipis** (2–4 blok).
 * Angka di sini estimasi awal P10–P90, bukan nilai mapan. Slot **siang belum
 * terukur** (hanya pagi & sore) — jangan tampilkan angka siang seolah terukur.
 * Tidak ada angka per-PINTU/gerai: arus hanya terukur per gerbang stasiun.
 */

export type SlotKey = "pagi" | "sore";

export interface RangeJt {
  /** Rupiah, batas bawah P10. */
  p10: number;
  /** Rupiah, batas atas P90. */
  p90: number;
}

export interface SlotFigure {
  slot: SlotKey;
  /** Jam terukur di lapangan. */
  jam: string;
  potensi: RangeJt;
  tertangkap: RangeJt;
  gap: RangeJt;
  /** blok pengamatan (menentukan sampel tipis). */
  sampel: number;
  /** true = di bawah ambang, tidak boleh dibaca sebagai mapan. */
  sampelTipis: boolean;
  /** skor kepercayaan 0–1 dari confidence_layer. */
  skorKepercayaan: number;
}

export interface KategoriFigure {
  key: "makanan_minuman" | "ritel_kemasan" | "apotek_kesehatan" | "jasa" | "lainnya";
  label: string;
  /** Jumlah POI real dalam radius 800 m (bukti permintaan). */
  demandCount: number;
  /** Sudah tersedia di dalam stasiun? */
  tersedia: boolean;
  /** Gerai kategori ini di dalam stasiun (amatan konversi lapangan, EC). */
  geraiCount: number;
}

export interface GerbangFigure {
  nama: string;
  masuk: number;
  keluar: number;
  total: number;
}

export interface StasiunFigure {
  id: number;
  kode: string;
  nama: string;
  tipologi: string;
  slot: SlotFigure[];
  kategori: KategoriFigure[];
  gerbang: GerbangFigure[];
}

const KATEGORI_LABEL: Record<KategoriFigure["key"], string> = {
  makanan_minuman: "Makanan & minuman",
  ritel_kemasan: "Ritel kemasan",
  apotek_kesehatan: "Apotek & kesehatan",
  jasa: "Jasa",
  lainnya: "Lainnya",
};

function kat(
  key: KategoriFigure["key"],
  demandCount: number,
  tersedia: boolean,
  geraiCount: number,
): KategoriFigure {
  return { key, label: KATEGORI_LABEL[key], demandCount, tersedia, geraiCount };
}

/**
 * Dua simpul. Angka persis dari seed BE / fixtures AI (per stasiun × slot).
 * Manggarai punya pagi + sore; Sudirman hanya sore terukur (pagi tak
 * berdenominator arus, jadi tidak diestimasi).
 */
export const STASIUN: StasiunFigure[] = [
  {
    id: 1,
    kode: "MRI",
    nama: "Manggarai",
    tipologi: "Simpul transit",
    slot: [
      {
        slot: "pagi",
        jam: "08.00",
        potensi: { p10: 900_000, p90: 1_600_000 },
        tertangkap: { p10: 500_000, p90: 900_000 },
        gap: { p10: 400_000, p90: 700_000 },
        sampel: 4,
        sampelTipis: true,
        skorKepercayaan: 0.45,
      },
      {
        slot: "sore",
        jam: "17.30",
        potensi: { p10: 1_500_000, p90: 2_600_000 },
        tertangkap: { p10: 700_000, p90: 1_200_000 },
        gap: { p10: 800_000, p90: 1_400_000 },
        sampel: 4,
        sampelTipis: true,
        skorKepercayaan: 0.5,
      },
    ],
    kategori: [
      kat("makanan_minuman", 21, true, 1),
      kat("ritel_kemasan", 4, true, 3),
      kat("apotek_kesehatan", 13, false, 0),
      kat("jasa", 55, false, 0),
      kat("lainnya", 0, false, 0),
    ],
    gerbang: [
      { nama: "Pintu A", masuk: 44, keluar: 32, total: 76 },
      { nama: "Pintu B", masuk: 18, keluar: 9, total: 27 },
    ],
  },
  {
    id: 2,
    kode: "SUD",
    nama: "Sudirman",
    tipologi: "Simpul perkantoran",
    slot: [
      {
        slot: "sore",
        jam: "17.30",
        potensi: { p10: 1_100_000, p90: 2_000_000 },
        tertangkap: { p10: 200_000, p90: 400_000 },
        gap: { p10: 900_000, p90: 1_600_000 },
        sampel: 4,
        sampelTipis: true,
        skorKepercayaan: 0.42,
      },
    ],
    kategori: [
      kat("makanan_minuman", 30, true, 4),
      kat("ritel_kemasan", 20, true, 1),
      kat("apotek_kesehatan", 4, false, 0),
      kat("jasa", 71, false, 0),
      kat("lainnya", 0, false, 1),
    ],
    gerbang: [{ nama: "Pintu Atas", masuk: 8, keluar: 27, total: 35 }],
  },
];

/** Asumsi model yang dipakai konsisten di seluruh pipeline (§1 integrasi AI). */
export const ASUMSI = {
  /** Konversi masuk→beli. */
  C: 0.95,
  /** Nilai transaksi rata-rata per kategori (Rupiah), dari struk. */
  V: { makanan_minuman: 25_000, ritel_kemasan: 30_000 } as Record<string, number>,
  /** Iterasi Monte Carlo per (stasiun, slot). */
  iterasiMonteCarlo: 10_000,
} as const;

export const PROVENANCE =
  "Survei lapangan Manggarai dan Sudirman (13 foto tally-counter serta koordinat), " +
  "pipeline Monte Carlo 10.000 iterasi. Semua slot masih sampel tipis (2 sampai 4 blok); angkanya estimasi awal P10–P90.";

/** "900000" -> "0,9". Untuk dirangkai jadi "Rp0,9–1,6 jt". */
export function jt(rupiah: number): string {
  return (rupiah / 1_000_000).toFixed(1).replace(".", ",");
}

/** (900000, 1600000) -> "Rp0,9–1,6 jt". */
export function rentangJt(r: RangeJt): string {
  return `Rp${jt(r.p10)}–${jt(r.p90)} jt`;
}

/** Titik tengah rentang (untuk rasio capture), Rupiah. */
export function tengah(r: RangeJt): number {
  return (r.p10 + r.p90) / 2;
}

/** Persen tertangkap = tertangkap/potensi di titik tengah. 0–100 (dibulatkan). */
export function persenTertangkap(s: SlotFigure): number {
  const pot = tengah(s.potensi);
  return pot > 0 ? Math.round((tengah(s.tertangkap) / pot) * 100) : 0;
}

/**
 * Total kesenjangan belanja harian, dijumlah atas semua slot terukur kedua
 * simpul. p50 diambil sebagai titik tengah rentang (P10/P90 dari pipeline;
 * p50 sejati tak disimpan). Ini angka headline "duduk perkara" Beranda.
 */
export function totalGap(): { p10: number; p50: number; p90: number } {
  let p10 = 0;
  let p90 = 0;
  for (const st of STASIUN) {
    for (const s of st.slot) {
      p10 += s.gap.p10;
      p90 += s.gap.p90;
    }
  }
  return { p10, p50: Math.round((p10 + p90) / 2), p90 };
}

/** Slot terukur diurutkan dari kesenjangan terbesar (untuk peringkat Insight). */
export function slotUrutGap(): { stasiun: string; slot: SlotFigure }[] {
  const rows: { stasiun: string; slot: SlotFigure }[] = [];
  for (const st of STASIUN) for (const s of st.slot) rows.push({ stasiun: st.nama, slot: s });
  return rows.sort((a, b) => tengah(b.slot.gap) - tengah(a.slot.gap));
}

/** Kategori dengan permintaan terbaca tapi belum ada di stasiun, urut demand. */
export function kategoriHilang(st: StasiunFigure): KategoriFigure[] {
  return st.kategori
    .filter((k) => !k.tersedia && k.demandCount > 0)
    .sort((a, b) => b.demandCount - a.demandCount);
}
