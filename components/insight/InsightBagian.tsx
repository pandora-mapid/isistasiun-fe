"use client";

/**
 * Komponen daun halaman Insight — semuanya membaca satu provider di atasnya
 * (`useInsight()`), tidak menghitung angka sendiri (kecuali posisi piksel di
 * dalam batang/kolom). Dipisah dari `app/insight/page.tsx` supaya halaman itu
 * tetap server component; hanya bagian yang butuh data ini yang client.
 *
 * Rupa: TELANJANG. Insight bukan majalah bersection seperti Beranda — ia satu
 * esai yang mengalir. Grafik duduk langsung di kolom baca, dibatasi garis-
 * rambut atas/bawah, tanpa kotak `.kartu`, tanpa border, tanpa latar. Palet
 * tetap persis Beranda: `--data` untuk mark grafik + pembacaan instrumen,
 * `--ink` untuk angka utama/kesimpulan, `--field` untuk kerja lapangan.
 */

import type { CSSProperties } from "react";

import { persen, ribuan, rupiahRingkas } from "@/lib/format";
import { useInsight, type IsiSel } from "./InsightData";

/* ---------------------------------------------------------------------------
 * Ringkasan — panel garis-rambut datar di atas kertas (bukan kartu tinta)
 * ------------------------------------------------------------------------ */

