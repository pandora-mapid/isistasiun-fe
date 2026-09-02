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
 */

import { persen, ribuan, rupiah } from "@/lib/format";
import { useBeranda } from "./BerandaData";

type Suku = {
  huruf: string;
  nama: string;
  arti: string;
  sumber: "lapangan" | "ai";
  nilai: string;
  satuan?: string;
};

const KOSONG = "—";

export function Persamaan() {
  const { contohVariabel } = useBeranda();
  const v = contohVariabel?.variables;

  const suku: Suku[] = [
    {
      huruf: "F",
      nama: "Arus pejalan",
      arti: "Pejalan kaki yang melintasi garis pengamatan di satu pintu, dicacah dalam blok menerus 15 menit.",
      sumber: "lapangan",
      nilai: v ? ribuan(v.F) : KOSONG,
      satuan: "org/jam",
    },
    {
      huruf: "E",
      nama: "Entry ratio",
      arti: "Bagian dari mereka yang berhenti dan benar-benar masuk ke dalam gerai.",
      sumber: "lapangan",
      nilai: v ? persen(v.E) : KOSONG,
    },
    {
      huruf: "C",
      nama: "Konversi",
      arti: "Bagian dari yang sudah masuk dan menyelesaikan pembayaran.",
      sumber: "lapangan",
      nilai: v ? persen(v.C, 0) : KOSONG,
    },
    {
      huruf: "V",
      nama: "Nilai transaksi",
      arti: "Jumlah akhir yang dibayarkan, dibaca dari foto struk dengan aturan yang ditetapkan sebelum survei dimulai.",
      sumber: "ai",
      nilai: v ? rupiah(v.V) : KOSONG,
    },
  ];

  return (
    <section className="ink-band" style={{ padding: "var(--s6) 0" }}>
      <div className="wrap">
        <div
          className="g12"
          style={{ rowGap: "var(--s4)", alignItems: "start" }}
        >
          <div style={{ gridColumn: "span 4" }}>
            <span
              className="eyebrow-chip eyebrow"
              style={{ marginBottom: "var(--s2)", display: "inline-flex" }}
            >
              Instrumen
            </span>
            <h2
              style={{
                font: `800 var(--t-h2)/1.06 var(--font-inter), system-ui, sans-serif`,
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              Empat variabel, satu instrumen.
            </h2>
          </div>
          <p
            className="measure"
            style={{
              gridColumn: "6 / span 6",
              margin: 0,
              fontSize: "var(--t-lead)",
              lineHeight: 1.6,
              color: "var(--ink-muted)",
            }}
          >
            Tiga yang pertama tidak ada di dataset mana pun — ketiganya dicacah
            sendiri di lapangan. Yang keempat dibaca mesin dari foto struk.
            Kesenjangan tidak pernah diukur langsung; ia keluar dari perkalian
            keempatnya.
          </p>
        </div>

        {/* Persamaannya sendiri. Tanda kali duduk di antara huruf, sejajar
            dengan garis dasarnya — itu yang membuat hubungan antar-suku
            terbaca sebelum satu kata pun dibaca. */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "var(--s3)",
            marginTop: "var(--s6)",
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
          {contohVariabel
            ? `nilai contoh · ${contohVariabel.namaStasiun} · ${contohVariabel.namaTitik} · slot ${contohVariabel.slot} (dicacah ${contohVariabel.jam})`
            : "memuat nilai contoh…"}
        </p>
      </div>
    </section>
  );
}
