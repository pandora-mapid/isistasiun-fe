"use client";

/**
 * Peta hero — MapLibre sungguhan, bukan ilustrasi.
 *
 * Yang berdiri di sini dulu adalah SVG peta buatan tangan: gedung kotak-bulat,
 * jalan bezier, blob isochrone. Itu kartun dari produk yang justru sudah ada
 * dan sudah bagus. Untuk produk pemetaan, memajang peta palsu di halaman depan
 * adalah pengakuan bahwa yang aslinya belum layak dilihat.
 *
 * Sempat dicoba sebagai panel setinggi hero (kolom kanan yang membentang penuh
 * `minHeight` section) — hasilnya kolom yang diciutkan lebarnya tapi tetap
 * dipaksa tinggi penuh terbaca sebagai strip vertikal aneh, bukan kartu.
 * Sekarang ia sungguhan sebuah `<figure>` berukuran tetap: kartu peta kecil
 * dengan keterangan di BAWAHNYA, bukan panel yang menentukan tinggi section.
 *
 * Tiga hal yang membuatnya aman berdiri di landing page:
 *
 * 1. **Non-interaktif.** `interactive: false` melepas seluruh penangan bawaan
 *    MapLibre. Peta yang menelan gulungan halaman di tengah landing page adalah
 *    jebakan, bukan fitur.
 * 2. **Dimuat setelah hidrasi.** `next/dynamic` dengan `ssr: false` menaruh
 *    MapLibre di chunk terpisah, jadi ia tidak ikut memblokir tampilan pertama.
 * 3. **Punya jalan mundur.** Kalau basemap gagal, `MapCanvas` sudah jatuh ke
 *    latar polos dan tetap menggambar lapisan datanya.
 */

import dynamic from "next/dynamic";

import { LAYER } from "@/lib/map/config";
import { rentangRingkas } from "@/lib/format";
import { useBeranda } from "./BerandaData";
import { RangeBar } from "./RangeBar";

/**
 * MapLibre baru diunduh sesudah halaman hidup. Beranda tetap tergambar penuh
 * tanpanya — yang muncul lebih dulu hanya bidang kertas kosong di tempat peta.
 */
const MapCanvas = dynamic(
  () => import("@/components/MapCanvas").then((m) => m.MapCanvas),
  { ssr: false },
);

/**
 * Hanya lingkaran kesenjangan dan halo kepercayaannya.
 *
 * Tanpa label: label menuntut glyph dari jaringan, dan satu permintaan glyph
 * yang gagal membuat seluruh tulisan hilang tanpa pesan. Di halaman depan,
 * peta tanpa nama titik tetap terbaca; peta dengan lubang-lubang kosong tidak.
 */
const LAPISAN_HERO = [LAYER.pointConfidence, LAYER.pointCircle] as const;

/**
 * Ruang yang dikosongkan di dalam kartu peta yang kini kecil (± 320px).
 *
 * Bukan lagi angka yang dirancang untuk panel setinggi hero — kartu sekecil
 * ini butuh padding tipis supaya `STUDY_BOUNDS` masih benar-benar terlihat,
 * bukan mengecil jadi titik di tengah.
 */
const PADDING_KARTU = { top: 20, bottom: 20, left: 20, right: 20 } as const;

/** Tinggi tetap kartu peta. Lebarnya mengikuti kolom yang disediakan induknya. */
const TINGGI_KARTU = 320;

/** Tidak ada yang bisa dipilih di sini — peta ini bacaan, bukan alat. */
const abaikan = () => {};

export function HeroPeta() {
  const { peta, sorotan, error } = useBeranda();

  return (
    <figure
      style={{
        margin: 0,
        // Lebarnya sendiri yang menentukan lebar kolom di grid induk (page.tsx
        // memberi kolom ini `auto`) — bukan sebaliknya. Itu yang membuatnya
        // benar-benar sebuah kartu, bukan panel yang mendikte tata letak.
        width: "min(42vw, 460px)",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: TINGGI_KARTU,
          border: "1px solid var(--rule)",
          borderRadius: "var(--r-xs)",
          overflow: "hidden",
          background: "var(--paper-2)",
        }}
      >
        {peta && (
          <MapCanvas
            points={peta.points}
            isochrones={peta.isochrones}
            labelData={null}
            featureStates={peta.featureStates}
            gapDomain={peta.gapDomain}
            confidenceDomain={peta.confidenceDomain}
            catchmentMinutes={5}
            visibleLayers={LAPISAN_HERO}
            selectedPointId={null}
            onSelectPoint={abaikan}
            dataError={error}
            interactive={false}
            fitPadding={PADDING_KARTU}
          />
        )}
      </div>

      {/* Keterangan di BAWAH kartu, bukan ditumpuk di atasnya. Kartu sorotan
         dulu menumpuk peta lewat `position: absolute` — masuk akal ketika
         peta setinggi hero, tapi di kartu sekecil ini akan menutupi hampir
         seluruh peta. Pola figure/figcaption ini juga otomatis membereskan
         masalah lama "kartu menimpa atribusi MapLibre": keduanya sekarang
         tidak mungkin bertumpuk sama sekali. */}
      {sorotan && (
        <figcaption style={{ marginTop: 14 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>
            {sorotan.namaStasiun} · {sorotan.namaTitik}
          </div>
          <div
            className="fig"
            style={{
              font: `500 clamp(19px, 1.8vw, 24px)/1 var(--font-mono), ui-monospace, monospace`,
              letterSpacing: "-0.03em",
              whiteSpace: "nowrap",
            }}
          >
            {rentangRingkas(sorotan.metric.gap)}
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: "var(--t-small)",
              color: "var(--ink-muted)",
            }}
          >
            kesenjangan belanja, per hari kerja
          </div>
          <div style={{ marginTop: 10 }}>
            <RangeBar range={sorotan.metric.gap} animate labels={false} />
          </div>
        </figcaption>
      )}
    </figure>
  );
}
