import { Fragment, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";

import { NavBar } from "@/components/NavBar";
import { KepalaBab } from "@/components/paper/KepalaBab";
import { Lencana } from "@/components/paper/Lencana";

/**
 * Insight — layar "membaca", di sistem desain "laporan instrumen" (kertas
 * hangat, tangga tipografi/ruang/radius sungguhan, angka monospace, garis-
 * rambut menggantikan isi kartu). Dimigrasi dari sistem lama satu layar per
 * kali (ROADMAP §7); Beranda sudah pindah lebih dulu.
 *
 * Fase ini: reskin statis. Angka yang tertulis di sini SUDAH cocok dengan
 * `public/mock/spending-gap.json` (fase berikutnya menariknya lewat
 * `lib/analytics/select.ts` sehingga tidak ada satu pun yang dihitung di JSX,
 * persis seperti Beranda). Cakupan dua simpul: Manggarai + Sudirman.
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

/** Sorotan hero — titik berkesenjangan terbesar di dua simpul (point 12). */
const SOROTAN = {
  angka: "Rp 2,9 jt",
  rentang: "Rp 2,3 – 4,0 jt",
  namaTitik: "Koridor Transit Utara",
  namaStasiun: "Manggarai",
  potensi: "Rp 4,2 jt",
  tertangkap: "Rp 1,3 jt",
  /** tertangkap p50 / potensi p50 = 1,28 jt / 4,18 jt */
  isiPersen: 30.6,
};

const RINGKAS: [string, string][] = [
  ["Simpul diamati", "2"],
  ["Struk terbaca", "1.561"],
  ["Estimasi ditahan", "1 pintu"],
];

/** Kesenjangan p50 per slot di titik sorotan, satu skala bersama. */
const PROFIL_SLOT: { label: string; nilai: string; tinggi: number }[] = [
  { label: "06–09", nilai: "Rp 1,1 jt", tinggi: 92 },
  { label: "11–14", nilai: "Rp 580 rb", tinggi: 48 },
  { label: "16–19", nilai: "Rp 840 rb", tinggi: 70 },
  { label: "19–21", nilai: "Rp 380 rb", tinggi: 32 },
];

const TEMUAN: { judul: string; isi: string }[] = [
  {
    judul: "Kesenjangan terpusat di pagi",
    isi: "Slot 06–09 menahan Rp 1,1 jt dari Rp 2,9 jt kesenjangan harian di Koridor Transit Utara — hampir dua kali lipat slot sore.",
  },
  {
    judul: "Apotek: permintaannya ada, gerainya nol",
    isi: "Permintaan kawasan untuk apotek terbaca sekitar 11% di kedua pintu terbesar, tapi tidak ada satu pun gerai apotek di sana.",
  },
  {
    judul: "Arus tinggi belum tentu kesenjangan tinggi",
    isi: "Arus pagi Koridor Transit Utara sekitar 1.574 org/jam, hampir lima kali Pintu 4 Sudirman — kesenjangannya hanya sekitar 1,6 kali.",
  },
];

type Isi = "Terisi" | "Kurang" | "Kosong";

/** Kategori × pintu terbesar tiap simpul (slot 06–09). `gerai_count` vs ambang 3. */
const MATRIKS: { kategori: string; a: Isi; b: Isi; permintaan: string }[] = [
  { kategori: "F&B", a: "Terisi", b: "Terisi", permintaan: "46,7%" },
  { kategori: "Ritel", a: "Kurang", b: "Kurang", permintaan: "18,4%" },
  { kategori: "Apotek", a: "Kosong", b: "Kosong", permintaan: "10,6%" },
  { kategori: "Jasa", a: "Kurang", b: "Kurang", permintaan: "12,6%" },
  { kategori: "Lainnya", a: "Kurang", b: "Kurang", permintaan: "11,8%" },
];

/** Cangkang section: latar pastel full-bleed + `.wrap` yang membawa ritme `--s6`. */
function Bab({ tile, children }: { tile?: string; children: ReactNode }) {
  return (
    <section
      className="reveal"
      style={tile ? { background: tile } : undefined}
    >
      <div
        className="wrap"
        style={{ paddingTop: "var(--s6)", paddingBottom: "var(--s6)" }}
      >
        {children}
      </div>
    </section>
  );
}

/** Status sel matriks — tingkat lewat gelap-terangnya tinta, bukan warna. */
function Status({ v }: { v: Isi }) {
  const gaya: Record<Isi, CSSProperties> = {
    Terisi: { color: "var(--ink-faint)" },
    Kurang: { color: "var(--ink-2)" },
    Kosong: { color: "var(--ink)", fontWeight: 700 },
  };
  return <span style={{ fontSize: "var(--t-small)", ...gaya[v] }}>{v}</span>;
}

const selMatriks: CSSProperties = {
  background: "var(--surface)",
  padding: "var(--s3)",
  display: "flex",
  alignItems: "center",
};

export default function InsightPage() {
  return (
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
              yang terbaca dari keduanya — kesenjangan belanja per pintu, profil
              tiap slot waktu, dan kategori yang permintaannya ada tapi gerainya
              belum. Temuan yang datanya tipis ditandai, bukan disembunyikan.
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

          {/* Kartu tinta. `.ink-band` meremap `--rule`/`--data`/`--ink-*` untuk
             latar gelap; `background` inline mengalahkan `.kartu` yang kalau
             tidak akan memaksa `--surface` putih. */}
          <div
            className="kartu ink-band"
            style={{ background: "var(--ink)", overflow: "hidden" }}
          >
            <div style={{ padding: "var(--s3)" }}>
              <span className="eyebrow">Kesenjangan terbesar</span>
              <div
                className="fig"
                style={{
                  font: "400 clamp(34px, 4.4vw, 50px)/1 var(--font-mono), ui-monospace, monospace",
                  letterSpacing: "-0.03em",
                  color: "var(--data)",
                  margin: "var(--s2) 0 0",
                }}
              >
                {SOROTAN.angka}
                <span
                  style={{ fontSize: "var(--t-small)", color: "var(--ink-faint)" }}
                >
                  {" "}
                  / hari
                </span>
              </div>
              <p
                style={{
                  margin: "var(--s2) 0 0",
                  fontSize: "var(--t-small)",
                  lineHeight: 1.55,
                  color: "var(--ink-muted)",
                }}
              >
                {SOROTAN.namaTitik}, {SOROTAN.namaStasiun}. Potensi{" "}
                {SOROTAN.potensi} lawan {SOROTAN.tertangkap} yang tertangkap
                gerai di sisi itu.
              </p>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 1,
                background: "var(--rule)",
              }}
            >
              {RINGKAS.map(([k, v]) => (
                <div
                  key={k}
                  style={{ background: "var(--ink)", padding: "var(--s3) var(--s2)" }}
                >
                  <div className="eyebrow" style={{ fontSize: 9 }}>
                    {k}
                  </div>
                  <div
                    className="fig"
                    style={{ fontSize: 20, color: "var(--data)", marginTop: 8 }}
                  >
                    {v}
                  </div>
                </div>
              ))}
            </div>
          </div>
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
          <div className="kartu" style={{ padding: "var(--s4)" }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: "var(--s2)",
              }}
            >
              <span className="eyebrow">Potensi lawan yang tertangkap</span>
              <span
                className="fig"
                style={{ fontSize: "var(--t-micro)", color: "var(--ink-faint)" }}
              >
                per hari kerja
              </span>
            </div>

            <div style={{ marginTop: "var(--s4)" }}>
              <div style={{ position: "relative", height: 52 }}>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "var(--data-wash)",
                    borderRadius: "var(--r-sm)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${SOROTAN.isiPersen}%`,
                    background: "var(--data)",
                    borderRadius: "var(--r-sm) 0 0 var(--r-sm)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: `${SOROTAN.isiPersen}%`,
                    top: -6,
                    bottom: -6,
                    width: 2,
                    background: "var(--ink)",
                  }}
                />
              </div>
              <div
                className="fig"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 8,
                  fontSize: "var(--t-micro)",
                  color: "var(--ink-faint)",
                }}
              >
                <span>Rp 0</span>
                <span>{SOROTAN.potensi} potensi</span>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "var(--s2)",
                marginTop: "var(--s4)",
                borderTop: "1px solid var(--rule)",
                paddingTop: "var(--s3)",
              }}
            >
              <div>
                <div className="eyebrow">Tertangkap</div>
                <div
                  className="fig"
                  style={{
                    fontSize: "clamp(17px, 2vw, 21px)",
                    color: "var(--ink-2)",
                    marginTop: 6,
                    whiteSpace: "nowrap",
                  }}
                >
                  {SOROTAN.tertangkap}
                </div>
              </div>
              <div>
                <div className="eyebrow" style={{ color: "var(--data)" }}>
                  Kesenjangan
                </div>
                <div
                  className="fig"
                  style={{
                    fontSize: "clamp(21px, 2.6vw, 29px)",
                    color: "var(--data)",
                    marginTop: 6,
                    whiteSpace: "nowrap",
                  }}
                >
                  {SOROTAN.angka}
                </div>
              </div>
              <div>
                <div className="eyebrow">Potensi</div>
                <div
                  className="fig"
                  style={{
                    fontSize: "clamp(17px, 2vw, 21px)",
                    color: "var(--ink-2)",
                    marginTop: 6,
                    whiteSpace: "nowrap",
                  }}
                >
                  {SOROTAN.potensi}
                </div>
              </div>
            </div>
          </div>

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
              Di Koridor Transit Utara, gerai di dalam stasiun menangkap sekitar
              sepertiga dari potensi belanja yang lewat. Sisanya — Rp 2,9 jt
              tiap hari kerja — adalah batas atas peluang yang belum diambil.
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
          <div className="kartu" style={{ padding: "var(--s4)" }}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: "var(--s3)",
                height: 200,
              }}
            >
              {PROFIL_SLOT.map((s, i) => (
                <div
                  key={s.label}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    gap: 8,
                    height: "100%",
                  }}
                >
                  <span
                    className="fig"
                    style={{
                      fontSize: "var(--t-micro)",
                      textAlign: "center",
                      color: i === 0 ? "var(--data)" : "var(--ink-faint)",
                    }}
                  >
                    {s.nilai}
                  </span>
                  <div
                    style={{
                      height: `${s.tinggi}%`,
                      background: i === 0 ? "var(--data)" : "var(--data-soft)",
                      borderRadius: "var(--r-sm) var(--r-sm) 0 0",
                    }}
                  />
                </div>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                gap: "var(--s3)",
                marginTop: 8,
                borderTop: "1px solid var(--rule)",
                paddingTop: 8,
              }}
            >
              {PROFIL_SLOT.map((s) => (
                <span
                  key={s.label}
                  className="fig"
                  style={{
                    flex: 1,
                    textAlign: "center",
                    fontSize: "var(--t-micro)",
                    color: "var(--ink-faint)",
                  }}
                >
                  {s.label}
                </span>
              ))}
            </div>
            <p
              style={{
                margin: "var(--s3) 0 0",
                fontSize: "var(--t-small)",
                lineHeight: 1.55,
                color: "var(--ink-2)",
              }}
            >
              Kesenjangan per slot di Koridor Transit Utara, pintu dengan selisih
              terbesar. Keempat batang memakai satu skala rupiah yang sama.
            </p>
          </div>

          <div>
            {TEMUAN.map((t, i) => (
              <div
                key={t.judul}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2.5ch 1fr",
                  gap: "var(--s3)",
                  padding: "var(--s3) 0",
                  borderTop: i === 0 ? undefined : "1px solid var(--rule)",
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
                    {t.judul}
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: "var(--t-small)",
                      lineHeight: 1.6,
                      color: "var(--ink-muted)",
                    }}
                  >
                    {t.isi}
                  </div>
                </div>
              </div>
            ))}
            <div
              className="kartu"
              style={{
                background: "var(--brand-wash)",
                padding: "var(--s3)",
                marginTop: "var(--s3)",
              }}
            >
              <div className="eyebrow" style={{ color: "var(--brand-strong)" }}>
                Estimasi ditahan
              </div>
              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: "var(--t-small)",
                  lineHeight: 1.55,
                  color: "var(--ink-2)",
                }}
              >
                Pintu 3 Sudirman baru tercacah 1 gerai pada 1 blok — ambangnya 3
                gerai × 2 blok. Angkanya ditahan sampai survei putaran kedua,
                tidak dibaca sebagai nol.
              </p>
            </div>
          </div>
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
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.1fr)",
            gap: 1,
            background: "var(--rule)",
            borderRadius: "var(--r-sm)",
            overflow: "hidden",
          }}
        >
          {[
            "Kategori",
            "Manggarai · Koridor Transit Utara",
            "Sudirman · Pintu 4",
            "Permintaan terbaca",
          ].map((h) => (
            <div
              key={h}
              className="eyebrow"
              style={{ background: "var(--paper)", padding: "var(--s2) var(--s3)" }}
            >
              {h}
            </div>
          ))}

          {MATRIKS.map((row) => (
            <Fragment key={row.kategori}>
              <div style={selMatriks}>
                <span style={{ fontSize: "var(--t-small)", fontWeight: 600 }}>
                  {row.kategori}
                </span>
              </div>
              <div style={selMatriks}>
                <Status v={row.a} />
              </div>
              <div style={selMatriks}>
                <Status v={row.b} />
              </div>
              <div style={selMatriks}>
                <span
                  className="fig"
                  style={{ fontSize: "var(--t-small)", color: "var(--data)" }}
                >
                  {row.permintaan}
                </span>
              </div>
            </Fragment>
          ))}
        </div>
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
        <Link
          href="/metodologi"
          style={{ fontSize: 11.5, fontWeight: 600, color: "var(--data)" }}
        >
          Lanjut ke metodologi →
        </Link>
      </footer>
    </div>
  );
}
