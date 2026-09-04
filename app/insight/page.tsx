import type { CSSProperties } from "react";
import Link from "next/link";

import { NavBar } from "@/components/NavBar";
import { Lencana } from "@/components/paper/Lencana";
import { InsightData } from "@/components/insight/InsightData";
import {
  BatangBersarang,
  DaftarTemuan,
  HeroKartu,
  InstrumenSlot,
  JejakInsight,
  KolomSlot,
  KpiStrip,
  MatriksKategori,
  PeringkatPintu,
  SorotanKategori,
} from "@/components/insight/InsightBagian";

/**
 * Insight — layar "membaca". Sistem desain sama dengan Beranda (kertas hangat,
 * palet `--data`/`--field`/`--brand`/`--ink` + pastel `--tile-*`, tangga
 * tipografi, angka `.fig`, nav pill, reveal scroll). KOMPOSISINYA meminjam
 * struktur DAN kepadatan halaman Metodologi & Rekomendasi: TANPA `.wrap` —
 * section membentang selebar layar dengan gutter `--page-x`, jarak antar-
 * section rapat (`--s4`), dan tiap section satu grid berisi beberapa kartu.
 *
 * Putaran 4 menjawab tiga hal: (1) terlalu banyak ruang kosong → full-width +
 * rapat; (2) cuma satu warna → mayoritas palet Beranda dipakai sebagai latar
 * kartu yang BERGILIR (`--tile-sky/-mint/-violet/-rose`, `--data-wash`,
 * `--field-wash`, `--paper-2`, satu kartu `.ink-band`) di atas SATU latar
 * kertas seragam — bukan pita full-bleed, jadi bukan "pemisahan halaman";
 * (3) kurang "analytics" → strip KPI, peringkat batang per pintu (idiom
 * "Urutan prioritas" Rekomendasi), pembacaan instrumen F×E×C×V (idiom kartu
 * persamaan Metodologi), kolom "Menahan" di matriks kategori.
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

/** Padding section: membentang selebar layar, gutter `--page-x` (sejajar nav). */
const seksi: CSSProperties = { padding: "0 var(--page-x) var(--s4)" };

/** Kartu isian datar bertint (tanpa bayangan). */
function tint(bg: string): CSSProperties {
  return {
    background: bg,
    borderRadius: "var(--r-md)",
    padding: "var(--s3)",
  };
}

