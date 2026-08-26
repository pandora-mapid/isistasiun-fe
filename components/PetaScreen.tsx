"use client";

import { useState } from "react";
import Link from "next/link";
import { NavBar } from "./NavBar";
import { MapCanvas } from "./MapCanvas";

type LayerRow = {
  key: string;
  label: string;
  dot: string;
  tint: string;
};

const LAYER_ROWS: LayerRow[] = [
  { key: "gap", label: "Kesenjangan belanja", dot: "#1D4ED8", tint: "rgba(29,78,216,.1)" },
  { key: "potensi", label: "Potensi belanja", dot: "#475569", tint: "rgba(71,85,105,.1)" },
  { key: "kategori-hilang", label: "Kategori hilang", dot: "#60A5FA", tint: "rgba(96,165,250,.12)" },
  { key: "arus", label: "Arus pintu stasiun", dot: "#2563EB", tint: "rgba(37,99,235,.1)" },
  { key: "sewa", label: "Indeks sewa / arus", dot: "#334155", tint: "rgba(51,65,85,.1)" },
  { key: "kepercayaan", label: "Kepercayaan data", dot: "#CBD5E1", tint: "rgba(29,78,216,.08)" },
  { key: "event", label: "Event & aktivasi", dot: "#94A3B8", tint: "rgba(148,163,184,.14)" },
];
const DEFAULT_ACTIVE_LAYERS = ["gap", "arus", "kepercayaan"];

const CATEGORIES = [
  { key: "semua", label: "Semua", dot: null as string | null },
  { key: "fnb", label: "F&B", dot: "#1D4ED8" },
  { key: "ritel", label: "Ritel", dot: "#475569" },
  { key: "apotek", label: "Apotek", dot: "#2563EB" },
  { key: "jasa", label: "Jasa", dot: "#2563EB" },
  { key: "lainnya", label: "Lainnya", dot: "#475569" },
];

const CATCHMENTS = [3, 5, 10] as const;

const SLOTS = [
  { key: "06-09", label: "06–09", extra: "2 blok" },
  { key: "11-14", label: "11–14", extra: null as string | null },
  { key: "16-19", label: "16–19", extra: null as string | null },
  { key: "19-21", label: "19–21", extra: null as string | null },
];

const QUESTIONS = [
  "pintu mana yang gapnya paling besar sore hari?",
  "bandingkan Stasiun B dengan Stasiun C",
  "kawasan mana yang sampelnya masih tipis?",
];