export function RingkasInsight() {
  const { sorotan, ringkas } = useInsight();

  const stat: [string, string][] = [
    ["Simpul diamati", ringkas ? ribuan(ringkas.simpulDiamati) : "—"],
    ["Struk terbaca", ringkas ? ribuan(ringkas.strukTerbaca) : "—"],
    ["Estimasi ditahan", ringkas ? `${ribuan(ringkas.pintuDitahan)} pintu` : "—"],
  ];

  return (
    <div
      style={{
        marginTop: "var(--s5)",
        borderTop: "1px solid var(--rule)",
        borderBottom: "1px solid var(--rule)",
        padding: "var(--s4) 0",
      }}
    >
      <span className="eyebrow">Kesenjangan terbesar · per hari kerja</span>
      <div
        className="fig"
        style={{
          font: "400 clamp(40px, 6vw, 68px)/1 var(--font-mono), ui-monospace, monospace",
          letterSpacing: "-0.03em",
          color: "var(--ink)",
          margin: "var(--s2) 0 0",
        }}
      >
        {sorotan ? rupiahRingkas(sorotan.gap.p50) : "—"}
        <span style={{ fontSize: "var(--t-small)", color: "var(--ink-faint)" }}>
          {" "}
          / hari
        </span>
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: "var(--t-small)",
          color: "var(--ink-muted)",
        }}
      >
        {sorotan
          ? `${sorotan.namaTitik}, ${sorotan.namaStasiun}`
          : "Memuat bacaan lapangan…"}
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--s5)",
          marginTop: "var(--s4)",
          paddingTop: "var(--s3)",
          borderTop: "1px solid var(--rule)",
        }}
      >
        {stat.map(([k, v]) => (
          <div key={k}>
            <div
              className="fig"
              style={{ fontSize: "clamp(18px, 2vw, 22px)", color: "var(--ink-2)" }}
            >
              {v}
            </div>
            <div className="eyebrow" style={{ marginTop: 4 }}>
              {k}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * 1 · Batang bersarang — potensi, tertangkap, kesenjangan
 * ------------------------------------------------------------------------ */

export function BatangBersarang() {
  const { sorotan } = useInsight();
  const isi = sorotan?.isiPersen ?? 0;

  return (
    <div style={{ borderTop: "1px solid var(--rule)", paddingTop: "var(--s3)" }}>
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
              width: `${isi}%`,
              background: "var(--data)",
              borderRadius: "var(--r-sm) 0 0 var(--r-sm)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: `${isi}%`,
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
          <span>{sorotan ? rupiahRingkas(sorotan.potensi.p50) : "—"} potensi</span>
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
          fontSize: sorot ? "clamp(21px, 2.6vw, 29px)" : "clamp(17px, 2vw, 21px)",
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
 * 2 · Diagram kolom — kesenjangan per slot
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
    <div style={{ borderTop: "1px solid var(--rule)", paddingTop: "var(--s4)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "var(--s3)",
          height: 200,
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
              gap: 8,
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
          gap: "var(--s3)",
          marginTop: 8,
          borderTop: "1px solid var(--rule)",
          paddingTop: 8,
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
          maxWidth: "60ch",
        }}
      >
        Kesenjangan per slot di {sorotan?.namaTitik ?? "pintu terbesar"}, pintu
        dengan selisih terbesar. Keempat batang memakai satu skala rupiah yang
        sama.
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * 2 · Daftar temuan bernomor + catatan pinggir sampel tipis
 * ------------------------------------------------------------------------ */

export function DaftarTemuan() {
  const { temuan, sampelTipis } = useInsight();

  const items: { judul: string; isi: string }[] = temuan
    ? [
        {
          judul: `Kesenjangan terpusat di slot ${temuan.slotPuncak.label}`,
          isi: `Slot ${temuan.slotPuncak.label} menahan ${rupiahRingkas(
            temuan.slotPuncak.nilai,
          )} dari ${rupiahRingkas(
            temuan.gapHarian,
          )} kesenjangan harian — slot terbesar dari empat.`,
        },
        temuan.kategoriKosong
          ? {
              judul: `${temuan.kategoriKosong.label}: permintaannya ada, gerainya nol`,
              isi: `Permintaan kawasan untuk ${temuan.kategoriKosong.label.toLowerCase()} terbaca ${persen(
                temuan.kategoriKosong.demandShare,
                0,
              )} di pintu terbesar, tapi tidak ada satu pun gerai di sana.`,
            }
          : {
              judul: "Setiap kategori sudah punya gerai",
              isi: "Di pintu terbesar tidak ada kategori dengan permintaan terbaca tapi nol gerai.",
            },
        temuan.pembanding
          ? {
              judul: "Arus tinggi belum tentu kesenjangan tinggi",
              isi: `Arus pagi mencapai ${ribuan(
                temuan.arusTitik ?? 0,
              )} org/jam, lawan ${ribuan(
                temuan.pembanding.arus ?? 0,
              )} org/jam di ${temuan.pembanding.namaTitik} ${temuan.pembanding.namaStasiun}. Kesenjangan hariannya ${rupiahRingkas(
                temuan.gapHarian,
              )} lawan ${rupiahRingkas(temuan.pembanding.gap)}.`,
            }
          : {
              judul: "Arus dan kesenjangan dibaca terpisah",
              isi: "Arus pejalan tidak diterjemahkan langsung jadi kesenjangan — keduanya dicacah sendiri.",
            },
      ]
    : [
        { judul: "Memuat temuan…", isi: "" },
        { judul: "Memuat temuan…", isi: "" },
        { judul: "Memuat temuan…", isi: "" },
      ];

  return (
    <div style={{ marginTop: "var(--s5)" }}>
      {items.map((t, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "2.5ch 1fr",
            gap: "var(--s3)",
            padding: "var(--s3) 0",
            borderTop: "1px solid var(--rule)",
            maxWidth: "64ch",
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
            {t.isi && (
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
            )}
          </div>
        </div>
      ))}

      <div
        style={{
          marginTop: "var(--s4)",
          borderLeft: "2px solid var(--field)",
          paddingLeft: "var(--s3)",
          maxWidth: "60ch",
        }}
      >
        <span className="tag tag-field">Estimasi ditahan</span>
        <p
          style={{
            margin: "var(--s2) 0 0",
            fontSize: "var(--t-small)",
            lineHeight: 1.55,
            color: "var(--ink-2)",
          }}
        >
          {sampelTipis
            ? `${sampelTipis.namaTitik} ${sampelTipis.namaStasiun} baru tercacah ${sampelTipis.geraiCount} gerai pada ${sampelTipis.blokCount} blok — ambangnya 3 gerai × 2 blok. Angkanya ditahan sampai survei putaran kedua, tidak dibaca sebagai nol.`
            : "Titik yang belum memenuhi ambang 3 gerai × 2 blok ditandai dan tidak diberi estimasi — tidak dibaca sebagai nol."}
        </p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * 3 · Matriks kategori × pintu terbesar tiap simpul — tabel editorial polos
 * ------------------------------------------------------------------------ */

const sel: CSSProperties = {
  padding: "var(--s3) var(--s3) var(--s3) 0",
  textAlign: "left",
  verticalAlign: "baseline",
};

function Status({ v }: { v: IsiSel }) {
  const gaya: Record<IsiSel, CSSProperties> = {
    Terisi: { color: "var(--ink-faint)" },
    Kurang: { color: "var(--ink-2)" },
    Kosong: { color: "var(--ink)", fontWeight: 700 },
    "—": { color: "var(--ink-faint)" },
  };
  return <span style={{ fontSize: "var(--t-small)", ...gaya[v] }}>{v}</span>;
}

function KepalaKolom({ stasiun, titik }: { stasiun: string; titik?: string }) {
  return (
    <>
      <span className="eyebrow">{stasiun}</span>
      {titik && (
        <span
          style={{
            display: "block",
            marginTop: 3,
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
    </>
  );
}

export function MatriksKategori() {
  const { matriks } = useInsight();

  const kolA = matriks?.kolomA;
  const kolB = matriks?.kolomB;
  const baris =
    matriks?.baris ??
    ["F&B", "Ritel", "Apotek", "Jasa", "Lainnya"].map((kategori) => ({
      kategori,
      a: "—" as IsiSel,
      b: "—" as IsiSel,
      permintaan: null as number | null,
    }));

  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        marginTop: "var(--s4)",
      }}
    >
      <colgroup>
        <col style={{ width: "26%" }} />
        <col style={{ width: "27%" }} />
        <col style={{ width: "27%" }} />
        <col style={{ width: "20%" }} />
      </colgroup>
      <thead>
        <tr>
          <th style={{ ...sel, borderBottom: "1px solid var(--rule-strong)" }}>
            <span className="eyebrow">Kategori</span>
          </th>
          <th style={{ ...sel, borderBottom: "1px solid var(--rule-strong)" }}>
            <KepalaKolom
              stasiun={kolA?.namaStasiun ?? "Simpul pertama"}
              titik={kolA?.namaTitik}
            />
          </th>
          <th style={{ ...sel, borderBottom: "1px solid var(--rule-strong)" }}>
            <KepalaKolom
              stasiun={kolB?.namaStasiun ?? "Simpul kedua"}
              titik={kolB?.namaTitik}
            />
          </th>
          <th style={{ ...sel, borderBottom: "1px solid var(--rule-strong)" }}>
            <span className="eyebrow">Permintaan</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {baris.map((row) => (
          <tr key={row.kategori}>
            <td style={{ ...sel, borderBottom: "1px solid var(--rule)" }}>
              <span style={{ fontSize: "var(--t-small)", fontWeight: 600 }}>
                {row.kategori}
              </span>
            </td>
            <td style={{ ...sel, borderBottom: "1px solid var(--rule)" }}>
              <Status v={row.a} />
            </td>
            <td style={{ ...sel, borderBottom: "1px solid var(--rule)" }}>
              <Status v={row.b} />
            </td>
            <td style={{ ...sel, borderBottom: "1px solid var(--rule)" }}>
              <span
                className="fig"
                style={{ fontSize: "var(--t-small)", color: "var(--data)" }}
              >
                {row.permintaan === null ? "—" : persen(row.permintaan, 1)}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
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
