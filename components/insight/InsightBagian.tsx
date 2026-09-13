"use client";

/**
 * Komponen daun halaman Insight — semuanya membaca satu provider di atasnya
 * (`useInsight()`), tidak menghitung angka sendiri (kecuali posisi piksel di
 * dalam batang/kolom). Dipisah dari `app/insight/page.tsx` supaya halaman itu
 * tetap server component; hanya bagian yang butuh data ini yang client.
 *
 * Rupa (putaran 4): kartu/panel kompak DATAR (tanpa bayangan) di atas satu
 * latar kertas hangat yang SERAGAM — struktur dan kepadatan dipinjam dari
 * halaman Metodologi & Rekomendasi, dan sekarang mayoritas palet Beranda ikut
 * dipakai sebagai latar kartu yang BERGILIR (pastel `--tile-*`, wash
 * `--data`/`--field`, `--paper-2`, satu kartu tinta `.ink-band`). Bukan pita
 * warna full-bleed — latar halaman tidak pernah berganti warna.
 *
 * Warna angka tetap terkunci pada artinya, tak peduli ubin di bawahnya:
 * `--data` biru untuk mark grafik + pembacaan instrumen (F/E/C/V, persen
 * permintaan, porsi tertangkap); `--ink`/`--ink-2` untuk judul, teks, angka
 * kesimpulan, dan cacahan polos; `--field` oker hanya untuk catatan kerja
 * lapangan; `--brand` emas tidak pernah jadi angka.
 */

import type { CSSProperties } from "react";

import { persen, rentangRingkas, ribuan, rupiahRingkas } from "@/lib/format";
import { useInsight, type IsiSel } from "./InsightData";

/** Batas atas skala yang enak dibaca: bulatkan ke atas ke setengah magnitudo. */
function niceCeil(v: number): number {
  if (v <= 0) return 1_000_000;
  const mag = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / (mag / 2)) * (mag / 2);
}

/* ---------------------------------------------------------------------------
 * Hero — kartu tinta ringkasan (satu-satunya elemen gelap di halaman)
 * ------------------------------------------------------------------------ */

