import type { CSSProperties } from "react";
import Link from "next/link";

import { NavBar } from "@/components/NavBar";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { Kepala } from "@/components/paper/Kepala";
import { Lencana } from "@/components/paper/Lencana";

/**
 * Rekomendasi — layar "jadi saya harus melakukan apa".
 *
 * Sama seperti Metodologi: layout & isinya TIDAK berubah (hero + tiga statistik,
 * tabel urutan prioritas, tiga kartu rekomendasi, kartu gelap urutan pelaksanaan,
 * panel risiko + foto, penutup, footer) — yang berubah cuma KULITNYA. Dipindah
 * dari sistem slate lama ke `.paper-canvas` yang sama dengan Beranda, Insight, dan
 * Metodologi: section full-width di `--page-x`, kartu DATAR bertint yang bergilir
 * menempuh palet (`--tile-*`, `--data-wash`, `--field-wash`) di atas satu latar
 * `--paper` seragam, satu kartu `.ink-band` gelap, angka `.fig`, kicker `.eyebrow`,
 * kepala `Kepala`, nav pil emas, reveal scroll.
 *
 * Masih **server component** dan masih mockup ilustratif — belum baca data hidup,
 * dan label lama "Stasiun A/B/C" sengaja dipertahankan (menyambungkannya ke data
 * dua-stasiun sungguhan adalah pekerjaan terpisah). Footer tetap menyatakan
 * "angka ilustratif".
 */

const seksi: CSSProperties = { padding: "0 var(--page-x) var(--s4)" };

function tint(bg: string): CSSProperties {
  return { background: bg, borderRadius: "var(--r-md)", padding: "var(--s3)" };
}

/* --- Data ilustratif (tidak berubah dari versi slate) --------------------- */

/** Tiga ringkasan di hero. */
const STAT: { label: string; nilai: string; bg: string; warna: string; dot?: boolean }[] = [
  {
    label: "Total kesenjangan tiga simpul",
    nilai: "Rp 6.400.000",
    bg: "var(--data-wash)",
    warna: "var(--data)",
  },
  {
    label: "Slot layak direkomendasikan",
    nilai: "34 dari 48",
    bg: "var(--tile-sky)",
    warna: "var(--ink)",
  },
  {
    label: "Ditunda karena sampel tipis",
    nilai: "14 slot",
    bg: "var(--field-wash)",
    warna: "var(--ink-muted)",
    dot: true,
  },
];

const KOLOM_PRIORITAS =
  "34px minmax(0, 1.55fr) minmax(0, 1.2fr) 76px minmax(0, 118px) 108px";

/** Satu baris tabel urutan prioritas. `tipis` = belum direkomendasikan. */
type BarisPrioritas = {
  rank: string;
  lokasi: string;
  kategori: string;
  dot?: string;
  slot: string;
  gap: string;
  keyakinan: string;
  isi?: number;
  isiWarna?: string;
  tipis?: boolean;
};

const PRIORITAS: BarisPrioritas[] = [
  {
    rank: "01",
    lokasi: "Stasiun B · Pintu 4",
    kategori: "Apotek & kesehatan",
    dot: "var(--data)",
    slot: "06–09",
    gap: "Rp 1.800.000",
    keyakinan: "tinggi",
    isi: 86,
    isiWarna: "var(--data)",
  },
  {
    rank: "02",
    lokasi: "Stasiun C · Pintu 2",
    kategori: "F&B cepat",
    dot: "var(--data-mid)",
    slot: "16–19",
    gap: "Rp 1.400.000",
    keyakinan: "tinggi",
    isi: 74,
    isiWarna: "var(--data)",
  },
  {
    rank: "03",
    lokasi: "Stasiun A · Pintu 1",
    kategori: "Ritel kebutuhan harian",
    dot: "var(--data-soft)",
    slot: "06–09",
    gap: "Rp 900.000",
    keyakinan: "sedang",
    isi: 58,
    isiWarna: "var(--data-mid)",
  },
  {
    rank: "04",
    lokasi: "Stasiun B · Pintu 1",
    kategori: "Jasa titip & kurir",
    dot: "var(--data)",
    slot: "11–14",
    gap: "Rp 700.000",
    keyakinan: "sedang",
    isi: 52,
    isiWarna: "var(--data-mid)",
  },
  {
    rank: "—",
    lokasi: "Stasiun B · Pintu 3",
    kategori: "Belum direkomendasikan",
    slot: "—",
    gap: "tidak diestimasi",
    keyakinan: "sampel tipis",
    tipis: true,
  },
];

