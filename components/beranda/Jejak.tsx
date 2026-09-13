"use client";

/**
 * Baris jejak asal data di kaki halaman.
 *
 * Kembaran dari baris yang sudah ada di halaman Peta. Ada di sini karena
 * Beranda kini memakai sumber yang sama persis: kalau angkanya berasal dari
 * suatu tempat, tempatnya harus disebut - termasuk saat tempatnya masih data
 * contoh.
 */

export function Jejak() {
  return (
    <span className="fig" style={{ fontSize: 10.5, color: "var(--ink-faint)" }}>
      survei lapangan Manggarai dan Sudirman · pipeline Monte Carlo 10.000
      iterasi · hari kerja · sampel tipis, estimasi awal
    </span>
  );
}
