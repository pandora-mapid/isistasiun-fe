"use client";

/**
 * Tiga angka yang melatarbelakangi proyek ini — SATU angka raksasa + dua
 * catatan tepi.
 *
 * Riwayat rupa: rel hairline (1–4) → kartu putih seragam (5) → baris 3 ubin
 * pastel (6) → tata "L" (7–9) → neraca garis-rambut (10). User menolak
 * semuanya sebagai "kotak/daftar berisi angka, tidak kreatif".
 *
 * Putaran 11 (riset "Wealth, shown to scale" + editorial-grid pull-quote):
 * angka yang KAMI ukur (`Rp 2,9 jt`) dicetak RAKSASA dan berdiri sendiri di
 * kolom kiri; dua fakta KAI yang cuma DIKUTIP (96% pendapatan tiket, 2,1%
 * ROA) mengecil jadi dua catatan kecil di kolom kanan, di bawah judul.
 * Argumen jadi terlihat tanpa satu kata pun: yang kami ukur mendominasi yang
 * cuma dikutip.
 *
 * Dipecah dua ekspor — `RelStatistikAngka` (kolom kiri) & `RelStatistikKutipan`
 * (kolom kanan, di bawah `KepalaBab`) — supaya `page.tsx` bisa menata keduanya
 * di sisi berlawanan tanpa satu kolom melompong kosong.
 *
 * Pembeda "milik kami" lewat UKURAN, bukan warna — angka kutipan tetap tinta,
 * bukan biru (pelajaran lama: satu angka biru di antara angka tinta terbaca
 * sebagai galat visual & mengencerkan biru yang dicadangkan untuk data peta).
 *
 * Semua angka & string sumber dipetik, tidak dihitung.
 */

import { rupiahRingkas } from "@/lib/format";
import { useBeranda } from "./BerandaData";

type Kutipan = { nilai: string; keterangan: string; sumber: string };

const KUTIPAN: Kutipan[] = [
  {
    nilai: "96%",
    keterangan:
      "pendapatan KAI berasal dari operasi kereta — hanya 4% datang dari luar tiket",
    sumber: "pernyataan Direktur Utama, Juli 2026",
  },
  {
    nilai: "2,1%",
    keterangan:
      "return on asset terhadap target 6%; aset 327,82 juta m² dinyatakan masih underleverage",
    sumber: "laporan kinerja",
  },
];

/** Kolom kiri Section 1 — angka yang KAMI ukur, raksasa, berdiri sendiri. */
export function RelStatistikAngka() {
  const { sorotan } = useBeranda();

  const angka = sorotan ? rupiahRingkas(sorotan.metric.gap.p50) : "—";
  const keterangan = sorotan
    ? `median kesenjangan belanja harian di ${sorotan.namaTitik}, ${sorotan.namaStasiun} — pintu terbesar yang kami cacah`
    : "median kesenjangan belanja harian pada pintu terbesar yang kami cacah";

  return (
    <div>
      <div
        className="fig"
        style={{
          font: "400 clamp(52px, 9vw, 116px)/0.92 var(--font-mono), ui-monospace, monospace",
          letterSpacing: "-0.04em",
          color: "var(--ink)",
          whiteSpace: "nowrap",
        }}
      >
        {angka}
      </div>
      <p
        style={{
          margin: "var(--s3) 0 0",
          fontSize: "var(--t-small)",
          lineHeight: 1.55,
          color: "var(--ink-2)",
          maxWidth: "40ch",
        }}
      >
        {keterangan}
      </p>
      <div
        className="row eyebrow"
        style={{ gap: 6, marginTop: 10, color: "var(--data)" }}
      >
        <span className="dot" style={{ background: "var(--data)" }} />
        <span>Kami ukur · pencacahan sendiri · rentang P10–P90</span>
      </div>
    </div>
  );
}

/** Kolom kanan Section 1 — dua fakta KAI yang cuma DIKUTIP, kecil, di bawah
 *  judul. */
export function RelStatistikKutipan() {
  return (
    <div>
      {KUTIPAN.map((k, i) => (
        <div
          key={k.nilai}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: "var(--s3)",
            alignItems: "baseline",
            padding: "var(--s3) 0",
            // Baris pertama: garis-rambut KepalaBab di atasnya sudah jadi batas.
            borderTop: i === 0 ? undefined : "1px solid var(--rule)",
            borderBottom:
              i === KUTIPAN.length - 1 ? "1px solid var(--rule)" : undefined,
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: "var(--t-small)",
                lineHeight: 1.55,
                color: "var(--ink-2)",
              }}
            >
              {k.keterangan}
            </p>
            <div
              className="eyebrow"
              style={{ marginTop: 6, color: "var(--ink-faint)" }}
            >
              Dikutip · {k.sumber}
            </div>
          </div>
          <div
            className="fig"
            style={{
              fontSize: "clamp(20px, 2.2vw, 28px)",
              letterSpacing: "-0.02em",
              color: "var(--ink-2)",
              whiteSpace: "nowrap",
            }}
          >
            {k.nilai}
          </div>
        </div>
      ))}
    </div>
  );
}
