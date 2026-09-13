"use client";

/**
 * Tabel atribut — seluruh titik pengamatan dalam potongan slot × kategori
 * yang sedang aktif, bisa diurutkan, bisa diunduh sebagai CSV.
 *
 * Tombol "Tabel atribut" sebelumnya termasuk tombol yang sengaja dibuat mati
 * (janji proposal tanpa isi). Sekarang terisi.
 *
 * Barisnya disusun `lib/export/rows.ts`, modul yang sama yang menyusun CSV-nya
 * — jadi berkas yang terunduh tidak bisa berbeda isi dari tabel yang baru saja
 * dilihat. Tidak ada angka yang dihitung di komponen ini.
 */

import { useEffect, useMemo, useRef, useState } from "react";

import type { CategoryFilter } from "@/lib/data/dimensions";
import { categoryLabel, slotLabel } from "@/lib/data/dimensions";
import type {
  ObservationPointProps,
  SlotKey,
  SpendingGapPayload,
} from "@/lib/data/types";
import {
  KOLOM_ATRIBUT,
  barisAtribut,
  csvAtribut,
  namaBerkasAtribut,
  urutkan,
  type Arah,
  type BarisAtribut,
} from "@/lib/export/rows";
import { unduhTeks } from "@/lib/export/unduh";
import { desimal, rupiahRingkas, TIDAK_DIESTIMASI } from "@/lib/format";

/**
 * Tulisan satu sel.
 *
 * Kolom rupiah diringkas supaya kolomnya tidak melebar sampai tabelnya harus
 * digeser; nilai penuhnya selalu ada di CSV. Yang tidak diestimasi ditulis
 * apa adanya, bukan "Rp 0" — aturan yang sama dengan seluruh aplikasi.
 */
function sel(row: BarisAtribut, key: keyof BarisAtribut): string {
  const v = row[key];
  if (typeof v === "boolean") return v ? "ya" : "—";
  if (v === null) return TIDAK_DIESTIMASI;
  if (typeof v === "string") return v;

  switch (key) {
    case "gapP10":
    case "gapP50":
    case "gapP90":
    case "potensiP50":
    case "tertangkapP50":
    case "V":
      return rupiahRingkas(v);
    case "E":
    case "C":
    case "confidence":
      return desimal(v, 2);
    default:
      return desimal(v, 0);
  }
}

export function TabelAtribut({
  payload,
  entrances,
  slot,
  category,
  onClose,
}: {
  payload: SpendingGapPayload;
  entrances: ObservationPointProps[];
  slot: SlotKey;
  category: CategoryFilter;
  onClose: () => void;
}) {
  const [sortKey, setSortKey] = useState<keyof BarisAtribut>("gapP50");
  const [arah, setArah] = useState<Arah>("turun");
  const closeRef = useRef<HTMLButtonElement>(null);

  const rows = useMemo(
    () => barisAtribut(payload, entrances, slot, category),
    [payload, entrances, slot, category],
  );
  const terurut = useMemo(() => urutkan(rows, sortKey, arah), [rows, sortKey, arah]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function sortir(key: keyof BarisAtribut) {
    if (key === sortKey) {
      setArah((a) => (a === "naik" ? "turun" : "naik"));
      return;
    }
    setSortKey(key);
    // Kolom angka paling sering dibaca dari yang terbesar; kolom teks dari A.
    setArah(KOLOM_ATRIBUT.find((k) => k.key === key)?.angka ? "turun" : "naik");
  }

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
        aria-labelledby="tabel-atribut-title"
        style={{
          width: "min(1040px, calc(100vw - 48px))",
          maxHeight: "calc(100vh - 96px)",
          display: "flex",
          flexDirection: "column",
          background: "var(--surface)",
          border: "1px solid var(--rule)",
          borderRadius: 14,
          boxShadow: "0 18px 48px rgba(22,19,15,.18)",
        }}
      >
        <header
          className="row"
          style={{ alignItems: "flex-start", gap: 16, padding: "18px 22px 12px", flex: "none" }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <span className="k">Tabel atribut · estimasi</span>
            <h2 id="tabel-atribut-title" style={{ fontSize: 18, margin: "2px 0 4px" }}>
              {terurut.length} titik pengamatan
            </h2>
            <p style={{ fontSize: 11.5, color: "var(--ink-muted)", margin: 0 }}>
              Potongan aktif: {slotLabel(slot)} · {categoryLabel(category)} ·{" "}
              {payload.pipeline_version}
            </p>
          </div>
          <button
            type="button"
            className="b bp"
            style={{ flex: "none" }}
            onClick={() =>
              unduhTeks(
                namaBerkasAtribut(payload, slot, category),
                csvAtribut(terurut),
              )
            }
          >
            Unduh CSV
          </button>
          <button
            ref={closeRef}
            type="button"
            className="btn-reset"
            aria-label="Tutup tabel atribut"
            onClick={onClose}
            style={{ fontSize: 18, lineHeight: 1, color: "var(--ink-muted)", flex: "none" }}
          >
            ×
          </button>
        </header>

        <div style={{ overflow: "auto", padding: "0 22px 20px" }}>
          <table
            className="fig"
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}
          >
            <thead>
              <tr>
                {KOLOM_ATRIBUT.map((k) => {
                  const aktif = k.key === sortKey;
                  return (
                    <th
                      key={k.key}
                      scope="col"
                      // `aria-sort` di <th>, bukan hanya panah visual: tanpa itu
                      // urutan tabel tidak pernah sampai ke pembaca layar.
                      aria-sort={
                        aktif ? (arah === "naik" ? "ascending" : "descending") : "none"
                      }
                      style={{
                        position: "sticky",
                        top: 0,
                        background: "var(--surface)",
                        textAlign: k.angka ? "right" : "left",
                        padding: "8px 8px",
                        borderBottom: "1px solid var(--rule-strong, var(--rule))",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <button
                        type="button"
                        className="btn-reset"
                        onClick={() => sortir(k.key)}
                        style={{
                          font: "inherit",
                          fontWeight: aktif ? 700 : 600,
                          color: "var(--ink)",
                          cursor: "pointer",
                        }}
                      >
                        {k.judul}
                        {aktif ? (arah === "naik" ? " ↑" : " ↓") : ""}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {terurut.map((row) => (
                <tr key={row.pointId}>
                  {KOLOM_ATRIBUT.map((k) => (
                    <td
                      key={k.key}
                      style={{
                        textAlign: k.angka ? "right" : "left",
                        padding: "6px 8px",
                        borderBottom: "1px solid var(--rule)",
                        whiteSpace: "nowrap",
                        color: row.sampelTipis ? "var(--ink-muted)" : undefined,
                      }}
                    >
                      {sel(row, k.key)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <p style={{ fontSize: 10.5, color: "var(--ink-faint)", marginTop: 12, lineHeight: 1.5 }}>
            Baris abu adalah titik bersampel tipis — estimasinya ditahan, bukan
            nol. Di CSV, kolomnya dikosongkan supaya tidak ikut terjumlah.
            Seluruh nilai rupiah adalah estimasi.
          </p>
        </div>
      </section>
    </div>
  );
}