export function PetaScreen() {
  const [tab, setTab] = useState<"brief" | "copilot">("brief");
  const [layersOpen, setLayersOpen] = useState(false);
  const [activeLayers, setActiveLayers] = useState<string[]>(DEFAULT_ACTIVE_LAYERS);
  const [activeCategory, setActiveCategory] = useState("fnb");
  const [activeCatchment, setActiveCatchment] = useState<number>(5);
  const [activeSlot, setActiveSlot] = useState("06-09");
  const [showTransparansi, setShowTransparansi] = useState(false);
  const [showCopilotResult, setShowCopilotResult] = useState(true);

  const tabX = tab === "brief" ? 4 : 190;
  const chev = layersOpen ? 180 : 0;
  const layerCount = layersOpen
    ? `${activeLayers.length} dari ${LAYER_ROWS.length} aktif`
    : `${activeLayers.length} aktif`;
  const categoryLabel =
    CATEGORIES.find((c) => c.key === activeCategory)?.label ?? "Semua";

  function toggleLayer(key: string) {
    setActiveLayers((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  return (
    <div
      className="page-canvas"
      style={{ height: "100vh", display: "flex", flexDirection: "column" }}
    >
      <NavBar
        active="peta"
        cta={
          <div className="row" style={{ gap: 10 }}>
            <button className="b bs">Bandingkan</button>
            <button className="b bp">Brief PDF</button>
          </div>
        }
      />
      <div
        style={{
          position: "relative",
          flex: 1,
          minHeight: 0,
          background: "#F8FAFC",
          overflow: "hidden",
        }}
      >
        {/* Peta sungguhan. Kanvas mengisi kotak berposisi relative ini,
           dan seluruh panel di bawah melayang di atasnya. */}
        <MapCanvas catchmentMinutes={activeCatchment} />

        <div
          className="row"
          style={{
            position: "absolute",
            left: 24,
            bottom: 132,
            gap: 18,
            padding: "10px 18px",
            background: "#fff",
            border: "1px solid #E2E8F0",
            borderRadius: 14,
          }}
        >
          <span className="row" style={{ gap: 7, fontSize: 11.5, color: "#475569" }}>
            <span style={{ width: 20, height: 3, background: "#0F172A", borderRadius: 12 }} />
            Jaringan rel
          </span>
          <span className="row" style={{ gap: 7, fontSize: 11.5, color: "#475569" }}>
            <span className="dot" style={{ background: "#1D4ED8", width: 11, height: 11 }} />
            Gap per pintu
          </span>
          <span className="row" style={{ gap: 7, fontSize: 11.5, color: "#475569" }}>
            <span className="dot" style={{ background: "rgba(37,99,235,.35)", width: 11, height: 11, boxShadow: "0 0 0 1px #2563EB" }} />
            Isochrone
          </span>
          <span style={{ width: 1, height: 18, background: "rgba(15,23,42,.12)" }} />
          <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span className="row" style={{ height: 5 }}>
              <span style={{ width: 22, background: "#0F172A" }} />
              <span style={{ width: 22, background: "rgba(15,23,42,.18)" }} />
              <span style={{ width: 22, background: "#0F172A" }} />
            </span>
            <span className="mono" style={{ fontSize: 9, color: "#94A3B8" }}>0&nbsp;&nbsp;150&nbsp;&nbsp;300 m</span>
          </span>
        </div>

        <div className="mono" style={{ position: "absolute", left: 24, bottom: 180, fontSize: 10.5, color: "rgba(255,255,255,.5)" }}>
          −6,2077 · 106,8451 &nbsp;|&nbsp; z 15,4 &nbsp;|&nbsp; GEO MAPID &nbsp;|&nbsp; survei 12–19 Agu · v0.3
        </div>

        <div
          className="glass"
          style={{ position: "absolute", left: 24, right: 462, bottom: 24, borderRadius: 14, border: "1px solid #E2E8F0", padding: "14px 18px 16px" }}
        >
          <div className="row" style={{ gap: 10, marginBottom: 11 }}>
            <span className="k">Slot waktu · hari kerja</span>
            <span style={{ fontSize: 11, color: "#94A3B8" }}>
              hanya slot yang benar-benar dicacah dapat dipilih — jam di antaranya tidak diinterpolasi
            </span>
          </div>
          <div className="row" style={{ gap: 6 }}>
            {SLOTS.map((slot, i) => {
              const active = activeSlot === slot.key;
              return (
                <div key={slot.key} className="row" style={{ gap: 6, flex: 1 }}>
                  {i > 0 && <span style={{ flex: 1, height: 1, background: "#CBD5E1" }} />}
                  <button
                    onClick={() => setActiveSlot(slot.key)}
                    className="pill"
                    style={{
                      all: "unset",
                      cursor: "pointer",
                      padding: "9px 16px",
                      background: active ? "#1D4ED8" : "#F1F5F9",
                      color: active ? "#fff" : "#475569",
                      font: `${active ? 600 : 500} 12px/1 var(--font-inter)`,
                      boxShadow: active ? "0 6px 16px rgba(29,78,216,.2)" : "none",
                      borderRadius: 999,
                    }}
                  >
                    {slot.label}
                    {slot.extra && (
                      <span className="mono" style={{ opacity: 0.7, fontWeight: 400, marginLeft: 4 }}>
                        {slot.extra}
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
            <span style={{ flex: 1, height: 1, background: "#CBD5E1" }} />
            <span
              className="pill"
              style={{ padding: "9px 16px", border: "1.5px dashed #CBD5E1", background: "#E2E8F0", color: "#64748B", font: "500 12px/1 var(--font-inter)" }}
            >
              Akhir pekan
            </span>
          </div>
        </div>

        <div
          className="glass"
          style={{ position: "absolute", right: 24, top: 24, bottom: 24, width: 414, borderRadius: 12, display: "flex", flexDirection: "column", overflow: "hidden" }}
        >
          <div style={{ flex: "none", padding: "14px 14px 12px" }}>
            <div className="row pill" style={{ position: "relative", background: "#F1F5F9", padding: 4 }}>
              <div
                className="pill"
                style={{
                  position: "absolute",
                  top: 4,
                  bottom: 4,
                  width: 186,
                  background: "#fff",
                  boxShadow: "0 2px 8px rgba(15,23,42,.1)",
                  transition: "left .18s cubic-bezier(.4,0,.2,1)",
                  left: tabX,
                }}
              />
              <button
                onClick={() => setTab("brief")}
                style={{ all: "unset", position: "relative", flex: 1, textAlign: "center", padding: "9px 0", font: "600 12.5px/1 var(--font-inter)", color: "#0F172A", cursor: "pointer" }}
              >
                Ringkasan
              </button>
              <button
                onClick={() => setTab("copilot")}
                style={{ all: "unset", position: "relative", flex: 1, textAlign: "center", padding: "9px 0", font: "600 12.5px/1 var(--font-inter)", color: "#0F172A", cursor: "pointer" }}
              >
                Tanya Data
              </button>
            </div>
          </div>

          {tab === "brief" && (
            <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
              <div style={{ flex: "none", padding: "4px 22px 18px" }}>
                <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div className="k" style={{ marginBottom: 10 }}>Brief simpul · {SLOTS.find((s) => s.key === activeSlot)?.label}</div>
                    <div style={{ font: "600 34px/1.05 var(--font-inter)", letterSpacing: "-.01em" }}>Stasiun B</div>
                    <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 12 }}>Kawasan campuran · 4 pintu</div>
                  </div>
                  <div className="ic">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="sc" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "0 22px 8px" }}>
                <div style={{ borderRadius: 12, background: "#F1F5F9", marginBottom: 26, overflow: "hidden" }}>
                  <div
                    onClick={() => setLayersOpen((v) => !v)}
                    className="row layers-toggle"
                    style={{ gap: 10, padding: "13px 15px", cursor: "pointer" }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#1D4ED8"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ flex: "none", transition: "transform .18s cubic-bezier(.4,0,.2,1)", transform: `rotate(${chev}deg)` }}
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                    <span className="k" style={{ flex: 1, color: "#1D4ED8" }}>Lapisan &amp; filter</span>
                    <span className="mono" style={{ fontSize: 10.5, color: "#94A3B8" }}>{layerCount}</span>
                  </div>

                  {!layersOpen && (
                    <div className="row" style={{ gap: 7, padding: "0 15px 13px", whiteSpace: "nowrap", overflow: "hidden" }}>
                      {LAYER_ROWS.filter((r) => activeLayers.includes(r.key))
                        .slice(0, 3)
                        .map((r) => (
                          <span key={r.key} className="row" style={{ gap: 5, flex: "none" }}>
                            <span className="dot" style={{ background: r.dot }} />
                            <span style={{ fontSize: 11.5 }}>{r.label.replace(" belanja", "").replace(" stasiun", "").replace(" data", "")}</span>
                          </span>
                        ))}
                      <span style={{ width: 1, height: 14, background: "rgba(15,23,42,.14)", flex: "none" }} />
                      <span className="mono" style={{ fontSize: 11.5, color: "#64748B", flex: "none" }}>
                        {categoryLabel} · {activeCatchment} mnt
                      </span>
                    </div>
                  )}

                  {layersOpen && (
                    <div style={{ padding: "2px 15px 16px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {LAYER_ROWS.map((r) => {
                          const on = activeLayers.includes(r.key);
                          return (
                            <div
                              key={r.key}
                              onClick={() => toggleLayer(r.key)}
                              className="lyr"
                              style={on ? { background: r.tint, color: "#0F172A", fontWeight: 600 } : undefined}
                            >
                              <span className="dot" style={{ background: r.dot }} />
                              {r.label}
                            </div>
                          );
                        })}
                      </div>

                      <div className="k" style={{ margin: "18px 0 10px" }}>Kategori usaha</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {CATEGORIES.map((c) => {
                          const active = activeCategory === c.key;
                          return (
                            <span
                              key={c.key}
                              className="chip"
                              onClick={() => setActiveCategory(c.key)}
                              style={active ? { background: "#0F172A", color: "#fff", borderColor: "#0F172A" } : undefined}
                            >
                              {c.dot && <span className="dot" style={{ background: c.dot }} />}
                              {c.label}
                            </span>
                          );
                        })}
                      </div>

                      <div className="k" style={{ margin: "18px 0 10px" }}>Kawasan tangkapan</div>
                      <div className="row pill" style={{ background: "rgba(255,255,255,.8)", padding: 3 }}>
                        {CATCHMENTS.map((m) => {
                          const active = activeCatchment === m;
                          return (
                            <span
                              key={m}
                              onClick={() => setActiveCatchment(m)}
                              className="pill"
                              style={{
                                flex: 1,
                                textAlign: "center",
                                padding: "8px 0",
                                fontSize: 12,
                                fontWeight: active ? 600 : 400,
                                background: active ? "#0F172A" : "transparent",
                                color: active ? "#fff" : "#475569",
                                cursor: "pointer",
                              }}
                            >
                              {m} mnt
                            </span>
                          );
                        })}
                      </div>

                      <div className="k" style={{ margin: "18px 0 9px" }}>Kesenjangan / hari</div>
                      <div className="row" style={{ height: 9, gap: 2 }}>
                        <span style={{ flex: 1, height: 9, background: "#EFF6FF" }} />
                        <span style={{ flex: 1, height: 9, background: "#93C5FD" }} />
                        <span style={{ flex: 1, height: 9, background: "#60A5FA" }} />
                        <span style={{ flex: 1, height: 9, background: "#3B82F6" }} />
                        <span style={{ flex: 1, height: 9, background: "#1D4ED8" }} />
                      </div>
                      <div className="mono row" style={{ justifyContent: "space-between", fontSize: 10, color: "#94A3B8", marginTop: 6 }}>
                        <span>&lt; Rp 1.000.000</span>
                        <span>&gt; Rp 4.000.000</span>
                      </div>
                      <div className="row" style={{ alignItems: "flex-start", gap: 9, marginTop: 12 }}>
                        <span style={{ width: 13, height: 13, borderRadius: 12, border: "1.5px dashed #94A3B8", flex: "none", marginTop: 1 }} />
                        <span style={{ fontSize: 11, lineHeight: 1.45, color: "#64748B" }}>
                          Sampel tipis — tidak diestimasi, tidak dibaca aman maupun bermasalah
                        </span>
                      </div>

                      <button onClick={() => setLayersOpen(false)} className="b bp" style={{ width: "100%", marginTop: 16 }}>
                        Terapkan &amp; tutup
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ borderRadius: 12, padding: 24, background: "#EEF2F6" }}>
                  <div className="k" style={{ color: "#1D4ED8", marginBottom: 12 }}>Kesenjangan belanja</div>
                  <div className="mono" style={{ fontWeight: 700, fontSize: 25, lineHeight: 1.15, letterSpacing: "-.01em", whiteSpace: "nowrap" }}>
                    Rp 2.400.000 – 4.100.000
                  </div>
                  <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 9 }}>per hari kerja · rentang P10–P90 · 10.000 iterasi</div>
                  <div style={{ position: "relative", height: 12, margin: "18px 0 8px" }}>
                    <div className="pill" style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,.08)" }} />
                    <div className="pill" style={{ position: "absolute", left: "22%", right: "24%", top: 0, bottom: 0, background: "#60A5FA" }} />
                    <div style={{ position: "absolute", left: "22%", top: -3, width: 18, height: 18, borderRadius: 12, background: "#fff", boxShadow: "0 2px 8px rgba(15,23,42,.16)", marginLeft: -9 }} />
                    <div style={{ position: "absolute", left: "76%", top: -3, width: 18, height: 18, borderRadius: 12, background: "#fff", boxShadow: "0 2px 8px rgba(15,23,42,.16)", marginLeft: -9 }} />
                  </div>
                  <div className="mono row" style={{ justifyContent: "space-between", fontSize: 10, color: "#94A3B8" }}>
                    <span>P10</span><span>median</span><span>P90</span>
                  </div>
                  <div style={{ fontSize: 11.5, lineHeight: 1.55, color: "#64748B", marginTop: 14 }}>
                    Batas atas peluang pendapatan non-tiket, <b style={{ color: "#0F172A" }}>bukan</b> pendapatan yang pasti diperoleh.
                  </div>
                </div>

                <div style={{ padding: "28px 0 20px" }}>
                  <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
                    <span className="k">Uraian F × E × C × V</span>
                    <Link href="/metodologi" style={{ fontSize: 11.5, fontWeight: 600 }}>Metodologi →</Link>
                  </div>
                  <div style={{ border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
                    <div className="row" style={{ justifyContent: "space-between", padding: "11px 14px", borderBottom: "1px solid #E2E8F0" }}>
                      <span style={{ fontSize: 12.5, color: "#475569" }}>F — arus pintu</span>
                      <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>2.450 <span style={{ color: "#94A3B8", fontWeight: 400 }}>org/jam</span></span>
                    </div>
                    <div className="row" style={{ justifyContent: "space-between", padding: "11px 14px", borderBottom: "1px solid #E2E8F0" }}>
                      <span style={{ fontSize: 12.5, color: "#475569" }}>E — entry ratio</span>
                      <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>6,4 <span style={{ color: "#94A3B8", fontWeight: 400 }}>%</span></span>
                    </div>
                    <div className="row" style={{ justifyContent: "space-between", padding: "11px 14px", borderBottom: "1px solid #E2E8F0" }}>
                      <span style={{ fontSize: 12.5, color: "#475569" }}>C — konversi</span>
                      <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>72 <span style={{ color: "#94A3B8", fontWeight: 400 }}>%</span></span>
                    </div>
                    <div className="row" style={{ justifyContent: "space-between", padding: "11px 14px", background: "#EEF2F6" }}>
                      <span style={{ fontSize: 12.5, color: "#475569" }}>V — nilai transaksi <span style={{ fontSize: 9.5, color: "#94A3B8" }}>AI</span></span>
                      <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: "#1D4ED8" }}>Rp 42.000</span>
                    </div>
                  </div>
                  <div className="row" style={{ justifyContent: "space-between", marginTop: 14 }}>
                    <span className="mono" style={{ fontSize: 11.5, color: "#64748B" }}>Potensi Rp 2.600.000 − tertangkap Rp 800.000</span>
                    <button
                      onClick={() => setShowTransparansi(true)}
                      style={{ all: "unset", cursor: "pointer", fontSize: 11.5, fontWeight: 600, color: "#1D4ED8" }}
                    >
                      Lihat bukti →
                    </button>
                  </div>
                </div>

                <div style={{ height: 1, background: "rgba(15,23,42,.1)" }} />

                <div style={{ padding: "26px 0" }}>
                  <div className="k" style={{ marginBottom: 16 }}>Kesenjangan per pintu</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                    <div className="row" style={{ gap: 11 }}>
                      <span style={{ width: 52, fontSize: 12, fontWeight: 600 }}>Pintu 4</span>
                      <span className="pill" style={{ flex: 1, height: 14, background: "rgba(15,23,42,.08)" }}>
                        <span className="pill" style={{ display: "block", width: "88%", height: 14, background: "#1D4ED8" }} />
                      </span>
                      <span className="mono" style={{ width: 92, textAlign: "right", fontSize: 11 }}>Rp 1.800.000</span>
                    </div>
                    <div className="row" style={{ gap: 11 }}>
                      <span style={{ width: 52, fontSize: 12, color: "#475569" }}>Pintu 1</span>
                      <span className="pill" style={{ flex: 1, height: 14, background: "rgba(15,23,42,.08)" }}>
                        <span className="pill" style={{ display: "block", width: "54%", height: 14, background: "#475569" }} />
                      </span>
                      <span className="mono" style={{ width: 92, textAlign: "right", fontSize: 11 }}>Rp 1.100.000</span>
                    </div>
                    <div className="row" style={{ gap: 11 }}>
                      <span style={{ width: 52, fontSize: 12, color: "#475569" }}>Pintu 2</span>
                      <span className="pill" style={{ flex: 1, height: 14, background: "rgba(15,23,42,.08)" }}>
                        <span className="pill" style={{ display: "block", width: "31%", height: 14, background: "#2563EB" }} />
                      </span>
                      <span className="mono" style={{ width: 92, textAlign: "right", fontSize: 11 }}>Rp 600.000</span>
                    </div>
                    <div className="row" style={{ gap: 11 }}>
                      <span style={{ width: 52, fontSize: 12, color: "#94A3B8" }}>Pintu 3</span>
                      <span className="pill" style={{ flex: 1, height: 14, background: "#F1F5F9", border: "1px dashed #CBD5E1" }} />
                      <span style={{ width: 64, textAlign: "right", fontSize: 10.5, color: "#94A3B8" }}>sampel tipis</span>
                    </div>
                  </div>
                </div>

                <div style={{ height: 1, background: "rgba(15,23,42,.1)" }} />

                <div style={{ padding: "26px 0 4px" }}>
                  <div className="row" style={{ justifyContent: "space-between", marginBottom: 15 }}>
                    <span className="k">Kategori hilang</span>
                    <span style={{ fontSize: 10.5, color: "#94A3B8" }}>permintaan kawasan vs gerai</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div className="row" style={{ justifyContent: "space-between", padding: "10px 2px", borderBottom: "1px solid #E2E8F0" }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Apotek &amp; kesehatan</span>
                      <span className="mono" style={{ fontSize: 11.5, color: "#475569" }}>37% · 0 gerai</span>
                    </div>
                    <div className="row" style={{ justifyContent: "space-between", padding: "10px 2px" }}>
                      <span style={{ fontSize: 13 }}>Jasa</span>
                      <span className="mono" style={{ fontSize: 11.5, color: "#475569" }}>22% · 1 gerai</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ flex: "none", padding: "16px 22px 20px", display: "flex", gap: 8, boxShadow: "0 -1px 0 rgba(15,23,42,.1)" }}>
                <button className="b bs" style={{ flex: 1 }}>Tabel atribut</button>
                <button className="b bp" style={{ flex: 1 }}>Unduh brief</button>
              </div>
            </div>
          )}

          {tab === "copilot" && (
            <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
              <div className="sc" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "4px 22px 12px" }}>
                <div className="row" style={{ gap: 8, marginBottom: 14 }}>
                  <span className="dot" style={{ background: "#1D4ED8" }} />
                  <span className="k" style={{ color: "#1D4ED8" }}>Tanya data peta</span>
                </div>

                {/* User's question — right-aligned, solid accent bubble. */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ maxWidth: "82%" }}>
                    <div className="k" style={{ textAlign: "right", color: "#94A3B8", marginBottom: 4 }}>Kamu</div>
                    <div
                      style={{ borderRadius: 12, borderBottomRightRadius: 4, background: "#1D4ED8", padding: "11px 15px", fontSize: 13, color: "#fff" }}
                    >
                      simpul mana yang kekurangan gerai apotek pagi hari?
                    </div>
                  </div>
                </div>

                {/* AI's answer — left-aligned, neutral bubble with a small
                   sparkle avatar, so the two speakers are never ambiguous. */}
                {showCopilotResult && (
                  <div className="row" style={{ gap: 8, alignItems: "flex-start", marginTop: 12 }}>
                    <span
                      style={{ width: 22, height: 22, borderRadius: 999, background: "rgba(29,78,216,.12)", flex: "none", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 17 }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z" />
                      </svg>
                    </span>
                    <div style={{ maxWidth: "82%" }}>
                      <div className="k" style={{ color: "#94A3B8", marginBottom: 4 }}>Asisten data</div>
                      <div style={{ borderRadius: 12, borderTopLeftRadius: 4, background: "#EEF2F6", padding: "16px 18px" }}>
                        <div style={{ fontSize: 13.5, lineHeight: 1.55 }}>
                          2 dari 3 simpul. Permintaan apotek di kawasan <b>Stasiun B</b> terbaca 37% tanpa satu pun gerai di dalam stasiun.
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
                          <span className="chip" style={{ background: "rgba(29,78,216,.1)", borderColor: "transparent", color: "#1D4ED8" }}>Lapisan → Kategori hilang</span>
                          <span className="chip" style={{ background: "rgba(29,78,216,.1)", borderColor: "transparent", color: "#1D4ED8" }}>Kategori → Apotek</span>
                          <span className="chip" style={{ background: "rgba(29,78,216,.1)", borderColor: "transparent", color: "#1D4ED8" }}>Slot → 06–09</span>
                        </div>
                        <div style={{ fontSize: 11.5, lineHeight: 1.5, color: "#64748B", marginTop: 14 }}>
                          Setiap jawaban mengubah lapisan peta, dan menyebut slot waktu yang dipakai. Tidak ada angka di luar slot yang dicacah.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="k" style={{ margin: "20px 0 10px" }}>Pertanyaan lain</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {QUESTIONS.map((q) => (
                    <div
                      key={q}
                      onClick={() => setShowCopilotResult(true)}
                      className="lyr"
                      style={{ border: "1px solid rgba(15,23,42,.12)", borderRadius: 12, padding: "10px 15px", fontSize: 12.5 }}
                    >
                      {q}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ flex: "none", padding: "12px 16px 18px", boxShadow: "0 -1px 0 rgba(15,23,42,.1)" }}>
                <div className="pill row" style={{ gap: 10, border: "1px solid rgba(15,23,42,.14)", padding: "5px 5px 5px 16px" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z" />
                  </svg>
                  <span style={{ flex: 1, fontSize: 13, color: "#94A3B8" }}>tanya tentang simpul ini…</span>
                  <button onClick={() => setShowCopilotResult(true)} className="b bp" style={{ padding: "9px 16px", fontSize: 12 }}>
                    Tanya
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {showTransparansi && (
          <div
            onClick={() => setShowTransparansi(false)}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(15,23,42,.55)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 40,
              zIndex: 30,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ width: "100%", maxWidth: 700, background: "#fff", borderRadius: 12, boxShadow: "0 40px 100px rgba(15,23,42,.3)", overflow: "hidden" }}
            >
              <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", padding: "24px 26px 20px" }}>
                <div>
                  <div className="k" style={{ color: "#1D4ED8", marginBottom: 8 }}>Panel transparansi</div>
                  <div style={{ font: "800 21px/1.15 var(--font-inter)", letterSpacing: "-.015em" }}>Dari mana angka V = Rp 42.000 berasal</div>
                </div>
                <div className="ic" onClick={() => setShowTransparansi(false)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </div>
              </div>
              <div style={{ display: "flex", gap: 22, padding: "0 26px 26px" }}>
                <div style={{ width: 230, flex: "none" }}>
                  <div className="k" style={{ marginBottom: 9 }}>Foto asli · Struk Go</div>
                  <div style={{ height: 206, borderRadius: 12, background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, lineHeight: 1.5, color: "#94A3B8", textAlign: "center", padding: "0 16px" }}>
                    Foto struk<br />identitas diredaksi
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "#F1F5F9", boxShadow: "0 0 0 2px #1D4ED8" }} />
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "#F1F5F9" }} />
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "#F1F5F9" }} />
                    <div style={{ width: 40, height: 40, borderRadius: 12, border: "1.5px dashed rgba(15,23,42,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#94A3B8" }}>+18</div>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="k" style={{ marginBottom: 9 }}>Hasil baca AI</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <div className="row" style={{ justifyContent: "space-between", padding: "11px 14px", borderRadius: "12px 12px 0 0", background: "#EEF2F6", fontSize: 12 }}>
                      <span style={{ color: "#64748B" }}>Kategori (dinormalisasi)</span><span>F&amp;B siap saji</span>
                    </div>
                    <div className="row" style={{ justifyContent: "space-between", padding: "11px 14px", background: "#EEF2F6", fontSize: 12 }}>
                      <span style={{ color: "#64748B" }}>Subtotal</span><span style={{ color: "#94A3B8" }}>Rp 47.500 — tidak dipakai</span>
                    </div>
                    <div className="row" style={{ justifyContent: "space-between", padding: "12px 14px", borderRadius: "0 0 12px 12px", background: "rgba(29,78,216,.1)", fontSize: 12 }}>
                      <span style={{ fontWeight: 600 }}>Jumlah dibayarkan</span>
                      <span className="mono" style={{ fontWeight: 700, color: "#1D4ED8" }}>Rp 42.000</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                    <div style={{ flex: 1, borderRadius: 12, background: "#F1F5F9", padding: 14 }}>
                      <div className="k" style={{ fontSize: 9, marginBottom: 7 }}>Keyakinan</div>
                      <div className="mono" style={{ font: "700 18px/1 var(--font-inter)" }}>0,91</div>
                      <div className="pill" style={{ height: 5, background: "rgba(15,23,42,.1)", marginTop: 9 }}>
                        <div className="pill" style={{ width: "84%", height: 5, background: "#1D4ED8" }} />
                      </div>
                    </div>
                    <div style={{ flex: 1, borderRadius: 12, background: "#F1F5F9", padding: 14 }}>
                      <div className="k" style={{ fontSize: 9, marginBottom: 7 }}>Cakupan</div>
                      <div className="mono" style={{ font: "700 18px/1 var(--font-inter)" }}>182 / 196</div>
                      <div style={{ fontSize: 10, lineHeight: 1.4, color: "#64748B", marginTop: 6 }}>struk terbaca · 4 ambigu dikeluarkan</div>
                    </div>
                  </div>
                  <div className="row" style={{ gap: 10, alignItems: "flex-start", marginTop: 12, borderRadius: 12, background: "rgba(29,78,216,.08)", padding: "13px 15px", fontSize: 11.5, lineHeight: 1.55 }}>
                    <span className="dot" style={{ background: "#1D4ED8", marginTop: 5 }} />
                    <span>Nilai V kategori ini <b>dialihkan</b> dari kawasan sejenis karena sampelnya tipis, dan ditandai pada lapisan kepercayaan data.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