/** Tiga kartu rekomendasi utama. */
type KartuRekomendasi = {
  prioritas: string;
  tempo: string;
  judul: string;
  isi: string;
  tint: string;
  baris: { k: string; v: string; data?: boolean }[];
};

const REKOMENDASI: KartuRekomendasi[] = [
  {
    prioritas: "Prioritas 01",
    tempo: "Kuartal ini",
    judul: "Isi Pintu 4 dengan gerai apotek berformat kecil",
    isi: "Permintaan kategori ini terbaca 37% pada slot 06–09 tanpa satu pun gerai di dalam stasiun, sementara arus pintu tergolong tertinggi.",
    tint: "var(--tile-sky)",
    baris: [
      { k: "Potensi tertangkap", v: "Rp 1.800.000 / hari", data: true },
      { k: "Ukur ulang setelah", v: "6 minggu" },
      { k: "Dasar data", v: "4 slot · 96 struk" },
    ],
  },
  {
    prioritas: "Prioritas 02",
    tempo: "2 kuartal",
    judul: "Ubah dasar sewa dari luas ruang ke arus pintu",
    isi: "Indeks sewa terhadap arus menunjukkan pintu dengan arus tinggi dihargai setara pintu sepi, sehingga nilai ruang tidak tercermin.",
    tint: "var(--tile-mint)",
    baris: [
      { k: "Cakupan", v: "24 titik sewa" },
      { k: "Ukur ulang setelah", v: "3 bulan" },
      { k: "Dasar data", v: "3 simpul · 4 slot" },
    ],
  },
  {
    prioritas: "Prioritas 03",
    tempo: "Berjalan",
    judul: "Perluas pencacahan ke simpul dengan sampel tipis",
    isi: "Kawasan bertanda sampel tipis menahan sebagian rekomendasi. Satu putaran tambahan cukup untuk menaikkannya ke tingkat kepercayaan yang sama.",
    tint: "var(--tile-violet)",
    baris: [
      { k: "Slot terbuka", v: "14 slot" },
      { k: "Kebutuhan", v: "5 hari kerja" },
      { k: "Hasil", v: "lapisan penuh" },
    ],
  },
];

/** Tiga fase pelaksanaan (kartu gelap). */
const FASE: { dot: string; kicker: string; judul: string; isi: string; garis: boolean }[] = [
  {
    dot: "var(--data)",
    kicker: "Fase 1 · Kuartal ini",
    judul: "Isi slot prioritas pertama",
    isi: "Satu gerai baru di pintu dengan gap terbesar, dengan pengukuran sebelum dan sesudah pada slot yang sama.",
    garis: true,
  },
  {
    dot: "var(--data-soft)",
    kicker: "Fase 2 · 2 kuartal",
    judul: "Tinjau dasar penetapan sewa",
    isi: "Indeks sewa terhadap arus dipakai sebagai salah satu dasar peninjauan harga di seluruh titik sewa.",
    garis: true,
  },
  {
    dot: "var(--data-mid)",
    kicker: "Fase 3 · Tahun berjalan",
    judul: "Perluas ke simpul lain",
    isi: "Protokol yang sama dijalankan di simpul berikutnya agar lapisannya dapat dibandingkan langsung.",
    garis: false,
  },
];

/** Risiko + penanganannya (panel kiri). */
const RISIKO: { dot: string; judul: string; isi: string }[] = [
  {
    dot: "var(--data)",
    judul: "Peta potensi mendorong kenaikan sewa",
    isi: "Lapisan diterbitkan bersama indeks sewa terhadap arus, sehingga kenaikan yang tidak sebanding dengan arus terlihat sebagai kejanggalan.",
  },
  {
    dot: "var(--data-soft)",
    judul: "Angka dibaca sebagai jaminan pendapatan",
    isi: "Setiap tampilan menyebut rentang dan batasannya; tidak ada satu angka tunggal yang berdiri sendiri.",
  },
  {
    dot: "var(--data-mid)",
    judul: "Tiga simpul belum mewakili jaringan",
    isi: "Hasilnya dinyatakan indikatif, dan protokolnya dibuka agar simpul lain dapat diukur dengan cara yang sama.",
  },
];

