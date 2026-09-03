import Link from "next/link";
import type { ReactNode } from "react";

import { NavBar } from "@/components/NavBar";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { BerandaData } from "@/components/beranda/BerandaData";
import { HeroPeta } from "@/components/beranda/HeroPeta";
import { Jejak } from "@/components/beranda/Jejak";
import { KickerBernomor } from "@/components/beranda/KickerBernomor";
import { PerbandinganSimpul } from "@/components/beranda/PerbandinganSimpul";
import { Persamaan } from "@/components/beranda/Persamaan";
import {
  RelStatistikAngka,
  RelStatistikKutipan,
} from "@/components/beranda/RelStatistik";

/**
 * Beranda.
 *
 * Halaman ini tetap **server component**. Sifat client dikurung di komponen
 * daun — `HeroPeta`, `Persamaan`, `PerbandinganSimpul`, `RelStatistik`,
 * `Jejak` — yang semuanya membaca satu provider di atasnya. Anak yang dioper
 * ke `BerandaData` tetap dirender di server.
 *
 * **Putaran keenam ("bento") merombak kerangkanya, bukan cuma kulitnya.**
 * Lima putaran sebelumnya (editorial → modern) memperbaiki tipografi, warna,
 * radius, bayangan — tapi tetap berdiri di atas satu kerangka yang sama:
 * `wrap > g12 (12 kolom) > Rubrik (kolom sticky) + konten`, section demi
 * section berbaris vertikal seragam, sebagian full-bleed berganti tint.
 * `Rubrik()` — sumber kolom sticky itu — sudah dihapus dari file ini.
 * Sebagai gantinya, hampir semua section sekarang satu `.bento`: grid
 * 4-kolom berisi ubin berukuran campuran (lihat `globals.css` untuk
 * `--tile-*`/`--r-xl`/`.bento-tile`), radius seragam.
 *
 * **Putaran ketujuh menjawab dua hal yang muncul begitu putaran keenam
 * terlihat: hero yang dipusatkan ternyata dirindukan sebagai dua kolom
 * (peta kembali di kiri, teks di kanan — dibalik dari sebelum putaran 6),
 * dan section-section bento-nya terasa monoton — resep yang sama (kicker →
 * judul → baris N-ubin-sama-besar di atas kertas polos) diulang tanpa
 * berubah dari satu topik ke topik berikutnya.** Jawabannya BUKAN menambah
 * warna baru (variasi warna putaran 6 sudah disukai, dipertahankan persis),
 * tapi memvariasikan DUA hal berbeda per section: latar section (sebagian
 * full-bleed `--tile-*`, sebagian kertas polos) dan pola komposisinya
 * (baris ubin sama besar, ubin asimetris, teks-sempit+ubin, daftar-polos+
 * kartu-unggulan) — lihat komentar di setiap section untuk pola spesifiknya.
 *
 * **Putaran kesembilan** mencoba numeral raksasa PUDAR di belakang tiap judul
 * (`01`–`05`, dipotong tepi) + "judul di kanan / isi di kiri" di tiga
 * section + hero dengan dua elemen separuh-keluar. User menolak semuanya.
 *
 * **Putaran kesepuluh** menyeragamkan kelima section (header selebar section
 * → garis-rambut → isi lebar penuh). User menolak: "sekali mengganti,
 * semuanya ikut, jadinya MONOTON".
 *
 * **Putaran kesebelas — komposisi berbeda per section (riset: DESIGN.md
 * Linear/Stripe/Notion/Figma/PostHog, Klim, "Wealth shown to scale", PolicyViz
 * small-multiples, CSS stacked cards).** Prinsip: koherensi di SISTEM kecil
 * yang tetap, variasi di KOMPOSISI. Tiap section arketipe BEDA + judul
 * selang-seling kiri/kanan: angka-raksasa / foto+overlap / kartu staggered +
 * skala bersama / kartu-highlight disandingkan daftar / tumpukan kartu
 * bergeser. Keluarga kartu `.kartu` (garis-rambut, tanpa bayangan) jadi
 * benang merah yang menyatukan.
 *
 * **Putaran kedua belas — refinement:** (1) nomor bab keluar dari pil kicker
 * & fontnya diperbesar sendiri (`KickerBernomor`). (2) Instrumen (Persamaan)
 * jadi bab bernomor — seluruh section RENOMOR (1 Duduk / 2 Instrumen / 3 Cara
 * datanya / 4 Yang sudah dicacah / 5 Dari peta ke keputusan / 6 Untuk siapa).
 * (3) `.kartu` sudutnya membulat seragam (buang sudut tajam). (4) Kolofon
 * dilebarkan + dirapatkan ke tengah.
 *
 * **Putaran ketiga belas:** nomor bab kehilangan em-dash (cukup angka + pil)
 * dan fontnya dinaikkan jadi numeral display besar — lihat `KickerBernomor`.
 */

