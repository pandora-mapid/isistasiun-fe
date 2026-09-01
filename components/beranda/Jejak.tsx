"use client";

/**
 * Baris jejak asal data di kaki halaman.
 *
 * Kembaran dari baris yang sudah ada di halaman Peta. Ada di sini karena
 * Beranda kini memakai sumber yang sama persis: kalau angkanya berasal dari
 * suatu tempat, tempatnya harus disebut — termasuk saat tempatnya masih data
 * contoh.
 */

import { useBeranda } from "./BerandaData";

export function Jejak() {
  const { jejak } = useBeranda();
  if (!jejak) return null;

  return (
    <span className="fig" style={{ fontSize: 10.5, color: "var(--ink-faint)" }}>
      data contoh · pipeline {jejak.pipeline} · {jejak.jenisHari} · dibuat{" "}
      {jejak.dibuat}
    </span>
  );
}
