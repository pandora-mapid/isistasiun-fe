"use client";

import { useState } from "react";
import Link from "next/link";
import { FloatingNavBar } from "./NavBar";

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
    <div className="page-canvas">
      <div
        style={{
          position: "relative",
          height: 860,
          background: "#F8FAFC",
          overflow: "hidden",
        }}
      >
        {/* Illustrative basemap — a real build renders this from actual GIS
           data (station coordinates, OSM building/road layers) instead. */}
        <svg
          width="1440"
          height="860"
          viewBox="0 0 1440 860"
          style={{ position: "absolute", inset: 0, display: "block" }}
        >
          <rect x="0" y="0" width="1440" height="860" fill="#F8FAFC" />
          <g fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1">
            <rect x="60" y="90" width="210" height="128" rx="2" />
            <rect x="292" y="76" width="150" height="96" rx="2" />
            <rect x="470" y="96" width="128" height="112" rx="2" />
            <rect x="628" y="70" width="176" height="104" rx="2" />
            <rect x="836" y="88" width="132" height="126" rx="2" />
            <rect x="1000" y="70" width="196" height="118" rx="2" />
            <rect x="1228" y="96" width="164" height="104" rx="2" />
            <rect x="70" y="356" width="164" height="118" rx="2" />
            <rect x="262" y="372" width="122" height="150" rx="2" />
            <rect x="452" y="470" width="146" height="132" rx="2" />
            <rect x="640" y="530" width="188" height="126" rx="2" />
            <rect x="880" y="256" width="140" height="120" rx="2" />
            <rect x="1048" y="240" width="180" height="146" rx="2" />
            <rect x="1256" y="280" width="146" height="128" rx="2" />
            <rect x="1086" y="470" width="176" height="140" rx="2" />
            <rect x="1300" y="486" width="112" height="124" rx="2" />
            <rect x="120" y="690" width="196" height="120" rx="2" />
            <rect x="360" y="700" width="150" height="110" rx="2" />
            <rect x="880" y="700" width="210" height="112" rx="2" />
            <rect x="1140" y="690" width="170" height="122" rx="2" />
          </g>
          <path
            d="M900 486 h190 a10 10 0 0 1 10 10 v128 a10 10 0 0 1 -10 10 h-190 a10 10 0 0 1 -10 -10 v-128 a10 10 0 0 1 10 -10 z"
            fill="#F1F5F9"
          />
          <text x="906" y="508" fill="#475569" style={{ font: "600 10px var(--font-inter)", letterSpacing: ".14em" }}>
            TAMAN KOTA
          </text>
          <path
            d="M-40 800 C 150 762 250 672 292 566 C 322 490 296 424 232 388"
            fill="none"
            stroke="#CBDBDC"
            strokeWidth="30"
            strokeLinecap="round"
          />
          <g fill="none" stroke="#C3CEDC" strokeLinecap="round">
            <path d="M-20 300 C 250 244 520 356 760 296 C 1000 236 1220 208 1460 256" strokeWidth="17" />
            <path d="M-20 636 C 300 676 700 572 1460 652" strokeWidth="15" />
            <path d="M206 -20 C 246 200 186 424 306 620 C 380 742 392 806 384 880" strokeWidth="15" />
            <path d="M1052 -20 C 1092 220 1020 470 1108 880" strokeWidth="13" />
          </g>
          <g fill="none" stroke="#DEE5ED" strokeLinecap="round">
            <path d="M-20 460 C 320 486 660 430 1460 470" strokeWidth="5" />
            <path d="M600 -20 C 620 200 580 460 640 880" strokeWidth="5" />
            <path d="M840 -20 C 860 240 830 520 900 880" strokeWidth="4" />
            <path d="M-20 160 C 340 190 740 120 1460 152" strokeWidth="4" />
            <path d="M-20 760 C 380 790 900 720 1460 764" strokeWidth="4" />
            <path d="M1266 -20 C 1300 240 1256 520 1320 880" strokeWidth="4" />
          </g>
          <text x="150" y="286" fill="#64748B" style={{ font: "600 10px var(--font-inter)", letterSpacing: ".14em" }}>
            JL. ARTERI UTARA
          </text>
          <text x="960" y="622" fill="#64748B" style={{ font: "600 10px var(--font-inter)", letterSpacing: ".14em" }}>
            JL. STASIUN RAYA
          </text>

          <path
            d="M705 60 C 900 72 1016 190 1030 380 C 1044 570 900 730 700 745 C 500 760 380 630 372 420 C 364 220 510 48 705 60 Z"
            fill="rgba(37,99,235,.045)"
            stroke="#2563EB"
            strokeOpacity=".55"
            strokeWidth="1.25"
            strokeDasharray="5 5"
          />
          <path
            d="M705 190 C 830 195 906 274 912 390 C 918 506 830 606 705 610 C 580 614 500 520 498 395 C 496 270 580 186 705 190 Z"
            fill="rgba(37,99,235,.08)"
            stroke="#2563EB"
            strokeOpacity=".65"
            strokeWidth="1.25"
            strokeDasharray="5 5"
          />
          <path
            d="M705 270 C 786 272 830 325 833 398 C 836 470 786 528 705 530 C 624 532 578 470 577 397 C 576 325 624 268 705 270 Z"
            fill="rgba(37,99,235,.13)"
            stroke="#2563EB"
            strokeOpacity=".8"
            strokeWidth="1.25"
            strokeDasharray="5 5"
          />
          <text x="440" y="196" fill="#1D4ED8" style={{ font: "600 10px var(--font-inter)", letterSpacing: ".14em" }}>
            10 MNT
          </text>
          <text x="520" y="300" fill="#1D4ED8" style={{ font: "600 10px var(--font-inter)", letterSpacing: ".14em" }}>
            5 MNT
          </text>

          <path
            d="M-40 726 C 240 664 420 472 700 400 C 980 328 1180 300 1480 224"
            fill="none"
            stroke="#475569"
            strokeWidth="4"
          />
          <path
            d="M-40 726 C 240 664 420 472 700 400 C 980 328 1180 300 1480 224"
            fill="none"
            stroke="#0F172A"
            strokeWidth="4"
            strokeDasharray="2 10"
          />

          <g transform="rotate(-15 705 400)">
            <rect x="618" y="382" width="174" height="36" rx="2" fill="#FFFFFF" />
            <rect x="640" y="391" width="146" height="18" rx="2" fill="none" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="1 5" />
            <text x="626" y="405" fill="#0F172A" style={{ font: "800 13px var(--font-inter)" }}>B</text>
          </g>

          <circle cx="612" cy="452" r="22" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="4 4" />
          <circle cx="820" cy="360" r="25" fill="rgba(147,197,253,.4)" />
          <circle cx="820" cy="360" r="16" fill="#93C5FD" stroke="#fff" strokeWidth="2.5" />
          <circle cx="630" cy="338" r="25" fill="rgba(96,165,250,.4)" />
          <circle cx="630" cy="338" r="16" fill="#60A5FA" stroke="#fff" strokeWidth="2.5" />
          <circle cx="790" cy="474" r="25" fill="rgba(29,78,216,.4)" />
          <circle cx="790" cy="474" r="16" fill="#1D4ED8" stroke="#fff" strokeWidth="2.5" />
        </svg>

        <div style={{ position: "absolute", left: 568, top: 414, font: "600 11px/1 var(--font-inter)", color: "#475569" }}>
          P3 <span style={{ color: "#94A3B8" }}>sampel tipis</span>
        </div>
        <div style={{ position: "absolute", left: 600, top: 296, font: "600 11px/1 var(--font-inter)", color: "#0F172A" }}>P1</div>
        <div style={{ position: "absolute", left: 846, top: 352, font: "600 11px/1 var(--font-inter)", color: "#0F172A" }}>P2</div>

        <div
          style={{
            position: "absolute",
            left: 742,
            top: 538,
            background: "#F8FAFC",
            borderLeft: "3px solid #1D4ED8",
            borderRadius: 12,
            padding: "9px 14px 9px 11px",
            boxShadow: "0 2px 8px rgba(15,23,42,.1)",
          }}
        >
          <div style={{ font: "700 11px/1.1 var(--font-inter)", color: "#475569", letterSpacing: ".06em", textTransform: "uppercase" }}>
            Pintu 4 · Gap terbesar
          </div>
          <div className="mono" style={{ fontWeight: 600, fontSize: 13, lineHeight: 1, fontFamily: "var(--font-inter)", color: "#0F172A", marginTop: 4 }}>
            Rp X,X jt / hari kerja
          </div>
        </div>

        <div className="glass" style={{ position: "absolute", left: 420, top: 462, borderRadius: 12, padding: "12px 15px" }}>
          <div className="row" style={{ gap: 8 }}>
            <span className="dot" style={{ background: "#2563EB" }} />
            <span style={{ font: "800 16px/1 var(--font-inter)" }}>Stasiun B</span>
          </div>
          <div className="mono" style={{ fontSize: 11.5, color: "#475569", marginTop: 6 }}>
            Kesenjangan Rp X,X–X,X jt · 4 pintu
          </div>
        </div>

        <FloatingNavBar active="peta" />

        <div style={{ position: "absolute", left: 24, top: 108, display: "flex", flexDirection: "column", gap: 6 }}>
          <div className="ic" style={{ background: "#fff", border: "1px solid #CBD5E1", boxShadow: "none" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
          </div>
          <div className="ic" style={{ background: "#fff", border: "1px solid #CBD5E1", boxShadow: "none" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 12h14" />
            </svg>
          </div>
          <div className="ic" style={{ background: "#fff", border: "1px solid #CBD5E1", boxShadow: "none", flexDirection: "column", gap: 1 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 3 4 9-4-2-4 2 4-9Z" />
            </svg>
            <span style={{ font: "600 8px/1 var(--font-inter)", color: "#64748B" }}>U</span>
          </div>
        </div>

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
          −6,2077 · 106,8451 &nbsp;|&nbsp; z 15,4 &nbsp;|&nbsp; GEO MAPID
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
          style={{ position: "absolute", right: 24, top: 108, bottom: 24, width: 414, borderRadius: 12, display: "flex", flexDirection: "column", overflow: "hidden" }}
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
                        <span>&lt; Rp X jt</span>
                        <span>&gt; Rp X jt</span>
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
                  <div className="mono" style={{ fontWeight: 700, fontSize: 52, lineHeight: 1, letterSpacing: "-.02em" }}>
                    Rp X,X–X,X jt
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
                      <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>X.XXX <span style={{ color: "#94A3B8", fontWeight: 400 }}>org/jam</span></span>
                    </div>
                    <div className="row" style={{ justifyContent: "space-between", padding: "11px 14px", borderBottom: "1px solid #E2E8F0" }}>
                      <span style={{ fontSize: 12.5, color: "#475569" }}>E — entry ratio</span>
                      <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>X,X <span style={{ color: "#94A3B8", fontWeight: 400 }}>%</span></span>
                    </div>
                    <div className="row" style={{ justifyContent: "space-between", padding: "11px 14px", borderBottom: "1px solid #E2E8F0" }}>
                      <span style={{ fontSize: 12.5, color: "#475569" }}>C — konversi</span>
                      <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>XX <span style={{ color: "#94A3B8", fontWeight: 400 }}>%</span></span>
                    </div>
                    <div className="row" style={{ justifyContent: "space-between", padding: "11px 14px", background: "#EEF2F6" }}>
                      <span style={{ fontSize: 12.5, color: "#475569" }}>V — nilai transaksi <span style={{ fontSize: 9.5, color: "#94A3B8" }}>AI</span></span>
                      <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: "#1D4ED8" }}>Rp XX.XXX</span>
                    </div>
                  </div>
                  <div className="row" style={{ justifyContent: "space-between", marginTop: 14 }}>
                    <span className="mono" style={{ fontSize: 11.5, color: "#64748B" }}>Potensi Rp X,X jt − tertangkap Rp X,X jt</span>
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
                      <span className="mono" style={{ width: 64, textAlign: "right", fontSize: 11 }}>Rp X,X jt</span>
                    </div>
                    <div className="row" style={{ gap: 11 }}>
                      <span style={{ width: 52, fontSize: 12, color: "#475569" }}>Pintu 1</span>
                      <span className="pill" style={{ flex: 1, height: 14, background: "rgba(15,23,42,.08)" }}>
                        <span className="pill" style={{ display: "block", width: "54%", height: 14, background: "#475569" }} />
                      </span>
                      <span className="mono" style={{ width: 64, textAlign: "right", fontSize: 11 }}>Rp X,X jt</span>
                    </div>
                    <div className="row" style={{ gap: 11 }}>
                      <span style={{ width: 52, fontSize: 12, color: "#475569" }}>Pintu 2</span>
                      <span className="pill" style={{ flex: 1, height: 14, background: "rgba(15,23,42,.08)" }}>
                        <span className="pill" style={{ display: "block", width: "31%", height: 14, background: "#2563EB" }} />
                      </span>
                      <span className="mono" style={{ width: 64, textAlign: "right", fontSize: 11 }}>Rp X,X jt</span>
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
                      <span className="mono" style={{ fontSize: 11.5, color: "#475569" }}>XX% · 0 gerai</span>
                    </div>
                    <div className="row" style={{ justifyContent: "space-between", padding: "10px 2px" }}>
                      <span style={{ fontSize: 13 }}>Jasa</span>
                      <span className="mono" style={{ fontSize: 11.5, color: "#475569" }}>XX% · 1 gerai</span>
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
                <div className="pill" style={{ background: "#F1F5F9", padding: "11px 15px", fontSize: 13, color: "#0F172A", marginBottom: 12 }}>
                  simpul mana yang kekurangan gerai apotek pagi hari?
                </div>
                {showCopilotResult && (
                  <div style={{ borderRadius: 12, background: "#EEF2F6", padding: "16px 18px" }}>
                    <div style={{ fontSize: 13.5, lineHeight: 1.55 }}>
                      2 dari 3 simpul. Permintaan apotek di kawasan <b>Stasiun B</b> terbaca XX% tanpa satu pun gerai di dalam stasiun.
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
                  <div style={{ font: "800 21px/1.15 var(--font-inter)", letterSpacing: "-.015em" }}>Dari mana angka V = Rp XX.XXX berasal</div>
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
                    <div style={{ width: 40, height: 40, borderRadius: 12, border: "1.5px dashed rgba(15,23,42,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#94A3B8" }}>+XX</div>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="k" style={{ marginBottom: 9 }}>Hasil baca AI</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <div className="row" style={{ justifyContent: "space-between", padding: "11px 14px", borderRadius: "12px 12px 0 0", background: "#EEF2F6", fontSize: 12 }}>
                      <span style={{ color: "#64748B" }}>Kategori (dinormalisasi)</span><span>F&amp;B siap saji</span>
                    </div>
                    <div className="row" style={{ justifyContent: "space-between", padding: "11px 14px", background: "#EEF2F6", fontSize: 12 }}>
                      <span style={{ color: "#64748B" }}>Subtotal</span><span style={{ color: "#94A3B8" }}>Rp XX.XXX — tidak dipakai</span>
                    </div>
                    <div className="row" style={{ justifyContent: "space-between", padding: "12px 14px", borderRadius: "0 0 12px 12px", background: "rgba(29,78,216,.1)", fontSize: 12 }}>
                      <span style={{ fontWeight: 600 }}>Jumlah dibayarkan</span>
                      <span className="mono" style={{ fontWeight: 700, color: "#1D4ED8" }}>Rp XX.XXX</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                    <div style={{ flex: 1, borderRadius: 12, background: "#F1F5F9", padding: 14 }}>
                      <div className="k" style={{ fontSize: 9, marginBottom: 7 }}>Keyakinan</div>
                      <div className="mono" style={{ font: "700 18px/1 var(--font-inter)" }}>0,XX</div>
                      <div className="pill" style={{ height: 5, background: "rgba(15,23,42,.1)", marginTop: 9 }}>
                        <div className="pill" style={{ width: "84%", height: 5, background: "#1D4ED8" }} />
                      </div>
                    </div>
                    <div style={{ flex: 1, borderRadius: 12, background: "#F1F5F9", padding: 14 }}>
                      <div className="k" style={{ fontSize: 9, marginBottom: 7 }}>Cakupan</div>
                      <div className="mono" style={{ font: "700 18px/1 var(--font-inter)" }}>XX / XX</div>
                      <div style={{ fontSize: 10, lineHeight: 1.4, color: "#64748B", marginTop: 6 }}>struk terbaca · X ambigu dikeluarkan</div>
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
