"use client";

/**
 * Peta hero — MapLibre sungguhan, bukan ilustrasi.
 *
 * Yang berdiri di sini dulu adalah SVG peta buatan tangan, lalu (putaran 1–4)
 * sebuah kartu persegi datar dengan satu bayangan sebagai satu-satunya
 * pengecualian di seluruh sistem. Putaran kelima memindahkan Beranda ke
 * sistem "modern" — bayangan jadi kosakata biasa, dan referensi yang diminta
 * user (foto properti dipotong bentuk organik + badge lingkaran mengambang)
 * diterapkan literal di sini juga, dengan satu penyesuaian sengaja:
 *
 * **Sudut yang "digigit" tidak boleh menyembunyikan data.** Referensinya
 * memotong foto dekoratif — tidak ada informasi yang hilang kalau sudut foto
 * terpotong. Punya kita peta sungguhan. Supaya bentuk organik ini tidak diam-
 * diam menyembunyikan sebuah titik pengamatan, sisi yang digigit (kiri-bawah)
 * diberi `fitPadding` ekstra, jadi `STUDY_BOUNDS` selalu digambar menjauhi
 * area itu — gigitannya murni bentuk kartu, bukan bagian peta yang terpotong.
 *
 * Tiga hal yang membuatnya aman berdiri di landing page (tidak berubah dari
 * putaran-putaran sebelumnya):
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
import { BadgeCincin } from "./BadgeCincin";
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
 * Ruang yang dikosongkan di dalam kartu peta.
 *
 * Kiri-bawah lebih lebar dari tiga sisi lain — itu bukan selera, itu yang
 * menjaga `STUDY_BOUNDS` selalu tergambar menjauhi sudut yang "digigit" oleh
 * bentuk kartunya (lihat komentar file). Tanpa ini, gigitan dekoratif itu bisa
 * kebetulan menutupi sebuah titik pengamatan sungguhan.
 */
const PADDING_KARTU = { top: 28, bottom: 96, left: 96, right: 28 } as const;

/** Tinggi tetap kartu peta. Lebarnya mengikuti kolom yang disediakan induknya. */
const TINGGI_KARTU = 420;

/** Ukuran sisi persegi "gigitan" di sudut kiri-bawah kartu. */
const GIGITAN = 84;

/** Tidak ada yang bisa dipilih di sini — peta ini bacaan, bukan alat. */
const abaikan = () => {};

export function HeroPeta() {
  const { peta, sorotan, error } = useBeranda();

  return (
    <figure style={{ margin: 0, width: "min(46vw, 580px)" }}>
      {/* Konteks posisi TETAP setinggi kartu peta saja (bukan setinggi figure
         beserta figcaption) — supaya "bottom"/"right" pada dekorasi di bawah
         ini selalu menempel ke tepi peta, bukan ikut mundur ketika teks
         keterangan di bawahnya berganti tinggi. */}
      <div style={{ position: "relative", width: "100%", height: TINGGI_KARTU }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            // Sudut kiri-bawah sengaja nyaris tajam (radius kecil) — elemen
            // "gigitan" di bawah ini yang menggambar lekukan cekungnya. Tiga
            // sudut lain memakai radius besar, bahasa yang sama dengan kartu
            // lain di sistem modern.
            borderRadius: "var(--r-lg) var(--r-lg) var(--r-xs) var(--r-lg)",
            border: "1px solid var(--rule-soft)",
            boxShadow: "var(--shadow-lift)",
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

        {/* Gigitan: bujur sangkar kecil di sudut kiri-bawah, warna latar
           halaman, dengan satu sudutnya (kanan-atas, menghadap ke dalam
           kartu) dibulatkan penuh. Itu yang membuat sudut kartu di baliknya
           terbaca sebagai "digigit lingkaran", bukan sekadar dipotong lurus —
           teknik CSS umum untuk potongan organik tanpa memotong konten
           sungguhan (kontennya, MapLibre, tetap persegi utuh di dalam
           `overflow:hidden` di atas). */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            width: GIGITAN,
            height: GIGITAN,
            background: "var(--paper)",
            borderTopRightRadius: "100%",
          }}
        />

        {/* Kartu kecil mengambang di dalam gigitan — padanan foto sekunder
           pada referensi, tapi isinya data sungguhan (angka sorotan), bukan
           hiasan. */}
        {sorotan && (
          <div
            className="card"
            style={{
              position: "absolute",
              left: -24,
              bottom: -24,
              width: 232,
              padding: "12px var(--s2)",
            }}
          >
            <div className="eyebrow" style={{ marginBottom: 4 }}>
              {sorotan.namaStasiun}
            </div>
            {/* 17px, bukan 20px — pada nilai terpanjang ("Rp 950 rb – Rp 1,7
               jt") 20px meluber ke luar kartu dan tumpang tindih dengan
               atribusi MapLibre di baliknya. */}
            <div
              className="fig"
              style={{
                font: `600 17px/1.15 var(--font-mono), ui-monospace, monospace`,
                letterSpacing: "-0.02em",
                color: "var(--data)",
                whiteSpace: "nowrap",
              }}
            >
              {rentangRingkas(sorotan.metric.gap)}
            </div>
            <div
              style={{
                marginTop: 2,
                fontSize: "var(--t-micro)",
                color: "var(--ink-faint)",
              }}
            >
              kesenjangan / hari
            </div>
          </div>
        )}

        {/* Badge cincin — chrome dekoratif, padanan "AWARD WINNING" pada
           referensi. Mengambang di sudut berlawanan dari gigitan supaya
           keduanya tidak berebut ruang. */}
        <div style={{ position: "absolute", top: -18, right: -18 }}>
          <BadgeCincin teks="Pengukuran lapangan · Data langsung · " />
        </div>
      </div>

      {/* Keterangan lengkap di BAWAH kartu — kartu kecil di dalam gigitan cuma
         "sekilas", ini tetap sumber lengkapnya: nama titik, rentang penuh
         dengan tiga label (P10/median/P90). */}
      {sorotan && (
        <figcaption style={{ marginTop: 40 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            {sorotan.namaStasiun} · {sorotan.namaTitik}
          </div>
          <div
            className="fig"
            style={{
              font: `600 clamp(22px, 2.1vw, 28px)/1 var(--font-mono), ui-monospace, monospace`,
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
          <div style={{ marginTop: 12 }}>
            <RangeBar range={sorotan.metric.gap} animate />
          </div>
        </figcaption>
      )}
    </figure>
  );
}
