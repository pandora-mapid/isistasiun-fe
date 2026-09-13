"use client";

/**
 * Overlay "Ringkasan & Bandingkan Simpul" — dua kolom di atas `/peta`.
 *
 * **Ini BUKAN dialog "Bandingkan" yang sudah ada.** Keduanya hidup
 * berdampingan dengan sengaja, dan namanya memang dibedakan supaya tidak
 * tertukar:
 *
 * | | "Bandingkan" (`ComparisonDialog`) | "Ringkasan & Bandingkan Simpul" (berkas ini) |
 * |---|---|---|
 * | Sumber angka | `demo-select.ts` — MENJUMLAH p50 titik pada slot × kategori aktif | `station-summary.json` — rollup Monte Carlo setingkat simpul |
 * | Rentang | tidak ada, cuma p50 | P10–P90 penuh |
 * | Ikut filter peta | ya | **tidak** — angka simpul tidak bergantung slot/kategori yang sedang dilihat |
 * | Stempel `basis` | tidak ada | ada, ditampilkan |
 *
 * Angka keduanya untuk pasangan stasiun yang sama memang akan berbeda. Itu dua
 * hitungan yang berbeda, bukan bug — lihat catatan panjang di
 * `lib/analytics/summary.ts`. Jangan menyatukan keduanya, dan jangan mengganti
 * isi `ComparisonDialog` dengan `bandingkanSimpul()`: dialog itu sudah dikunci
 * tesnya sendiri.
 *
 * Tidak ada angka yang dihitung di JSX ini. Seluruh rasio (`gapRatio`, selisih
 * capture, entry ratio, arus) datang jadi dari `bandingkanSimpul()`.
 */

import { useEffect, useRef, useState } from "react";

import {
  bandingkanSimpul,
  kategoriHilang,
  ringkasanSimpul,
  type BandingSimpul,
} from "@/lib/analytics/summary";
import { categoryLabel, slotLabel } from "@/lib/data/dimensions";
import { loadStationSummary } from "@/lib/data/source";
import type { StationSummaryRow } from "@/lib/data/types";
import { desimal, persen, rentangRingkas, ribuan } from "@/lib/format";

const BASIS_LABEL: Record<StationSummaryRow["basis"], string> = {
  "monte-carlo-simpul": "simulasi Monte Carlo setingkat simpul",
  "agregat-titik": "agregat titik (sementara, bukan simulasi)",
};

function Baris({
  label,
  children,
  kuat,
}: {
  label: string;
  children: React.ReactNode;
  kuat?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 12,
        padding: "6px 0",
        borderTop: "1px solid var(--rule)",
      }}
    >
      <span style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>{label}</span>
      <span
        className="fig"
        style={{
          fontSize: kuat ? 13.5 : 12,
          fontWeight: kuat ? 600 : 400,
          textAlign: "right",
        }}
      >
        {children}
      </span>
    </div>
  );
}

