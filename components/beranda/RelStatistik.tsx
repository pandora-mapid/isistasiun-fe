"use client";

/**
 * Tiga angka yang melatarbelakangi proyek ini, sebagai satu rel mendatar.
 *
 * Dua perubahan terhadap versi lama, dan keduanya bukan soal rupa:
 *
 * 1. **Angka ketiga tidak lagi dikarang.** Dulu tertulis "Rp 6.000.000 …yang
 *    kami ukur di tiga simpul", padahal payload tidak pernah menyediakan angka
 *    setingkat kawasan; menjumlahkannya sendiri berarti melahirkan angka yang
 *    tak bisa dilacak. Yang ditampilkan sekarang satu nilai yang benar-benar
 *    ada: median kesenjangan pada pintu terbesar.
 * 2. **Angka yang DIKUTIP dan angka yang KAMI UKUR dibedakan — tapi bukan
 *    lewat warna pada angka besarnya.** Percobaan pertama mewarnai angka
 *    ketiga biru, karena biru di seluruh aplikasi ini berarti "data kami".
 *    Hasilnya justru terbalik: satu angka mono 60px biru solid duduk di
 *    antara dua angka tinta terbaca sebagai galat visual, bukan sinyal — dan
 *    mengencerkan biru sebagai aksen yang seharusnya jarang & istimewa
 *    (peta hero, band persamaan). Ketiga angka sekarang seragam tinta;
 *    pembeda "kami ukur" hidup di label kecil di bawahnya, dengan satu titik
 *    biru (`.dot`, konvensi yang sama dipakai legenda `/peta`) sebagai
 *    penanda ringkas — bukan warna besar yang bertabrakan.
 */

import { rupiahRingkas } from "@/lib/format";
import { useBeranda } from "./BerandaData";

type Butir = {
  nilai: string;
  keterangan: string;
  sumber: string;
  milikKami?: boolean;
};

export function RelStatistik() {
  const { sorotan } = useBeranda();

  const butir: Butir[] = [
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
    {
      nilai: sorotan ? rupiahRingkas(sorotan.metric.gap.p50) : "—",
      keterangan: sorotan
        ? `median kesenjangan belanja harian di ${sorotan.namaTitik}, ${sorotan.namaStasiun} — pintu terbesar yang kami cacah`
        : "median kesenjangan belanja harian pada pintu terbesar yang kami cacah",
      sumber: "pencacahan sendiri · rentang P10–P90",
      milikKami: true,
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "var(--s4)",
      }}
    >
      {butir.map((b, i) => (
        <div
          key={b.nilai + i}
          style={{
            paddingLeft: i === 0 ? 0 : "var(--s4)",
            borderLeft: i === 0 ? undefined : "1px solid var(--rule)",
          }}
        >
          <div
            className="fig"
            style={{
              font: `400 clamp(34px, 4.2vw, 60px)/1 var(--font-mono), ui-monospace, monospace`,
              letterSpacing: "-0.045em",
              color: "var(--ink)",
              whiteSpace: "nowrap",
            }}
          >
            {b.nilai}
          </div>
          <p
            style={{
              margin: "var(--s3) 0 var(--s2)",
              fontSize: "var(--t-small)",
              lineHeight: 1.6,
              color: "var(--ink-2)",
              maxWidth: "34ch",
            }}
          >
            {b.keterangan}
          </p>
          <div
            className="row eyebrow"
            style={{
              gap: 6,
              color: b.milikKami ? "var(--data)" : "var(--ink-faint)",
            }}
          >
            {b.milikKami && (
              <span className="dot" style={{ background: "var(--data)" }} />
            )}
            <span>
              {b.milikKami ? "Kami ukur" : "Dikutip"} · {b.sumber}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
