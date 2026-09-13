import type { CSSProperties } from "react";
import Link from "next/link";

import { NavBar } from "@/components/NavBar";
import { RequireLogin } from "@/components/auth/RequireLogin";
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
 * Masih **server component**, tetapi angkanya kini NYATA: dari survei lapangan
 * Manggarai dan Sudirman (seed BE = fixtures AI, diturunkan pipeline dari
 * `isistasiun-ai/data/source/field/`). Semua slot masih sampel tipis (2 sampai
 * 4 blok), jadi setiap angka disertai skor kepercayaannya dan tak ada yang
 * disebut mapan. Tidak ada angka per-pintu (arus hanya terukur per gerbang);
 * rekomendasi diberikan per stasiun x slot. Lihat `lib/data/real-figures.ts`.
 */

const seksi: CSSProperties = { padding: "0 var(--page-x) var(--s4)" };

function tint(bg: string): CSSProperties {
  return { background: bg, borderRadius: "var(--r-md)", padding: "var(--s3)" };
}

/* --- Data ilustratif (tidak berubah dari versi slate) --------------------- */

/** Tiga ringkasan di hero. */
const STAT: {
  label: string;
  nilai: string;
  bg: string;
  warna: string;
  dot?: boolean;
}[] = [
  {
    label: "Kesenjangan harian, slot terukur",
    nilai: "Rp2,1–3,7 jt",
    bg: "var(--data-wash)",
    warna: "var(--data)",
  },
  {
    label: "Slot dengan estimasi",
    nilai: "3 slot",
    bg: "var(--tile-sky)",
    warna: "var(--ink)",
  },
  {
    label: "Semua slot masih sampel tipis",
    nilai: "2–4 blok",
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
    lokasi: "Sudirman",
    kategori: "Jasa, apotek",
    dot: "var(--data)",
    slot: "16–19",
    gap: "Rp0,9–1,6 jt",
    keyakinan: "tipis · 0,42",
    isi: 42,
    isiWarna: "var(--data)",
  },
  {
    rank: "02",
    lokasi: "Manggarai",
    kategori: "Jasa, apotek",
    dot: "var(--data-mid)",
    slot: "16–19",
    gap: "Rp0,8–1,4 jt",
    keyakinan: "tipis · 0,50",
    isi: 50,
    isiWarna: "var(--data)",
  },
  {
    rank: "03",
    lokasi: "Manggarai",
    kategori: "Jasa, apotek",
    dot: "var(--data-soft)",
    slot: "06–09",
    gap: "Rp0,4–0,7 jt",
    keyakinan: "tipis · 0,45",
    isi: 45,
    isiWarna: "var(--data-mid)",
  },
  {
    rank: "·",
    lokasi: "Sudirman",
    kategori: "Pagi belum terukur",
    slot: "06–09",
    gap: "tidak diestimasi",
    keyakinan: "tak berdenominator",
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
    judul: "Buka gerai jasa di Sudirman untuk slot sore",
    isi: "Sudirman hanya menangkap 19 persen dari potensi belanja sore, kesenjangan terbesar di antara dua simpul. Permintaan jasa terbaca kuat di kawasan (71 titik dalam 800 meter) tanpa satu pun gerai jasa di dalam stasiun.",
    tint: "var(--tile-sky)",
    baris: [
      { k: "Kesenjangan sore", v: "Rp0,9–1,6 jt", data: true },
      { k: "Permintaan jasa", v: "71 POI / 800 m" },
      { k: "Dasar data", v: "sore, 4 blok (tipis)" },
    ],
  },
  {
    prioritas: "Prioritas 02",
    tempo: "Kuartal ini",
    judul: "Lengkapi jasa dan apotek di Manggarai",
    isi: "Manggarai kehilangan dua kategori yang berpermintaan di kawasan: jasa (55 titik) dan apotek (13 titik), tak satu pun ada di dalam stasiun. Kesenjangannya Rp0,8–1,4 jt pada sore dan Rp0,4–0,7 jt pada pagi.",
    tint: "var(--tile-mint)",
    baris: [
      { k: "Kesenjangan sore", v: "Rp0,8–1,4 jt", data: true },
      { k: "Jasa / apotek", v: "55 / 13 POI" },
      { k: "Dasar data", v: "pagi + sore, 4 blok" },
    ],
  },
  {
    prioritas: "Prioritas 03",
    tempo: "Berjalan",
    judul: "Tambah putaran pencacahan sebelum menyimpulkan",
    isi: "Ketiga slot yang terukur masih sampel tipis, dengan skor kepercayaan 0,15 sampai 0,50. Satu putaran pencacahan lagi menaikkannya ke tingkat yang layak dipakai untuk keputusan sewa.",
    tint: "var(--tile-violet)",
    baris: [
      { k: "Slot terestimasi", v: "3 slot" },
      { k: "Skor kepercayaan", v: "0,15–0,50" },
      { k: "Kebutuhan", v: "1 putaran" },
    ],
  },
];

