"use client";

/**
 * Komponen daun halaman Insight — semuanya membaca satu provider di atasnya
 * (`useInsight()`), tidak menghitung angka sendiri (kecuali posisi piksel di
 * dalam batang/kolom). Dipisah dari `app/insight/page.tsx` supaya halaman itu
 * tetap server component; hanya bagian yang butuh data ini yang client.
 *
 * Rupa: kartu/panel kompak, DATAR (tanpa bayangan), di atas kertas hangat yang
 * seragam — struktur dipinjam dari halaman Metodologi & Rekomendasi, palet dari
 * Beranda. Tiap daun merender ISI saja; `page.tsx` yang membungkusnya dalam
 * panel `--paper-2` atau kartu `.kartu`. Kecuali `HeroKartu`, yang memang kartu
 * tinta gelap sendiri.
 *
 * Warna: `--data` untuk mark grafik + pembacaan instrumen (persen permintaan),
 * `--ink` untuk angka utama/kesimpulan, `--field` untuk catatan kerja lapangan.
 */

import type { CSSProperties } from "react";

import { persen, ribuan, rupiahRingkas } from "@/lib/format";
import { useInsight, type IsiSel } from "./InsightData";

/* ---------------------------------------------------------------------------
 * Hero — kartu tinta ringkasan (satu-satunya elemen gelap di halaman)
 * ------------------------------------------------------------------------ */

