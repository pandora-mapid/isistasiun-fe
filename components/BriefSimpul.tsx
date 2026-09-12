"use client";

/**
 * Brief satu simpul — tampil di layar, dan dicetak menjadi PDF.
 *
 * **Tanpa library PDF.** `jspdf` dan kawan-kawannya berarti satu dependensi
 * baru (±350 kB) yang harus merender ulang tata letak dan tipografinya
 * sendiri, dan hasilnya selalu meleset dari yang tampil di layar. Dialog cetak
 * browser sudah menghasilkan PDF di semua platform target, memakai tipografi
 * halaman ini apa adanya, dan "Simpan sebagai PDF" ada di setiap dialog itu.
 * Yang dibutuhkan cuma aturan `@media print` — lihat `globals.css`.
 *
 * Isinya mengikuti bentuk brief di `isi-stasiun-ai-integration.md §2.2`
 * (headline, rentang capture, asumsi, kategori hilang teratas, catatan
 * kepercayaan), tapi datanya dari `StationSummaryRow` yang sudah ada — bukan
 * dari AI service, yang memang belum dipanggil dari sini.
 */

import { useEffect, useRef, useState } from "react";

import {
  arusPuncak,
  entryRatioPuncak,
  kategoriHilang,
  ringkasanSimpul,
} from "@/lib/analytics/summary";
import { categoryLabel, slotLabel } from "@/lib/data/dimensions";
import { loadStationSummary } from "@/lib/data/source";
import type { StationSummaryPayload, StationSummaryRow } from "@/lib/data/types";
import { desimal, persen, rentangRingkas, ribuan } from "@/lib/format";

const BASIS_LABEL: Record<StationSummaryRow["basis"], string> = {
  "monte-carlo-simpul": "simulasi Monte Carlo setingkat simpul",
  "agregat-titik": "agregat titik (sementara, bukan simulasi)",
};

function Bagian({ judul, children }: { judul: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 16 }}>
      <div className="k" style={{ marginBottom: 6 }}>{judul}</div>
      {children}
    </section>
  );
}

function IsiBrief({
  row,
  payload,
}: {
  row: StationSummaryRow;
  payload: StationSummaryPayload;
}) {
  const hilang = kategoriHilang(row);
  const E = entryRatioPuncak(row);
  const F = arusPuncak(row);

  return (
    <article>
      <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>
        Brief simpul · {payload.day_type === "weekday" ? "hari kerja" : "akhir pekan"}
      </div>
      <h3 style={{ fontSize: 22, margin: "2px 0 8px" }}>{row.station_name}</h3>

      <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>
        Kesenjangan belanja di {row.station_name} diperkirakan{" "}
        <strong className="fig">{rentangRingkas(row.gap)}</strong> per hari, dari
        potensi <span className="fig">{rentangRingkas(row.potensi)}</span> yang
        baru tertangkap <span className="fig">{persen(row.capture_rate)}</span>{" "}
        oleh gerai di dalam simpul.
      </p>

      <Bagian judul="Rentang tertangkap">
        <div style={{ fontSize: 13, lineHeight: 1.6 }}>
          Tertangkap <span className="fig">{rentangRingkas(row.tertangkap)}</span>{" "}
          dari potensi <span className="fig">{rentangRingkas(row.potensi)}</span>.
          Dilaporkan sebagai rentang P10–P90, bukan satu angka tunggal.
        </div>
      </Bagian>

      <Bagian judul="Asumsi yang dipakai">
        <ul style={{ fontSize: 12.5, lineHeight: 1.65, margin: 0, paddingLeft: 18 }}>
          <li>
            Dasar angka: {BASIS_LABEL[row.basis]}, bukan penjumlahan angka titik
            di layar.
          </li>
          <li>
            Titik puncak{" "}
            {row.peak
              ? `${row.peak.point_label} pada slot ${slotLabel(row.peak.slot)}`
              : "belum ditetapkan"}
            {F !== null ? `, arus ${ribuan(F)} org/jam` : ""}
            {E !== null ? `, rasio masuk ${persen(E)}` : ""}.
          </li>
          <li>
            {row.pintu_dicacah} pintu dicacah
            {row.pintu_ditahan > 0
              ? `, ${row.pintu_ditahan} pintu estimasinya ditahan karena sampel tipis — angka di atas adalah batas bawah`
              : ""}
            .
          </li>
          <li>Konversi beli (C) dikunci 0,95 sebagai keputusan produk.</li>
        </ul>
      </Bagian>

      <Bagian judul="Kategori hilang teratas">
        {hilang.length === 0 ? (
          <div style={{ fontSize: 12.5 }}>Tidak ada kategori di bawah ambang.</div>
        ) : (
          <ul style={{ fontSize: 12.5, lineHeight: 1.65, margin: 0, paddingLeft: 18 }}>
            {hilang.slice(0, 3).map((c) => (
              <li key={c.category}>
                <strong>{categoryLabel(c.category)}</strong> — permintaan{" "}
                <span className="fig">{persen(c.demand_share, 0)}</span>, baru{" "}
                <span className="fig">{c.gerai_count}</span> gerai.
              </li>
            ))}
          </ul>
        )}
      </Bagian>

      <Bagian judul="Catatan kepercayaan">
        <div style={{ fontSize: 12.5, lineHeight: 1.6 }}>
          {row.confidence
            ? `Skor kepercayaan titik-titik yang diestimasi berkisar ${desimal(row.confidence.min)}–${desimal(row.confidence.max)}.`
            : "Belum ada titik yang bisa diestimasi."}{" "}
          {row.struk_terbaca > 0
            ? `${ribuan(row.struk_terbaca)} struk terbaca menjadi dasar nilai transaksi.`
            : "Belum ada struk terbaca; nilai transaksi memakai asumsi bersumber, bukan hasil OCR."}{" "}
          Sampel lapangan 2 hari — seluruh angka rupiah adalah estimasi.
        </div>
      </Bagian>
    </article>
  );
}