function KolomSimpul({ row }: { row: StationSummaryRow }) {
  const hilang = kategoriHilang(row);

  return (
    <article style={{ minWidth: 0 }}>
      <div style={{ fontSize: 14.5, fontWeight: 600 }}>{row.station_name}</div>
      <div style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 2 }}>
        {row.typology} · {row.pintu_dicacah} pintu dicacah
        {row.pintu_ditahan > 0 ? `, ${row.pintu_ditahan} ditahan` : ""}
      </div>

      <div style={{ marginTop: 12 }}>
        <Baris label="Kesenjangan (P10–P90)" kuat>
          {rentangRingkas(row.gap)}
        </Baris>
        <Baris label="Potensi">{rentangRingkas(row.potensi)}</Baris>
        <Baris label="Tertangkap">{rentangRingkas(row.tertangkap)}</Baris>
        <Baris label="Porsi tertangkap">{persen(row.capture_rate)}</Baris>
        <Baris label="Kepercayaan">
          {row.confidence
            ? `${desimal(row.confidence.min)} – ${desimal(row.confidence.max)}`
            : "—"}
        </Baris>
        <Baris label="Struk terbaca">{ribuan(row.struk_terbaca)}</Baris>
        <Baris label="Titik puncak">
          {row.peak ? `${row.peak.point_label} · ${slotLabel(row.peak.slot)}` : "—"}
        </Baris>
        <Baris label="Kesenjangan titik puncak">
          {row.peak ? rentangRingkas(row.peak.gap) : "—"}
        </Baris>
      </div>

      <div style={{ marginTop: 12 }}>
        <div className="k" style={{ marginBottom: 6 }}>Kategori hilang</div>
        {hilang.length === 0 ? (
          <div style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>Tidak ada</div>
        ) : (
          <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
            {hilang.map((c) => (
              <span
                key={c.category}
                style={{
                  fontSize: 11,
                  padding: "3px 8px",
                  borderRadius: 999,
                  background: "var(--field-wash, rgba(180,95,51,.10))",
                  color: "var(--ink-2)",
                  whiteSpace: "nowrap",
                }}
              >
                {categoryLabel(c.category)} · {persen(c.demand_share, 0)} · {c.gerai_count} gerai
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function Pembacaan({ banding }: { banding: BandingSimpul }) {
  const { a, b, gapRatio, captureRateSelisih, entryRatio, arus, hilangBersama } = banding;

  return (
    <div
      style={{
        marginTop: 16,
        paddingTop: 14,
        borderTop: "1px solid var(--rule-strong, var(--rule))",
        display: "grid",
        gap: 8,
        fontSize: 12,
        lineHeight: 1.55,
      }}
    >
      <div className="k">Pembacaan selisih</div>

      <div>
        Kesenjangan {a.station_name}{" "}
        <strong className="fig">
          {gapRatio === null ? "—" : `${desimal(gapRatio, 1)}×`}
        </strong>{" "}
        kesenjangan {b.station_name}.
      </div>

      <div>
        Porsi tertangkap {a.station_name} berbeda{" "}
        <strong className="fig">
          {captureRateSelisih === null
            ? "—"
            : `${captureRateSelisih > 0 ? "+" : ""}${desimal(captureRateSelisih, 1)} poin persen`}
        </strong>{" "}
        dari {b.station_name}.
      </div>

      <div>
        Rasio masuk di titik puncak —{" "}
        <span className="fig">{persen(entryRatio.a)}</span> ({a.station_name}) vs{" "}
        <span className="fig">{persen(entryRatio.b)}</span> ({b.station_name}).
        Makin tinggi, makin banyak orang yang benar-benar singgah alih-alih
        sekadar lewat.
      </div>

      <div>
        Arus titik puncak —{" "}
        <span className="fig">{arus.a === null ? "—" : `${ribuan(arus.a)} org/jam`}</span>{" "}
        ({a.station_name}) vs{" "}
        <span className="fig">{arus.b === null ? "—" : `${ribuan(arus.b)} org/jam`}</span>{" "}
        ({b.station_name}).
      </div>

      <div>
        Kategori yang hilang di <em>kedua</em> simpul:{" "}
        <strong>
          {hilangBersama.length
            ? hilangBersama.map(categoryLabel).join(", ")
            : "tidak ada"}
        </strong>
        . Yang hilang di dua-duanya adalah peluang yang tidak bergantung pilihan
        lokasi.
      </div>
    </div>
  );
}

type Isi = { baris: StationSummaryRow[]; banding: BandingSimpul | null };

export function BandingSimpulOverlay({ onClose }: { onClose: () => void }) {
  const [isi, setIsi] = useState<Isi | null>(null);
  const [gagal, setGagal] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let batal = false;
    loadStationSummary()
      .then((payload) => {
        if (batal) return;
        const baris = ringkasanSimpul(payload);
        setIsi({
          baris,
          banding: baris.length >= 2 ? bandingkanSimpul(baris[0], baris[1]) : null,
        });
      })
      .catch(() => !batal && setGagal(true));
    return () => {
      batal = true;
    };
  }, []);

  // Fokus masuk ke dalam modal, dan Esc menutupnya — sama seperti panel
  // transparansi. Tanpa ini Tab menyusuri panel yang sedang tertutup backdrop.
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const baris = isi?.baris ?? [];
  // Stempel basis diambil dari baris pertama: keduanya berasal dari satu
  // payload dan satu jalur pipeline, jadi basisnya selalu sama.
  const basis = baris[0]?.basis;

  return (
    <div
      className="dialog-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="banding-simpul-title"
        style={{
          width: "min(900px, calc(100vw - 48px))",
          maxHeight: "calc(100vh - 96px)",
          overflowY: "auto",
          background: "var(--surface)",
          border: "1px solid var(--rule)",
          borderRadius: 14,
          padding: "20px 24px 24px",
          boxShadow: "0 18px 48px rgba(22,19,15,.18)",
        }}
      >
        <header className="row" style={{ alignItems: "flex-start", gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span className="k">Tingkat simpul · estimasi</span>
            <h2 id="banding-simpul-title" style={{ fontSize: 19, margin: "2px 0 4px" }}>
              Ringkasan &amp; Bandingkan Simpul
            </h2>
            <p style={{ fontSize: 12, color: "var(--ink-muted)", margin: 0, lineHeight: 1.5 }}>
              Angka setingkat stasiun, <strong>tidak</strong> mengikuti filter
              slot dan kategori yang sedang aktif di peta — dan bukan angka yang
              sama dengan tombol &ldquo;Bandingkan&rdquo;, yang menjumlah titik
              pada filter aktif.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="btn-reset"
            aria-label="Tutup ringkasan simpul"
            onClick={onClose}
            style={{ fontSize: 18, lineHeight: 1, color: "var(--ink-muted)", flex: "none" }}
          >
            ×
          </button>
        </header>

        {gagal && (
          <p style={{ fontSize: 12.5, color: "var(--ink-muted)", marginTop: 18 }}>
            Ringkasan simpul gagal dimuat.
          </p>
        )}

        {!gagal && isi === null && (
          <p style={{ fontSize: 12.5, color: "var(--ink-muted)", marginTop: 18 }}>
            Memuat ringkasan simpul…
          </p>
        )}

        {!gagal && isi !== null && baris.length < 2 && (
          <p style={{ fontSize: 12.5, color: "var(--ink-muted)", marginTop: 18 }}>
            Perbandingan butuh dua simpul yang datanya sudah terkumpul; sekarang
            baru ada {baris.length}.
          </p>
        )}

        {isi?.banding && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                gap: 28,
                marginTop: 18,
              }}
            >
              <KolomSimpul row={isi.banding.a} />
              <KolomSimpul row={isi.banding.b} />
            </div>

            <Pembacaan banding={isi.banding} />

            <p
              style={{
                fontSize: 10.5,
                color: "var(--ink-faint)",
                marginTop: 14,
                lineHeight: 1.5,
              }}
            >
              Dasar angka: {basis ? BASIS_LABEL[basis] : "—"}. Rentang P10–P90,
              bukan satu angka tunggal. Seluruh nilai rupiah adalah estimasi.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
