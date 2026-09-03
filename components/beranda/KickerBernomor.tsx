/**
 * Kicker section bernomor — angka bab (besar) + pil kicker.
 *
 * Riwayat nomor bab: putaran 9 numeral raksasa PUDAR di belakang judul
 * (ditolak); putaran 10 numeral SOLID raksasa (ditolak — kelewat besar);
 * putaran 11 nomor DI DALAM pil kicker (`1 — DUDUK PERKARA`, seukuran teks
 * pil); putaran 12 nomor keluar dari pil, sedikit lebih besar, dengan em-dash
 * (`1 — DUDUK PERKARA`). Putaran 13: em-dash dibuang (cukup angka + pil) dan
 * angkanya dinaikkan jauh jadi numeral display — `clamp(44px, 6vw, 84px)`,
 * jangkar visual modern di kepala tiap bab.
 *
 * Kenapa ini BUKAN pengulangan putaran 10 yang ditolak: di sana numeral solid
 * `--ink` sebesar judul dan duduk sebagai elemen kedua yang setara — dua hal
 * besar bersaing. Di sini angkanya `--ink-faint` (di ink-band otomatis jadi
 * putih tembus), jadi besar tapi tetap LATAR — pil kicker dan judul yang
 * dibaca lebih dulu, angkanya penanda urutan yang terasa modern, bukan klaim.
 *
 * Fungsi polos (tanpa `"use client"`) supaya bisa dipakai di server
 * (`page.tsx` → `KepalaBab`) MAUPUN client (`Persamaan.tsx`).
 *
 * Angka & pil disejajarkan di DASAR (`align-items: flex-end`). `text-box-trim`
 * pada angka memangkas kotak-teksnya ke garis-dasar alfabet — tanpa itu
 * `flex-end` mensejajarkan dasar KOTAK BARIS angka (masih memuat ruang turunan
 * ~0.25em) dengan dasar pil, jadi glyph "2" yang terlihat malah melayang naik
 * ~20px. Dengan pangkas ini, dasar glyph yang terlihat = dasar kotak pil.
 * (Chromium 133+/Safari 18.2+; browser lama jatuh ke perilaku lama — angkanya
 * sedikit naik, tidak rusak.)
 */
export function KickerBernomor({ n, kicker }: { n: number; kicker: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: "12px",
        flexWrap: "wrap",
      }}
    >
      <span
        className="fig"
        aria-hidden
        style={{
          fontSize: "clamp(44px, 6vw, 84px)",
          fontWeight: 100,
          lineHeight: 1,
          letterSpacing: "-0.04em",
          color: "var(--ink-faint)",
          textBoxTrim: "trim-both",
          textBoxEdge: "cap alphabetic",
        }}
      >
        {n}
      </span>
      <span className="eyebrow-chip eyebrow">{kicker}</span>
    </div>
  );
}
