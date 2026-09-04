import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";

import { NavBar } from "@/components/NavBar";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { Kepala } from "@/components/paper/Kepala";
import { Lencana } from "@/components/paper/Lencana";

/**
 * Metodologi — layar "bagaimana angkanya dibuat".
 *
 * Layout-nya tidak berubah (hero + persamaan, lima langkah, panel transparansi,
 * histogram + kartu "yang dibuang", footer) — yang berubah cuma KULITNYA:
 * dipindah dari sistem slate lama ke `.paper-canvas` yang sama dengan Beranda
 * dan Insight, dan rupanya disamakan dengan Insight — section full-width di
 * `--page-x`, kartu DATAR bertint yang bergilir menempuh palet (`--tile-*`,
 * `--data-wash`, `--field-wash`) di atas satu latar `--paper` seragam, dua
 * kartu `.ink-band` gelap, angka `.fig`, kicker `.eyebrow`, kepala `Kepala`,
 * nav pil emas, reveal scroll.
 *
 * Masih **server component** dan masih mockup ilustratif — belum baca data
 * hidup (itu pekerjaan terpisah; footer tetap menyatakan "angka ilustratif").
 */

const seksi: CSSProperties = { padding: "0 var(--page-x) var(--s4)" };

function tint(bg: string): CSSProperties {
  return { background: bg, borderRadius: "var(--r-md)", padding: "var(--s3)" };
}

/** Satu langkah dari alur pencacahan. */
type Langkah = { n: string; judul: string; isi: string; tint: string };

const LANGKAH: Langkah[] = [
  {
    n: "01",
    judul: "Tetapkan simpul & pintu",
    isi: "Garis pengamatan digambar di setiap pintu, lalu dibekukan sebelum survei agar tidak berubah antar slot.",
    tint: "var(--tile-sky)",
  },
  {
    n: "02",
    judul: "Cacah F, E, C",
    isi: "Blok menerus 15 menit per slot, dua pencacah per pintu, hitungan dibandingkan di akhir blok.",
    tint: "var(--tile-mint)",
  },
  {
    n: "03",
    judul: "Baca struk dengan AI",
    isi: "Yang diambil hanya jumlah dibayarkan dan kategori. Identitas diredaksi sebelum foto diunggah.",
    tint: "var(--tile-violet)",
  },
  {
    n: "04",
    judul: "Simulasi rentang",
    isi: "10.000 iterasi atas ketidakpastian tiap variabel, dilaporkan sebagai P10–P90, bukan angka tunggal.",
    tint: "var(--tile-rose)",
  },
  {
    n: "05",
    judul: "Publikasi lapisan",
    isi: "Lapisan, protokol, dan catatan keterbatasan diterbitkan bersamaan agar dapat diperiksa ulang.",
    tint: "var(--data-wash)",
  },
];

const BUANG: { warna: string; judul: string; isi: string }[] = [
  {
    warna: "var(--data)",
    judul: "Blok dengan selisih antar pencacah > 15%",
    isi: "Blok diulang; bila tetap berselisih, slot itu tidak dipakai.",
  },
  {
    warna: "var(--data)",
    judul: "Struk yang tidak terbaca utuh",
    isi: "Tidak ditebak. Dikeluarkan dari perhitungan dan dilaporkan jumlahnya.",
  },
  {
    warna: "var(--field)",
    judul: "Kawasan dengan sampel di bawah ambang",
    isi: "Ditandai sebagai sampel tipis, tidak diberi estimasi, dan tidak dibaca aman maupun bermasalah.",
  },
  {
    warna: "var(--field)",
    judul: "Hari dengan gangguan operasi",
    isi: "Rekayasa lalu lintas atau gangguan perjalanan membuat arus tidak mewakili hari biasa.",
  },
];

