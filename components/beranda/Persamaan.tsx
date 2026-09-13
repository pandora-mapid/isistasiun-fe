"use client";

/**
 * F × E × C × V sebagai persamaan, bukan sebagai empat kartu.
 *
 * Ini inti intelektual produknya — satu-satunya alasan angka kesenjangan bisa
 * ada sama sekali. Sebelumnya ia disajikan sebagai empat kotak abu berukuran
 * sama, persis seperti setiap kelompok empat hal lain di halaman ini, sehingga
 * tidak ada apa pun yang memberi tahu pembaca bahwa keempatnya **dikalikan**.
 *
 * Bentuk persamaan mengembalikan hubungan itu, dan angkanya diambil dari satu
 * titik pada satu slot yang benar-benar dicacah — bukan rata-rata karangan.
 *
 * Putaran 12: kicker "Instrumen" jadi `<KickerBernomor n={2}>`; band ini
 * diperlakukan sebagai bab bernomor. `--ink-faint` pada angka otomatis jadi
 * warna terang di `.ink-band`.
 *
 * Putaran berikut: kepala bab jadi baris flex (bukan `.g12`) supaya judul
 * "Empat variabel, satu instrumen." bisa `nowrap` selebar isinya. Paragraf
 * pengantar dipersingkat, RATA-KANAN (`margin-left: auto` + `text-align:
 * right`, menempel tepi band), dan ditulis kalimat biasa saja — tanpa em-dash,
 * titik-dua, atau titik-koma (permintaan user).
 */

import { persen, ribuan, rupiah } from "@/lib/format";
import { KickerBernomor } from "@/components/paper/KickerBernomor";

/**
 * Contoh nyata satu slot yang benar-benar dicacah: Manggarai, sore.
 * F = pejalan tercacah di depan gerai pada blok survei; E = masuk/lewat
 * (31/152); C = konversi asumsi 0,95; V = nilai acuan makanan-minuman
 * Rp25.000 (struk belum dikumpulkan). Sumber: entry-conversion lapangan.
 */
const CONTOH_NYATA = { F: 152, E: 0.2, C: 0.95, V: 25000 };

type Suku = {
  huruf: string;
  nama: string;
  arti: string;
  sumber: "lapangan" | "ai";
  nilai: string;
  satuan?: string;
};

