"use client";

/**
 * Strip "Ringkasan simpul" — dua simpul berdampingan, satu skala rupiah
 * bersama, plus satu baris pembacaan selisihnya.
 *
 * Ini wajah tampil dari tugas "ringkasan & perbandingan antarsimpul": naik
 * satu tingkat dari panel per-pintu ke potret per-kawasan, menjawab
 * pertanyaan Persona 2 (pengusaha) — "buka toko di simpul mana".
 *
 * Kenapa memuat datanya sendiri, bukan lewat `InsightData`: sumbernya berkas
 * lain (`station-summary.json` = `GET /analytics/station-summary`), dimuat
 * sekali di sini saja. Aturan "satu provider" di `InsightData` soal tidak
 * menghitung angka di JSX dan tidak memuat sumber yang sama dua kali — bukan
 * larangan menambah sumber baru. Tidak ada angka yang dihitung di sini
 * kecuali posisi piksel di dalam batang; rasio (`gapRatio`, selisih capture)
 * datang dari `lib/analytics/summary.ts`, sama seperti `capturePersen` di
 * Insight.
 */

import { useEffect, useState } from "react";

import {
  bandingkanSimpul,
  kategoriHilang,
  ringkasanSimpul,
  type BandingSimpul,
} from "@/lib/analytics/summary";
import { categoryLabel } from "@/lib/data/dimensions";
import { loadStationSummary } from "@/lib/data/source";
import type { StationSummaryRow } from "@/lib/data/types";
import { persen, ribuan, rupiahRingkas } from "@/lib/format";

/** Batas atas skala yang enak dibaca: bulatkan ke atas ke setengah magnitudo. */
function niceCeil(v: number): number {
  if (v <= 0) return 1_000_000;
  const mag = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / (mag / 2)) * (mag / 2);
}

function tipologi(teks: string): string {
  return teks.charAt(0).toUpperCase() + teks.slice(1);
}

type Isi = { baris: StationSummaryRow[]; banding: BandingSimpul | null };

export function RingkasanSimpul() {
  const [isi, setIsi] = useState<Isi | null>(null);
  const [gagal, setGagal] = useState(false);

  useEffect(() => {
    let batal = false;
    loadStationSummary()
      .then((payload) => {
        if (batal) return;
        const baris = ringkasanSimpul(payload);
        setIsi({
          baris,
          banding:
            baris.length >= 2 ? bandingkanSimpul(baris[0], baris[1]) : null,
        });
      })
      .catch(() => !batal && setGagal(true));
    return () => {
      batal = true;
    };
  }, []);

  if (gagal) return null;

  const baris = isi?.baris ?? [];
  const maxP90 = baris.length
    ? niceCeil(Math.max(...baris.map((s) => s.gap.p90 ?? 0)))
    : 1_000_000;

  return (
    <div
      className="runtuh-1"
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
        gap: "var(--s2)",
        alignItems: "start",
      }}
    >
      {(baris.length ? baris : [null, null]).map((row, i) => (
        <KartuSimpul
          key={row?.station_id ?? i}
          row={row}
          max={maxP90}
          tint={i === 0 ? "var(--tile-sky)" : "var(--tile-mint)"}
        />
      ))}

      <div
        style={{
          gridColumn: "1 / -1",
          background: "var(--data-wash)",
          borderRadius: "var(--r-md)",
          padding: "var(--s3)",
        }}
      >
        <div className="eyebrow" style={{ marginBottom: "var(--s2)" }}>
          Selisihnya
        </div>
        <BacaBanding banding={isi?.banding ?? null} />
      </div>
    </div>
  );
}

