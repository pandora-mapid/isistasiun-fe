"use client";

/**
 * Tiga angka yang melatarbelakangi proyek ini - SATU angka raksasa + dua
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
 * Dipecah dua ekspor - `RelStatistikAngka` (kolom kiri) & `RelStatistikKutipan`
 * (kolom kanan, di bawah `KepalaBab`) - supaya `page.tsx` bisa menata keduanya
 * di sisi berlawanan tanpa satu kolom melompong kosong.
 *
 * Pembeda "milik kami" lewat UKURAN, bukan warna - angka kutipan tetap tinta,
 * bukan biru (pelajaran lama: satu angka biru di antara angka tinta terbaca
 * sebagai galat visual & mengencerkan biru yang dicadangkan untuk data peta).
 *
 * Semua angka & string sumber dipetik, tidak dihitung.
 */

import { rupiahRingkas } from "@/lib/format";
import { totalGap } from "@/lib/data/real-figures";

type Kutipan = { nilai: string; keterangan: string; sumber: string };

const KUTIPAN: Kutipan[] = [
  {
    nilai: "96%",
    keterangan:
      "pendapatan KAI berasal dari operasi kereta, hanya 4% datang dari luar tiket",
    sumber: "pernyataan Direktur Utama, Juli 2026",
  },
  {
    nilai: "2,1%",
    keterangan:
      "return on asset terhadap target 6%; aset 327,82 juta m² dinyatakan masih underleverage",
    sumber: "laporan kinerja",
  },
];

/** Kolom kiri Section 1 - angka yang KAMI ukur, raksasa, berdiri sendiri.
 *
 * Seluruh isi duduk di satu kotak `width: max-content` yang lebarnya DIIKAT ke
 * angka raksasa (`nowrap`). Semua elemen lain lebih pendek dari itu, jadi
 * mereka pas di dalamnya - kecuali keterangan, yang dibungkus `width: 0;
 * min-width: 100%` supaya mengalir selebar angka TANPA memaksa kotak melebar
 * mengikuti teksnya sendiri.
 *
 * Angka mentah tidak berkepala/berkaki apa pun tadinya - terasa kosong. Kini
 * dibingkai: label + garis-rambut di ATAS (menamai apa angkanya), dan batang
 * rentang P10–P90 dengan penanda median di posisi sebenarnya di BAWAH
 * (memvisualkan "rentang P10–P90" yang dulu cuma ditulis di eyebrow). Kalau
 * sampel tipis dan rentangnya tak terbaca, batang jatuh ke garis-rambut polos.
 */
export function RelStatistikAngka() {
  const gap = totalGap();
  const angka = rupiahRingkas(gap.p50);
  const keterangan =
    "median kesenjangan belanja harian dua simpul yang kami cacah, Manggarai dan Sudirman, dijumlah atas slot terukur. Angkanya masih estimasi awal karena sampel tipis";

  const posisi =
    gap.p90 > gap.p10 ? (gap.p50 - gap.p10) / (gap.p90 - gap.p10) : null;

  return (
    <div style={{ width: "max-content", maxWidth: "100%" }}>
      {/* Hiasan ATAS - label kicker + garis-rambut mengisi sisa lebar angka.
          Jarak ke angka sengaja lega (`--s4`) - angka setinggi ~116px butuh
          ruang napas, bukan garis yang menempel. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--s2)",
          marginBottom: "var(--s4)",
        }}
      >
        <span className="eyebrow boleh-patah-kecil" style={{ whiteSpace: "nowrap" }}>
          Kesenjangan belanja · per hari kerja
        </span>
        <span style={{ flex: 1, height: 1, background: "var(--rule)" }} />
      </div>

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

      {/* Hiasan BAWAH - batang rentang P10–P90, penanda median di posisi asli.
          Jarak ke angka selega hiasan atas (`--s4`). */}
      {posisi !== null && gap ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--s2)",
            marginTop: "var(--s4)",
          }}
        >
          <span
            className="fig"
            style={{
              fontSize: "var(--t-micro)",
              color: "var(--ink-faint)",
              whiteSpace: "nowrap",
            }}
          >
            {rupiahRingkas(gap.p10)}
          </span>
          <span style={{ position: "relative", flex: 1, height: 8 }}>
            <span
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 3,
                height: 2,
                background: "var(--rule)",
              }}
            />
            <span
              style={{
                position: "absolute",
                left: `${(posisi * 100).toFixed(1)}%`,
                top: 0,
                width: 2,
                height: 8,
                background: "var(--data)",
                transform: "translateX(-50%)",
              }}
            />
          </span>
          <span
            className="fig"
            style={{
              fontSize: "var(--t-micro)",
              color: "var(--ink-faint)",
              whiteSpace: "nowrap",
            }}
          >
            {rupiahRingkas(gap.p90)}
          </span>
        </div>
      ) : (
        <div
          style={{ marginTop: "var(--s4)", height: 1, background: "var(--rule)" }}
        />
      )}

      {/* `width: 0; min-width: 100%` - <p> mengalir selebar kotak (= lebar
          angka) tanpa ikut memaksa kotak melebar. */}
      <div style={{ width: 0, minWidth: "100%" }}>
        <p
          style={{
            margin: "var(--s3) 0 0",
            fontSize: "var(--t-small)",
            lineHeight: 1.55,
            color: "var(--ink-2)",
          }}
        >
          {keterangan}
        </p>
      </div>

      <div
        className="row eyebrow"
        style={{ gap: 6, marginTop: 10, color: "var(--data)" }}
      >
        <span className="dot" style={{ background: "var(--data)" }} />
        <span>Kami ukur · pencacahan sendiri</span>
      </div>
    </div>
  );
}

/** Kolom kanan Section 1 - dua fakta KAI yang cuma DIKUTIP, kecil, di bawah
 *  judul. */
export function RelStatistikKutipan() {
  return (
    <div
      style={{
        // `KepalaBab` menaruh `marginBottom: var(--s4)` di bawah garis-
        // rambutnya untuk menjauhkan isi section. Di sini garis-rambut itu
        // SEKALIGUS batas atas baris kutipan pertama (lihat `borderTop:
        // undefined` di bawah), jadi jaraknya ke teks harus sama dengan
        // antar-baris - `var(--s3)` saja, bukan `var(--s4)` + `var(--s3)`.
        // Tarik balik marginnya.
        marginTop: "calc(var(--s4) * -1)",
      }}
    >
      {KUTIPAN.map((k, i) => (
        <div
          key={k.nilai}
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) auto",
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
