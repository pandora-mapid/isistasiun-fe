import type { CSSProperties } from "react";
import Link from "next/link";

import { NavBar } from "@/components/NavBar";
import { Lencana } from "@/components/paper/Lencana";
import { InsightData } from "@/components/insight/InsightData";
import {
  BatangBersarang,
  DaftarTemuan,
  JejakInsight,
  KolomSlot,
  MatriksKategori,
  RingkasInsight,
} from "@/components/insight/InsightBagian";

/**
 * Insight — layar "membaca". Sistem desain sama dengan Beranda (kertas hangat,
 * palet `--data`/`--field`/`--brand`/`--ink`, tangga tipografi, angka `.fig`,
 * nav pill, reveal scroll), TAPI komposisinya sengaja BEDA.
 *
 * Beranda = majalah bersection: pita pastel full-bleed, numeral raksasa,
 * tiap section arketipe sendiri, judul selang-seling. Cocok untuk halaman
 * pendaratan. Insight = esai yang MENGALIR: satu kolom baca sempit di tengah
 * kertas, dari atas ke bawah, gerakan dipisah garis-rambut + napas saja,
 * grafik telanjang menyatu dalam alur teks. "Latar section pastel / komposisi
 * beda per section" adalah aturan BERANDA, bukan aturan sistem kertas.
 *
 * Tetap **server component**. Sifat client dikurung di komponen daun
 * (`components/insight/InsightBagian.tsx`) yang membaca `InsightData` →
 * `usePetaData()` + `lib/analytics/select.ts`. Tidak ada angka yang dihitung
 * di JSX; semuanya dipetik, cakupan dua simpul (Manggarai + Sudirman).
 */

/** Penekanan lewat garis bawah emas, bukan warna teks — biru dikunci untuk data. */
const garisEmas: CSSProperties = {
  textDecoration: "underline",
  textDecorationColor: "var(--brand)",
  textDecorationThickness: 4,
  textUnderlineOffset: 6,
};

/** Kolom baca — sempit, di tengah. Prosa di dalamnya lebih sempit lagi (`.measure`). */
const KOLOM: CSSProperties = {
  maxWidth: 960,
  margin: "0 auto",
  paddingInline: "var(--page-x)",
};

/** Awal tiap gerakan: garis-rambut + napas. Cukup itu — tidak ada pita warna. */
const gerakan: CSSProperties = {
  marginTop: "var(--s5)",
  paddingTop: "var(--s5)",
  borderTop: "1px solid var(--rule)",
};

const prosa: CSSProperties = {
  margin: 0,
  fontSize: "var(--t-body)",
  lineHeight: 1.68,
  color: "var(--ink-2)",
};

/** Kepala gerakan — kicker kecil + judul. Tanpa numeral, tanpa garis sendiri. */
function Kepala({ kicker, judul }: { kicker: string; judul: string }) {
  return (
    <div style={{ marginBottom: "var(--s4)" }}>
      <div className="eyebrow">{kicker}</div>
      <h2
        style={{
          font: "800 var(--t-h3)/1.18 var(--font-inter), system-ui, sans-serif",
          letterSpacing: "-0.015em",
          margin: "var(--s2) 0 0",
          maxWidth: "30ch",
        }}
      >
        {judul}
      </h2>
    </div>
  );
}