export function HeroKartu() {
  const { sorotan, ringkas } = useInsight();

  const stat: [string, string][] = [
    ["Simpul diamati", ringkas ? ribuan(ringkas.simpulDiamati) : "—"],
    ["Struk terbaca", ringkas ? ribuan(ringkas.strukTerbaca) : "—"],
    ["Estimasi ditahan", ringkas ? `${ribuan(ringkas.pintuDitahan)} pintu` : "—"],
  ];

  return (
    <div
      className="kartu ink-band"
      style={{ background: "var(--ink)", overflow: "hidden" }}
    >
      <div style={{ padding: "var(--s4)" }}>
        <span className="eyebrow">Kesenjangan terbesar</span>
        <div
          className="fig"
          style={{
            font: "400 clamp(30px, 3.4vw, 42px)/1 var(--font-mono), ui-monospace, monospace",
            letterSpacing: "-0.03em",
            color: "var(--data)",
            margin: "var(--s2) 0 0",
          }}
        >
          {sorotan ? rupiahRingkas(sorotan.gap.p50) : "—"}
          <span style={{ fontSize: "var(--t-small)", color: "var(--ink-faint)" }}>
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
          {sorotan
            ? `${sorotan.namaTitik}, ${sorotan.namaStasiun}. Potensi ${rupiahRingkas(
                sorotan.potensi.p50,
              )} lawan ${rupiahRingkas(sorotan.tertangkap.p50)} yang tertangkap.`
            : "Memuat bacaan lapangan…"}
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
        {stat.map(([k, v]) => (
          <div
            key={k}
            style={{ background: "var(--ink)", padding: "var(--s3) var(--s2)" }}
          >
            <div className="fig" style={{ fontSize: 18, color: "var(--data)" }}>
              {v}
            </div>
            <div className="eyebrow" style={{ fontSize: 9, marginTop: 6 }}>
              {k}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * 1 · Batang bersarang — potensi, tertangkap, kesenjangan (isi panel --paper-2)
 * ------------------------------------------------------------------------ */

export function BatangBersarang() {
  const { sorotan } = useInsight();
  const isi = sorotan?.isiPersen ?? 0;

  return (
    <div>
      <div style={{ position: "relative", height: 60 }}>
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
            width: `${isi}%`,
            background: "var(--data)",
            borderRadius: "var(--r-sm) 0 0 var(--r-sm)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: `${isi}%`,
            top: -5,
            bottom: -5,
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
        <span>{sorotan ? rupiahRingkas(sorotan.potensi.p50) : "—"} potensi</span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "var(--s2)",
          marginTop: "var(--s3)",
          borderTop: "1px solid var(--rule)",
          paddingTop: "var(--s3)",
        }}
      >
        <Kaki label="Tertangkap" nilai={sorotan?.tertangkap.p50 ?? null} />
        <Kaki label="Kesenjangan" nilai={sorotan?.gap.p50 ?? null} sorot />
        <Kaki label="Potensi" nilai={sorotan?.potensi.p50 ?? null} />
      </div>
    </div>
  );
}

function Kaki({
  label,
  nilai,
  sorot = false,
}: {
  label: string;
  nilai: number | null;
  sorot?: boolean;
}) {
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div
        className="fig"
        style={{
          fontSize: sorot ? "clamp(20px, 2.4vw, 27px)" : "clamp(16px, 1.9vw, 20px)",
          fontWeight: sorot ? 700 : 400,
          color: sorot ? "var(--ink)" : "var(--ink-2)",
          marginTop: 6,
          whiteSpace: "nowrap",
        }}
      >
        {rupiahRingkas(nilai)}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * 2 · Diagram kolom — kesenjangan per slot (isi panel --paper-2)
 * ------------------------------------------------------------------------ */

export function KolomSlot() {
  const { profilSlot, sorotan } = useInsight();

  const baris = profilSlot.length
    ? profilSlot
    : [
        { label: "06–09", jam: "", nilai: null, tinggi: 0 },
        { label: "11–14", jam: "", nilai: null, tinggi: 0 },
        { label: "16–19", jam: "", nilai: null, tinggi: 0 },
        { label: "19–21", jam: "", nilai: null, tinggi: 0 },
      ];
  const puncak = baris.reduce(
    (b, s, i) => ((s.nilai ?? -1) > (baris[b]?.nilai ?? -1) ? i : b),
    0,
  );

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "var(--s2)",
          height: 190,
        }}
      >
        {baris.map((s, i) => (
          <div
            key={s.label}
            title={s.jam || undefined}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              gap: 7,
              height: "100%",
            }}
          >
            <span
              className="fig"
              style={{
                fontSize: "var(--t-micro)",
                textAlign: "center",
                color: i === puncak ? "var(--ink-2)" : "var(--ink-faint)",
              }}
            >
              {rupiahRingkas(s.nilai)}
            </span>
            <div
              style={{
                height: `${Math.max(s.tinggi, s.nilai === null ? 0 : 2)}%`,
                background: i === puncak ? "var(--data)" : "var(--data-soft)",
                borderRadius: "var(--r-sm) var(--r-sm) 0 0",
              }}
            />
          </div>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          gap: "var(--s2)",
          marginTop: 7,
          borderTop: "1px solid var(--rule)",
          paddingTop: 7,
        }}
      >
        {baris.map((s) => (
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
          color: "var(--ink-muted)",
        }}
      >
        Kesenjangan per slot di {sorotan?.namaTitik ?? "pintu terbesar"}. Keempat
        batang memakai satu skala rupiah yang sama.
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * 2 · Daftar temuan + catatan sampel tipis (isi kartu .kartu putih)
 * ------------------------------------------------------------------------ */

export function DaftarTemuan() {
  const { temuan, sampelTipis } = useInsight();

  const items: { judul: string; isi: string }[] = temuan
    ? [
        {
          judul: `Kesenjangan terpusat di slot ${temuan.slotPuncak.label}`,
          isi: `${rupiahRingkas(temuan.slotPuncak.nilai)} dari ${rupiahRingkas(
            temuan.gapHarian,
          )} kesenjangan harian ada di satu slot — slot terbesar dari empat.`,
        },
        temuan.kategoriKosong
          ? {
              judul: `${temuan.kategoriKosong.label}: permintaannya ada, gerainya nol`,
              isi: `Permintaan kawasan ${persen(
                temuan.kategoriKosong.demandShare,
                0,
              )} di pintu terbesar, tanpa satu pun gerai di sana.`,
            }
          : {
              judul: "Setiap kategori sudah punya gerai",
              isi: "Di pintu terbesar tidak ada kategori dengan permintaan terbaca tapi nol gerai.",
            },
        temuan.pembanding
          ? {
              judul: "Arus tinggi belum tentu kesenjangan tinggi",
              isi: `Arus pagi ${ribuan(temuan.arusTitik ?? 0)} org/jam lawan ${ribuan(
                temuan.pembanding.arus ?? 0,
              )} di ${temuan.pembanding.namaTitik} Sudirman — kesenjangan ${rupiahRingkas(
                temuan.gapHarian,
              )} lawan ${rupiahRingkas(temuan.pembanding.gap)}.`,
            }
          : {
              judul: "Arus dan kesenjangan dibaca terpisah",
              isi: "Arus pejalan tidak diterjemahkan langsung jadi kesenjangan.",
            },
      ]
    : [
        { judul: "Memuat temuan…", isi: "" },
        { judul: "Memuat temuan…", isi: "" },
        { judul: "Memuat temuan…", isi: "" },
      ];

  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: "var(--s3)" }}>
        Temuan
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
        {items.map((t, i) => (
          <div
            key={i}
            style={{ display: "flex", gap: "var(--s2)", alignItems: "flex-start" }}
          >
            <span
              className="dot"
              style={{ background: "var(--data)", marginTop: 7 }}
            />
            <div>
              <div
                style={{
                  fontSize: "var(--t-body)",
                  fontWeight: 600,
                  lineHeight: 1.35,
                }}
              >
                {t.judul}
              </div>
              {t.isi && (
                <div
                  style={{
                    marginTop: 3,
                    fontSize: "var(--t-small)",
                    lineHeight: 1.5,
                    color: "var(--ink-muted)",
                  }}
                >
                  {t.isi}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          gap: "var(--s2)",
          alignItems: "flex-start",
          marginTop: "var(--s4)",
          padding: "var(--s3)",
          background: "var(--field-wash)",
          borderRadius: "var(--r-sm)",
        }}
      >
        <span
          className="dot"
          style={{ background: "var(--field)", marginTop: 7 }}
        />
        <div>
          <span className="eyebrow" style={{ color: "var(--field)" }}>
            Estimasi ditahan
          </span>
          <p
            style={{
              margin: "6px 0 0",
              fontSize: "var(--t-small)",
              lineHeight: 1.5,
              color: "var(--ink-2)",
            }}
          >
            {sampelTipis
              ? `${sampelTipis.namaTitik} ${sampelTipis.namaStasiun} baru tercacah ${sampelTipis.geraiCount} gerai pada ${sampelTipis.blokCount} blok — ambangnya 3 gerai × 2 blok. Angkanya ditahan sampai survei putaran kedua.`
              : "Titik yang belum memenuhi ambang 3 gerai × 2 blok ditandai dan tidak diberi estimasi."}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * 3 · Matriks kategori × pintu terbesar tiap simpul — tabel baris bertumpuk
 * ------------------------------------------------------------------------ */

const KOLOM = "minmax(0,1.5fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1.4fr)";

function Status({ v }: { v: IsiSel }) {
  const gaya: Record<IsiSel, CSSProperties> = {
    Terisi: { color: "var(--ink-faint)" },
    Kurang: { color: "var(--ink-2)" },
    Kosong: { color: "var(--ink)", fontWeight: 700 },
    "—": { color: "var(--ink-faint)" },
  };
  return <span style={{ fontSize: "var(--t-small)", ...gaya[v] }}>{v}</span>;
}

function KolHead({ stasiun, titik }: { stasiun: string; titik?: string }) {
  return (
    <span className="eyebrow">
      {stasiun}
      {titik && (
        <span
          style={{
            display: "block",
            marginTop: 2,
            fontSize: "var(--t-micro)",
            fontWeight: 400,
            letterSpacing: "normal",
            textTransform: "none",
            color: "var(--ink-faint)",
          }}
        >
          {titik}
        </span>
      )}
    </span>
  );
}

export function MatriksKategori() {
  const { matriks } = useInsight();

  const baris =
    matriks?.baris ??
    ["F&B", "Ritel", "Apotek", "Jasa", "Lainnya"].map((kategori) => ({
      kategori,
      a: "—" as IsiSel,
      b: "—" as IsiSel,
      permintaan: null as number | null,
    }));

  return (
    <div
      style={{
        borderRadius: "var(--r-md)",
        overflow: "hidden",
        border: "1px solid var(--rule)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: KOLOM,
          gap: "var(--s3)",
          padding: "var(--s3) var(--s4)",
          background: "var(--paper-2)",
        }}
      >
        <span className="eyebrow">Kategori</span>
        <KolHead
          stasiun={matriks?.kolomA.namaStasiun ?? "Simpul pertama"}
          titik={matriks?.kolomA.namaTitik}
        />
        <KolHead
          stasiun={matriks?.kolomB.namaStasiun ?? "Simpul kedua"}
          titik={matriks?.kolomB.namaTitik}
        />
        <span className="eyebrow">Permintaan terbaca</span>
      </div>

      {baris.map((row, i) => (
        <div
          key={row.kategori}
          style={{
            display: "grid",
            gridTemplateColumns: KOLOM,
            gap: "var(--s3)",
            padding: "var(--s3) var(--s4)",
            alignItems: "center",
            background: i % 2 ? "var(--paper-2)" : "var(--surface)",
            borderTop: "1px solid var(--rule)",
          }}
        >
          <span style={{ fontSize: "var(--t-small)", fontWeight: 600 }}>
            {row.kategori}
          </span>
          <Status v={row.a} />
          <Status v={row.b} />
          <span style={{ display: "flex", alignItems: "center", gap: "var(--s2)" }}>
            <span
              className="fig"
              style={{
                fontSize: "var(--t-small)",
                color: "var(--data)",
                minWidth: "4.5ch",
              }}
            >
              {row.permintaan === null ? "—" : persen(row.permintaan, 1)}
            </span>
            {row.permintaan !== null && (
              <span
                className="pill"
                style={{
                  display: "inline-block",
                  overflow: "hidden",
                  flex: 1,
                  maxWidth: 96,
                  height: 5,
                  background: "var(--rule)",
                }}
              >
                <span
                  className="pill"
                  style={{
                    display: "block",
                    width: `${Math.min(100, row.permintaan * 100)}%`,
                    height: 5,
                    background: "var(--data)",
                  }}
                />
              </span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Footer — jejak asal data
 * ------------------------------------------------------------------------ */

export function JejakInsight() {
  const { jejak } = useInsight();
  if (!jejak) return null;
  return (
    <span className="fig" style={{ fontSize: 10.5, color: "var(--ink-faint)" }}>
      data contoh · pipeline {jejak.pipeline} · {jejak.jenisHari} · dibuat{" "}
      {jejak.dibuat}
    </span>
  );
}
