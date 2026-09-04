import type { ReactNode } from "react";

/**
 * Kepala section ringan — kicker `.eyebrow` + judul modest + catatan rata kanan.
 *
 * Ini alternatif `KepalaBab` untuk layar yang TIDAK mau numeral bab: judulnya
 * `clamp(25px, 2.5vw, 32px)` (sengaja lebih kecil dari `--t-h2` yang menyentuh
 * 40px — mengikuti kepadatan Metodologi/Rekomendasi), tanpa garis-rambut, tanpa
 * angka. Lahir sebagai helper lokal di `app/insight/page.tsx` lalu diangkat ke
 * sini begitu `app/metodologi/page.tsx` butuh kepala yang sama.
 *
 * `catatan` menerima `ReactNode` supaya sebuah layar bisa mengoper baris chip,
 * bukan cuma teks.
 *
 * Fungsi polos (tanpa `"use client"`) — dipakai di server component.
 */
export function Kepala({
  kicker,
  judul,
  catatan,
}: {
  kicker: string;
  judul: string;
  catatan?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: "var(--s4)",
        marginBottom: "var(--s3)",
        flexWrap: "wrap",
      }}
    >
      <div>
        <div className="eyebrow" style={{ marginBottom: "var(--s2)" }}>
          {kicker}
        </div>
        <h2
          style={{
            font: "800 clamp(25px, 2.5vw, 32px)/1.12 var(--font-inter), system-ui, sans-serif",
            letterSpacing: "-0.02em",
            margin: 0,
            maxWidth: "24ch",
          }}
        >
          {judul}
        </h2>
      </div>
      {catatan && (
        <span
          style={{
            fontSize: "var(--t-small)",
            lineHeight: 1.5,
            color: "var(--ink-muted)",
            maxWidth: "38ch",
            textAlign: "right",
          }}
        >
          {catatan}
        </span>
      )}
    </div>
  );
}