export function BriefSimpul({ onClose }: { onClose: () => void }) {
  const [payload, setPayload] = useState<StationSummaryPayload | null>(null);
  const [gagal, setGagal] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let batal = false;
    loadStationSummary()
      .then((p) => !batal && setPayload(p))
      .catch(() => !batal && setGagal(true));
    return () => {
      batal = true;
    };
  }, []);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const baris = payload ? ringkasanSimpul(payload) : [];

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
        aria-labelledby="brief-simpul-title"
        className="brief-cetak"
        style={{
          width: "min(760px, calc(100vw - 48px))",
          maxHeight: "calc(100vh - 96px)",
          overflowY: "auto",
          background: "var(--surface)",
          border: "1px solid var(--rule)",
          borderRadius: 14,
          padding: "20px 26px 26px",
          boxShadow: "0 18px 48px rgba(22,19,15,.18)",
        }}
      >
        <header
          className="row cetak-sembunyi"
          style={{ alignItems: "flex-start", gap: 16 }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <span className="k">Brief simpul · estimasi</span>
            <h2 id="brief-simpul-title" style={{ fontSize: 18, margin: "2px 0 0" }}>
              Brief PDF
            </h2>
            <p style={{ fontSize: 11.5, color: "var(--ink-muted)", margin: "4px 0 0" }}>
              Pilih &ldquo;Simpan sebagai PDF&rdquo; di dialog cetak.
            </p>
          </div>
          <button
            type="button"
            className="b bp"
            style={{ flex: "none" }}
            onClick={() => window.print()}
            disabled={baris.length === 0}
          >
            Cetak / simpan PDF
          </button>
          <button
            ref={closeRef}
            type="button"
            className="btn-reset"
            aria-label="Tutup brief simpul"
            onClick={onClose}
            style={{ fontSize: 18, lineHeight: 1, color: "var(--ink-muted)", flex: "none" }}
          >
            ×
          </button>
        </header>

        {gagal && (
          <p style={{ fontSize: 12.5, color: "var(--ink-muted)", marginTop: 18 }}>
            Brief gagal dimuat.
          </p>
        )}

        {!gagal && payload === null && (
          <p style={{ fontSize: 12.5, color: "var(--ink-muted)", marginTop: 18 }}>
            Memuat brief…
          </p>
        )}

        {payload &&
          baris.map((row, i) => (
            <div
              key={row.station_id}
              style={{
                marginTop: i === 0 ? 18 : 26,
                paddingTop: i === 0 ? 0 : 20,
                borderTop: i === 0 ? undefined : "1px solid var(--rule)",
                // Tiap simpul mulai di halaman baru saat dicetak; dua brief yang
                // terpotong di tengah halaman tidak bisa dibagikan terpisah.
                breakBefore: i === 0 ? "auto" : "page",
              }}
            >
              <IsiBrief row={row} payload={payload} />
            </div>
          ))}

        {payload && (
          <p
            className="cetak-sumber"
            style={{
              fontSize: 10.5,
              color: "var(--ink-faint)",
              marginTop: 18,
              lineHeight: 1.5,
            }}
          >
            Sumber: Isi Stasiun · {payload.pipeline_version} · dihasilkan{" "}
            {payload.generated_at}. Setiap angka dapat ditelusuri ke sumbernya di
            panel transparansi aplikasi.
          </p>
        )}
      </section>
    </div>
  );
}