export function Persamaan() {
  const v = CONTOH_NYATA;

  const suku: Suku[] = [
    {
      huruf: "F",
      nama: "Arus pejalan",
      arti: "Pejalan kaki yang melintasi garis pengamatan di depan gerai, dicacah dalam blok menerus 15 menit.",
      sumber: "lapangan",
      nilai: ribuan(v.F),
      satuan: "org tercacah",
    },
    {
      huruf: "E",
      nama: "Entry ratio",
      arti: "Bagian dari mereka yang berhenti dan benar-benar masuk ke dalam gerai.",
      sumber: "lapangan",
      nilai: persen(v.E),
    },
    {
      huruf: "C",
      nama: "Konversi",
      arti: "Bagian dari yang sudah masuk dan menyelesaikan pembayaran. Masih asumsi acuan.",
      sumber: "lapangan",
      nilai: persen(v.C, 0),
    },
    {
      huruf: "V",
      nama: "Nilai transaksi",
      arti: "Nilai acuan per kategori (struk belum dikumpulkan). Nantinya dibaca dari foto struk dengan aturan yang ditetapkan sebelum survei.",
      sumber: "ai",
      nilai: rupiah(v.V),
    },
  ];

  return (
    <section className="ink-band" style={{ padding: "var(--s6) 0" }}>
      <div className="wrap">
        {/* Baris flex, bukan `.g12`: blok judul `flex: 0 0 auto` supaya <h2>
            `nowrap` menentukan lebarnya sendiri; paragraf mengambil sisa dan
            `flex-wrap` menjatuhkannya ke bawah kalau ruang tak cukup. */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "var(--s5)",
            flexWrap: "wrap",
          }}
        >
          <div className="blok-judul" style={{ flex: "0 0 auto" }}>
            <div style={{ marginBottom: "var(--s3)" }}>
              <KickerBernomor n={2} kicker="Instrumen" />
            </div>
            <h2
              className="boleh-patah"
              style={{
                font: `800 var(--t-h2)/1.06 var(--font-inter), system-ui, sans-serif`,
                letterSpacing: "-0.02em",
                margin: 0,
                whiteSpace: "nowrap",
              }}
            >
              Empat variabel, satu instrumen.
            </h2>
          </div>
          <p
            style={{
              flex: "1 1 340px",
              maxWidth: "44ch",
              margin: "0 0 0 auto",
              fontSize: "var(--t-lead)",
              lineHeight: 1.6,
              color: "var(--ink-muted)",
              textAlign: "right",
            }}
          >
            Tiga variabel pertama tidak terdapat di dataset mana pun, kami
            cacah sendiri. Yang keempat dibaca mesin dari struk. Dari situ didapatkanlah kesenjangan
            dari perkaliannya, tak pernah diukur langsung.
          </p>
        </div>

        {/* Persamaannya sendiri. Tanda kali duduk di antara huruf, sejajar
            dengan garis dasarnya — itu yang membuat hubungan antar-suku
            terbaca sebelum satu kata pun dibaca. */}
        <div
          className="runtuh-2"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "var(--s3)",
            // Sengaja lebih lega (`--s5`) dari jarak kicker→judul (`--s3`) di
            // atas — dua jeda itu tidak boleh sama besar.
            marginTop: "var(--s5)",
          }}
        >
          {suku.map((s, i) => (
            <div key={s.huruf} style={{ position: "relative" }}>
              {i > 0 && (
                <span
                  aria-hidden
                  className="fig"
                  style={{
                    position: "absolute",
                    left: "calc(var(--s3) / -2)",
                    transform: "translate(-50%, 0)",
                    top: "clamp(16px, 2.1vw, 34px)",
                    fontSize: "clamp(16px, 1.8vw, 26px)",
                    color: "var(--ink-faint)",
                  }}
                >
                  ×
                </span>
              )}
              <div
                className="fig"
                style={{
                  font: `400 clamp(46px, 6vw, 86px)/0.9 var(--font-mono), ui-monospace, monospace`,
                  letterSpacing: "-0.05em",
                }}
              >
                {s.huruf}
              </div>
              <div
                style={{
                  marginTop: "var(--s3)",
                  paddingTop: "var(--s2)",
                  borderTop: "1px solid var(--rule)",
                }}
              >
                <div
                  style={{
                    fontSize: "var(--t-body)",
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  {s.nama}
                </div>
                <div
                  className="fig"
                  style={{
                    fontSize: "clamp(17px, 1.5vw, 21px)",
                    color: "var(--data)",
                    marginBottom: "var(--s2)",
                  }}
                >
                  {s.nilai}
                  {s.satuan && (
                    <span
                      style={{
                        fontSize: "var(--t-micro)",
                        color: "var(--ink-faint)",
                        letterSpacing: 0,
                      }}
                    >
                      {" "}
                      {s.satuan}
                    </span>
                  )}
                </div>
                <p
                  style={{
                    margin: "0 0 var(--s2)",
                    fontSize: "var(--t-small)",
                    lineHeight: 1.58,
                    color: "var(--ink-muted)",
                  }}
                >
                  {s.arti}
                </p>
                <span
                  className={s.sumber === "ai" ? "tag tag-data" : "tag tag-field"}
                >
                  {s.sumber === "ai" ? "Ekstraksi AI" : "Survei lapangan"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Angka di atas bukan hiasan — ini alamat persisnya di dalam data. */}
        <p
          className="fig"
          style={{
            marginTop: "var(--s4)",
            paddingTop: "var(--s2)",
            borderTop: "1px solid var(--rule)",
            fontSize: "var(--t-micro)",
            color: "var(--ink-faint)",
          }}
        >
          nilai nyata · Manggarai · depan gerai · slot sore (dicacah 17.30)
        </p>
      </div>
    </section>
  );
}