/** Deret tinggi batang histogram simulasi (ekor kiri, naik, puncak, turun, ekor kanan). */
const HISTO: { x: number; h: number; grup: 0 | 1 | 2 }[] = [
  { x: 4, h: 20, grup: 0 },
  { x: 26, h: 30, grup: 0 },
  { x: 48, h: 46, grup: 0 },
  { x: 70, h: 64, grup: 0 },
  { x: 92, h: 84, grup: 1 },
  { x: 114, h: 104, grup: 1 },
  { x: 136, h: 122, grup: 1 },
  { x: 158, h: 138, grup: 1 },
  { x: 180, h: 150, grup: 1 },
  { x: 202, h: 160, grup: 2 },
  { x: 224, h: 166, grup: 2 },
  { x: 246, h: 162, grup: 2 },
  { x: 268, h: 154, grup: 2 },
  { x: 290, h: 142, grup: 1 },
  { x: 312, h: 126, grup: 1 },
  { x: 334, h: 108, grup: 1 },
  { x: 356, h: 88, grup: 1 },
  { x: 378, h: 68, grup: 1 },
  { x: 400, h: 50, grup: 0 },
  { x: 422, h: 36, grup: 0 },
  { x: 444, h: 26, grup: 0 },
  { x: 466, h: 18, grup: 0 },
  { x: 488, h: 12, grup: 0 },
  { x: 510, h: 8, grup: 0 },
  { x: 532, h: 5, grup: 0 },
];

const WARNA_GRUP = ["var(--rule)", "var(--data-mid)", "var(--data)"];

