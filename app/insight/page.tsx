import { type CSSProperties, type ReactNode } from "react";
import Link from "next/link";

import { NavBar } from "@/components/NavBar";
import { KepalaBab } from "@/components/paper/KepalaBab";
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
 * Insight — layar "membaca", di sistem desain "laporan instrumen" (kertas
 * hangat, tangga tipografi/ruang/radius sungguhan, angka monospace, garis-
 * rambut menggantikan isi kartu). Dimigrasi dari sistem lama satu layar per
 * kali (ROADMAP §7); Beranda sudah pindah lebih dulu.
 *
 * Halaman ini tetap **server component**. Sifat client dikurung di komponen
 * daun (`components/insight/InsightBagian.tsx`), yang membaca satu provider —
 * `InsightData` → `usePetaData()` + `lib/analytics/select.ts`. Tidak ada satu
 * pun angka yang dihitung di JSX; semuanya dipetik dari payload, cakupan dua
 * simpul (Manggarai + Sudirman).
 *
 * Prinsip komposisi (sama dengan Beranda): sistem kecil tetap — satu ritme
 * `--s6`, satu tangga tipografi, keluarga `.kartu`, kicker bernomor
 * `KepalaBab`, latar section pastel, angka `.fig` — dan tiap section
 * komposisinya BEDA, judul selang-seling kiri/kanan.
 */

/** Penekanan lewat garis bawah emas, bukan warna teks — biru dikunci untuk data. */
const garisEmas: CSSProperties = {
  textDecoration: "underline",
  textDecorationColor: "var(--brand)",
  textDecorationThickness: 4,
  textUnderlineOffset: 6,
};

