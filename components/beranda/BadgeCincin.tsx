/**
 * Badge lingkaran dengan teks melingkar — chrome dekoratif, bukan data.
 *
 * Padanan dari "AWARD WINNING REAL ESTATE" pada referensi Dribbble: sebuah
 * cap yang berputar pelan di sudut sebuah foto. Yang kita punya di situ
 * bukan foto, tapi peta sungguhan, jadi teksnya jujur soal itu — "pengukuran
 * lapangan, data langsung" — bukan klaim penghargaan yang tidak ada.
 *
 * `aria-hidden`: tidak ada informasi di sini yang tidak sudah ada di tempat
 * lain (nama titik, rentang, sumber data semuanya ada di `figcaption`), jadi
 * pembaca layar boleh melewatinya sepenuhnya.
 */
"use client";

import { useId } from "react";

export function BadgeCincin({
  teks,
  ukuran = 108,
}: {
  teks: string;
  ukuran?: number;
}) {
  const pathId = useId();

  return (
    <div
      aria-hidden
      style={{
        width: ukuran,
        height: ukuran,
        borderRadius: "var(--r-pill)",
        background: "var(--surface)",
        boxShadow: "var(--shadow-soft)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* className ring-spin: lihat globals.css — dijaga
         prefers-reduced-motion di sana, bukan di sini. */}
      <svg
        className="ring-spin"
        viewBox="0 0 100 100"
        width={ukuran - 14}
        height={ukuran - 14}
      >
        <path
          id={pathId}
          d="M 50,50 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0"
          fill="none"
        />
        <text
          fill="var(--ink-muted)"
          style={{
            font: "600 6.6px var(--font-inter), system-ui, sans-serif",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          <textPath href={`#${pathId}`} startOffset="0%">
            {teks}
          </textPath>
        </text>
      </svg>
    </div>
  );
}
