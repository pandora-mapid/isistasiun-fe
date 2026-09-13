"use client";

/**
 * Satu-satunya tempat halaman Insight mengambil angka.
 *
 * Kini bersumber dari data survei NYATA per stasiun x slot
 * (`lib/data/real-figures.ts` = seed BE = fixtures AI, diturunkan pipeline dari
 * `isistasiun-ai/data/source/field/`), bukan lagi model peta per-titik yang
 * masih prototipe. Cakupan dua simpul: Manggarai + Sudirman.
 *
 * ⚠️ Semua slot masih sampel tipis (2 sampai 4 blok) dan hanya pagi + sore yang
 * terukur (siang belum). Tidak ada angka per-PINTU: arus terukur per gerbang,
 * jadi "peringkat" di sini per stasiun x slot, bukan per pintu. Tidak ada struk
 * yang di-OCR, jadi V memakai nilai acuan (25rb/30rb) dan struk_terbaca = 0.
 */

import { createContext, useContext, type ReactNode } from "react";

import {
  STASIUN,
  totalGap,
  slotUrutGap,
  tengah,
  persenTertangkap,
  type RangeJt,
  type StasiunFigure,
} from "@/lib/data/real-figures";
import type { Range } from "@/lib/data/types";

export type IsiSel = "Terisi" | "Kurang" | "Kosong" | "-";

export type IsiInsight = {
  siap: boolean;
  error: string | null;
  /** Slot berkesenjangan terbesar dari kedua simpul. */
  sorotan: {
    namaStasiun: string;
    namaTitik: string;
    gap: Range;
    potensi: Range;
    tertangkap: Range;
    /** Bagian potensi yang tertangkap, 0–100 - dipakai mengisi batang. */
    isiPersen: number;
    /** Porsi potensi yang tertangkap gerai, 0–100. `null` bila tak terhitung. */
    capturePersen: number | null;
  } | null;
  /** Angka cakupan pencacahan - dasar bukti di balik seluruh halaman. */
  cakupan: {
    simpulDiamati: number;
    pintuDiamati: number;
    strukTerbaca: number;
    slot: number;
    kategori: number;
    pintuDitahan: number;
  } | null;
  /** Semua slot dalam cakupan, terurut dari kesenjangan harian terbesar. */
  peringkat: {
    namaStasiun: string;
    namaTitik: string;
    gap: Range;
    potensi: Range;
    tertangkap: Range;
    capturePersen: number | null;
    sampelTipis: boolean;
  }[];
  /** Uraian F × E × C × V pada satu slot nyata yang dicacah. */
  instrumen: {
    F: number;
    E: number;
    C: number;
    V: number;
    jam: string;
    slotLabel: string;
    namaTitik: string;
    namaStasiun: string;
  } | null;
  /** Kesenjangan p50 tiap slot terukur, satu skala bersama. */
  profilSlot: {
    label: string;
    jam: string;
    nilai: number | null;
    /** Tinggi kolom relatif, 0–100. */
    tinggi: number;
  }[];
  /** Slot yang estimasinya paling tipis. */
  sampelTipis: {
    namaTitik: string;
    namaStasiun: string;
    geraiCount: number;
    blokCount: number;
  } | null;
  temuan: {
    slotPuncak: { label: string; nilai: number | null };
    gapHarian: number | null;
    kategoriKosong: { label: string; demandShare: number | null } | null;
    arusTitik: number | null;
    pembanding: {
      namaTitik: string;
      namaStasiun: string;
      arus: number | null;
      gap: number | null;
    } | null;
  } | null;
  matriks: {
    kolomA: { namaStasiun: string; namaTitik: string };
    kolomB: { namaStasiun: string; namaTitik: string };
    baris: {
      kategori: string;
      a: IsiSel;
      b: IsiSel;
      permintaan: number | null;
      /** Kesenjangan per kategori belum diukur (hanya per stasiun x slot). */
      menahan: number | null;
    }[];
  } | null;
  jejak: { pipeline: string; dibuat: string; jenisHari: string } | null;
};

const Konteks = createContext<IsiInsight>({
  siap: false,
  error: null,
  sorotan: null,
  cakupan: null,
  peringkat: [],
  instrumen: null,
  profilSlot: [],
  sampelTipis: null,
  temuan: null,
  matriks: null,
  jejak: null,
});

/** Angka Insight. */
export function useInsight(): IsiInsight {
  return useContext(Konteks);
}

/** Batas atas skala yang enak dibaca - bulatkan ke atas ke setengah magnitudo. */
function niceCeil(v: number): number {
  if (v <= 0) return 1_000_000;
  const mag = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / (mag / 2)) * (mag / 2);
}

/** Ember status sel dari jumlah gerai terhadap ambang 3. */
function ember(gerai: number): IsiSel {
  if (gerai === 0) return "Kosong";
  if (gerai < 3) return "Kurang";
  return "Terisi";
}

