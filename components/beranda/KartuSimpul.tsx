"use client";

/**
 * Tiga kartu simpul — satu-satunya kartu yang bertahan di halaman ini.
 *
 * Bertahan karena ia memang satu unit yang bisa diklik; sisa halaman yang dulu
 * berupa kartu sekarang berupa band ber-hairline. Isinya dibangun ulang dari
 * dua sisi:
 *
 * 1. **Angkanya dari data, bukan karangan.** Versi lama menulis "Stasiun A/B/C"
 *    dengan tipologi dan jumlah pintu yang dibantah `stations.json` — Stasiun C
 *    disebut punya 5 pintu padahal datanya 3. Halaman depan membantah halaman
 *    petanya sendiri.
 * 2. **Hiasannya diganti data.** Tiga SVG peta-mini palsu yang tidak
 *    mengandung informasi apa pun diganti sparkline empat slot dan bar rentang
 *    P10–P90 — keduanya menggambar angka yang benar-benar ada.
 *
 * Yang disebut kartu adalah **satu titik**, bukan seluruh stasiun: payload tidak
 * menyediakan angka setingkat stasiun, dan menjumlahkan titik-titiknya berarti
 * melahirkan angka yang tidak pernah diukur.
 */

import Link from "next/link";

import { rentangRingkas } from "@/lib/format";
import { useBeranda } from "./BerandaData";
import { RangeBar } from "./RangeBar";
import { SlotSparkline } from "./SlotSparkline";

/** Tipologi datang huruf kecil dari data; hanya huruf pertamanya dinaikkan. */
function tipologi(teks: string): string {
  return teks.charAt(0).toUpperCase() + teks.slice(1);
}

export function KartuSimpul() {
  const { simpul, siap } = useBeranda();

  if (!siap) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "var(--s3)",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            aria-hidden
            style={{
              height: 300,
              border: "1px solid var(--rule)",
              borderRadius: "var(--r-xs)",
              background: "var(--paper-2)",
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "var(--s3)",
      }}
    >
      {simpul.map(({ station, metric, namaTitik, slot }) => (
        <Link
          key={station.id}
          href="/peta"
          className="card"
          style={{
            display: "block",
            padding: "var(--s3)",
            color: "inherit",
            textDecoration: "none",
          }}
        >
          <div
            className="row"
            style={{ justifyContent: "space-between", alignItems: "baseline" }}
          >
            <span className="eyebrow">{tipologi(station.typology)}</span>
            <span
              className="fig"
              style={{ fontSize: "var(--t-micro)", color: "var(--ink-faint)" }}
            >
              {station.point_count} titik
            </span>
          </div>

          <h3
            className="serif"
            style={{
              font: `400 var(--t-h3)/1.1 var(--font-serif), Georgia, serif`,
              margin: "var(--s2) 0 4px",
              // Nama stasiun bisa satu atau dua baris ("Stasiun C (belum
              // ditentukan)"). Tanpa ruang yang dicadangkan, satu judul panjang
              // menggeser seluruh isi kartunya dan ketiganya berhenti sebaris.
              minHeight: "2.2em",
            }}
          >
            {station.name}
          </h3>
          <div
            style={{
              fontSize: "var(--t-small)",
              color: "var(--ink-muted)",
              marginBottom: "var(--s3)",
            }}
          >
            titik terbesar · {namaTitik}
          </div>

          <div
            className="fig"
            style={{
              fontSize: "clamp(17px, 1.5vw, 20px)",
              whiteSpace: "nowrap",
            }}
          >
            {metric ? rentangRingkas(metric.gap) : "—"}
          </div>
          <div
            style={{
              fontSize: "var(--t-micro)",
              color: "var(--ink-faint)",
              margin: "4px 0 var(--s2)",
            }}
          >
            kesenjangan per hari kerja
          </div>

          {metric && <RangeBar range={metric.gap} labels={false} />}

          <div
            style={{
              marginTop: "var(--s3)",
              paddingTop: "var(--s2)",
              borderTop: "1px solid var(--rule)",
            }}
          >
            <div className="eyebrow" style={{ marginBottom: 10 }}>
              Per slot
            </div>
            <SlotSparkline slot={slot} />
          </div>
        </Link>
      ))}
    </div>
  );
}