export function HeroKartu() {
  const { sorotan } = useInsight();

  const stat: [string, string][] = [
    ["Potensi / hari", sorotan ? rupiahRingkas(sorotan.potensi.p50) : "—"],
    ["Tertangkap", sorotan ? rupiahRingkas(sorotan.tertangkap.p50) : "—"],
    [
      "Porsi tertangkap",
      sorotan?.capturePersen != null
        ? `${Math.round(sorotan.capturePersen)}%`
        : "—",
    ],
  ];

  return (
    <div
      className="kartu ink-band"
      style={{ background: "var(--ink)", overflow: "hidden" }}
    >
      <div style={{ padding: "var(--s3)" }}>
        <span className="eyebrow">Kesenjangan harian terbesar</span>
        <div
          className="fig"
          style={{
            font: "400 clamp(28px, 3.2vw, 40px)/1 var(--font-mono), ui-monospace, monospace",
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
            ? `${sorotan.namaTitik}, ${sorotan.namaStasiun}. Selisih potensi belanja komuter dan belanja yang tertangkap gerai di pintu ini.`
            : "Memuat bacaan lapangan…"}
        </p>
      </div>
      <div
        className="runtuh-2"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 1,
          background: "var(--rule)",
        }}
      >
        {stat.map(([k, v]) => (
          <div
            key={k}
            style={{ background: "var(--ink)", padding: "var(--s3) var(--s2)" }}
          >
            <div className="fig" style={{ fontSize: 17, color: "var(--data)" }}>
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
 * Strip KPI — cakupan pencacahan, lima sel pastel bergilir
 * ------------------------------------------------------------------------ */

export function KpiStrip() {
  const { cakupan } = useInsight();

  const sel: { fig: string; label: string; tint: string }[] = [
    {
      fig: cakupan ? ribuan(cakupan.simpulDiamati) : "—",
      label: "Simpul dicacah penuh",
      tint: "var(--tile-sky)",
    },
    {
      fig: cakupan ? ribuan(cakupan.pintuDiamati) : "—",
      label: "Pintu diamati",
      tint: "var(--tile-mint)",
    },
    {
      fig: cakupan ? ribuan(cakupan.strukTerbaca) : "—",
      label: "Struk terbaca",
      tint: "var(--tile-violet)",
    },
    {
      fig: cakupan ? `${cakupan.slot} × ${cakupan.kategori}` : "—",
      label: "Slot × kategori",
      tint: "var(--tile-rose)",
    },
    {
      fig: cakupan ? ribuan(cakupan.pintuDitahan) : "—",
      label: "Pintu ditahan · sampel tipis",
      tint: "var(--data-wash)",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(158px, 1fr))",
        gap: "var(--s2)",
      }}
    >
      {sel.map((s) => (
        <div
          key={s.label}
          style={{
            background: s.tint,
            borderRadius: "var(--r-md)",
            padding: "var(--s3)",
          }}
        >
          <div
            className="fig"
            style={{
              font: "400 clamp(21px, 2.3vw, 29px)/1 var(--font-mono), ui-monospace, monospace",
              letterSpacing: "-0.02em",
              color: "var(--ink)",
            }}
          >
            {s.fig}
          </div>
          <div className="eyebrow" style={{ marginTop: "var(--s2)" }}>
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * 1 · Peringkat pintu — batang kesenjangan harian, semua titik cakupan
 * ------------------------------------------------------------------------ */

export function PeringkatPintu() {
  const { peringkat } = useInsight();

  if (!peringkat.length) {
    return (
      <div
        aria-hidden
        style={{
          height: 260,
          background: "var(--paper-2)",
          borderRadius: "var(--r-sm)",
        }}
      />
    );
  }

  const skala = niceCeil(
    Math.max(1, ...peringkat.map((r) => r.potensi.p50 ?? 0)),
  );
  const pct = (v: number | null) => (v === null ? 0 : (v / skala) * 100);

  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: "var(--s3)" }}>
        Kesenjangan harian per pintu
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
        {peringkat.map((r) => {
          const terhitung = r.gap.p50 !== null;
          return (
            <div
              key={`${r.namaStasiun}·${r.namaTitik}`}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(0, 148px) minmax(0, 1fr) minmax(0, 74px)",
                gap: "var(--s2)",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "var(--t-small)",
                    fontWeight: 600,
                    lineHeight: 1.25,
                  }}
                >
                  {r.namaTitik}
                </div>
                <div className="eyebrow" style={{ fontSize: 9, marginTop: 2 }}>
                  {r.namaStasiun}
                </div>
              </div>

              <div style={{ position: "relative", height: 13 }}>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "var(--rule-soft)",
                    borderRadius: "var(--r-xs)",
                  }}
                />
                {terhitung ? (
                  <>
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${pct(r.tertangkap.p50)}%`,
                        background: "var(--data-soft)",
                        borderRadius: "var(--r-xs) 0 0 var(--r-xs)",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        left: `${pct(r.tertangkap.p50)}%`,
                        top: 0,
                        bottom: 0,
                        width: `${pct(r.gap.p50)}%`,
                        background: "var(--data)",
                      }}
                    />
                  </>
                ) : (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      width: "34%",
                      top: "50%",
                      borderTop: "1.5px dashed var(--rule-strong)",
                    }}
                  />
                )}
              </div>

              <span
                className="fig"
                style={{
                  fontSize: "var(--t-small)",
                  fontWeight: terhitung ? 700 : 400,
                  color: terhitung ? "var(--ink)" : "var(--ink-faint)",
                  textAlign: "right",
                  whiteSpace: "nowrap",
                }}
              >
                {terhitung ? rupiahRingkas(r.gap.p50) : "—"}
              </span>
            </div>
          );
        })}
      </div>
      <p
        className="fig"
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "var(--s2)",
          marginTop: "var(--s3)",
          paddingTop: "var(--s2)",
          borderTop: "1px solid var(--rule)",
          fontSize: "var(--t-micro)",
          color: "var(--ink-faint)",
        }}
      >
        <span>batang = potensi · biru tua = kesenjangan</span>
        <span>skala 0–{rupiahRingkas(skala)}</span>
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * 1 · Batang bersarang — potensi, tertangkap, kesenjangan (kartu --data-wash)
 * ------------------------------------------------------------------------ */

export function BatangBersarang() {
  const { sorotan } = useInsight();
  const isi = sorotan?.isiPersen ?? 0;

  return (
    <div>
      <div style={{ position: "relative", height: 56 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "var(--surface)",
            border: "1px solid var(--rule)",
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
            background: "var(--data-soft)",
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
        className="runtuh-2"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
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

      {sorotan?.capturePersen != null && (
        <p
          style={{
            margin: "var(--s3) 0 0",
            fontSize: "var(--t-small)",
            lineHeight: 1.5,
            color: "var(--ink-muted)",
          }}
        >
          Sekitar{" "}
          <span
            className="fig"
            style={{ color: "var(--data)", fontWeight: 700 }}
          >
            {Math.round(sorotan.capturePersen)}%
          </span>{" "}
          potensi tertangkap gerai di pintu ini — porsi yang mirip di semua
          pintu yang tercacah.
        </p>
      )}

      <div
        className="fig"
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "var(--s2)",
          marginTop: "var(--s3)",
          paddingTop: "var(--s2)",
          borderTop: "1px solid var(--rule)",
          fontSize: "var(--t-micro)",
          color: "var(--ink-faint)",
        }}
      >
        <span>rentang harian · P10–P90</span>
        <span>{rentangRingkas(sorotan?.gap)}</span>
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
          fontSize: sorot
            ? "clamp(19px, 2.2vw, 25px)"
            : "clamp(15px, 1.8vw, 19px)",
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
 * 2 · Diagram kolom — kesenjangan per slot (kartu --tile-sky)
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
          height: 168,
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
        Kesenjangan per slot di {sorotan?.namaTitik ?? "pintu terbesar"} — satu
        skala rupiah bersama.
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * 2 · Instrumen F × E × C × V pada slot puncak (kartu --data-wash)
 * ------------------------------------------------------------------------ */

export function InstrumenSlot() {
  const { instrumen } = useInsight();

  const suku: {
    huruf: string;
    nama: string;
    nilai: string;
    satuan?: string;
    sumber: "lapangan" | "ai";
  }[] = [
    {
      huruf: "F",
      nama: "Arus pejalan",
      nilai: instrumen ? ribuan(instrumen.F) : "—",
      satuan: "org/jam",
      sumber: "lapangan",
    },
    {
      huruf: "E",
      nama: "Masuk gerai",
      nilai: instrumen ? persen(instrumen.E) : "—",
      sumber: "lapangan",
    },
    {
      huruf: "C",
      nama: "Konversi bayar",
      nilai: instrumen ? persen(instrumen.C, 0) : "—",
      sumber: "lapangan",
    },
    {
      huruf: "V",
      nama: "Nilai transaksi",
      nilai: instrumen ? rupiahRingkas(instrumen.V) : "—",
      sumber: "ai",
    },
  ];

  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: "var(--s3)" }}>
        Instrumen · slot {instrumen?.slotLabel ?? "puncak"}
      </div>
      <div
        className="runtuh-2"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "var(--s2)",
        }}
      >
        {suku.map((s) => (
          <div
            key={s.huruf}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--rule)",
              borderRadius: "var(--r-sm)",
              padding: "var(--s2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span
                className="fig"
                style={{ fontSize: 19, color: "var(--ink-faint)" }}
              >
                {s.huruf}
              </span>
              <span style={{ fontSize: "var(--t-small)", fontWeight: 600 }}>
                {s.nama}
              </span>
            </div>
            <div
              className="fig"
              style={{
                fontSize: "clamp(16px, 1.7vw, 20px)",
                color: "var(--data)",
                marginTop: 6,
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
            <div style={{ marginTop: 8 }}>
              <span
                className={s.sumber === "ai" ? "tag tag-data" : "tag tag-field"}
              >
                {s.sumber === "ai" ? "Baca AI" : "Survei"}
              </span>
            </div>
          </div>
        ))}
      </div>
      <p
        className="fig"
        style={{
          margin: "var(--s3) 0 0",
          paddingTop: "var(--s2)",
          borderTop: "1px solid var(--rule)",
          fontSize: "var(--t-micro)",
          lineHeight: 1.5,
          color: "var(--ink-faint)",
        }}
      >
        {instrumen
          ? `F × E × C × V → kesenjangan · ${instrumen.namaTitik}, ${instrumen.namaStasiun} · dicacah ${instrumen.jam}`
          : "memuat nilai instrumen…"}
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * 2 · Daftar temuan + catatan sampel tipis (kartu .kartu putih)
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

const KOLOM =
  "minmax(0,1.3fr) minmax(0,0.85fr) minmax(0,0.85fr) minmax(0,1.35fr) minmax(0,0.9fr)";

function Status({ v }: { v: IsiSel }) {
  const gaya: Record<IsiSel, CSSProperties> = {
    Terisi: { color: "var(--ink-faint)" },
    Kurang: { color: "var(--ink-2)" },
    Kosong: { color: "var(--ink)", fontWeight: 700 },
    "-": { color: "var(--ink-faint)" },
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
      menahan: null as number | null,
    }));

  return (
    <div
      style={{
        borderRadius: "var(--r-md)",
        overflow: "hidden",
        border: "1px solid var(--rule)",
        background: "var(--surface)",
      }}
      className="tabel-geser"
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: KOLOM,
          gap: "var(--s2)",
          padding: "var(--s3)",
          background: "var(--data-wash)",
          borderBottom: "1px solid var(--rule)",
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
        <span className="eyebrow">Menahan · pagi</span>
      </div>

      {baris.map((row, i) => (
        <div
          key={row.kategori}
          style={{
            display: "grid",
            gridTemplateColumns: KOLOM,
            gap: "var(--s2)",
            padding: "var(--s2) var(--s3)",
            alignItems: "center",
            background: i % 2 ? "var(--data-wash)" : "var(--surface)",
            borderTop: i === 0 ? undefined : "1px solid var(--rule)",
          }}
        >
          <span style={{ fontSize: "var(--t-small)", fontWeight: 600 }}>
            {row.kategori}
          </span>
          <Status v={row.a} />
          <Status v={row.b} />
          <span
            style={{ display: "flex", alignItems: "center", gap: "var(--s2)" }}
          >
            <span
              className="fig"
              style={{
                fontSize: "var(--t-small)",
                color: "var(--data)",
                minWidth: "4.4ch",
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
                  maxWidth: 88,
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
          <span
            className="fig"
            style={{
              fontSize: "var(--t-small)",
              fontWeight: row.a === "Kosong" ? 700 : 400,
              color: row.menahan === null ? "var(--ink-faint)" : "var(--data)",
              whiteSpace: "nowrap",
            }}
          >
            {row.menahan === null ? "—" : rupiahRingkas(row.menahan)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * 3 · Sorotan kategori paling menganga (kartu --tile-violet)
 * ------------------------------------------------------------------------ */

export function SorotanKategori() {
  const { temuan } = useInsight();
  const k = temuan?.kategoriKosong ?? null;

  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: "var(--s3)" }}>
        Paling menganga
      </div>
      {k ? (
        <>
          <div
            className="fig"
            style={{
              font: "400 clamp(23px, 2.5vw, 31px)/1 var(--font-mono), ui-monospace, monospace",
              letterSpacing: "-0.02em",
              color: "var(--ink)",
            }}
          >
            {k.label}
          </div>
          <p
            style={{
              margin: "var(--s2) 0 0",
              fontSize: "var(--t-small)",
              lineHeight: 1.55,
              color: "var(--ink-2)",
            }}
          >
            Permintaan kawasan{" "}
            <span
              className="fig"
              style={{ color: "var(--data)", fontWeight: 700 }}
            >
              {persen(k.demandShare, 0)}
            </span>{" "}
            di pintu berkesenjangan terbesar, tanpa satu pun gerai kategori ini
            di dalam stasiun.
          </p>
        </>
      ) : (
        <p
          style={{
            margin: 0,
            fontSize: "var(--t-small)",
            lineHeight: 1.55,
            color: "var(--ink-2)",
          }}
        >
          Di pintu terbesar tiap simpul tidak ada kategori dengan permintaan
          terbaca tapi nol gerai.
        </p>
      )}
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
