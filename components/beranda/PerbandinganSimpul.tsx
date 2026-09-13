"use client";

/**
 * Tiga simpul — tiga kartu staggered, satu skala rupiah bersama (small
 * multiples).
 *
 * Riwayat: putaran 5–8 tiga kartu berdampingan (ditolak: "kotak seragam");
 * putaran 10 satu grafik sumbu polos (ditolak: "sampah, tidak kreatif").
 *
 * Putaran 11 (riset PolicyViz small-multiples + SAP staggered layout): tetap
 * tiga kartu, TAPI (a) tinggi awal berbeda-beda — komposisi, bukan baris rata;
 * (b) tiap kartu = satu batang rentang mini dengan skala IDENTIK (`min = 0`,
 * `max` yang sama), endpoint `Rp 0` / `Rp {max}` dicetak di tiap kartu, jadi
 * ketiganya benar-benar bisa dibandingkan sekilas walau tidak sejajar piksel;
 * (c) kartu keluarga `.kartu` — satu sudut tajam, garis-rambut, tanpa bayangan.
 *
 * Semua angka dipetik dari `useBeranda()` — yang dihitung hanya posisi piksel
 * di dalam batang. Sumbu dijangkar di 0, batas atas dibulatkan ke atas.
 */

import Link from "next/link";
import type { CSSProperties } from "react";

import { rentangRingkas, rupiahRingkas } from "@/lib/format";
import { useBeranda } from "./BerandaData";
import type { SimpulRingkas } from "./BerandaData";

/** Tipologi datang huruf kecil dari data; hanya huruf pertamanya dinaikkan. */
function tipologi(teks: string): string {
  return teks.charAt(0).toUpperCase() + teks.slice(1);
}

/** Batas atas skala yang enak dibaca: bulatkan ke atas ke setengah magnitudo. */
function niceCeil(v: number): number {
  if (v <= 0) return 1_000_000;
  const mag = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / (mag / 2)) * (mag / 2);
}

/**
 * P10/P50/P90 kalau — dan hanya kalau — ketiganya benar-benar diestimasi dan
 * bukan sampel tipis. `null` berarti "gambar garis putus".
 */
function rentangTerbaca(
  simpul: SimpulRingkas,
): { p10: number; p50: number; p90: number } | null {
  const m = simpul.metric;
  if (!m || m.sampelTipis) return null;
  const { p10, p50, p90 } = m.gap;
  if (p10 === null || p50 === null || p90 === null) return null;
  return { p10, p50, p90 };
}

/** Geseran tinggi awal per posisi kartu — bikin baris terasa dikomposisi. */
const STAGGER = ["0", "var(--s5)", "var(--s3)"];

function KartuSimpul({
  simpul,
  max,
  geser,
}: {
  simpul: SimpulRingkas;
  max: number;
  geser: string;
}) {
  const { station, namaTitik } = simpul;
  const r = rentangTerbaca(simpul);
  const pos = (v: number) => (v / max) * 100;

  return (
    <Link
      href="/peta"
      className="kartu"
      style={{
        display: "block",
        padding: "var(--s4) var(--s3)",
        marginTop: geser,
        color: "inherit",
        textDecoration: "none",
      }}
    >
      <div style={{ fontSize: "var(--t-body)", fontWeight: 700 }}>
        {station.name}
      </div>
      <div className="eyebrow">{tipologi(station.typology)}</div>
      <div
        style={{
          marginTop: 6,
          fontSize: "var(--t-micro)",
          color: "var(--ink-muted)",
        }}
      >
        titik terbesar · {namaTitik}
      </div>

      {/* Batang rentang — skala 0..max identik di ketiga kartu. */}
      <div
        style={{ position: "relative", height: 12, marginTop: "var(--s3)" }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "50%",
            height: 1,
            background: "var(--rule)",
          }}
        />
        {r ? (
          <>
            <div
              style={{
                position: "absolute",
                top: "50%",
                transform: "translateY(-50%)",
                left: `${pos(r.p10)}%`,
                width: `${pos(r.p90) - pos(r.p10)}%`,
                height: 8,
                borderRadius: 4,
                background: "var(--data-soft)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${pos(r.p50)}%`,
                width: 3,
                background: "var(--data)",
              }}
            />
          </>
        ) : (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "50%",
              transform: "translateY(-50%)",
              borderTop: "1.5px dashed var(--rule-strong)",
            }}
          />
        )}
      </div>
      <div
        className="fig"
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 6,
          fontSize: "var(--t-micro)",
          color: "var(--ink-faint)",
        }}
      >
        <span>Rp 0</span>
        <span>{rupiahRingkas(max)}</span>
      </div>

      <div
        className="fig"
        style={{
          marginTop: "var(--s3)",
          fontSize: "var(--t-small)",
          fontWeight: 700,
          color: r ? "var(--ink)" : "var(--ink-faint)",
        }}
      >
        {r ? rentangRingkas(simpul.metric?.gap) : "tidak diestimasi"}
      </div>
    </Link>
  );
}

const GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "var(--s3)",
  alignItems: "start",
};

export function PerbandinganSimpul() {
  const { simpul, siap } = useBeranda();

  if (!siap) {
    return (
      <div className="runtuh-1" style={GRID}>
        {STAGGER.map((geser, i) => (
          <div
            key={i}
            aria-hidden
            className="kartu"
            style={{
              height: 190,
              marginTop: geser,
              background: "var(--paper-2)",
            }}
          />
        ))}
      </div>
    );
  }

  const atas: number[] = [];
  for (const s of simpul) {
    const r = rentangTerbaca(s);
    if (r) atas.push(r.p90);
  }
  const max = atas.length ? niceCeil(Math.max(...atas)) : 1_000_000;

  const baris = [...simpul].sort(
    (a, b) => (b.metric?.gap.p50 ?? -1) - (a.metric?.gap.p50 ?? -1),
  );

  return (
    <div className="runtuh-1" style={GRID}>
      {baris.map((s, i) => (
        <KartuSimpul
          key={s.station.id}
          simpul={s}
          max={max}
          geser={STAGGER[i] ?? "0"}
        />
      ))}
    </div>
  );
}
