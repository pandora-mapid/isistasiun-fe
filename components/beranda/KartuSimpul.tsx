"use client";

/**
 * Tiga kartu simpul — satu-satunya kartu yang benar-benar bisa diklik.
 *
 * (Sistem editorial putaran 1–4 menjadikan kartu ini pengecualian tunggal di
 * halaman yang selain itu ber-hairline. Sistem "modern" putaran 5 membalik
 * itu — kartu ada di mana-mana lagi — tapi bedanya di sini tetap berarti:
 * hanya kartu inilah yang jadi `<Link>`, bukan sekadar wadah visual.)
 * Isinya dibangun ulang dari dua sisi:
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

import { rentangRingkas, rupiahRingkas } from "@/lib/format";
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
              height: 340,
              border: "1px solid var(--rule)",
              borderRadius: "var(--r-lg)",
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
            padding: "var(--s4)",
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
            style={{
              font: `800 var(--t-h3)/1.1 var(--font-inter), system-ui, sans-serif`,
              letterSpacing: "-0.015em",
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
              fontSize: "clamp(19px, 1.7vw, 23px)",
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

          {/* Baris data tambahan — bukan hiasan, dua angka ini memang
             komponen dari gap di atasnya (gap = potensi − tertangkap), dan
             frasanya sama persis dengan yang dipakai panel /peta. Ini yang
             membuat kartu terasa lebih padat tanpa mengarang satu angka pun. */}
          {metric && (
            <div
              style={{
                marginTop: "var(--s2)",
                fontSize: "var(--t-micro)",
                color: "var(--ink-muted)",
              }}
            >
              Potensi {rupiahRingkas(metric.potensi.p50)} − tertangkap{" "}
              {rupiahRingkas(metric.tertangkap.p50)}
            </div>
          )}

          <div
            style={{
              marginTop: "var(--s4)",
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
