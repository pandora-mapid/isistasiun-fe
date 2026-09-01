import Link from "next/link";
import type { ReactNode } from "react";

import { NavBar } from "@/components/NavBar";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { BerandaData } from "@/components/beranda/BerandaData";
import { HeroPeta } from "@/components/beranda/HeroPeta";
import { Jejak } from "@/components/beranda/Jejak";
import { KartuSimpul } from "@/components/beranda/KartuSimpul";
import { Persamaan } from "@/components/beranda/Persamaan";
import { RelStatistik } from "@/components/beranda/RelStatistik";

/**
 * Beranda.
 *
 * Halaman ini tetap **server component**. Sifat client dikurung di komponen
 * daun — `HeroPeta`, `Persamaan`, `KartuSimpul`, `RelStatistik`, `Jejak` —
 * yang semuanya membaca satu provider di atasnya. Anak yang dioper ke
 * `BerandaData` tetap dirender di server.
 *
 * Bahasa visualnya: laporan instrumen di atas kertas hangat. Yang paling
 * membedakannya dari versi sebelumnya bukan warnanya, melainkan **hilangnya
 * kartu**: dua puluh kotak bersudut sama diganti band ber-hairline, dan satu-
 * satunya kartu yang tersisa adalah tiga kartu simpul, karena hanya ketiganya
 * yang benar-benar sebuah unit yang bisa diklik.
 */

/** Rubrik section: nomor + label, menempel selama section-nya berjalan. */
function Rubrik({ nomor, label }: { nomor: string; label: string }) {
  return (
    <div style={{ gridColumn: "span 3" }}>
      <div className="eyebrow" style={{ position: "sticky", top: "var(--s4)" }}>
        {nomor} — {label}
      </div>
    </div>
  );
}

