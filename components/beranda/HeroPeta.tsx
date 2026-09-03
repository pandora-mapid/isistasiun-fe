"use client";

/**
 * Peta hero — kolom kanan, satu blok utuh, dengan satu kartu kecil mengambang.
 *
 * Riwayat singkat: putaran 1–4 sebuah `<figure>` di sisi kanan teks; putaran
 * 5 sudut kiri-bawahnya "digigit" bentuk organik dengan badge cincin
 * mengambang; putaran 6 dipecah jadi dua ubin `.bento` (peta + angka
 * sorotan) di bawah hero yang dipusatkan. Putaran 7 mengembalikan tata letak
 * dua-kolom (peta KIRI, tulisan KANAN); putaran 8 membaliknya lagi atas
 * permintaan eksplisit — peta KANAN, tulisan KIRI — dan mengecilkan petanya
 * (kolom teks kini lebih lebar, `TINGGI_MIN` turun) supaya tipografi jadi
 * jangkar utama dan peta jadi pendukung. Putaran 10 menaruh kartu sorotan
 * INSET di dalam peta; user minta ia mengikuti model kartu overlap Section 2.
 * Putaran 11: kartu sorotan MENGGANTUNG ~separuh keluar sudut kanan-bawah
 * peta, gaya sel garis-rambut (kelas `.kartu`) — persis seperti kartu angka
 * lapangan di bab 3. Sudut kanvas MapLibre tetap dipaksa membulat lewat
 * `isolation: isolate` + prop `borderRadius` ke `MapCanvas`. (Bukan lagi
 * gigitan organik/badge cincin — itu ornamen putaran 5 yang sudah dibuang
 * putaran 6 dan tidak dikembalikan.)
 *
 * `HeroPeta` sekarang mengembalikan **satu blok**, bukan fragment dua ubin
 * grid — `page.tsx` menaruhnya langsung sebagai kolom kanan sebuah grid dua
 * kolom, bukan sebagai anak `.bento`.
 *
 * Tiga hal yang membuat peta ini aman berdiri di landing page (tidak berubah
 * dari putaran-putaran sebelumnya):
 *
 * 1. **Non-interaktif.** `interactive: false` melepas seluruh penangan bawaan
 *    MapLibre. Peta yang menelan gulungan halaman di tengah landing page
 *    adalah jebakan, bukan fitur.
 * 2. **Dimuat setelah hidrasi.** `next/dynamic` dengan `ssr: false` menaruh
 *    MapLibre di chunk terpisah, jadi ia tidak ikut memblokir tampilan
 *    pertama.
 * 3. **Punya jalan mundur.** Kalau basemap gagal, `MapCanvas` sudah jatuh ke
 *    latar polos dan tetap menggambar lapisan datanya.
 */

import dynamic from "next/dynamic";

import { LAYER } from "@/lib/map/config";
import { rentangRingkas } from "@/lib/format";
import { useBeranda } from "./BerandaData";

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

/** Padding simetris — tidak ada sudut yang perlu dijauhi. */
const PADDING_KARTU = { top: 28, bottom: 28, left: 28, right: 28 } as const;

/** Tinggi minimum kalau kolom teks di sebelahnya kebetulan pendek. Diturunkan
 * di putaran 8: peta sengaja jadi lebih kecil dari kolom teks di sebelahnya. */
const TINGGI_MIN = 360;

/** Tidak ada yang bisa dipilih di sini — peta ini bacaan, bukan alat. */
const abaikan = () => {};

export function HeroPeta() {
  const { peta, sorotan, error } = useBeranda();

  return (
    <div style={{ position: "relative", height: "100%", minHeight: TINGGI_MIN }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "var(--r-xl)",
          border: "1px solid var(--rule)",
          boxShadow: "var(--shadow-lift)",
          overflow: "hidden",
          // Kanvas MapLibre kadang dikompositkan di layer sendiri dan lolos
          // dari kliping `border-radius` nenek-moyangnya. `isolation: isolate`
          // memaksa stacking-context di sini supaya sudutnya benar-benar
          // terpotong; `borderRadius` juga dioper ke MapCanvas sebagai
          // sabuk-kedua (memotong tepat di pembungkus kanvas).
          isolation: "isolate",
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
            borderRadius="var(--r-xl)"
          />
        )}
      </div>

      {/* Kartu sorotan — MENGGANTUNG ~separuh keluar sudut kanan-bawah peta
         (model kartu overlap Section 2). Isi dua sel dipisah garis-rambut
         (`gap: 1px` menyingkap `--rule` di baliknya), satu sudut tajam
         (`.kartu`). Menggantung ke arah selokan `--page-x` — aman. */}
      {sorotan && (
        <div
          className="kartu"
          style={{
            position: "absolute",
            right: -20,
            bottom: -20,
            left: "auto",
            width: "min(288px, 76%)",
            overflow: "hidden",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <div
            style={{
              display: "grid",
              gap: 1,
              background: "var(--rule)",
            }}
          >
            <div
              className="eyebrow"
              style={{
                background: "var(--surface)",
                padding: "var(--s2) var(--s3)",
                lineHeight: 1.4,
              }}
            >
              {sorotan.namaStasiun} · {sorotan.namaTitik}
            </div>
            <div
              style={{
                background: "var(--surface)",
                padding: "var(--s2) var(--s3)",
              }}
            >
              <div
                className="fig"
                style={{
                  font: `700 clamp(19px, 2vw, 24px)/1 var(--font-mono), ui-monospace, monospace`,
                  letterSpacing: "-0.03em",
                  whiteSpace: "nowrap",
                }}
              >
                {rentangRingkas(sorotan.metric.gap)}
              </div>
              <div
                style={{
                  marginTop: 3,
                  fontSize: "var(--t-micro)",
                  color: "var(--ink-muted)",
                }}
              >
                kesenjangan belanja · per hari kerja
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