function KartuSimpul({
  row,
  max,
  tint,
}: {
  row: StationSummaryRow | null;
  max: number;
  tint: string;
}) {
  if (!row) {
    return (
      <div
        aria-hidden
        className="kartu"
        style={{ height: 230, background: "var(--paper-2)" }}
      />
    );
  }

  const { gap } = row;
  const pos = (v: number | null) => (v === null ? 0 : (v / max) * 100);
  const terhitung = gap.p10 !== null && gap.p50 !== null && gap.p90 !== null;
  const hilang = kategoriHilang(row);
  const e = row.peak?.variables?.E ?? null;
  const f = row.peak?.variables?.F ?? null;

  return (
    <div className="kartu" style={{ padding: "var(--s3)", background: tint }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "var(--s2)" }}>
        <span style={{ fontSize: "var(--t-body)", fontWeight: 700 }}>
          {row.station_name}
        </span>
        <span className="eyebrow">{tipologi(row.typology)}</span>
      </div>

      <div
        className="fig"
        style={{
          font: "400 clamp(22px, 2.6vw, 30px)/1 var(--font-mono), ui-monospace, monospace",
          letterSpacing: "-0.02em",
          color: terhitung ? "var(--ink)" : "var(--ink-faint)",
          margin: "var(--s2) 0 0",
        }}
      >
        {terhitung ? rupiahRingkas(gap.p50) : "tidak diestimasi"}
        <span style={{ fontSize: "var(--t-small)", color: "var(--ink-faint)" }}>
          {" "}
          / hari
        </span>
      </div>

      {/* Batang rentang P10–P90, skala 0..max identik di kedua kartu. */}
      <div style={{ position: "relative", height: 12, marginTop: "var(--s2)" }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "50%",
            height: 1,
            background: "var(--rule-strong)",
          }}
        />
        {terhitung && (
          <>
            <div
              style={{
                position: "absolute",
                top: "50%",
                transform: "translateY(-50%)",
                left: `${pos(gap.p10)}%`,
                width: `${pos(gap.p90) - pos(gap.p10)}%`,
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
                left: `${pos(gap.p50)}%`,
                width: 3,
                background: "var(--data)",
              }}
            />
          </>
        )}
      </div>
      <div
        className="fig"
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 5,
          fontSize: "var(--t-micro)",
          color: "var(--ink-faint)",
        }}
      >
        <span>Rp 0</span>
        <span>rentang P10–P90</span>
        <span>{rupiahRingkas(max)}</span>
      </div>

      <div
        className="runtuh-2"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "var(--s2)",
          marginTop: "var(--s3)",
          paddingTop: "var(--s2)",
          borderTop: "1px solid var(--rule)",
        }}
      >
        <Sel label="Porsi tertangkap" nilai={row.capture_rate === null ? "—" : `${Math.round(row.capture_rate * 100)}%`} />
        <Sel label="Potensi / hari" nilai={rupiahRingkas(row.potensi.p50)} />
        <Sel label="Tertangkap" nilai={rupiahRingkas(row.tertangkap.p50)} />
      </div>

      <div
        style={{
          marginTop: "var(--s3)",
          paddingTop: "var(--s2)",
          borderTop: "1px solid var(--rule)",
          fontSize: "var(--t-small)",
          lineHeight: 1.5,
          color: "var(--ink-2)",
        }}
      >
        Titik puncak <strong>{row.peak?.point_label ?? "—"}</strong> — arus{" "}
        <span className="fig" style={{ color: "var(--data)" }}>
          {f === null ? "—" : ribuan(f)}
        </span>{" "}
        org/jam, masuk gerai{" "}
        <span className="fig" style={{ color: "var(--data)" }}>
          {persen(e)}
        </span>
        .
      </div>

      <div
        style={{
          marginTop: "var(--s2)",
          fontSize: "var(--t-small)",
          lineHeight: 1.5,
          color: "var(--ink-muted)",
        }}
      >
        {hilang.length
          ? `Kategori hilang: ${hilang.map((c) => categoryLabel(c.category)).join(", ")}.`
          : "Setiap kategori sudah punya cukup gerai."}
      </div>

      <div
        className="fig"
        style={{
          marginTop: "var(--s2)",
          paddingTop: "var(--s2)",
          borderTop: "1px solid var(--rule)",
          fontSize: "var(--t-micro)",
          color: "var(--ink-faint)",
        }}
      >
        {row.pintu_dicacah} titik pengamatan
        {row.pintu_ditahan > 0 ? ` · ${row.pintu_ditahan} ditahan` : ""} ·{" "}
        {ribuan(row.struk_terbaca)} struk · simulasi setingkat simpul
      </div>
    </div>
  );
}

function Sel({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div>
      <div
        className="fig"
        style={{ fontSize: "clamp(14px, 1.6vw, 17px)", color: "var(--ink)" }}
      >
        {nilai}
      </div>
      <div className="eyebrow" style={{ fontSize: 9, marginTop: 4 }}>
        {label}
      </div>
    </div>
  );
}

function BacaBanding({ banding }: { banding: BandingSimpul | null }) {
  if (!banding) {
    return (
      <p style={{ margin: 0, fontSize: "var(--t-small)", color: "var(--ink-muted)" }}>
        Memuat perbandingan…
      </p>
    );
  }

  const { a, b, gapRatio, captureRateSelisih, entryRatio, hilangBersama } = banding;
  const kali =
    gapRatio === null
      ? null
      : new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(
          gapRatio,
        );

  return (
    <ul
      style={{
        margin: 0,
        paddingLeft: "1.1em",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        fontSize: "var(--t-small)",
        lineHeight: 1.5,
        color: "var(--ink-2)",
      }}
    >
      {kali && (
        <li>
          Kesenjangan harian <strong>{a.station_name}</strong> sekitar{" "}
          <span className="fig" style={{ color: "var(--data)", fontWeight: 700 }}>
            {kali}×
          </span>{" "}
          <strong>{b.station_name}</strong> —{" "}
          {rupiahRingkas(a.gap.p50)} lawan {rupiahRingkas(b.gap.p50)}.
        </li>
      )}
      {captureRateSelisih !== null && (
        <li>
          Porsi tertangkap{" "}
          {Math.abs(captureRateSelisih) < 2
            ? "praktis sama"
            : `beda ${Math.abs(Math.round(captureRateSelisih))} poin`}{" "}
          (~{Math.round((a.capture_rate ?? 0) * 100)}% vs ~
          {Math.round((b.capture_rate ?? 0) * 100)}%) — yang membedakan bukan
          efisiensi gerai, tapi skala arus dan entry ratio.
        </li>
      )}
      {entryRatio.a !== null && entryRatio.b !== null && (
        <li>
          Dari tiap 100 orang lewat titik puncak,{" "}
          <span className="fig" style={{ color: "var(--data)" }}>
            {Math.round(entryRatio.a * 100)}
          </span>{" "}
          masuk gerai di {a.station_name},{" "}
          <span className="fig" style={{ color: "var(--data)" }}>
            {Math.round(entryRatio.b * 100)}
          </span>{" "}
          di {b.station_name}.
        </li>
      )}
      {hilangBersama.length > 0 && (
        <li>
          <span className="fig" style={{ color: "var(--data)" }}>
            {hilangBersama.length}
          </span>{" "}
          kategori — {hilangBersama.map((c) => categoryLabel(c)).join(", ")} —
          permintaannya terbaca di kedua simpul tapi gerainya belum ada di
          mana pun.
        </li>
      )}
    </ul>
  );
}