/** Cangkang section: latar pastel full-bleed + `.wrap` yang membawa ritme `--s6`. */
function Bab({ tile, children }: { tile?: string; children: ReactNode }) {
  return (
    <section className="reveal" style={tile ? { background: tile } : undefined}>
      <div
        className="wrap"
        style={{ paddingTop: "var(--s6)", paddingBottom: "var(--s6)" }}
      >
        {children}
      </div>
    </section>
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

        {/* ================================================================
            Hero — dua kolom: tulisan di KIRI, kartu tinta ringkasan di KANAN.
            Bukan peta (itu milik Beranda) — panel angka di atas latar tinta,
            satu-satunya ketukan gelap sebelum section pertama.
            ================================================================ */}
        <section
          className="wrap reveal"
          style={{
            paddingTop: "clamp(40px, 5vw, 72px)",
            paddingBottom: "var(--s6)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.15fr) minmax(0, 0.85fr)",
              gap: "var(--s5)",
              alignItems: "center",
            }}
          >
            <div>
              <div>
                <Lencana label="Bacaan lapangan" warna="brand" dot />
              </div>
              <h1
                style={{
                  font: "800 var(--t-display)/1.02 var(--font-inter), system-ui, sans-serif",
                  letterSpacing: "-0.028em",
                  margin: "var(--s3) 0 0",
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
                yang terbaca dari keduanya — kesenjangan belanja per pintu,
                profil tiap slot waktu, dan kategori yang permintaannya ada tapi
                gerainya belum. Temuan yang datanya tipis ditandai, bukan
                disembunyikan.
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
            </div>

            <HeroKartu />
          </div>

          <p
            style={{
              margin: "var(--s5) 0 0",
              fontSize: "var(--t-small)",
              lineHeight: 1.6,
              color: "var(--ink-faint)",
            }}
          >
            Setiap angka adalah rentang P10–P90, bukan satu titik, dan bisa
            ditelusuri sampai ke pintunya di peta.
          </p>
        </section>

        {/* ================================================================
            1 · Duduk perkara — `--tile-sky`. Arketipe: BATANG BERSARANG.
            Potensi utuh, bagian yang tertangkap terisi, sisanya ADALAH
            kesenjangan. Judul di KANAN (`align="right"`).
            ================================================================ */}
        <Bab tile="var(--tile-sky)">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 0.85fr)",
              gap: "var(--s5)",
              alignItems: "center",
            }}
          >
            <BatangBersarang />

            <div>
              <KepalaBab
                n={1}
                align="right"
                kicker="Duduk perkara"
                judul="Selisih terbesar ada di pintu yang paling ramai."
              />
              <p
                style={{
                  margin: "calc(var(--s3) - var(--s4)) 0 0 auto",
                  maxWidth: "38ch",
                  fontSize: "var(--t-small)",
                  lineHeight: 1.6,
                  color: "var(--ink-2)",
                  textAlign: "right",
                }}
              >
                Gerai di dalam stasiun menangkap sekitar sepertiga dari potensi
                belanja yang lewat pintu terbesar. Sisanya adalah batas atas
                peluang pendapatan non-tiket yang belum diambil.
              </p>
            </div>
          </div>
        </Bab>

        {/* ================================================================
            2 · Profil tiap slot — `--tile-mint`. Header selebar section (judul
            KIRI), lalu badan dua kolom: diagram kolom + daftar temuan bernomor
            dengan kartu sorot sampel tipis.
            ================================================================ */}
        <Bab tile="var(--tile-mint)">
          <KepalaBab
            n={2}
            kicker="Yang terbaca per slot"
            judul="Pagi menahan kesenjangan terbesar."
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.15fr) minmax(0, 0.85fr)",
              gap: "var(--s5)",
              alignItems: "start",
            }}
          >
            <KolomSlot />
            <DaftarTemuan />
          </div>
        </Bab>

        {/* ================================================================
            3 · Kategori di tiap simpul — `--tile-violet`. Header selebar
            section (judul KIRI, garis-rambut setengah), lalu matriks garis-
            rambut: gap 1px di atas `--rule`, tiap sel `--surface`. Tanpa
            border, tanpa header gelap, tanpa pill berwarna.
            ================================================================ */}
        <Bab tile="var(--tile-violet)">
          <KepalaBab
            n={3}
            halfRule
            kicker="Kategori yang belum terisi"
            judul="Permintaannya terbaca, gerainya belum ada."
          />
          <MatriksKategori />
          <p
            style={{
              margin: "var(--s3) 0 0",
              fontSize: "var(--t-small)",
              lineHeight: 1.55,
              color: "var(--ink-muted)",
            }}
          >
            Terisi · Kurang · Kosong dibaca dari jumlah gerai yang tercacah di
            lapangan terhadap ambang 3 gerai per kategori, bukan dari data sewa.
            Permintaan adalah porsi permintaan kawasan untuk kategori itu.
          </p>
        </Bab>

        {/* ================================================================
            Penutup — band tinta pendek, satu kalimat + tautan.
            ================================================================ */}
        <section
          className="ink-band reveal"
          style={{ paddingTop: "var(--s5)", paddingBottom: "var(--s5)" }}
        >
          <div
            className="wrap row"
            style={{
              justifyContent: "space-between",
              gap: "var(--s3)",
              flexWrap: "wrap",
            }}
          >
            <p
              style={{
                margin: 0,
                font: "800 var(--t-h3)/1.15 var(--font-inter), system-ui, sans-serif",
                letterSpacing: "-0.02em",
                maxWidth: "24ch",
              }}
            >
              Tiap angka di sini bisa ditelusuri ke pintunya di peta.
            </p>
            <Link
              href="/peta"
              className="b bp"
              style={{ padding: "14px 24px", fontSize: 14 }}
            >
              Buka di peta
            </Link>
          </div>
        </section>

        <footer
          className="wrap row"
          style={{
            justifyContent: "space-between",
            gap: "var(--s3)",
            flexWrap: "wrap",
            padding: "var(--s3) var(--page-x) var(--s4)",
          }}
        >
          <span style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>
            Isi Stasiun · dibangun di atas GEO MAPID · seluruh angka pada halaman
            ini bersifat ilustratif
          </span>
          <div
            className="row"
            style={{ gap: "var(--s3)", flexWrap: "wrap" }}
          >
            <JejakInsight />
            <Link
              href="/metodologi"
              style={{ fontSize: 11.5, fontWeight: 600, color: "var(--data)" }}
            >
              Lanjut ke metodologi →
            </Link>
          </div>
        </footer>
      </div>
    </InsightData>
  );
}