/** RangeJt (p10/p90) -> Range FE (p50 = titik tengah; p50 sejati tak disimpan). */
function r3(rj: RangeJt): Range {
  return { p10: rj.p10, p50: Math.round((rj.p10 + rj.p90) / 2), p90: rj.p90 };
}

function demandShare(st: StasiunFigure, key: string): number | null {
  const total = st.kategori.reduce((s, k) => s + k.demandCount, 0);
  const k = st.kategori.find((c) => c.key === key);
  return total > 0 && k ? k.demandCount / total : null;
}

/** Dihitung sekali dari data statis - tidak bergantung fetch apa pun. */
const NILAI: IsiInsight = (() => {
  const manggarai = STASIUN.find((s) => s.id === 1)!;
  const sudirman = STASIUN.find((s) => s.id === 2)!;
  const urut = slotUrutGap();
  const teratas = urut[0];

  const sorotan = {
    namaStasiun: teratas.stasiun,
    namaTitik: `slot ${teratas.slot.slot}`,
    gap: r3(teratas.slot.gap),
    potensi: r3(teratas.slot.potensi),
    tertangkap: r3(teratas.slot.tertangkap),
    isiPersen: persenTertangkap(teratas.slot),
    capturePersen: persenTertangkap(teratas.slot),
  };

  const peringkat = urut.map(({ stasiun, slot }) => ({
    namaStasiun: stasiun,
    namaTitik: `slot ${slot.slot}`,
    gap: r3(slot.gap),
    potensi: r3(slot.potensi),
    tertangkap: r3(slot.tertangkap),
    capturePersen: persenTertangkap(slot),
    sampelTipis: slot.sampelTipis,
  }));

  // Instrumen: contoh nyata Manggarai sore (F=lewat depan gerai, E=masuk/lewat,
  // C asumsi 0,95, V acuan Rp25.000). Sumber entry-conversion lapangan.
  const instrumen = {
    F: 152,
    E: 0.2,
    C: 0.95,
    V: 25000,
    jam: "17.30",
    slotLabel: "Sore",
    namaTitik: "depan gerai",
    namaStasiun: "Manggarai",
  };

  // Profil slot: tiap slot terukur (Manggarai pagi/sore + Sudirman sore).
  const barisSlot = STASIUN.flatMap((st) =>
    st.slot.map((s) => ({
      label: `${st.nama} ${s.slot}`,
      jam: s.jam,
      nilai: tengah(s.gap),
    })),
  );
  const skala = niceCeil(Math.max(0, ...barisSlot.map((b) => b.nilai)));
  const profilSlot = barisSlot.map((b) => ({
    ...b,
    tinggi: (b.nilai / skala) * 100,
  }));

  // Semua slot memenuhi ambang gerai x blok tetapi skor kepercayaannya masih
  // rendah (0,15-0,50), jadi tak ada satu slot yang "gagal ambang" untuk
  // disorot spesifik - tampilkan pernyataan aturan umum (sampelTipis null).
  const sampelTipis = null;

  const jasaSudirman = sudirman.kategori.find((k) => k.key === "jasa")!;

  const temuan = {
    slotPuncak: { label: "Sore", nilai: tengah(teratas.slot.gap) },
    gapHarian: totalGap().p50,
    kategoriKosong: {
      label: jasaSudirman.label,
      demandShare: demandShare(sudirman, "jasa"),
    },
    arusTitik: sudirman.gerbang[0]?.total ?? null,
    pembanding: {
      namaTitik: "slot sore",
      namaStasiun: "Manggarai",
      arus: manggarai.gerbang[0]?.total ?? null,
      gap: tengah(manggarai.slot.find((s) => s.slot === "sore")!.gap),
    },
  };

  const matriks = {
    kolomA: { namaStasiun: "Manggarai", namaTitik: "kawasan 800 m" },
    kolomB: { namaStasiun: "Sudirman", namaTitik: "kawasan 800 m" },
    baris: manggarai.kategori.map((ka) => {
      const kb = sudirman.kategori.find((c) => c.key === ka.key)!;
      return {
        kategori: ka.label,
        a: ember(ka.geraiCount),
        b: ember(kb.geraiCount),
        permintaan: demandShare(manggarai, ka.key) ?? demandShare(sudirman, ka.key),
        menahan: null,
      };
    }),
  };

  return {
    siap: true,
    error: null,
    sorotan,
    cakupan: {
      simpulDiamati: 2,
      pintuDiamati: 15,
      strukTerbaca: 0,
      slot: 3,
      kategori: 5,
      pintuDitahan: 0,
    },
    peringkat,
    instrumen,
    profilSlot,
    sampelTipis,
    temuan,
    matriks,
    jejak: {
      pipeline: "survei-lapangan-1",
      dibuat: "2026-09-12",
      jenisHari: "hari kerja",
    },
  };
})();

export function InsightData({ children }: { children: ReactNode }) {
  return <Konteks.Provider value={NILAI}>{children}</Konteks.Provider>;
}