export default function MetodologiPage() {
  return (
    <div className="page-canvas paper-canvas">
      <NavBar
        active="metodologi"
        cta={<button className="b bs">Unduh protokol</button>}
      />

      {/* ============================================================
          Hero — dua kolom. Tulisan kiri, kartu tinta persamaan kanan.
          ============================================================ */}
      <section
        className="reveal"
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 1fr) minmax(0, clamp(360px, 32vw, 460px))",
          gap: "var(--s4)",
          alignItems: "end",
          padding: "clamp(28px, 3.5vw, 52px) var(--page-x) var(--s4)",
        }}
      >
        <div>
          <Lencana label="Protokol pengukuran" warna="brand" dot />
          <h1
            style={{
              font: "800 clamp(30px, 3.6vw, 52px)/1.08 var(--font-inter), system-ui, sans-serif",
              letterSpacing: "-0.03em",
              margin: "var(--s3) 0 0",
              textWrap: "balance",
            }}
          >
            Bagaimana angkanya dibuat, dan di mana batasnya.
          </h1>
          <p
            style={{
              margin: "var(--s3) 0 0",
              maxWidth: "56ch",
              fontSize: "var(--t-lead)",
              lineHeight: 1.62,
              color: "var(--ink-2)",
            }}
          >
            Tiga variabel dicacah manusia di lapangan, satu variabel dibaca AI
            dari foto struk, dan hasilnya disajikan sebagai rentang. Halaman ini
            memuat aturan yang dipakai — termasuk aturan untuk membuang data
            yang tidak layak dipakai.
          </p>
        </div>

        <div
          className="ink-band"
          style={{
            background: "var(--ink)",
            borderRadius: "var(--r-md)",
            padding: "var(--s4)",
          }}
        >
          <span className="eyebrow">Persamaan potensi</span>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 10,
              marginTop: "var(--s3)",
            }}
          >
            <Suku>F</Suku>
            <Operator>×</Operator>
            <Suku>E</Suku>
            <Operator>×</Operator>
            <Suku>C</Suku>
            <Operator>×</Operator>
            <Suku>V</Suku>
            <Operator>=</Operator>
            <span
              className="fig"
              style={{
                padding: "9px 15px",
                borderRadius: "var(--r-pill)",
                background: "var(--paper)",
                color: "var(--ink)",
                font: "700 13px/1 var(--font-mono), ui-monospace, monospace",
              }}
            >
              Potensi belanja
            </span>
          </div>
          <div
            style={{
              height: 1,
              background: "var(--rule)",
              margin: "var(--s3) 0",
            }}
          />
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Pil>Potensi</Pil>
            <Operator>−</Operator>
            <Pil>Tertangkap</Pil>
            <Operator>=</Operator>
            <span
              className="fig"
              style={{
                padding: "9px 15px",
                borderRadius: "var(--r-pill)",
                background: "var(--data)",
                color: "var(--ink)",
                font: "700 13px/1 var(--font-mono), ui-monospace, monospace",
              }}
            >
              Kesenjangan
            </span>
          </div>
          <p
            style={{
              margin: "var(--s3) 0 0",
              fontSize: "var(--t-small)",
              lineHeight: 1.6,
              color: "var(--ink-muted)",
            }}
          >
            Keduanya diukur pada pintu yang sama, slot waktu yang sama, dan
            instrumen yang sama — sehingga selisihnya dapat dibandingkan antar
            simpul.
          </p>
        </div>
      </section>

      {/* ============================================================
          Lima langkah — kartu bertint bergilir.
          ============================================================ */}
      <section className="reveal" style={seksi}>
        <Kepala
          kicker="Alur pencacahan"
          judul="Lima langkah, dari lapangan ke lapisan peta."
          catatan={
            <span className="fig" style={{ fontSize: "var(--t-micro)" }}>
              satu simpul · satu hari kerja
            </span>
          }
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
            gap: "var(--s2)",
          }}
        >
          {LANGKAH.map((l) => (
            <div key={l.n} style={tint(l.tint)}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <span
                  className="fig"
                  style={{
                    fontSize: "clamp(24px, 2.6vw, 34px)",
                    fontWeight: 200,
                    lineHeight: 1,
                    letterSpacing: "-0.03em",
                    color: "var(--ink-faint)",
                  }}
                >
                  {l.n}
                </span>
                <span
                  className="dot"
                  style={{ background: "var(--data)", marginTop: 6 }}
                />
              </div>
              <div
                style={{
                  font: "700 var(--t-body)/1.25 var(--font-inter), system-ui, sans-serif",
                  margin: "var(--s3) 0 var(--s1)",
                }}
              >
                {l.judul}
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--t-small)",
                  lineHeight: 1.55,
                  color: "var(--ink-muted)",
                }}
              >
                {l.isi}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================
          Panel transparansi — foto struk → satu angka.
          ============================================================ */}
      <section className="reveal" style={seksi}>
        <Kepala
          kicker="Panel transparansi"
          judul="Dari foto struk ke satu angka."
          catatan="Setiap nilai V pada peta dapat dibuka sampai foto aslinya, lengkap dengan keyakinan bacaan dan alasan bila datanya dibuang."
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 300px) minmax(0, 1fr)",
            gap: "var(--s3)",
            background: "var(--tile-sky)",
            borderRadius: "var(--r-md)",
            padding: "var(--s4)",
          }}
        >
          {/* KIRI — foto + kontak sheet */}
          <div>
            <div
              className="kartu"
              style={{
                borderRadius: "var(--r-sm)",
                overflow: "hidden",
                height: 280,
                background: "var(--surface)",
              }}
            >
              <ImagePlaceholder
                label="Foto struk (identitas diredaksi)"
                style={{ color: "var(--ink-faint)" }}
              />
            </div>
            <div style={{ display: "flex", gap: 7, marginTop: 10 }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "var(--r-sm)",
                    background: "var(--paper-2)",
                    boxShadow: i === 0 ? "0 0 0 2px var(--data)" : undefined,
                  }}
                />
              ))}
              <div
                className="fig"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "var(--r-sm)",
                  border: "1.5px dashed var(--rule-strong)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10.5,
                  color: "var(--ink-faint)",
                }}
              >
                +18
              </div>
            </div>
          </div>

          {/* KANAN — hasil baca AI */}
          <div>
            <div className="eyebrow" style={{ marginBottom: "var(--s2)" }}>
              Hasil baca AI
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                background: "var(--rule)",
                borderRadius: "var(--r-sm)",
                overflow: "hidden",
              }}
            >
              <BarisAtribut label="Kategori (dinormalisasi)">
                <span style={{ fontWeight: 600, color: "var(--ink)" }}>
                  F&amp;B siap saji
                </span>
              </BarisAtribut>
              <BarisAtribut label="Subtotal sebelum pajak">
                <span style={{ color: "var(--ink-faint)" }}>
                  Rp 47.500 — tidak dipakai
                </span>
              </BarisAtribut>
              <BarisAtribut label="Waktu transaksi">
                <span className="fig">07.42 · slot 06–09</span>
              </BarisAtribut>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  background: "var(--data-wash)",
                  fontSize: "var(--t-small)",
                }}
              >
                <span style={{ fontWeight: 600, color: "var(--ink)" }}>
                  Jumlah dibayarkan → V
                </span>
                <span
                  className="fig"
                  style={{ fontWeight: 700, color: "var(--data)" }}
                >
                  Rp 42.000
                </span>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "var(--s2)",
                marginTop: "var(--s2)",
              }}
            >
              <KartuStat label="Keyakinan bacaan" nilai="0,91" isi={84} />
              <KartuStat label="Cakupan" nilai="182 / 196" catatan="struk terbaca" />
              <KartuStat label="Dibuang" nilai="4" catatan="bacaan ambigu" />
            </div>

            <div
              style={{
                display: "flex",
                gap: 11,
                alignItems: "flex-start",
                marginTop: "var(--s2)",
                borderRadius: "var(--r-sm)",
                background: "var(--field-wash)",
                padding: "15px 17px",
                fontSize: "var(--t-small)",
                lineHeight: 1.55,
                color: "var(--ink-2)",
              }}
            >
              <span
                className="dot"
                style={{ background: "var(--field)", marginTop: 6 }}
              />
              <span>
                Bila sampel satu kategori terlalu tipis, nilai V{" "}
                <b>dialihkan</b> dari kawasan sejenis dan simpul itu ditandai
                pada lapisan kepercayaan data — bukan diisi diam-diam.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          Mengapa jawabannya rentang — histogram + kartu "yang dibuang".
          ============================================================ */}
      <section
        className="reveal"
        style={{
          ...seksi,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr)",
          gap: "var(--s2)",
        }}
      >
        <div style={tint("var(--data-wash)")}>
          <div className="eyebrow" style={{ marginBottom: "var(--s2)" }}>
            Sebaran hasil simulasi
          </div>
          <h2
            style={{
              font: "800 var(--t-h3)/1.12 var(--font-inter), system-ui, sans-serif",
              letterSpacing: "-0.02em",
              margin: "0 0 6px",
            }}
          >
            Mengapa jawabannya rentang
          </h2>
          <p
            style={{
              fontSize: "var(--t-small)",
              lineHeight: 1.6,
              color: "var(--ink-muted)",
              margin: "0 0 var(--s3)",
              maxWidth: "48ch",
            }}
          >
            Tiap variabel punya ketidakpastian sendiri. Setelah dikalikan,
            ketidakpastiannya menumpuk — maka yang dilaporkan adalah rentang
            P10–P90.
          </p>
          <svg
            width="100%"
            height="180"
            viewBox="0 0 560 180"
            preserveAspectRatio="xMidYMid meet"
            style={{ display: "block", width: "100%", maxWidth: 620, margin: "0 auto" }}
          >
            {HISTO.map((b) => (
              <rect
                key={b.x}
                x={b.x}
                y={180 - b.h}
                width={18}
                height={b.h}
                rx={2}
                style={{ fill: WARNA_GRUP[b.grup] }}
              />
            ))}
            <line
              x1={92}
              y1={0}
              x2={92}
              y2={180}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              style={{ stroke: "var(--ink)" }}
            />
            <line
              x1={233}
              y1={0}
              x2={233}
              y2={180}
              strokeWidth={2}
              style={{ stroke: "var(--ink)" }}
            />
            <line
              x1={396}
              y1={0}
              x2={396}
              y2={180}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              style={{ stroke: "var(--ink)" }}
            />
          </svg>
          <div
            className="fig"
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 12,
              fontSize: "var(--t-micro)",
            }}
          >
            <span style={{ color: "var(--ink-muted)" }}>P10</span>
            <span style={{ fontWeight: 700, color: "var(--ink)" }}>median</span>
            <span style={{ color: "var(--ink-muted)" }}>P90</span>
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: "var(--s3)",
              flexWrap: "wrap",
            }}
          >
            {["10.000 iterasi", "per pintu · per slot", "tanpa penghalusan antar jam"].map(
              (t) => (
                <span key={t} className="eyebrow-chip eyebrow">
                  {t}
                </span>
              ),
            )}
          </div>
        </div>

        <div
          className="ink-band"
          style={{
            background: "var(--ink)",
            borderRadius: "var(--r-md)",
            padding: "var(--s4)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div className="eyebrow" style={{ marginBottom: "var(--s3)" }}>
            Yang kami buang, dan alasannya
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--s3)",
              flex: 1,
            }}
          >
            {BUANG.map((b) => (
              <div
                key={b.judul}
                style={{ display: "flex", gap: 14, alignItems: "flex-start" }}
              >
                <span
                  className="dot"
                  style={{ background: b.warna, marginTop: 7 }}
                />
                <div>
                  <div
                    style={{
                      fontSize: "var(--t-small)",
                      fontWeight: 600,
                      color: "var(--paper)",
                    }}
                  >
                    {b.judul}
                  </div>
                  <div
                    style={{
                      fontSize: "var(--t-small)",
                      lineHeight: 1.55,
                      color: "var(--ink-muted)",
                      marginTop: 4,
                    }}
                  >
                    {b.isi}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: "var(--s4)",
              flexWrap: "wrap",
            }}
          >
            <button className="b bp">Unduh protokol pencacahan</button>
            <button className="b bs">Catatan keterbatasan</button>
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
          href="/rekomendasi"
          style={{
            fontSize: "var(--t-small)",
            fontWeight: 600,
            color: "var(--ink)",
          }}
        >
          Lanjut ke rekomendasi →
        </Link>
      </footer>
    </div>
  );
}