export default function InsightPage() {
  return (
    <InsightData>
      <div className="page-canvas paper-canvas">
        <NavBar
          active="insight"
          cta={
            <Link href="/peta" className="b bp">
              Buka di peta
            </Link>
          }
        />

        <div style={KOLOM}>
          {/* ============================================================
              Masthead — kicker chip, judul, lede, panel ringkas. Semua di
              kolom yang sama, tanpa kolom kedua, tanpa kartu tinta.
              ============================================================ */}
          <header
            className="reveal"
            style={{ paddingTop: "clamp(40px, 5vw, 72px)" }}
          >
            <Lencana
              label="Bacaan lapangan · Manggarai + Sudirman"
              warna="brand"
              dot
            />
            <h1
              style={{
                font: "800 var(--t-h1)/1.05 var(--font-inter), system-ui, sans-serif",
                letterSpacing: "-0.025em",
                margin: "var(--s3) 0 0",
                maxWidth: "16ch",
              }}
            >
              Apa yang <span style={garisEmas}>terbaca</span> dari dua simpul.
            </h1>
            <p
              className="measure"
              style={{
                margin: "var(--s4) 0 0",
                fontSize: "var(--t-lead)",
                lineHeight: 1.62,
                color: "var(--ink-2)",
              }}
            >
              Manggarai dan Sudirman sudah dicacah penuh. Halaman ini merangkum
              yang terbaca dari keduanya — kesenjangan belanja per pintu, profil
              tiap slot waktu, dan kategori yang permintaannya ada tapi gerainya
              belum. Temuan yang datanya tipis ditandai, bukan disembunyikan.
            </p>

            <RingkasInsight />

            <p
              style={{
                margin: "var(--s4) 0 0",
                fontSize: "var(--t-small)",
                lineHeight: 1.6,
                color: "var(--ink-faint)",
                maxWidth: "56ch",
              }}
            >
              Setiap angka adalah rentang P10–P90, bukan satu titik, dan bisa
              ditelusuri sampai ke pintunya di peta.
            </p>
          </header>

          {/* ============================================================
              Duduk perkara — batang bersarang potensi / tertangkap / gap.
              ============================================================ */}
          <section className="reveal" style={gerakan}>
            <Kepala
              kicker="Duduk perkara"
              judul="Selisih terbesar ada di pintu yang paling ramai."
            />
            <p className="measure" style={prosa}>
              Gerai di dalam stasiun menangkap sekitar sepertiga dari potensi
              belanja yang lewat pintu terbesar. Sisanya adalah batas atas
              peluang pendapatan non-tiket yang belum diambil.
            </p>
            <div style={{ marginTop: "var(--s5)" }}>
              <BatangBersarang />
            </div>
          </section>

          {/* ============================================================
              Profil per slot — diagram kolom + daftar temuan.
              ============================================================ */}
          <section className="reveal" style={gerakan}>
            <Kepala
              kicker="Profil per slot"
              judul="Pagi menahan kesenjangan terbesar."
            />
            <p className="measure" style={prosa}>
              Kesenjangan tidak rata sepanjang hari. Slot pagi menahan bagian
              terbesarnya di pintu dengan selisih tertinggi, justru saat arus
              paling deras.
            </p>
            <div style={{ marginTop: "var(--s5)" }}>
              <KolomSlot />
            </div>
            <DaftarTemuan />
          </section>

          {/* ============================================================
              Kategori yang belum terisi — matriks tabel editorial polos.
              ============================================================ */}
          <section className="reveal" style={gerakan}>
            <Kepala
              kicker="Kategori yang belum terisi"
              judul="Permintaannya terbaca, gerainya belum ada."
            />
            <p className="measure" style={prosa}>
              Survei lapangan mencatat berapa gerai tiap kategori di pintu
              terbesar tiap simpul, lalu membandingkannya dengan porsi permintaan
              kawasan. Beberapa kategori dengan permintaan jelas belum punya
              gerai sama sekali.
            </p>
            <MatriksKategori />
            <p
              style={{
                margin: "var(--s3) 0 0",
                fontSize: "var(--t-small)",
                lineHeight: 1.55,
                color: "var(--ink-muted)",
                maxWidth: "64ch",
              }}
            >
              Terisi · Kurang · Kosong dibaca dari jumlah gerai yang tercacah di
              lapangan terhadap ambang 3 gerai per kategori, bukan dari data
              sewa. Permintaan adalah porsi permintaan kawasan untuk kategori
              itu.
            </p>
          </section>

          {/* ============================================================
              Penutup — di atas kertas, bukan band tinta.
              ============================================================ */}
          <section
            className="reveal"
            style={{ ...gerakan, paddingBottom: "var(--s6)" }}
          >
            <p
              style={{
                margin: 0,
                font: "800 var(--t-h3)/1.2 var(--font-inter), system-ui, sans-serif",
                letterSpacing: "-0.015em",
                maxWidth: "28ch",
              }}
            >
              Tiap angka di sini bisa ditelusuri ke pintunya di peta.
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "var(--s1)",
                marginTop: "var(--s4)",
              }}
            >
              <Link
                href="/peta"
                className="b bp"
                style={{ padding: "14px 24px", fontSize: 14 }}
              >
                Buka di peta
              </Link>
              <Link
                href="/metodologi"
                className="b bs"
                style={{ padding: "14px 24px", fontSize: 14 }}
              >
                Baca metodologi
              </Link>
            </div>
          </section>

          <footer
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "var(--s3)",
              flexWrap: "wrap",
              paddingTop: "var(--s4)",
              paddingBottom: "var(--s5)",
              borderTop: "1px solid var(--rule)",
            }}
          >
            <span style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>
              Isi Stasiun · dibangun di atas GEO MAPID · seluruh angka pada
              halaman ini bersifat ilustratif
            </span>
            <JejakInsight />
          </footer>
        </div>
      </div>
    </InsightData>
  );
}