export default function RekomendasiPage() {
  return (
    <div className="page-canvas paper-canvas">
      <NavBar
        active="rekomendasi"
        cta={<button className="b bs">Unduh paket rekomendasi</button>}
      />

      {/* ============================================================
          Hero — dua kolom. Tulisan kiri, tiga kartu ringkasan kanan.
          Grid, tipografi & jarak disamakan dengan hero Metodologi.
          ============================================================ */}
      <section
        className="reveal"
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 1fr) minmax(0, clamp(340px, 30vw, 430px))",
          gap: "var(--s4)",
          alignItems: "start",
          padding: "clamp(28px, 3.5vw, 52px) var(--page-x) var(--s4)",
        }}
      >
        <div>
          <Lencana label="Urutan tindakan" warna="brand" dot />
          <h1
            style={{
              font: "800 var(--t-h1)/1.04 var(--font-inter), system-ui, sans-serif",
              letterSpacing: "-0.025em",
              margin: "var(--s3) 0 0",
              maxWidth: "24ch",
              textWrap: "balance",
            }}
          >
            Slot mana yang diisi lebih dahulu, dan mengapa.
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
            Rekomendasi hanya diberikan untuk pintu dan slot yang sampelnya
            memadai. Urutannya mengikuti besar kesenjangan, bukan luas ruang
            yang tersedia.
          </p>
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "var(--s2)" }}
        >
          {STAT.map((s) => (
            <div key={s.label} style={tint(s.bg)}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "var(--s2)",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--s1)",
                    fontSize: "var(--t-small)",
                    color: "var(--ink-muted)",
                  }}
                >
                  {s.dot && (
                    <span
                      className="dot"
                      style={{ background: "var(--field)" }}
                    />
                  )}
                  {s.label}
                </span>
                <span
                  className="fig"
                  style={{
                    fontSize: "var(--t-lead)",
                    fontWeight: 700,
                    color: s.warna,
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.nilai}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================
          Urutan prioritas — kepala + chip simpul + tabel grid.
          ============================================================ */}
      <section className="reveal" style={seksi}>
        <Kepala
          kicker="Petak kosong"
          judul="Urutan prioritas"
          catatan="Diambil dari 34 slot yang datanya memadai. Kolom kepercayaan menandai ketebalan sampel di balik tiap estimasi."
        />

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--s1)",
            margin: "0 0 var(--s3)",
          }}
        >
          {["Semua simpul", "Stasiun A", "Stasiun B", "Stasiun C"].map((c, i) => (
            <span
              key={c}
              className="eyebrow-chip eyebrow"
              style={
                i === 0
                  ? { background: "var(--ink)", color: "var(--paper)" }
                  : undefined
              }
            >
              {c}
            </span>
          ))}
        </div>

        <div
          style={{
            border: "1px solid var(--rule)",
            borderRadius: "var(--r-md)",
            overflow: "hidden",
            background: "var(--surface)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: KOLOM_PRIORITAS,
              gap: "var(--s3)",
              padding: "var(--s2) var(--s3)",
              background: "var(--data-wash)",
              borderBottom: "1px solid var(--rule)",
            }}
          >
            <span className="eyebrow">#</span>
            <span className="eyebrow">Lokasi</span>
            <span className="eyebrow">Kategori disarankan</span>
            <span className="eyebrow">Slot</span>
            <span className="eyebrow" style={{ textAlign: "right" }}>
              Kesenjangan
            </span>
            <span className="eyebrow">Kepercayaan</span>
          </div>

          {PRIORITAS.map((b, i) => (
            <div
              key={b.lokasi}
              style={{
                display: "grid",
                gridTemplateColumns: KOLOM_PRIORITAS,
                gap: "var(--s3)",
                padding: "var(--s3)",
                alignItems: "center",
                background: i % 2 ? "var(--data-wash)" : "var(--surface)",
                borderTop: i === 0 ? undefined : "1px solid var(--rule)",
              }}
            >
              <span
                className="fig"
                style={{
                  fontSize: "var(--t-small)",
                  fontWeight: b.rank === "01" ? 700 : 400,
                  color: b.rank === "01" ? "var(--data)" : "var(--ink-faint)",
                }}
              >
                {b.rank}
              </span>
              <span
                style={{
                  fontSize: "var(--t-small)",
                  fontWeight: 600,
                  color: b.tipis ? "var(--ink-faint)" : "var(--ink)",
                }}
              >
                {b.lokasi}
              </span>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--s1)",
                  fontSize: "var(--t-small)",
                  color: b.tipis ? "var(--ink-faint)" : "var(--ink-2)",
                }}
              >
                <span
                  className="dot"
                  style={{ background: b.tipis ? "var(--field)" : b.dot }}
                />
                {b.kategori}
              </span>
              <span
                className="fig"
                style={{
                  fontSize: "var(--t-micro)",
                  color: b.tipis ? "var(--ink-faint)" : "var(--ink-2)",
                }}
              >
                {b.slot}
              </span>
              <span
                className="fig"
                style={{
                  fontSize: "var(--t-small)",
                  fontWeight: b.tipis ? 400 : 700,
                  textAlign: "right",
                  color: b.tipis
                    ? "var(--ink-faint)"
                    : b.rank === "01"
                      ? "var(--data)"
                      : "var(--ink)",
                }}
              >
                {b.gap}
              </span>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--s1)",
                }}
              >
                {b.isi !== undefined ? (
                  <>
                    <span
                      className="pill"
                      style={{
                        display: "block",
                        width: 52,
                        height: 6,
                        background: "var(--rule)",
                        overflow: "hidden",
                        flex: "none",
                      }}
                    >
                      <span
                        className="pill"
                        style={{
                          display: "block",
                          width: `${b.isi}%`,
                          height: 6,
                          background: b.isiWarna,
                        }}
                      />
                    </span>
                    <span
                      className="fig"
                      style={{
                        fontSize: "var(--t-micro)",
                        color: "var(--ink-muted)",
                      }}
                    >
                      {b.keyakinan}
                    </span>
                  </>
                ) : (
                  <span
                    className="fig"
                    style={{
                      fontSize: "var(--t-micro)",
                      color: "var(--ink-faint)",
                    }}
                  >
                    {b.keyakinan}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            gap: "var(--s1)",
            marginTop: "var(--s2)",
            alignItems: "flex-start",
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
              maxWidth: "80ch",
            }}
          >
            Baris tanpa peringkat berarti data belum memadai. Slot tersebut
            menunggu putaran pencacahan berikutnya, dan tidak diisi dengan angka
            pinjaman.
          </span>
        </div>
      </section>

      {/* ============================================================
          Tiga rekomendasi utama — kartu bertint bergilir.
          ============================================================ */}
      <section className="reveal" style={seksi}>
        <Kepala
          kicker="Tindakan"
          judul="Tiga rekomendasi utama"
          catatan="Setiap rekomendasi menyebut dasar datanya, dan apa yang harus diukur ulang setelah dijalankan."
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "var(--s2)",
          }}
        >
          {REKOMENDASI.map((r) => (
            <div
              key={r.prioritas}
              style={{
                ...tint(r.tint),
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "var(--s2)",
                }}
              >
                <span className="eyebrow">{r.prioritas}</span>
                <span className="eyebrow-chip eyebrow">{r.tempo}</span>
              </div>
              <h3
                style={{
                  font: "700 var(--t-lead)/1.2 var(--font-inter), system-ui, sans-serif",
                  letterSpacing: "-0.015em",
                  margin: "var(--s3) 0 var(--s2)",
                }}
              >
                {r.judul}
              </h3>
              <p
                style={{
                  fontSize: "var(--t-small)",
                  lineHeight: 1.55,
                  color: "var(--ink-2)",
                  margin: "0 0 var(--s3)",
                }}
              >
                {r.isi}
              </p>
              <div
                style={{
                  marginTop: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 9,
                }}
              >
                {r.baris.map((row) => (
                  <div
                    key={row.k}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "var(--s2)",
                      fontSize: "var(--t-micro)",
                    }}
                  >
                    <span style={{ color: "var(--ink-muted)" }}>{row.k}</span>
                    <span
                      className="fig"
                      style={{
                        fontWeight: row.data ? 700 : 400,
                        color: row.data ? "var(--data)" : "var(--ink-2)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.v}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================
          Urutan pelaksanaan — satu kartu gelap `.ink-band`.
          ============================================================ */}
      <section className="reveal" style={seksi}>
        <div
          className="kartu ink-band"
          style={{ background: "var(--ink)", padding: "var(--s3)" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: "var(--s3)",
              flexWrap: "wrap",
              marginBottom: "var(--s4)",
            }}
          >
            <h2
              style={{
                font: "800 clamp(22px, 2.4vw, 30px)/1.1 var(--font-inter), system-ui, sans-serif",
                letterSpacing: "-0.02em",
                color: "var(--paper)",
                margin: 0,
              }}
            >
              Urutan pelaksanaan
            </h2>
            <span
              className="fig"
              style={{ fontSize: "var(--t-micro)", color: "var(--ink-faint)" }}
            >
              tiga fase · satu tahun
            </span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "var(--s3)",
            }}
          >
            {FASE.map((f) => (
              <div key={f.kicker}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: "var(--s3)",
                  }}
                >
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "var(--r-pill)",
                      background: f.dot,
                      flex: "none",
                    }}
                  />
                  {f.garis && (
                    <span
                      style={{ flex: 1, height: 2, background: "var(--rule)" }}
                    />
                  )}
                </div>
                <div className="eyebrow" style={{ marginBottom: "var(--s2)" }}>
                  {f.kicker}
                </div>
                <div
                  style={{
                    font: "700 var(--t-lead)/1.25 var(--font-inter), system-ui, sans-serif",
                    color: "var(--paper)",
                    marginBottom: "var(--s2)",
                  }}
                >
                  {f.judul}
                </div>
                <p
                  style={{
                    fontSize: "var(--t-small)",
                    lineHeight: 1.55,
                    color: "var(--ink-muted)",
                    margin: 0,
                  }}
                >
                  {f.isi}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          Risiko & penanganannya + foto — dua kartu datar.
          ============================================================ */}
      <section
        className="reveal"
        style={{
          ...seksi,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          gap: "var(--s2)",
        }}
      >
        <div className="kartu" style={{ padding: "var(--s3)" }}>
          <h2
            style={{
              font: "800 clamp(21px, 2vw, 26px)/1.15 var(--font-inter), system-ui, sans-serif",
              letterSpacing: "-0.02em",
              margin: "0 0 var(--s3)",
            }}
          >
            Risiko dan penanganannya
          </h2>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "var(--s2)" }}
          >
            {RISIKO.map((r) => (
              <div key={r.judul}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--s1)",
                    marginBottom: 5,
                  }}
                >
                  <span className="dot" style={{ background: r.dot }} />
                  <span
                    style={{ fontSize: "var(--t-body)", fontWeight: 600 }}
                  >
                    {r.judul}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "var(--t-small)",
                    lineHeight: 1.55,
                    color: "var(--ink-muted)",
                    margin: "0 0 0 calc(7px + var(--s1))",
                  }}
                >
                  {r.isi}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div
          className="kartu"
          style={{
            overflow: "hidden",
            background: "var(--surface)",
            minHeight: 340,
          }}
        >
          <ImagePlaceholder
            label="Foto area komersial / gerai stasiun"
            style={{ color: "var(--ink-faint)" }}
          />
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
                maxWidth: "28ch",
              }}
            >
              Satu simpul, satu hari kerja, satu brief yang bisa langsung
              dibahas.
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
              Kami siap menjalankan putaran pencacahan berikutnya di simpul
              pilihan Anda.
            </p>
            <button
              className="b bp"
              style={{ padding: "14px 24px", fontSize: 14 }}
            >
              Unduh paket rekomendasi
            </button>
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
          Isi Stasiun · dibangun di atas GEO MAPID · seluruh angka pada halaman
          ini bersifat ilustratif
        </span>
        <Link
          href="/peta"
          style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink)" }}
        >
          Kembali ke peta →
        </Link>
      </footer>
    </div>
  );
}