/** Header section: kicker + judul modest (BUKAN numeral) + catatan rata kanan. */
function Kepala({
  kicker,
  judul,
  catatan,
}: {
  kicker: string;
  judul: string;
  catatan?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: "var(--s4)",
        marginBottom: "var(--s3)",
        flexWrap: "wrap",
      }}
    >
      <div>
        <div className="eyebrow" style={{ marginBottom: "var(--s2)" }}>
          {kicker}
        </div>
        <h2
          style={{
            font: "800 clamp(25px, 2.5vw, 32px)/1.12 var(--font-inter), system-ui, sans-serif",
            letterSpacing: "-0.02em",
            margin: 0,
            maxWidth: "24ch",
          }}
        >
          {judul}
        </h2>
      </div>
      {catatan && (
        <span
          style={{
            fontSize: "var(--t-small)",
            lineHeight: 1.5,
            color: "var(--ink-muted)",
            maxWidth: "38ch",
            textAlign: "right",
          }}
        >
          {catatan}
        </span>
      )}
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

        {/* ============================================================
            Hero — dua kolom + strip KPI. Tulisan kiri, kartu tinta
            ringkasan kanan (satu-satunya elemen gelap di halaman).
            ============================================================ */}
        <section
          className="reveal"
          style={{
            padding: "clamp(28px, 3.5vw, 52px) var(--page-x) var(--s4)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(0, 1fr) minmax(0, clamp(340px, 30vw, 420px))",
              gap: "var(--s4)",
              alignItems: "end",
            }}
          >
            <div>
              <Lencana
                label="Bacaan lapangan · Manggarai + Sudirman"
                warna="brand"
                dot
              />
              <h1
                style={{
                  font: "800 var(--t-h1)/1.04 var(--font-inter), system-ui, sans-serif",
                  letterSpacing: "-0.025em",
                  margin: "var(--s3) 0 0",
                  maxWidth: "17ch",
                }}
              >
                Apa yang <span style={garisEmas}>terbaca</span> dari dua simpul.
              </h1>
              <p
                style={{
                  margin: "var(--s3) 0 0",
                  maxWidth: "54ch",
                  fontSize: "var(--t-body)",
                  lineHeight: 1.6,
                  color: "var(--ink-2)",
                }}
              >
                Manggarai dan Sudirman sudah dicacah penuh. Halaman ini membaca
                keduanya — kesenjangan belanja per pintu, profil tiap slot, dan
                kategori yang permintaannya ada tapi gerainya belum. Yang
                datanya tipis ditandai, bukan disembunyikan.
              </p>
            </div>

            <HeroKartu />
          </div>

          <div style={{ marginTop: "var(--s4)" }}>
            <KpiStrip />
          </div>
        </section>

        {/* ============================================================
            1 · Duduk perkara — peringkat pintu + batang bersarang.
            ============================================================ */}
        <section className="reveal" style={seksi}>
          <Kepala
            kicker="Duduk perkara"
            judul="Selisih terbesar ada di pintu yang paling ramai."
            catatan="Gerai di dalam stasiun menangkap sekitar sepertiga potensi yang lewat pintu terbesar; sisanya batas atas peluang pendapatan non-tiket."
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.55fr) minmax(0, 1fr)",
              gap: "var(--s2)",
              alignItems: "start",
            }}
          >
            <div className="kartu" style={{ padding: "var(--s3)" }}>
              <PeringkatPintu />
            </div>
            <div style={tint("var(--data-wash)")}>
              <div className="eyebrow" style={{ marginBottom: "var(--s3)" }}>
                Pintu terbesar · sehari
              </div>
              <BatangBersarang />
            </div>
          </div>
        </section>

        {/* ============================================================
            2 · Profil per slot — kolom slot + instrumen + temuan.
            ============================================================ */}
        <section className="reveal" style={seksi}>
          <Kepala
            kicker="Profil per slot"
            judul="Pagi menahan kesenjangan terbesar."
            catatan="Kesenjangan per slot di pintu dengan selisih terbesar, dan instrumen F × E × C × V yang menyusunnya."
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(0, 1fr) minmax(0, 1.1fr) minmax(0, 1fr)",
              gap: "var(--s2)",
              alignItems: "start",
            }}
          >
            <div style={tint("var(--tile-sky)")}>
              <div className="eyebrow" style={{ marginBottom: "var(--s3)" }}>
                Kesenjangan per slot
              </div>
              <KolomSlot />
            </div>
            <div style={tint("var(--data-wash)")}>
              <InstrumenSlot />
            </div>
            <div className="kartu" style={{ padding: "var(--s3)" }}>
              <DaftarTemuan />
            </div>
          </div>
        </section>

        {/* ============================================================
            3 · Kategori yang belum terisi — matriks + sorotan.
            ============================================================ */}
        <section className="reveal" style={seksi}>
          <Kepala
            kicker="Kategori yang belum terisi"
            judul="Permintaannya terbaca, gerainya belum ada."
            catatan="Terisi · Kurang · Kosong dibaca dari jumlah gerai yang tercacah terhadap ambang 3 per kategori, bukan dari data sewa."
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 300px)",
              gap: "var(--s2)",
              alignItems: "start",
            }}
          >
            <MatriksKategori />
            <div style={tint("var(--tile-violet)")}>
              <SorotanKategori />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: "var(--s2)",
              alignItems: "flex-start",
              marginTop: "var(--s3)",
              maxWidth: "82ch",
            }}
          >
            <span
              className="dot"
              style={{ background: "var(--ink-faint)", marginTop: 6 }}
            />
            <span
              style={{
                fontSize: "var(--t-small)",
                lineHeight: 1.5,
                color: "var(--ink-muted)",
              }}
            >
              Dibaca di pintu berkesenjangan terbesar tiap simpul pada slot
              pagi. Kolom Menahan adalah kesenjangan kategori itu pada slot
              tersebut; Permintaan adalah porsi permintaan kawasan untuknya.
            </span>
          </div>
        </section>

        {/* ============================================================
            Penutup — grid 1fr 320px, di atas kertas.
            ============================================================ */}
        <section
          className="reveal"
          style={{
            padding: "var(--s4) var(--page-x)",
            borderTop: "1px solid var(--rule)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 320px)",
              gap: "var(--s4)",
              alignItems: "end",
            }}
          >
            <div>
              <div className="eyebrow" style={{ marginBottom: "var(--s3)" }}>
                Langkah berikutnya
              </div>
              <h2
                style={{
                  font: "800 clamp(25px, 2.5vw, 32px)/1.12 var(--font-inter), system-ui, sans-serif",
                  letterSpacing: "-0.02em",
                  margin: 0,
                  maxWidth: "24ch",
                }}
              >
                Tiap angka di sini bisa ditelusuri ke pintunya di peta.
              </h2>
            </div>
            <div>
              <p
                style={{
                  margin: "0 0 var(--s3)",
                  fontSize: "var(--t-small)",
                  lineHeight: 1.6,
                  color: "var(--ink-2)",
                }}
              >
                Buka salah satu angka di peta untuk melihat pintunya, slotnya,
                dan foto aslinya.
              </p>
              <div
                style={{ display: "flex", flexWrap: "wrap", gap: "var(--s1)" }}
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
            </div>
          </div>
        </section>

        <footer
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "var(--s3)",
            flexWrap: "wrap",
            padding: "var(--s3) var(--page-x) var(--s4)",
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
    </InsightData>
  );
}