/** Tiga fase pelaksanaan (kartu gelap). */
const FASE: {
  dot: string;
  kicker: string;
  judul: string;
  isi: string;
  garis: boolean;
}[] = [
  {
    dot: "var(--data)",
    kicker: "Fase 1 · Kuartal ini",
    judul: "Isi gerai jasa di Sudirman sore",
    isi: "Slot dengan kesenjangan terbesar dan capture terendah, diukur sebelum dan sesudah pada slot yang sama untuk melihat dampaknya.",
    garis: true,
  },
  {
    dot: "var(--data-soft)",
    kicker: "Fase 2 · 2 kuartal",
    judul: "Lengkapi jasa dan apotek Manggarai",
    isi: "Dua kategori berpermintaan yang absen di dalam stasiun, mengisi kesenjangan pagi dan sore secara bertahap.",
    garis: true,
  },
  {
    dot: "var(--data-mid)",
    kicker: "Fase 3 · Tahun berjalan",
    judul: "Tebalkan sampel kedua simpul",
    isi: "Semua slot masih sampel tipis. Putaran pencacahan tambahan menaikkan skor kepercayaan sebelum angka dipakai untuk keputusan sewa.",
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
    judul: "Dua simpul belum mewakili jaringan",
    isi: "Hasilnya dinyatakan indikatif dan masih sampel tipis, dan protokolnya dibuka agar simpul lain dapat diukur dengan cara yang sama.",
  },
];

export default function RekomendasiPage() {
  return (
    <RequireLogin next="/rekomendasi">
    <div className="page-canvas paper-canvas">
      <NavBar active="rekomendasi" cta={null} />

      {/* ============================================================
          Hero — dua kolom. Tulisan kiri, tiga kartu ringkasan kanan.
          Grid, tipografi & jarak disamakan dengan hero Metodologi.
          ============================================================ */}
      <section
        className="reveal runtuh-1"
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
            Urutannya mengikuti besar kesenjangan, bukan luas ruang yang
            tersedia. Semua angka masih estimasi awal karena sampelnya tipis,
            jadi tiap rekomendasi menyertakan skor kepercayaannya.
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
          catatan="Diurutkan dari besar kesenjangan. Semua slot masih sampel tipis, jadi kolom kepercayaan menampilkan skornya, bukan cap mapan."
        />

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--s1)",
            margin: "0 0 var(--s3)",
          }}
        >
          {["Semua simpul", "Manggarai", "Sudirman"].map(
            (c, i) => (
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
            ),
          )}
        </div>

        <div
          className="tabel-geser"
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
          className="runtuh-1"
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
            className="runtuh-1"
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
        className="reveal runtuh-1"
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
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--s2)",
            }}
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
                  <span style={{ fontSize: "var(--t-body)", fontWeight: 600 }}>
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
          className="runtuh-1"
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
          Isi Stasiun · dibangun di atas GEO MAPID · angka dari survei lapangan
          Manggarai dan Sudirman, masih sampel tipis (estimasi awal)
        </span>
        <Link
          href="/peta"
          style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink)" }}
        >
          Kembali ke peta →
        </Link>
      </footer>
    </div>
    </RequireLogin>
  );
}