/* --- Potongan kecil untuk kartu persamaan di hero -------------------------- */

function Operator({ children }: { children: string }) {
  return (
    <span
      style={{
        color: "var(--ink-faint)",
        font: "700 15px/1 var(--font-inter), system-ui, sans-serif",
      }}
    >
      {children}
    </span>
  );
}

function Suku({ children }: { children: string }) {
  return (
    <span
      className="fig"
      style={{
        padding: "9px 15px",
        borderRadius: "var(--r-pill)",
        background: "rgba(250, 248, 244, 0.1)",
        color: "var(--data-mid)",
        font: "700 15px/1 var(--font-mono), ui-monospace, monospace",
      }}
    >
      {children}
    </span>
  );
}

function Pil({ children }: { children: string }) {
  return (
    <span
      style={{
        padding: "9px 15px",
        borderRadius: "var(--r-pill)",
        background: "rgba(250, 248, 244, 0.1)",
        color: "var(--ink-muted)",
        font: "600 13px/1 var(--font-inter), system-ui, sans-serif",
      }}
    >
      {children}
    </span>
  );
}

/* --- Baris atribut & kartu stat di panel transparansi --------------------- */

function BarisAtribut({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "var(--s2)",
        padding: "13px 16px",
        background: "var(--surface)",
        fontSize: "var(--t-small)",
      }}
    >
      <span style={{ color: "var(--ink-muted)" }}>{label}</span>
      {children}
    </div>
  );
}

function KartuStat({
  label,
  nilai,
  isi,
  catatan,
}: {
  label: string;
  nilai: string;
  isi?: number;
  catatan?: string;
}) {
  return (
    <div
      style={{
        borderRadius: "var(--r-sm)",
        background: "var(--surface)",
        border: "1px solid var(--rule)",
        padding: "var(--s2)",
      }}
    >
      <div className="eyebrow" style={{ fontSize: 9, marginBottom: 9 }}>
        {label}
      </div>
      <div className="fig" style={{ fontSize: 19, color: "var(--ink)" }}>
        {nilai}
      </div>
      {isi !== undefined && (
        <span
          className="pill"
          style={{
            display: "block",
            height: 5,
            marginTop: 10,
            background: "var(--rule)",
            overflow: "hidden",
          }}
        >
          <span
            className="pill"
            style={{
              display: "block",
              width: `${isi}%`,
              height: 5,
              background: "var(--data)",
            }}
          />
        </span>
      )}
      {catatan && (
        <div
          style={{
            fontSize: 10.5,
            lineHeight: 1.4,
            color: "var(--ink-muted)",
            marginTop: 7,
          }}
        >
          {catatan}
        </div>
      )}
    </div>
  );
}
