import type { CSSProperties } from "react";
import Link from "next/link";

import { NavBar } from "@/components/NavBar";
import { Lencana } from "@/components/paper/Lencana";
import { InsightData } from "@/components/insight/InsightData";
import {
  BatangBersarang,
  DaftarTemuan,
  HeroKartu,
  JejakInsight,
  KolomSlot,
  MatriksKategori,
} from "@/components/insight/InsightBagian";

/**
 * Insight — layar "membaca". Sistem desain sama dengan Beranda (kertas hangat,
 * palet `--data`/`--field`/`--brand`/`--ink`, tangga tipografi, angka `.fig`,
 * nav pill, reveal scroll). Tapi KOMPOSISINYA meminjam struktur halaman
 * Metodologi & Rekomendasi, bukan Beranda: hero dua kolom, lalu section
 * berisi panel/kartu DATAR di atas satu latar kertas yang seragam — header
 * section modest + catatan di kanan, grid multi-kolom yang padat. TANPA pita
 * warna full-bleed, TANPA numeral raksasa. Satu kartu tinta gelap di hero.
 *
 * "Majalah bersection (pita pastel + numeral display)" adalah perangkat khusus
 * BERANDA. Metodologi/Rekomendasi (masih sistem lama) adalah model strukturnya.
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
        marginBottom: "var(--s4)",
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
            maxWidth: "22ch",
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
            maxWidth: "34ch",
            textAlign: "right",
          }}
        >
          {catatan}
        </span>
      )}
    </div>
  );
}

/** Panel isian datar (tanpa bayangan). */
const panel: CSSProperties = {
  background: "var(--paper-2)",
  borderRadius: "var(--r-md)",
  padding: "var(--s4)",
};

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

        <div className="wrap">
          {/* ============================================================
              Hero — dua kolom, alignItems end. Tulisan kiri, kartu tinta
              ringkasan kanan (satu-satunya elemen gelap di halaman).
              ============================================================ */}
          <section
            className="reveal"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 400px)",
              gap: "var(--s5)",
              alignItems: "end",
              paddingTop: "clamp(40px, 5vw, 72px)",
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
                  maxWidth: "18ch",
                }}
              >
                Apa yang <span style={garisEmas}>terbaca</span> dari dua simpul.
              </h1>
              <p
                style={{
                  margin: "var(--s4) 0 0",
                  maxWidth: "56ch",
                  fontSize: "var(--t-lead)",
                  lineHeight: 1.62,
                  color: "var(--ink-2)",
                }}
              >
                Manggarai dan Sudirman sudah dicacah penuh. Halaman ini merangkum
                yang terbaca dari keduanya — kesenjangan belanja per pintu,
                profil tiap slot waktu, dan kategori yang permintaannya ada tapi
                gerainya belum. Temuan yang datanya tipis ditandai, bukan
                disembunyikan.
              </p>
            </div>

            <HeroKartu />
          </section>

          {/* ============================================================
              Duduk perkara — panel batang bersarang.
              ============================================================ */}
          <section className="reveal" style={{ marginTop: "var(--s6)" }}>
            <Kepala
              kicker="Duduk perkara"
              judul="Selisih terbesar ada di pintu yang paling ramai."
              catatan="Gerai di dalam stasiun menangkap sekitar sepertiga potensi yang lewat pintu terbesar; sisanya batas atas peluang pendapatan non-tiket."
            />
            <div style={panel}>
              <BatangBersarang />
            </div>
          </section>

          {/* ============================================================
              Profil per slot — diagram kolom + kartu temuan.
              ============================================================ */}
          <section className="reveal" style={{ marginTop: "var(--s5)" }}>
            <Kepala
              kicker="Profil per slot"
              judul="Pagi menahan kesenjangan terbesar."
              catatan="Kesenjangan per slot di pintu dengan selisih terbesar, pada satu skala rupiah bersama."
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1.25fr) minmax(0, 1fr)",
                gap: "var(--s3)",
                alignItems: "start",
              }}
            >
              <div style={panel}>
                <KolomSlot />
              </div>
              <div className="kartu" style={{ padding: "var(--s4)" }}>
                <DaftarTemuan />
              </div>
            </div>
          </section>

          {/* ============================================================
              Kategori yang belum terisi — matriks baris bertumpuk.
              ============================================================ */}
          <section className="reveal" style={{ marginTop: "var(--s5)" }}>
            <Kepala
              kicker="Kategori yang belum terisi"
              judul="Permintaannya terbaca, gerainya belum ada."
              catatan="Terisi · Kurang · Kosong dibaca dari jumlah gerai yang tercacah terhadap ambang 3 per kategori, bukan dari data sewa."
            />
            <MatriksKategori />
            <div
              style={{
                display: "flex",
                gap: "var(--s2)",
                alignItems: "flex-start",
                marginTop: "var(--s3)",
                maxWidth: "72ch",
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
                Dibaca di pintu berkesenjangan terbesar tiap simpul. Kolom
                Permintaan adalah porsi permintaan kawasan untuk kategori itu.
              </span>
            </div>
          </section>

          {/* ============================================================
              Penutup — grid 1fr 320px, di atas kertas.
              ============================================================ */}
          <section
            className="reveal"
            style={{
              marginTop: "var(--s6)",
              paddingTop: "var(--s5)",
              borderTop: "1px solid var(--rule)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) minmax(0, 320px)",
                gap: "var(--s5)",
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
              marginTop: "var(--s5)",
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