/** Kicker section — chip pil polos, tanpa nomor urut kecil (nomor hidup di
 * `KepalaBab`, bukan label "1 dari N").
 *
 * `warna="ink"` untuk band tinta: `Lencana` selalu menyetel `background`
 * inline, dan inline itu menang atas aturan `.ink-band .eyebrow-chip`. Tanpa
 * varian ini, di atas band tinta pil-nya jadi krem opak dengan teks putih
 * 40% di atasnya — kotak yang isinya tak terbaca. */
function Lencana({
  label,
  warna = "netral",
  dot = false,
}: {
  label: string;
  warna?: "netral" | "brand" | "ink";
  dot?: boolean;
}) {
  const background =
    warna === "brand"
      ? "var(--brand-wash)"
      : warna === "ink"
        ? "rgba(250, 248, 244, 0.12)"
        : "var(--paper-2)";
  return (
    <span
      className="eyebrow-chip eyebrow"
      style={{
        background,
        ...(warna === "ink" ? { color: "var(--paper)" } : null),
      }}
    >
      {dot && <span className="dot" style={{ background: "var(--brand)" }} />}
      {label}
    </span>
  );
}

/** Judul section dengan ukuran dan famili yang sama di seluruh halaman. */
function Judul({ children }: { children: ReactNode }) {
  return (
    <h2
      style={{
        font: "800 var(--t-h2)/1.06 var(--font-inter), system-ui, sans-serif",
        letterSpacing: "-0.02em",
        margin: 0,
      }}
    >
      {children}
    </h2>
  );
}

/**
 * Kepala bab — kicker bernomor + judul + garis-rambut.
 *
 * Nomor bab hidup di `KickerBernomor` (putaran 12: angka di LUAR pil kicker,
 * fontnya diperbesar sendiri). `KepalaBab` tinggal menyusun kicker → judul →
 * garis-rambut. Dipakai full-width (bab 3 & 5) ATAU sebagai satu kolom grid
 * yang berselang-seling kiri/kanan (bab 1 kanan, 4 kiri, 6 kanan). Garis-
 * rambut ikut lebar wadahnya — di kolom sempit itu disengaja (gaya Klim).
 *
 * `align="right"` (bab 1) merata-kanankan kicker + judul; garis-rambut tetap
 * selebar wadah.
 */
function KepalaBab({
  n,
  kicker,
  judul,
  align = "left",
}: {
  n: number;
  kicker: string;
  judul: ReactNode;
  align?: "left" | "right";
}) {
  return (
    <div style={{ marginBottom: "var(--s4)" }}>
      <KickerBernomor n={n} kicker={kicker} align={align} />
      <div style={{ marginTop: "var(--s2)", textAlign: align }}>
        <Judul>{judul}</Judul>
      </div>
      <div
        style={{ marginTop: "var(--s3)", borderBottom: "1px solid var(--rule)" }}
      />
    </div>
  );
}

const KEPUTUSAN = [
  {
    judul: "Komposisi kategori penyewa per pintu",
    isi: "Kategori yang permintaannya terbaca tinggi namun gerainya nol jadi prioritas pertama.",
  },
  {
    judul: "Harga sewa yang mengikuti arus, bukan luas",
    isi: "Indeks sewa terhadap arus pejalan membuat perbedaan nilai antar pintu terlihat.",
  },
  {
    judul: "Jadwal aktivasi pada slot yang tepat",
    isi: "Slot dengan kesenjangan terbesar menunjukkan jam yang paling layak diisi lebih dahulu.",
  },
];