/** Judul section dengan ukuran dan famili yang sama di seluruh halaman. */
function Judul({ children }: { children: ReactNode }) {
  return (
    <h2
      className="serif"
      style={{
        font: "400 var(--t-h2)/1.06 var(--font-serif), Georgia, serif",
        margin: 0,
      }}
    >
      {children}
    </h2>
  );
}

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
            01 · Hero

            Peta BUKAN lagi panel setinggi hero — ia kartu berukuran tetap
            (lihat HeroPeta.tsx) yang mengambang di sisi kanan teks, rata bawah
            sejajar baris tombol. Percobaan pertama (kolom sempit tapi tetap
            setinggi hero) menghasilkan strip vertikal aneh; kartu ini yang
            diminta.
            ================================================================ */}
        <section
          style={{
            padding: "clamp(40px, 5.4vw, 80px) var(--page-x)",
            borderBottom: "1px solid var(--rule)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) auto",
              columnGap: "var(--s6)",
              alignItems: "end",
            }}
          >
            <div style={{ maxWidth: 640 }}>
              <div className="eyebrow" style={{ marginBottom: "var(--s3)" }}>
                01 — Pengukuran
              </div>
              <h1
                className="serif"
                style={{
                  font: "400 var(--t-display)/1.02 var(--font-serif), Georgia, serif",
                  letterSpacing: "-0.022em",
                  margin: 0,
                  maxWidth: "15ch",
                }}
              >
                Berapa rupiah yang{" "}
                {/* Penekanan lewat miring, bukan warna. Sejak biru dikunci
                   untuk data, ia tidak boleh lagi dipakai sekadar menandai
                   "ini penting" — dan miring pada serif justru lebih tepat di
                   sini. */}
                <em style={{ fontStyle: "italic" }}>lewat</em>, berapa yang{" "}
                <em style={{ fontStyle: "italic" }}>tertangkap</em>.
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
                instrumen yang sama: potensi belanja komuter, dan belanja yang
                benar-benar tertangkap gerai di dalam stasiun. Selisihnya
                adalah batas atas peluang pendapatan non-tiket.
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
              margin: "var(--s4) 0 0",
              paddingTop: "var(--s3)",
              borderTop: "1px solid var(--rule)",
              fontSize: "var(--t-small)",
              lineHeight: 1.6,
              color: "var(--ink-muted)",
              maxWidth: "46ch",
            }}
          >
            Setiap angka adalah rentang, bukan satu titik — dan setiap rentang
            dapat ditelusuri sampai ke foto aslinya.
          </p>
        </section>

        {/* ================================================================
            02 · Angka yang melatarbelakangi
            ================================================================ */}
        <section
          className="wrap reveal"
          style={{ padding: "var(--s6) var(--page-x)" }}
        >
          <div className="g12" style={{ rowGap: "var(--s4)" }}>
            <Rubrik nomor="02" label="Duduk perkara" />
            <div style={{ gridColumn: "4 / span 9" }}>
              <Judul>
                Aset paling ramai di kota ini adalah aset yang paling sedikit
                diukur.
              </Judul>
              <div style={{ marginTop: "var(--s5)" }}>
                <RelStatistik />
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
            03 · Persamaan — band tinta, satu-satunya ketukan kontras nilai
            ================================================================ */}
        <div className="reveal">
          <Persamaan />
        </div>

        {/* ================================================================
            04 · Metode
            ================================================================ */}
        <section
          className="wrap reveal"
          style={{ padding: "var(--s6) var(--page-x) var(--s5)" }}
        >
          <div className="g12" style={{ rowGap: "var(--s4)" }}>
            <Rubrik nomor="04" label="Cara datanya dikumpulkan" />
            <div style={{ gridColumn: "4 / span 6" }}>
              <Judul>Dua pasang mata, lalu satu mesin pembaca.</Judul>
              <p
                className="measure"
                style={{
                  margin: "var(--s3) 0 0",
                  fontSize: "var(--t-body)",
                  lineHeight: 1.68,
                  color: "var(--ink-2)",
                }}
              >
                Dua pencacah berdiri di garis pengamatan tiap pintu selama blok
                menerus 15 menit. Foto struk dari gerai yang bersedia kemudian
                dibaca ulang oleh AI, dengan aturan yang ditetapkan sebelum
                survei dimulai — bukan sesudah datanya terlihat.
              </p>
              <p
                className="measure"
                style={{
                  margin: "var(--s3) 0 0",
                  fontSize: "var(--t-body)",
                  lineHeight: 1.68,
                  color: "var(--ink-2)",
                }}
              >
                Blok yang selisih antar-pencacahnya melebihi 15% diulang. Kalau
                setelah diulang tetap berselisih, slot itu tidak dipakai sama
                sekali.
              </p>
            </div>

            {/* Catatan lapangan: satu-satunya tempat oker dipakai di section
               ini, karena isinya memang kerja tangan — bukan hasil hitungan. */}
            <div style={{ gridColumn: "11 / span 2" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--s2)",
                  paddingLeft: "var(--s3)",
                  borderLeft: "2px solid var(--field)",
                }}
              >
                {[
                  ["2", "pencacah per pintu"],
                  ["15", "menit per blok"],
                  ["3", "stasiun"],
                  ["4", "slot waktu"],
                ].map(([n, t]) => (
                  <div key={t}>
                    <div
                      className="fig"
                      style={{ fontSize: 21, color: "var(--field)" }}
                    >
                      {n}
                    </div>
                    <div
                      style={{
                        fontSize: "var(--t-micro)",
                        lineHeight: 1.4,
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
        </section>

        {/* Satu band foto full-bleed, menggantikan tiga kotak "Foto …" yang
           dulu berjejer di sepertiga atas halaman. Foto adalah janji; tiga
           kotak kosong di paling atas hanya memajang apa yang belum ada. */}
        <section
          className="reveal"
          style={{
            borderTop: "1px solid var(--rule)",
            borderBottom: "1px solid var(--rule)",
            background: "var(--paper-2)",
          }}
        >
          <div style={{ height: "clamp(220px, 26vw, 340px)" }}>
            <ImagePlaceholder label="Foto pencacahan di pintu stasiun · identitas diredaksi" />
          </div>
        </section>

        {/* ================================================================
            05 · Tiga simpul
            ================================================================ */}
        <section
          className="wrap reveal"
          style={{ padding: "var(--s6) var(--page-x)" }}
        >
          {/* Bukan lagi <Rubrik/> di kolom sticky terpisah — kartu di bawahnya
             cukup tinggi sehingga kolom rubrik akan kosong sepanjang sisa
             section (persis yang dikeluhkan). Label sekarang sebaris langsung
             di atas judul, dan kontennya memakai 12 kolom penuh, bukan 9. */}
          <div className="eyebrow" style={{ marginBottom: "var(--s2)" }}>
            05 — Yang sudah dicacah
          </div>
          <Judul>Tiga simpul, tiga tipe kawasan.</Judul>
          <div style={{ marginTop: "var(--s5)" }}>
            <KartuSimpul />
          </div>
          {/* Link "Lihat semuanya" dulu duduk sebaris dengan judul lewat
             space-between — di layar lebar itu menciptakan jarak kosong
             mentah persis di baris paling atas section, sebelum satu kartu
             pun terlihat. Sekarang ia jadi penutup di bawah grid kartu. */}
          <div style={{ marginTop: "var(--s3)", textAlign: "right" }}>
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
        </section>

        {/* ================================================================
            06 · Dari peta ke keputusan
            ================================================================ */}
        <section
          className="wrap reveal"
          style={{
            padding: "var(--s6) var(--page-x)",
            borderTop: "1px solid var(--rule)",
          }}
        >
          {/* Bukan lagi <Rubrik/> + dua kolom rata atas — kotak "1 hari kerja"
             jauh lebih pendek daripada daftar bernomor di sebelahnya, dan rata
             atas menyisakan void besar di bawahnya. Bentuknya tetap dua kolom
             (beda dari section 05 yang satu blok penuh) — yang berubah cuma
             `alignItems: "center"`, supaya kotak yang lebih pendek duduk di
             tengah tinggi daftar, bukan menempel di atas lalu menggantung. */}
          <div className="eyebrow" style={{ marginBottom: "var(--s2)" }}>
            06 — Keputusan yang bisa diambil
          </div>
          <Judul>Dari peta ke keputusan sewa.</Judul>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(220px, 300px)",
              columnGap: "var(--s5)",
              alignItems: "center",
              marginTop: "var(--s5)",
            }}
          >
            <div>
              {[
                  [
                    "Komposisi kategori penyewa per pintu",
                    "Kategori yang permintaannya terbaca tinggi namun gerainya nol jadi prioritas pertama.",
                  ],
                  [
                    "Harga sewa yang mengikuti arus, bukan luas",
                    "Indeks sewa terhadap arus pejalan membuat perbedaan nilai antar pintu terlihat.",
                  ],
                  [
                    "Jadwal aktivasi pada slot yang tepat",
                    "Slot dengan kesenjangan terbesar menunjukkan jam yang paling layak diisi lebih dahulu.",
                  ],
                ].map(([judul, isi], i) => (
                  <div
                    key={judul}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto 1fr",
                      gap: "var(--s3)",
                      padding: "var(--s3) 0",
                      borderTop: "1px solid var(--rule)",
                    }}
                  >
                    <span
                      className="fig"
                      style={{ fontSize: 12, color: "var(--ink-faint)" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <div
                        style={{
                          fontSize: "var(--t-body)",
                          fontWeight: 600,
                          marginBottom: 5,
                        }}
                      >
                        {judul}
                      </div>
                      <div
                        style={{
                          fontSize: "var(--t-small)",
                          lineHeight: 1.6,
                          color: "var(--ink-muted)",
                        }}
                      >
                        {isi}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            <div
              style={{
                paddingTop: "var(--s3)",
                borderTop: "2px solid var(--ink)",
              }}
            >
              <div
                className="fig"
                style={{
                  font: "400 clamp(28px, 3vw, 42px)/1 var(--font-mono), ui-monospace, monospace",
                  letterSpacing: "-0.04em",
                }}
              >
                1
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: "var(--t-body)",
                  fontWeight: 600,
                }}
              >
                hari kerja
              </div>
              <p
                style={{
                  margin: "var(--s2) 0 var(--s3)",
                  fontSize: "var(--t-small)",
                  lineHeight: 1.6,
                  color: "var(--ink-muted)",
                }}
              >
                waktu yang dibutuhkan satu tim untuk mencacah satu simpul dan
                menghasilkan brief seperti yang ada di halaman peta.
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
          </div>
        </section>

        {/* ================================================================
            07 · Untuk siapa — baris hairline, bukan kartu
            ================================================================ */}
        <section
          className="wrap reveal"
          style={{
            padding: "0 var(--page-x) var(--s6)",
          }}
        >
          {/* Sebelumnya section ini sama sekali tidak punya label
             section-level — kolom 1-3 kosong total sepanjang section, tidak
             ada satu pun "07 — …" di sana. Ditambahkan sekarang, tapi bentuknya
             beda lagi dari 05 dan 06: TANPA judul besar (section ini bukan satu
             "beat" utama; tiga mini-judul di kartunya sudah cukup menjelaskan
             diri sendiri) — eyebrow dipasangkan sebaris dengan satu kalimat
             pendek, lalu band 3 kolom langsung memakai lebar penuh. */}
          <div
            className="row"
            style={{
              justifyContent: "space-between",
              alignItems: "baseline",
              flexWrap: "wrap",
              gap: "var(--s2)",
              paddingTop: "var(--s4)",
              borderTop: "1px solid var(--rule)",
            }}
          >
            <div className="eyebrow">07 — Untuk siapa</div>
            <div style={{ fontSize: "var(--t-small)", color: "var(--ink-muted)" }}>
              Tiga kelompok yang datanya kami buka bagi.
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "var(--s4)",
              marginTop: "var(--s4)",
            }}
          >
            {[
              [
                "Operator & pengelola kawasan",
                "Dasar terukur untuk komposisi kategori penyewa dan peninjauan harga sewa.",
              ],
              [
                "Pelaku usaha kecil",
                "Akses terbuka ke informasi arus dan potensi belanja yang selama ini hanya dimiliki pihak bermodal besar.",
              ],
              [
                "Pemerintah daerah & perencana",
                "Protokol pencacahan diterbitkan terbuka agar kota lain dapat menghasilkan lapisan setara.",
              ],
            ].map(([judul, isi], i) => (
              <div key={judul}>
                {/* Angka polos, bukan "01 — Untuk siapa" seperti dulu — label
                   itu sekarang sudah dinyatakan sekali di atas, mengulanginya
                   di tiap kartu jadi berlebihan. Sama seperti angka polos pada
                   daftar bernomor di section 06. */}
                <span
                  className="fig"
                  style={{
                    fontSize: 12,
                    color: "var(--ink-faint)",
                    display: "block",
                    marginBottom: 10,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div
                  style={{
                    fontSize: "var(--t-body)",
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  {judul}
                </div>
                <div
                  style={{
                    fontSize: "var(--t-small)",
                    lineHeight: 1.6,
                    color: "var(--ink-muted)",
                  }}
                >
                  {isi}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================================================================
            08 · Kolofon — ukuran baris sempit, ritme berbeda dari seluruh
            halaman di atasnya. Bagian kejujuran ini pembeda proyek; ia diberi
            bentuk yang membuatnya dibaca, bukan dilewati.
            ================================================================ */}
        <section
          className="reveal"
          style={{
            padding: "var(--s6) var(--page-x)",
            borderTop: "1px solid var(--rule)",
            background: "var(--paper-2)",
          }}
        >
          <div style={{ maxWidth: 660, margin: "0 auto" }}>
            <div
              className="eyebrow"
              style={{ marginBottom: "var(--s3)", textAlign: "center" }}
            >
              Yang kami nyatakan terbuka
            </div>
            <div
              className="serif"
              style={{
                font: "400 clamp(19px, 1.9vw, 25px)/1.5 var(--font-serif), Georgia, serif",
                textAlign: "center",
                margin: "0 0 var(--s5)",
              }}
            >
              Estimasi potensi bukan proyeksi pendapatan yang pasti. Biaya
              operasi dan risiko usaha tidak diperhitungkan di dalamnya.
            </div>
            <div className="measure-narrow" style={{ margin: "0 auto" }}>
              {[
                "Tiga stasiun berarti hasilnya indikatif; seluruh pengujian bersifat kalibrasi, bukan pembuktian.",
                "Kawasan dengan sampel tipis ditandai dan tidak diberi estimasi — bukan dibaca sebagai nol.",
                "Peta potensi tinggi dapat mendorong kenaikan sewa. Risiko ini dan mitigasinya dinyatakan, bukan disembunyikan.",
              ].map((t) => (
                <p
                  key={t}
                  style={{
                    margin: 0,
                    padding: "var(--s3) 0",
                    borderTop: "1px solid var(--rule)",
                    fontSize: "var(--t-small)",
                    lineHeight: 1.7,
                    color: "var(--ink-2)",
                  }}
                >
                  {t}
                </p>
              ))}
              <div style={{ paddingTop: "var(--s3)" }}>
                <Link
                  href="/metodologi"
                  style={{
                    fontSize: "var(--t-small)",
                    fontWeight: 600,
                    color: "var(--data)",
                  }}
                >
                  Baca keterbatasan lengkap →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
            09 · Penutup
            ================================================================ */}
        <section className="ink-band" style={{ padding: "var(--s6) 0" }}>
          <div className="wrap">
            <div className="g12" style={{ rowGap: "var(--s4)" }}>
              <div style={{ gridColumn: "span 7" }}>
                <div className="eyebrow" style={{ marginBottom: "var(--s3)" }}>
                  Rantai sebabnya sederhana
                </div>
                <p
                  className="serif"
                  style={{
                    font: "400 var(--t-h1)/1.1 var(--font-serif), Georgia, serif",
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
                  Ruang fiskal yang terbebas dapat dipakai memperluas jangkauan
                  layanan.
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
            Isi Stasiun · dibangun di atas GEO MAPID · seluruh angka pada halaman
            ini bersifat ilustratif
          </span>
          <Jejak />
        </footer>
      </div>
    </BerandaData>
  );
}