const AUDIENS = [
  {
    judul: "Operator & pengelola kawasan",
    isi: "Dasar terukur untuk komposisi kategori penyewa dan peninjauan harga sewa — kelompok yang paling langsung memakai brief per titik.",
  },
  {
    judul: "Pelaku usaha kecil",
    isi: "Akses terbuka ke informasi arus dan potensi belanja yang selama ini hanya dimiliki pihak bermodal besar.",
  },
  {
    judul: "Pemerintah daerah & perencana",
    isi: "Protokol pencacahan diterbitkan terbuka agar kota lain dapat menghasilkan lapisan setara.",
  },
];

export default function BerandaPage() {
  return (
    <BerandaData>
      <div className="page-canvas paper-canvas">
        <NavBar
          active="beranda"
          cta={
            <Link href="/peta" className="b bp">
              Buka peta
            </Link>
          }
        />

        {/* ================================================================
            Hero — dua kolom, tulisan di KIRI dan peta di KANAN (dibalik lagi
            di putaran 8 atas permintaan eksplisit user; peta juga dikecilkan —
            kolom teks lebih lebar, `alignItems: center` supaya peta tak
            diregang setinggi kolom teks). Ini pola yang KHAS milik hero —
            tidak ada section lain di halaman ini yang berbentuk dua-kolom-
            sejajar-tinggi — jadi ia sendiri sudah jadi pembeda pertama sebelum
            pembaca sampai ke section berikutnya.
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
              gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 0.9fr)",
              gap: "var(--s5)",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              {/* Dibungkus <div>: kolom ini `align-items: stretch` (bawaan
                 flex-column), jadi `Lencana` langsung akan diregang selebar
                 kolom — pil `--brand-wash`-nya melar ke ujung. <div> pembungkus
                 yang menyerap regangan; chip balik ke lebar konten. */}
              <div>
                <Lencana label="Pengukuran langsung" warna="brand" dot />
              </div>
              <h1
                style={{
                  font: "800 var(--t-display)/1.02 var(--font-inter), system-ui, sans-serif",
                  letterSpacing: "-0.028em",
                  margin: "var(--s3) 0 0",
                }}
              >
                Berapa rupiah yang{" "}
                {/* Penekanan lewat garis bawah emas, bukan warna teks. Sejak
                   biru dikunci untuk data, ia tidak boleh dipakai sekadar
                   menandai "ini penting" — emas justru sudah dicadangkan
                   untuk chrome/penekanan seperti ini. */}
                <span
                  style={{
                    textDecoration: "underline",
                    textDecorationColor: "var(--brand)",
                    textDecorationThickness: 4,
                    textUnderlineOffset: 6,
                  }}
                >
                  lewat
                </span>
                , berapa yang{" "}
                <span
                  style={{
                    textDecoration: "underline",
                    textDecorationColor: "var(--brand)",
                    textDecorationThickness: 4,
                    textUnderlineOffset: 6,
                  }}
                >
                  tertangkap
                </span>
                .
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
                Dua besaran diukur pada simpul transit yang sama, dengan
                instrumen yang sama: potensi belanja komuter, dan belanja
                yang benar-benar tertangkap gerai di dalam stasiun.
                Selisihnya adalah batas atas peluang pendapatan non-tiket.
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
                  Buka peta interaktif
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

            <HeroPeta />
          </div>

          <p
            style={{
              margin: "var(--s5) 0 0",
              fontSize: "var(--t-small)",
              lineHeight: 1.6,
              color: "var(--ink-faint)",
            }}
          >
            Setiap angka adalah rentang, bukan satu titik — dan setiap
            rentang dapat ditelusuri sampai ke foto aslinya.
          </p>
        </section>

        {/* ================================================================
            1 · Duduk perkara — full-bleed `--tile-sky`. Arketipe: ANGKA
            RAKSASA + catatan tepi. Angka yang KAMI ukur (`Rp 2,9 jt`) berdiri
            raksasa di KIRI; kicker + judul di kolom KANAN dan RATA-KANAN
            (`align="right"`), menghadap balik ke angka. Dua fakta KAI yang cuma
            DIKUTIP mengecil jadi catatan di bawahnya. (Kolom kanan — awal ritme
            selang-seling: bab 1 kanan, bab 4 kiri, bab 6 kanan.)
            ================================================================ */}
        <section className="reveal" style={{ background: "var(--tile-sky)" }}>
          <div
            className="wrap"
            style={{ paddingTop: "var(--s6)", paddingBottom: "var(--s6)" }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) minmax(0, 0.9fr)",
                gap: "var(--s5)",
                alignItems: "center",
              }}
            >
              <RelStatistikAngka />
              <div>
                <KepalaBab
                  n={1}
                  align="right"
                  kicker="Duduk perkara"
                  judul="Aset paling ramai di kota ini adalah aset yang paling sedikit diukur."
                />
                <RelStatistikKutipan />
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
            2 · Instrumen (Persamaan) — band tinta. Putaran 12: user minta
            Instrumen diperlakukan sebagai section penuh, jadi dapat nomor
            (`2 —`) seperti bab lain — nomornya ada DI DALAM `Persamaan.tsx`
            lewat `KickerBernomor`. Isi & tata letak band F×E×C×V tetap.
            ================================================================ */}
        <div className="reveal">
          <Persamaan />
        </div>

        {/* ================================================================
            3 · Cara datanya dikumpulkan — full-bleed `--field-wash`. Header
            selebar section, lalu badan DUA KOLOM — satu-satunya section yang
            badannya dua kolom: foto letterbox + kartu angka overlap di KIRI,
            dua paragraf di KANAN. (Putaran 12: Instrumen jadi bab 2, jadi
            section ini bab 3.)
            ================================================================ */}
        <section className="reveal" style={{ background: "var(--field-wash)" }}>
          <div
            className="wrap"
            style={{ paddingTop: "var(--s6)", paddingBottom: "var(--s6)" }}
          >
            <KepalaBab
              n={3}
              kicker="Cara datanya dikumpulkan"
              judul="Dua pasang mata, lalu satu mesin pembaca."
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 7fr) minmax(0, 5fr)",
                gap: "var(--s5)",
                alignItems: "start",
              }}
            >
              {/* KIRI — foto letterbox + kartu angka yang menembus sudutnya. */}
              <div style={{ position: "relative" }}>
                <div
                  className="bento-tile"
                  style={{
                    padding: 0,
                    overflow: "hidden",
                    aspectRatio: "16 / 7",
                  }}
                >
                  <ImagePlaceholder label="Foto pencacahan di pintu stasiun · identitas diredaksi" />
                </div>

                {/* ~separuh keluar dari sudut kanan-bawah foto. Angka lapangan
                   dipisah garis-rambut: pembungkus grid berlatar `--rule`,
                   tiap sel berlatar `--surface`, `gap: 1px` yang menyingkap
                   garis di antaranya. `.kartu` = garis-rambut + sudut membulat
                   seragam, tanpa bayangan (keluarga kartu Beranda). */}
                <div
                  className="kartu"
                  style={{
                    position: "absolute",
                    right: -28,
                    bottom: -32,
                    width: "min(360px, 82%)",
                    padding: 0,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: "1px",
                      background: "var(--rule)",
                    }}
                  >
                    {[
                      ["2", "pencacah per pintu"],
                      ["15", "menit per blok"],
                      ["3", "stasiun"],
                      ["4", "slot waktu"],
                    ].map(([n, t]) => (
                      <div
                        key={t}
                        style={{
                          background: "var(--surface)",
                          padding: "var(--s2) var(--s3)",
                        }}
                      >
                        <div
                          className="fig"
                          style={{ fontSize: 20, color: "var(--field)" }}
                        >
                          {n}
                        </div>
                        <div
                          style={{
                            marginTop: 4,
                            fontSize: "var(--t-micro)",
                            lineHeight: 1.35,
                            color: "var(--ink-muted)",
                          }}
                        >
                          {t}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* KANAN — dua paragraf (teks tak berubah). */}
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "var(--t-body)",
                    lineHeight: 1.68,
                    color: "var(--ink-2)",
                  }}
                >
                  Dua pencacah berdiri di garis pengamatan tiap pintu selama
                  blok menerus 15 menit. Foto struk dari gerai yang bersedia
                  kemudian dibaca ulang oleh AI, dengan aturan yang ditetapkan
                  sebelum survei dimulai — bukan sesudah datanya terlihat.
                </p>
                <p
                  style={{
                    margin: "var(--s3) 0 0",
                    fontSize: "var(--t-body)",
                    lineHeight: 1.68,
                    color: "var(--ink-2)",
                  }}
                >
                  Blok yang selisih antar-pencacahnya melebihi 15% diulang.
                  Kalau setelah diulang tetap berselisih, slot itu tidak
                  dipakai sama sekali.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
            4 · Yang sudah dicacah — full-bleed `--tile-mint`. Arketipe: KARTU
            STAGGERED + skala bersama. Judul di KIRI (selang-seling), tiga
            kartu tinggi-berbeda di KANAN — tiap kartu batang rentang mini
            pada SATU skala yang dicetak sekali di atasnya (`PerbandinganSimpul`).
            Judul H2 "Tiga simpul, tiga tipe kawasan." tetap satu blok teks
            utuh (dicek persis oleh tests/beranda.spec.ts).
            ================================================================ */}
        <section className="reveal" style={{ background: "var(--tile-mint)" }}>
          <div
            className="wrap"
            style={{ paddingTop: "var(--s6)", paddingBottom: "var(--s6)" }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 0.6fr) minmax(0, 1.4fr)",
                gap: "var(--s5)",
                alignItems: "start",
              }}
            >
              <div>
                <KepalaBab
                  n={4}
                  kicker="Yang sudah dicacah"
                  judul="Tiga simpul, tiga tipe kawasan."
                />
                <p
                  style={{
                    margin: "0 0 var(--s3)",
                    fontSize: "var(--t-small)",
                    lineHeight: 1.6,
                    color: "var(--ink-2)",
                    maxWidth: "36ch",
                  }}
                >
                  Ketiga batang memakai skala rupiah yang sama — makin ke
                  kanan, makin besar kesenjangannya. Garis tebal = median.
                </p>
                <Link
                  href="/peta"
                  style={{
                    fontSize: "var(--t-small)",
                    fontWeight: 600,
                    color: "var(--data)",
                  }}
                >
                  Lihat semuanya di peta →
                </Link>
              </div>
              <PerbandinganSimpul />
            </div>
          </div>
        </section>

        {/* ================================================================
            5 · Dari peta ke keputusan — full-bleed `--tile-violet`. Arketipe:
            LIST + HIGHLIGHT SPLIT. Header selebar section, lalu badan dua
            kolom — KARTU emas "1 hari kerja" di KIRI (satu-satunya elemen
            ber-isi penuh di halaman) DISANDINGKAN dengan daftar 3 keputusan
            bernomor di KANAN.
            ================================================================ */}
        <section className="reveal" style={{ background: "var(--tile-violet)" }}>
          <div
            className="wrap"
            style={{ paddingTop: "var(--s6)", paddingBottom: "var(--s6)" }}
          >
            <KepalaBab
              n={5}
              kicker="Keputusan yang bisa diambil"
              judul="Dari peta ke keputusan sewa."
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 0.62fr) minmax(0, 1fr)",
                gap: "var(--s5)",
                alignItems: "start",
              }}
            >
              {/* KIRI — kartu highlight "1 hari kerja". */}
              <div
                className="kartu"
                style={{
                  background: "var(--brand-wash)",
                  padding: "var(--s4)",
                  alignSelf: "start",
                  marginTop: 4,
                }}
              >
                <span
                  className="fig"
                  style={{
                    font: "700 clamp(48px, 7vw, 80px)/1 var(--font-mono), ui-monospace, monospace",
                    letterSpacing: "-0.04em",
                    color: "var(--brand-strong)",
                  }}
                >
                  1
                </span>
                <div style={{ marginTop: 6, fontSize: "var(--t-body)", fontWeight: 700 }}>
                  hari kerja
                </div>
                <p
                  style={{
                    margin: "var(--s2) 0 var(--s3)",
                    fontSize: "var(--t-small)",
                    lineHeight: 1.6,
                    color: "var(--ink-2)",
                  }}
                >
                  waktu satu tim mencacah satu simpul dan menghasilkan brief
                  seperti yang ada di halaman peta.
                </p>
                <Link
                  href="/peta"
                  style={{
                    fontSize: "var(--t-small)",
                    fontWeight: 600,
                    color: "var(--data)",
                  }}
                >
                  Lihat contoh brief →
                </Link>
              </div>

              {/* KANAN — 3 keputusan, nomor mono menggantung di selokan baris. */}
              <div>
                {KEPUTUSAN.map((k, i) => (
                  <div
                    key={k.judul}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2.5ch 1fr",
                      gap: "var(--s3)",
                      padding: "var(--s3) 0",
                      borderTop:
                        i === 0 ? undefined : "1px solid var(--rule)",
                      borderBottom:
                        i === KEPUTUSAN.length - 1
                          ? "1px solid var(--rule)"
                          : undefined,
                    }}
                  >
                    <span
                      className="fig"
                      style={{
                        fontSize: "var(--t-body)",
                        fontWeight: 700,
                        color: "var(--data)",
                      }}
                    >
                      {i + 1}
                    </span>
                    <div>
                      <div style={{ fontSize: "var(--t-body)", fontWeight: 700 }}>
                        {k.judul}
                      </div>
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: "var(--t-small)",
                          lineHeight: 1.6,
                          color: "var(--ink-muted)",
                        }}
                      >
                        {k.isi}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
            6 · Untuk siapa — full-bleed `--tile-rose`. Arketipe: TUMPUKAN
            KARTU BERGESER. Isi di KIRI (selang-seling: judul di KANAN). Tiga
            kartu keluarga (`.kartu`) bergeser diagonal — tiap kartu turun +
            geser kanan, sebagian saling menimpa di SUDUT (yang tertimpa cuma
            padding, teks tetap terbaca penuh).
            ================================================================ */}
        <section className="reveal" style={{ background: "var(--tile-rose)" }}>
          <div
            className="wrap"
            style={{ paddingTop: "var(--s6)", paddingBottom: "var(--s6)" }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) minmax(0, 0.95fr)",
                gap: "var(--s5)",
                alignItems: "center",
              }}
            >
              <div style={{ position: "relative" }}>
                {AUDIENS.map((a, i) => (
                  <div
                    key={a.judul}
                    className="kartu"
                    style={{
                      position: "relative",
                      zIndex: i + 1,
                      width: "min(340px, 88%)",
                      padding: "var(--s4) var(--s4) var(--s5)",
                      background: "var(--surface)",
                      marginTop: i === 0 ? 0 : "calc(var(--s4) * -1)",
                      transform: `translateX(${i * 30}%)`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: "var(--t-body)",
                        fontWeight: 700,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {a.judul}
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: "var(--t-small)",
                        lineHeight: 1.6,
                        color: "var(--ink-2)",
                        maxWidth: "26ch",
                      }}
                    >
                      {a.isi}
                    </div>
                  </div>
                ))}
              </div>

              <KepalaBab
                n={6}
                kicker="Untuk siapa"
                judul="Tiga kelompok yang datanya kami buka bagi."
              />
            </div>
          </div>
        </section>

        {/* ================================================================
            Kolofon — satu panel lebar netral (bukan pastel: bagian kejujuran/
            keterbatasan ini sengaja beda nada dari section lain). Putaran 12:
            panel DILEBARKAN (`maxWidth` 760 → 1040) dan tiga disclaimer
            dijadikan BARIS 3 KOLOM, semua rata tengah — supaya section tidak
            memanjang tinggi ke bawah.
            ================================================================ */}
        <section
          className="wrap reveal"
          style={{ paddingTop: "var(--s6)", paddingBottom: "var(--s6)" }}
        >
          <div
            className="bento-panel"
            style={{ maxWidth: 1040, margin: "0 auto", textAlign: "center" }}
          >
            <div
              style={{ marginBottom: "var(--s3)", display: "flex", justifyContent: "center" }}
            >
              <Lencana label="Yang kami nyatakan terbuka" />
            </div>
            <div
              className="measure"
              style={{
                font: "500 clamp(19px, 1.9vw, 25px)/1.5 var(--font-inter), system-ui, sans-serif",
                letterSpacing: "-0.01em",
                color: "var(--ink-2)",
                margin: "0 auto",
              }}
            >
              Estimasi potensi bukan proyeksi pendapatan yang pasti. Biaya
              operasi dan risiko usaha tidak diperhitungkan di dalamnya.
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: "var(--s4)",
                borderTop: "1px solid var(--rule)",
                marginTop: "var(--s5)",
                paddingTop: "var(--s4)",
                textAlign: "left",
              }}
            >
              {[
                "Tiga stasiun berarti hasilnya indikatif; seluruh pengujian bersifat kalibrasi, bukan pembuktian.",
                "Kawasan dengan sampel tipis ditandai dan tidak diberi estimasi — bukan dibaca sebagai nol.",
                "Peta potensi tinggi dapat mendorong kenaikan sewa. Risiko ini dan mitigasinya dinyatakan, bukan disembunyikan.",
              ].map((t) => (
                <p
                  key={t}
                  style={{
                    margin: 0,
                    fontSize: "var(--t-small)",
                    lineHeight: 1.65,
                    color: "var(--ink-2)",
                  }}
                >
                  {t}
                </p>
              ))}
            </div>
            <div style={{ marginTop: "var(--s4)" }}>
              <Link
                href="/metodologi"
                style={{ fontSize: "var(--t-small)", fontWeight: 600, color: "var(--data)" }}
              >
                Baca keterbatasan lengkap →
              </Link>
            </div>
          </div>
        </section>

        {/* ================================================================
            Penutup — band tinta. Putaran 9 hanya memperbaiki chip-nya: lewat
            helper `Lencana`, `background` inline `--paper-2` menang atas
            aturan `.ink-band .eyebrow-chip`, jadi pil-nya krem opak dengan
            teks putih-40% di atasnya — kotak tanpa isi terbaca. `warna="ink"`
            memakai latar tinta-tembus + teks terang. Sisanya tak berubah.
            ================================================================ */}
        <section className="ink-band" style={{ paddingTop: "var(--s6)", paddingBottom: "var(--s6)" }}>
          <div className="wrap">
            <div className="g12" style={{ rowGap: "var(--s4)" }}>
              <div style={{ gridColumn: "span 7" }}>
                <div style={{ marginBottom: "var(--s3)" }}>
                  <Lencana label="Rantai sebabnya sederhana" warna="ink" />
                </div>
                <p
                  style={{
                    font: "800 var(--t-h1)/1.1 var(--font-inter), system-ui, sans-serif",
                    letterSpacing: "-0.025em",
                    margin: 0,
                    maxWidth: "20ch",
                  }}
                >
                  Setiap rupiah non-tiket yang tertangkap mengurangi
                  ketergantungan pada subsidi.
                </p>
              </div>
              <div
                style={{
                  gridColumn: "10 / span 3",
                  alignSelf: "end",
                }}
              >
                <p
                  style={{
                    margin: "0 0 var(--s3)",
                    fontSize: "var(--t-small)",
                    lineHeight: 1.65,
                    color: "var(--ink-muted)",
                  }}
                >
                  Ruang fiskal yang terbebas dapat dipakai memperluas
                  jangkauan layanan.
                </p>
                <Link
                  href="/peta"
                  className="b bp"
                  style={{ padding: "14px 24px", fontSize: 14 }}
                >
                  Buka peta interaktif
                </Link>
              </div>
            </div>
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
            Isi Stasiun · dibangun di atas GEO MAPID · seluruh angka pada
            halaman ini bersifat ilustratif
          </span>
          <Jejak />
        </footer>
      </div>
    </BerandaData>
  );
}
