"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { HeroPeta } from "./HeroPeta";
import { Icon } from "./Icon";

type ProductTabKey =
  | "spending-gap"
  | "missing-category"
  | "pedestrian-flow"
  | "rent-flow"
  | "confidence";

export function LandingView() {
  const [activeTab, setActiveTab] = useState<ProductTabKey>("spending-gap");
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [activeBuffer, setActiveBuffer] = useState<"3" | "5" | "10">("3");

  const [activeStationNode, setActiveStationNode] = useState<number>(0);
  const spineRef = useRef<SVGPathElement>(null);

  // Efek animasi Transit Spine mengikuti scroll halaman
  useEffect(() => {
    const transitSpine = spineRef.current;
    if (!transitSpine) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let pathLength = 5200;
    try {
      pathLength = transitSpine.getTotalLength();
    } catch {
      pathLength = 5200;
    }

    transitSpine.style.strokeDasharray = `${pathLength}`;
    transitSpine.style.strokeDashoffset = prefersReducedMotion
      ? "0"
      : `${pathLength}`;
    transitSpine.style.transition = "stroke-dashoffset 0.12s ease-out";

    let ticking = false;

    function handleScroll() {
      if (prefersReducedMotion) return;

      const docElem = document.documentElement;
      const totalHeight = docElem.scrollHeight - docElem.clientHeight;
      const scrollTop = window.scrollY || docElem.scrollTop;
      const progress = Math.min(Math.max(scrollTop / (totalHeight || 1), 0), 1);

      const easedProgress = Math.min(progress * 1.08, 1);
      const drawLength = pathLength * (1 - easedProgress);
      if (transitSpine) {
        transitSpine.style.strokeDashoffset = `${drawLength}`;
      }

      const nodeThresholds = [0.08, 0.28, 0.52, 0.72, 0.94];
      let maxActive = 0;
      nodeThresholds.forEach((threshold, idx) => {
        if (progress >= threshold) {
          maxActive = idx + 1;
        }
      });
      setActiveStationNode(maxActive);

      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(handleScroll);
        ticking = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleTabChange = (tab: ProductTabKey) => {
    setActiveTab(tab);
  };

  return (
    <div className="bg-canvas-warm text-on-surface font-body-md antialiased min-h-screen relative selection:bg-accent-yellow/30">
      {/* MAIN CONTAINER */}
      <main className="w-full pt-4 sm:pt-8 bg-canvas-warm min-h-screen relative overflow-hidden">
        {/* CONTINUOUS TRANSIT SPINE SVG BACKGROUND */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 w-full h-full overflow-hidden z-0"
        >
          <svg
            className="w-full h-full"
            id="transit-spine-svg"
            preserveAspectRatio="none"
            viewBox="0 0 1440 4800"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient
                id="transitLineGrad"
                x1="0%"
                x2="0%"
                y1="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#D8A72E" />
                <stop offset="28%" stopColor="#D49A59" />
                <stop offset="50%" stopColor="#4B7FF7" />
                <stop offset="78%" stopColor="#6E9F7B" />
                <stop offset="100%" stopColor="#D8A72E" />
              </linearGradient>
              <filter
                height="140%"
                id="spineGlow"
                width="140%"
                x="-20%"
                y="-20%"
              >
                <feGaussianBlur
                  in="SourceGraphic"
                  result="blur"
                  stdDeviation="4"
                />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Faint base track bed */}
            <path
              className="transit-track-base"
              d="M 680 180 C 820 320, 920 440, 910 650 C 900 840, 720 1020, 480 1140 C 240 1260, 210 1400, 260 1560 C 310 1720, 560 1820, 740 1920 C 940 2040, 1140 2200, 1100 2480 C 1060 2740, 800 2860, 480 2980 C 260 3060, 200 3240, 240 3420 C 290 3620, 520 3760, 720 3880 C 920 4000, 1020 4160, 980 4360 C 940 4520, 840 4640, 720 4750"
              fill="none"
              opacity="0.14"
              stroke="#787770"
              strokeDasharray="6 8"
              strokeLinecap="round"
              strokeWidth="3"
            />

            {/* Active animated transit spine path */}
            <path
              ref={spineRef}
              d="M 680 180 C 820 320, 920 440, 910 650 C 900 840, 720 1020, 480 1140 C 240 1260, 210 1400, 260 1560 C 310 1720, 560 1820, 740 1920 C 940 2040, 1140 2200, 1100 2480 C 1060 2740, 800 2860, 480 2980 C 260 3060, 200 3240, 240 3420 C 290 3620, 520 3760, 720 3880 C 920 4000, 1020 4160, 980 4360 C 940 4520, 840 4640, 720 4750"
              fill="none"
              filter="url(#spineGlow)"
              id="transit-active-line"
              opacity="0.85"
              stroke="url(#transitLineGrad)"
              strokeLinecap="round"
              strokeWidth="4"
            />

            {/* Schematic station interchange tick marks */}
            <g opacity="0.35" stroke="#787770" strokeWidth="2">
              <line x1="880" x2="904" y1="520" y2="528" />
              <line x1="620" x2="636" y1="1080" y2="1100" />
              <line x1="280" x2="298" y1="1640" y2="1656" />
              <line x1="880" x2="900" y1="2000" y2="2018" />
              <line x1="920" x2="936" y1="2880" y2="2902" />
              <line x1="320" x2="340" y1="3520" y2="3538" />
              <line x1="860" x2="880" y1="3940" y2="3956" />
            </g>

            {/* Node 1: Hero Station Node (910, 650) */}
            <g
              className="transit-node transition-all duration-700"
              style={{
                opacity: activeStationNode >= 1 ? 1 : 0.5,
                transform: `translate(910px, 650px) ${activeStationNode >= 1 ? "scale(1.05)" : "scale(1)"}`,
              }}
            >
              <circle
                className={`station-pulse origin-center ${activeStationNode >= 1 ? "station-pulse-active" : ""}`}
                fill="none"
                r="22"
                stroke="#D8A72E"
                strokeOpacity="0.4"
                strokeWidth="1.5"
              />
              <circle
                fill="#FAF9F5"
                r="11"
                stroke="#D8A72E"
                strokeWidth="3.5"
              />
              <circle fill="#171714" r="4.5" />
              <g opacity="0.75" transform="translate(18, -4)">
                <rect
                  fill="#171714"
                  height="18"
                  rx="4"
                  width="72"
                  x="0"
                  y="-8"
                />
                <text
                  fill="#FAF9F5"
                  fontFamily="Inter"
                  fontSize="9.5"
                  fontWeight="600"
                  letterSpacing="0.4"
                  x="7"
                  y="5"
                >
                  Manggarai
                </text>
              </g>
            </g>

            {/* Node 2: Traffic-to-Value Node (260, 1560) */}
            <g
              className="transit-node transition-all duration-700"
              style={{
                opacity: activeStationNode >= 2 ? 1 : 0.5,
                transform: `translate(260px, 1560px) ${activeStationNode >= 2 ? "scale(1.05)" : "scale(1)"}`,
              }}
            >
              <circle
                className={`station-pulse origin-center ${activeStationNode >= 2 ? "station-pulse-active" : ""}`}
                fill="none"
                r="22"
                stroke="#D49A59"
                strokeOpacity="0.4"
                strokeWidth="1.5"
              />
              <circle
                fill="#FAF9F5"
                r="11"
                stroke="#D49A59"
                strokeWidth="3.5"
              />
              <circle fill="#171714" r="4.5" />
              <g opacity="0.75" transform="translate(18, -4)">
                <rect
                  fill="#171714"
                  height="18"
                  rx="4"
                  width="64"
                  x="0"
                  y="-8"
                />
                <text
                  fill="#FAF9F5"
                  fontFamily="Inter"
                  fontSize="9.5"
                  fontWeight="600"
                  letterSpacing="0.4"
                  x="7"
                  y="5"
                >
                  Sudirman
                </text>
              </g>
            </g>

            {/* Node 3: Bento Decisions Node (1100, 2480) */}
            <g
              className="transit-node transition-all duration-700"
              style={{
                opacity: activeStationNode >= 3 ? 1 : 0.5,
                transform: `translate(1100px, 2480px) ${activeStationNode >= 3 ? "scale(1.05)" : "scale(1)"}`,
              }}
            >
              <circle
                className={`station-pulse origin-center ${activeStationNode >= 3 ? "station-pulse-active" : ""}`}
                fill="none"
                r="26"
                stroke="#4B7FF7"
                strokeOpacity="0.5"
                strokeWidth="2"
              />
              <circle
                fill="#171714"
                r="12"
                stroke="#4B7FF7"
                strokeWidth="3.5"
              />
              <circle fill="#D8A72E" r="5" />
              <g opacity="0.85" transform="translate(-72, -4)">
                <rect
                  fill="#171714"
                  height="18"
                  rx="4"
                  width="56"
                  x="0"
                  y="-8"
                />
                <text
                  fill="#FAF9F5"
                  fontFamily="Inter"
                  fontSize="9.5"
                  fontWeight="600"
                  letterSpacing="0.4"
                  x="7"
                  y="5"
                >
                  Gambir
                </text>
              </g>
            </g>

            {/* Node 4: WebGIS Studio Node (240, 3420) */}
            <g
              className="transit-node transition-all duration-700"
              style={{
                opacity: activeStationNode >= 4 ? 1 : 0.5,
                transform: `translate(240px, 3420px) ${activeStationNode >= 4 ? "scale(1.05)" : "scale(1)"}`,
              }}
            >
              <circle
                className={`station-pulse origin-center ${activeStationNode >= 4 ? "station-pulse-active" : ""}`}
                fill="none"
                r="22"
                stroke="#6E9F7B"
                strokeOpacity="0.4"
                strokeWidth="1.5"
              />
              <circle
                fill="#FAF9F5"
                r="11"
                stroke="#6E9F7B"
                strokeWidth="3.5"
              />
              <circle fill="#171714" r="4.5" />
              <g opacity="0.75" transform="translate(18, -4)">
                <rect
                  fill="#171714"
                  height="18"
                  rx="4"
                  width="80"
                  x="0"
                  y="-8"
                />
                <text
                  fill="#FAF9F5"
                  fontFamily="Inter"
                  fontSize="9.5"
                  fontWeight="600"
                  letterSpacing="0.4"
                  x="7"
                  y="5"
                >
                  Tanah Abang
                </text>
              </g>
            </g>

            {/* Node 5: Terminal Node CTA (720, 4750) */}
            <g
              className="transit-node transition-all duration-700"
              style={{
                opacity: activeStationNode >= 5 ? 1 : 0.6,
                transform: `translate(720px, 4750px) ${activeStationNode >= 5 ? "scale(1.05)" : "scale(1)"}`,
              }}
            >
              <circle
                className={`station-pulse origin-center ${activeStationNode >= 5 ? "station-pulse-active" : ""}`}
                fill="none"
                r="28"
                stroke="#D8A72E"
                strokeOpacity="0.6"
                strokeWidth="2"
              />
              <circle fill="#171714" r="14" stroke="#D8A72E" strokeWidth="4" />
              <circle fill="#FAF9F5" r="6" />
              <g opacity="0.95" transform="translate(-46, 22)">
                <rect
                  fill="#171714"
                  height="20"
                  rx="5"
                  stroke="#D8A72E"
                  strokeWidth="1"
                  width="92"
                  x="0"
                  y="0"
                />
                <text
                  fill="#D8A72E"
                  fontFamily="Inter"
                  fontSize="9.5"
                  fontWeight="700"
                  letterSpacing="0.4"
                  textAnchor="middle"
                  x="46"
                  y="14"
                >
                  Jakarta Kota
                </text>
              </g>
            </g>
          </svg>
        </div>

        {/* SECTION 1: HERO */}
        <section className="reveal relative w-full overflow-hidden px-gutter-sm lg:px-gutter py-space-xl lg:py-24 max-w-7xl mx-auto z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column */}
            <div className="lg:col-span-6 xl:col-span-5 flex flex-col items-start gap-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-high/80 text-text-primary border border-border-subtle backdrop-blur-sm shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-yellow"></span>
                <span className="font-label-sm uppercase tracking-wider text-text-secondary font-semibold">
                  Spatial Intelligence for Transit
                </span>
              </div>

              <h1 className="font-headline-lg text-text-primary tracking-tight font-bold">
                Berapa rupiah yang lewat, berapa yang{" "}
                <span className="relative inline-block px-2.5 py-0.5 rounded-md bg-accent-yellow/25 text-text-primary font-serif italic font-bold">
                  tertangkap.
                </span>
              </h1>

              <p className="font-body-lg text-text-secondary leading-relaxed max-w-xl">
                Isi Stasiun mengubah pergerakan komuter menjadi{" "}
                <em className="italic text-text-primary font-serif font-medium">
                  spatial intelligence
                </em>{" "}
                untuk membantu melihat potensi ekonomi setiap simpul transit.
                Temukan spending gap, kategori usaha yang belum terpenuhi,
                posisi relatif sewa, dan peluang komersial langsung dari peta.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2 w-full sm:w-auto">
                <Link
                  href="/peta"
                  className="b bp inline-flex items-center justify-center gap-2.5 px-7 py-3.5 font-label-lg font-semibold shadow-md hover:brightness-105 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
                  style={{ color: "#171714", background: "var(--brand)" }}
                >
                  <span className="w-2 h-2 rounded-full bg-surface-dark"></span>
                  <span>Buka Peta Interaktif</span>
                  <Icon name="arrow_forward" className="text-[18px]" />
                </Link>

                <a
                  href="#how-it-works"
                  className="b bs inline-flex items-center gap-2 px-5 py-3.5 font-label-md transition-all shadow-xs"
                  style={{ color: "#171714" }}
                >
                  <span>Lihat cara kerjanya</span>
                  <Icon
                    name="arrow_downward"
                    className="text-[16px] text-text-secondary"
                  />
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-4 text-text-muted font-label-sm">
                <span className="inline-flex items-center gap-1.5 font-medium text-text-secondary">
                  <span className="w-2 h-2 rounded-full bg-accent-green"></span>
                  Live spatial analysis
                </span>
                <span className="text-outline-variant">•</span>
                <span>Transparent evidence</span>
              </div>
            </div>

            {/* Right Column: Interactive Composed WebGIS Map Scene */}
            <div className="lg:col-span-6 xl:col-span-7 relative">
              <div className="relative w-full rounded-3xl bg-surface-card shadow-2xl p-3 sm:p-5 overflow-hidden border border-border-subtle">
                <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] rounded-2xl bg-[#EBE8DF] overflow-hidden">
                  {/* Real Live MapCanvas mounted in background to satisfy Playwright test queries */}
                  <div className="absolute inset-0 opacity-85">
                    <HeroPeta showOverlayCards={false} />
                  </div>

                  {/* Top Left HUD */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-surface-card/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-border-subtle z-20">
                    <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse"></span>
                    <span className="font-label-sm text-text-primary font-semibold">
                      Manggarai Central Hub
                    </span>
                    <span className="text-text-muted font-body-sm text-xs">
                      · Isochrone 5m
                    </span>
                  </div>

                  {/* Top Right HUD Controls */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-surface-card/90 backdrop-blur-md p-1 rounded-full shadow-sm border border-border-subtle z-20">
                    <button
                      type="button"
                      aria-label="Perbesar"
                      className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-surface-container text-text-primary"
                    >
                      <Icon name="add" className="text-[16px]" />
                    </button>
                    <button
                      type="button"
                      aria-label="Perkecil"
                      className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-surface-container text-text-primary"
                    >
                      <Icon name="remove" className="text-[16px]" />
                    </button>
                    <button
                      type="button"
                      aria-label="Lapisan peta"
                      className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-surface-container text-text-primary"
                    >
                      <Icon name="layers" className="text-[16px]" />
                    </button>
                  </div>

                  {/* Floating Insight Card A */}
                  <div className="absolute top-16 right-4 sm:right-6 w-56 sm:w-64 bg-surface-card/95 backdrop-blur-md rounded-xl p-3.5 shadow-xl border border-border-subtle transition-transform hover:scale-[1.02] cursor-default z-20">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-label-sm text-[10px] tracking-wider uppercase text-text-muted">
                        Manggarai · Pintu Timur
                      </span>
                      <span className="w-2 h-2 rounded-full bg-accent-yellow"></span>
                    </div>
                    <div className="font-label-sm text-xs text-text-secondary">
                      Potential Spending:
                    </div>
                    <div className="font-stat-numeric text-xl sm:text-2xl text-text-primary">
                      Rp 2,3–4,0 jt
                    </div>
                    <div className="font-body-sm text-[11px] text-text-muted mt-0.5">
                      per window observasi 2 jam
                    </div>
                  </div>

                  {/* Floating Insight Card B: Spending Gap */}
                  <div className="absolute bottom-16 left-4 sm:left-6 w-60 sm:w-72 bg-surface-card/95 backdrop-blur-md rounded-xl p-3.5 shadow-xl border border-border-subtle transition-transform hover:scale-[1.02] cursor-default z-20">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <Icon
                          name="trending_up"
                          className="text-accent-yellow-dark text-[18px]"
                        />
                        <span className="font-label-sm text-xs font-semibold text-text-primary">
                          SPENDING GAP
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-accent-green/20 text-[#245431] font-label-sm text-[10px] font-semibold">
                        High Opp.
                      </span>
                    </div>
                    <div className="font-stat-numeric text-2xl sm:text-3xl text-text-primary tracking-tight">
                      Rp 1,8–3,1 jt
                    </div>
                    <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden my-2">
                      <div
                        className="bg-accent-yellow h-full rounded-full"
                        style={{ width: "72%" }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-label-sm text-text-muted">
                      <span>Tertangkap: Rp 1,2 jt</span>
                      <span className="text-text-primary font-medium">
                        Uncaptured: 68%
                      </span>
                    </div>
                  </div>

                  {/* Floating Insight Card C: Category Opportunity */}
                  <div className="absolute bottom-4 right-4 sm:right-6 w-auto bg-surface-dark/95 backdrop-blur-md text-surface-bright rounded-xl p-3 sm:px-4 sm:py-3 shadow-2xl border border-white/15 transition-transform hover:scale-[1.02] cursor-default z-20">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Icon
                          name="storefront"
                          className="text-accent-yellow text-[18px]"
                        />
                      </div>
                      <div className="flex flex-col min-w-0 pr-1">
                        <span className="font-label-sm text-[10px] tracking-wider uppercase text-white/75 font-semibold whitespace-nowrap">
                          Top Recommendation
                        </span>
                        <span className="font-label-md text-xs sm:text-sm font-semibold text-white whitespace-nowrap">
                          Convenience Retail
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: WHY IT MATTERS ('Ramai belum tentu menghasilkan') */}
        <section
          className="reveal w-full bg-surface-container-low/60 py-20 lg:py-28 px-gutter-sm lg:px-gutter border-y border-border-subtle relative z-10"
          id="how-it-works"
        >
          <div className="max-w-7xl mx-auto flex flex-col items-center">
            <div className="text-center max-w-3xl flex flex-col items-center gap-3 mb-16">
              <span className="font-label-sm uppercase tracking-widest text-text-muted font-semibold">
                The Problem
              </span>
              <h2 className="font-headline-lg text-text-primary tracking-tight font-normal">
                Ramai belum tentu menghasilkan.
              </h2>
              <p className="font-body-lg text-text-secondary leading-relaxed mt-2">
                Ribuan orang bisa melewati sebuah stasiun setiap hari. Namun
                tingginya arus belum tentu berarti tingginya aktivitas
                komersial. Yang perlu dipahami bukan hanya siapa yang lewat,
                tetapi bagaimana pergerakan berubah menjadi nilai ekonomi.
              </p>
            </div>

            {/* Micro-Conversion Funnel Flow Visual */}
            <div className="w-full max-w-5xl bg-surface-card rounded-2xl p-6 sm:p-8 shadow-sm border border-border-subtle mb-16">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <Icon
                    name="conversion_path"
                    className="text-text-primary text-[20px]"
                  />
                  <span className="font-label-md font-semibold text-text-primary">
                    Micro-Conversion Funnel Simpul Transit
                  </span>
                </div>
                <span className="font-label-sm text-[10px] uppercase tracking-wider px-2.5 py-1 rounded bg-surface-container text-text-muted">
                  Spatial Funnel Flow
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
                {/* Step 1: TRAFFIC */}
                <div className="relative bg-surface-container-low/80 rounded-xl p-4 flex flex-col justify-between border border-border-subtle">
                  <div>
                    <div className="flex items-center justify-between text-text-muted mb-2 font-label-sm text-[11px] uppercase">
                      <span>01 · Traffic</span>
                      <Icon name="directions_walk" className="text-[16px]" />
                    </div>
                    <div className="font-stat-numeric text-2xl text-text-primary">
                      12,420
                    </div>
                    <div className="font-body-sm text-text-secondary">
                      komuter / hari melintas
                    </div>
                  </div>
                  <div className="mt-4 pt-3 text-[11px] text-text-muted border-t border-border-subtle/50">
                    Total foot-traffic pintu transit
                  </div>
                </div>

                {/* Step 2: VISIT */}
                <div className="relative bg-surface-container-low/80 rounded-xl p-4 flex flex-col justify-between border border-border-subtle">
                  <div>
                    <div className="flex items-center justify-between text-text-muted mb-2 font-label-sm text-[11px] uppercase">
                      <span>02 · Visit</span>
                      <Icon name="visibility" className="text-[16px]" />
                    </div>
                    <div className="font-stat-numeric text-2xl text-text-primary">
                      1,842
                    </div>
                    <div className="font-body-sm text-text-secondary">
                      kunjungan area retail (14.8%)
                    </div>
                  </div>
                  <div className="mt-4 pt-3 text-[11px] text-text-muted border-t border-border-subtle/50">
                    Berhenti &gt; 3 menit di koridor niaga
                  </div>
                </div>

                {/* Step 3: PURCHASE */}
                <div className="relative bg-surface-container-low/80 rounded-xl p-4 flex flex-col justify-between border border-border-subtle">
                  <div>
                    <div className="flex items-center justify-between text-text-muted mb-2 font-label-sm text-[11px] uppercase">
                      <span>03 · Purchase</span>
                      <Icon name="shopping_bag" className="text-[16px]" />
                    </div>
                    <div className="font-stat-numeric text-2xl text-accent-yellow-dark">
                      638
                    </div>
                    <div className="font-body-sm text-text-secondary">
                      transaksi terkonversi (5.1%)
                    </div>
                  </div>
                  <div className="mt-4 pt-3 text-[11px] text-text-muted border-t border-border-subtle/50">
                    Pelanggan aktif melakukan order
                  </div>
                </div>

                {/* Step 4: VALUE */}
                <div className="relative bg-surface-dark text-surface-bright rounded-xl p-4 flex flex-col justify-between shadow-md">
                  <div>
                    <div className="flex items-center justify-between text-text-muted mb-2 font-label-sm text-[11px] uppercase">
                      <span className="text-accent-yellow font-semibold">
                        04 · Captured Value
                      </span>
                      <Icon
                        name="payments"
                        className="text-accent-yellow text-[16px]"
                      />
                    </div>
                    <div className="font-stat-numeric text-2xl text-surface-bright">
                      Rp 38.500
                    </div>
                    <div className="font-body-sm text-on-primary-container">
                      avg. basket size / orang
                    </div>
                  </div>
                  <div className="mt-4 pt-3 text-[11px] text-accent-yellow font-medium border-t border-surface-container-highest/30">
                    Nilai tangkapan per pintu / shift
                  </div>
                </div>
              </div>
            </div>

            {/* Station Comparison 2-Column Cards */}
            <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {/* Left Station Card: Manggarai */}
              <div className="bg-surface-card rounded-2xl p-6 sm:p-7 shadow-sm border border-border-subtle flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[#BA1A1A]"></span>
                      <h3 className="font-headline-sm font-medium text-text-primary">
                        Manggarai
                      </h3>
                      <span className="text-text-muted font-body-sm">
                        · Hub Transit
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-accent-green/15 text-[#214c2c] font-label-sm text-[11px] font-semibold">
                      HIGH DWELL TIME
                    </span>
                  </div>
                  <p className="font-body-md text-text-secondary leading-relaxed mb-6">
                    Ribuan penumpang menunggu peron transfer selama 8–18 menit.
                    Potensi belanja terfokus pada konsumsi cepat, minuman
                    grab-and-go, dan convenience ritel saat transit.
                  </p>

                  <div className="space-y-3.5 bg-surface-container-low p-4 rounded-xl mb-6 border border-border-subtle/50">
                    <div>
                      <div className="flex justify-between text-xs font-label-sm mb-1.5">
                        <span className="text-text-primary font-medium">
                          Dwell Time (&gt;10 min transit)
                        </span>
                        <span className="font-semibold text-text-primary">
                          82%
                        </span>
                      </div>
                      <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-accent-green h-full rounded-full"
                          style={{ width: "82%" }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-label-sm mb-1.5">
                        <span className="text-text-muted">
                          Direct Pass-Through
                        </span>
                        <span className="text-text-secondary font-medium">
                          35%
                        </span>
                      </div>
                      <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-outline h-full rounded-full"
                          style={{ width: "35%" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between text-text-muted font-label-sm text-xs border-t border-border-subtle/50">
                  <span className="flex items-center gap-1.5">
                    <Icon
                      name="store"
                      className="text-[16px] text-accent-yellow"
                    />{" "}
                    Peluang: Kiosk Kopi &amp; Snack
                  </span>
                  <span className="font-medium text-text-primary">
                    Skor Peluang: 8.9/10
                  </span>
                </div>
              </div>

              {/* Right Station Card: Sudirman */}
              <div className="bg-surface-card rounded-2xl p-6 sm:p-7 shadow-sm border border-border-subtle flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-accent-blue"></span>
                      <h3 className="font-headline-sm font-medium text-text-primary">
                        Sudirman
                      </h3>
                      <span className="text-text-muted font-body-sm">
                        · Hub Perkantoran
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-accent-orange/20 text-[#68411c] font-label-sm text-[11px] font-semibold">
                      HIGH PASS-THROUGH
                    </span>
                  </div>
                  <p className="font-body-md text-text-secondary leading-relaxed mb-6">
                    Arus komuter koridor Sudirman bergerak sangat cepat menuju
                    menara perkantoran SCBD / Thamrin. Kebutuhan belanja
                    sensitif waktu: sarapan cepat, ATM, farmasi darurat.
                  </p>

                  <div className="space-y-3.5 bg-surface-container-low p-4 rounded-xl mb-6 border border-border-subtle/50">
                    <div>
                      <div className="flex justify-between text-xs font-label-sm mb-1.5">
                        <span className="text-text-muted">
                          Dwell Time (&gt;10 min transit)
                        </span>
                        <span className="text-text-secondary font-medium">
                          28%
                        </span>
                      </div>
                      <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-outline h-full rounded-full"
                          style={{ width: "28%" }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-label-sm mb-1.5">
                        <span className="text-text-primary font-medium">
                          Direct Pass-Through Arus Kantor
                        </span>
                        <span className="font-semibold text-text-primary">
                          89%
                        </span>
                      </div>
                      <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-accent-orange h-full rounded-full"
                          style={{ width: "89%" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between text-text-muted font-label-sm text-xs border-t border-border-subtle/50">
                  <span className="flex items-center gap-1.5">
                    <Icon
                      name="speed"
                      className="text-[16px] text-accent-blue"
                    />{" "}
                    Peluang: Express Breakfast &amp; Parcel
                  </span>
                  <span className="font-medium text-text-primary">
                    Skor Peluang: 8.4/10
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: FOUR DECISIONS (Editorial Redesign) */}
        <section className="reveal w-full bg-surface-dark text-surface-bright py-24 lg:py-32 px-gutter-sm lg:px-gutter relative z-10">
          <div className="max-w-7xl mx-auto">
            {/* Header: Left-aligned, max-w-[700px], generous mb */}
            <div className="flex flex-col items-start gap-4 mb-20 lg:mb-24 max-w-[700px]">
              <span className="text-[11px] lg:text-[12px] uppercase tracking-[0.08em] text-accent-yellow font-semibold font-mono">
                What You Can Discover
              </span>
              <h2 className="font-headline-lg text-2xl sm:text-4xl lg:text-[46px] leading-[1.15] font-normal text-surface-bright tracking-tight max-w-none whitespace-nowrap">
                Satu peta. Empat keputusan.
              </h2>
              <p className="text-[16px] lg:text-[17px] text-stone-400 leading-relaxed font-normal">
                Empat cara untuk memahami nilai komersial sebuah simpul transit.
              </p>
            </div>

            {/* ROW 1: 01 Spending Gap & 02 Category Opportunity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 pb-16 lg:pb-20 border-b border-white/10">
              {/* CARD 01: Spending Gap */}
              <div className="flex flex-col justify-between">
                <div>
                  <span className="text-[11px] lg:text-[12px] uppercase tracking-[0.08em] text-accent-yellow font-semibold font-mono block mb-3">
                    01 / Where is the money?
                  </span>
                  <h3 className="font-headline-md text-2xl sm:text-3xl lg:text-[34px] font-normal text-surface-bright leading-snug mb-3">
                    Berapa potensi yang belum tertangkap?
                  </h3>
                  <p className="text-[15px] lg:text-[16px] text-stone-400 leading-relaxed mb-8 max-w-xl">
                    Bandingkan potensi belanja komuter dengan transaksi yang
                    sudah tertangkap tenant di sekitar pintu stasiun.
                  </p>
                </div>

                <div className="space-y-6 pt-2">
                  {/* Two Simple Comparison Bars */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-baseline text-sm mb-1.5 font-label-sm">
                        <span className="text-stone-400 text-xs">
                          Potensi belanja
                        </span>
                        <span className="text-surface-bright font-medium text-sm font-mono">
                          Rp 4,2 jt
                        </span>
                      </div>
                      <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                        <div className="bg-surface-bright h-full rounded-full w-full" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-baseline text-sm mb-1.5 font-label-sm">
                        <span className="text-stone-400 text-xs">
                          Sudah tertangkap
                        </span>
                        <span className="text-stone-300 font-medium text-sm font-mono">
                          Rp 2,6 jt
                        </span>
                      </div>
                      <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                        <div className="bg-stone-500 h-full rounded-full w-[62%]" />
                      </div>
                    </div>
                  </div>

                  {/* Single Focal Metric */}
                  <div className="pt-2">
                    <div className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-accent-yellow tracking-tight leading-none mb-1 font-mono">
                      Rp 1,6 jt
                    </div>
                    <div className="text-sm text-surface-bright font-medium">
                      Spending gap
                    </div>
                    <div className="text-xs text-stone-400 mt-0.5">
                      38% potensi belum tertangkap
                    </div>
                  </div>

                  <div className="text-[11px] text-stone-500 font-mono pt-2">
                    Confidence · 86%
                  </div>
                </div>
              </div>

              {/* CARD 02: Category Opportunity */}
              <div className="flex flex-col justify-between">
                <div>
                  <span className="text-[11px] lg:text-[12px] uppercase tracking-[0.08em] text-accent-yellow font-semibold font-mono block mb-3">
                    02 / What should be here?
                  </span>
                  <h3 className="font-headline-md text-2xl sm:text-3xl lg:text-[34px] font-normal text-surface-bright leading-snug mb-3">
                    Apa yang masih kurang?
                  </h3>
                  <p className="text-[15px] lg:text-[16px] text-stone-400 leading-relaxed mb-8 max-w-xl">
                    Lihat kategori dengan demand tinggi tetapi supply yang masih
                    terbatas di sekitar stasiun.
                  </p>
                </div>

                <div className="space-y-6 pt-2">
                  {/* Editorial List: 4 clean rows */}
                  <div className="divide-y divide-white/10">
                    <div className="py-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-surface-bright">
                          F&amp;B
                        </div>
                        <div className="text-xs text-stone-500">
                          Supply tinggi
                        </div>
                      </div>
                      <div className="text-xs text-stone-400">Sudah padat</div>
                    </div>

                    <div className="py-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-surface-bright">
                          Convenience &amp; Personal Care
                        </div>
                        <div className="text-xs text-stone-500">
                          Supply rendah
                        </div>
                      </div>
                      <div className="text-xs font-semibold text-emerald-400">
                        Peluang tinggi
                      </div>
                    </div>

                    <div className="py-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-surface-bright">
                          Farmasi &amp; Kesehatan
                        </div>
                        <div className="text-xs text-stone-500">
                          Supply rendah
                        </div>
                      </div>
                      <div className="text-xs font-semibold text-emerald-400">
                        Peluang tinggi
                      </div>
                    </div>

                    <div className="py-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-surface-bright">
                          Jasa &amp; Ekspedisi
                        </div>
                        <div className="text-xs text-stone-500">
                          Supply sedang
                        </div>
                      </div>
                      <div className="text-xs text-stone-400">Netral</div>
                    </div>
                  </div>

                  {/* Bottom Takeaway */}
                  <div className="pt-2">
                    <div className="text-sm sm:text-base font-semibold text-surface-bright">
                      2 kategori masih memiliki ruang pertumbuhan.
                    </div>
                    <div className="text-[11px] text-stone-500 font-mono mt-1">
                      46 POI dianalisis dalam radius 400 m
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 2: 03 Rent vs Flow & 04 Activation Timing */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 pt-16 lg:pt-20">
              {/* CARD 03: Rent vs Flow */}
              <div className="flex flex-col justify-between">
                <div>
                  <span className="text-[11px] lg:text-[12px] uppercase tracking-[0.08em] text-accent-yellow font-semibold font-mono block mb-3">
                    03 / Is the space worth it?
                  </span>
                  <h3 className="font-headline-md text-2xl sm:text-3xl lg:text-[34px] font-normal text-surface-bright leading-snug mb-3">
                    Apakah sewanya sepadan dengan arus?
                  </h3>
                  <p className="text-[15px] lg:text-[16px] text-stone-400 leading-relaxed mb-8 max-w-xl">
                    Bandingkan harga sewa dengan kekuatan traffic untuk melihat
                    posisi relatif sebuah ruang komersial.
                  </p>
                </div>

                <div className="space-y-6 pt-2">
                  {/* Horizontal Spectrum */}
                  <div className="pt-3 pb-2">
                    <div className="flex justify-between text-[10px] uppercase font-mono tracking-wider text-stone-500 mb-2">
                      <span>Low Value</span>
                      <span>High Value</span>
                    </div>
                    <div className="relative w-full h-1 bg-white/15 rounded-full my-5">
                      {/* Position marker for Pintu Timur */}
                      <div className="absolute top-1/2 left-[72%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                        <span className="w-3 h-3 rounded-full bg-accent-yellow shadow-[0_0_10px_rgba(216,167,46,0.6)] ring-4 ring-surface-dark" />
                        <span className="text-xs font-medium text-surface-bright whitespace-nowrap mt-2">
                          Pintu Timur
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Two Large Metrics */}
                  <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/10">
                    <div>
                      <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-surface-bright font-mono">
                        Rp 1,8 jt
                      </div>
                      <div className="text-xs text-stone-400 mt-0.5">
                        /m²/bulan
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-surface-bright font-mono">
                        8.400
                      </div>
                      <div className="text-xs text-stone-400 mt-0.5">
                        komuter/hari
                      </div>
                    </div>
                  </div>

                  {/* Takeaway & Sub-label */}
                  <div className="pt-1">
                    <div className="text-sm sm:text-base font-semibold text-surface-bright">
                      Arus tinggi dengan harga sewa relatif kompetitif.
                    </div>
                    <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
                      Potentially attractive
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 04: Activation Timing */}
              <div className="flex flex-col justify-between">
                <div>
                  <span className="text-[11px] lg:text-[12px] uppercase tracking-[0.08em] text-accent-yellow font-semibold font-mono block mb-3">
                    04 / When should we activate?
                  </span>
                  <h3 className="font-headline-md text-2xl sm:text-3xl lg:text-[34px] font-normal text-surface-bright leading-snug mb-3">
                    Kapan waktu terbaik untuk aktivasi?
                  </h3>
                  <p className="text-[15px] lg:text-[16px] text-stone-400 leading-relaxed mb-8 max-w-xl">
                    Temukan slot waktu ketika arus tinggi tetapi kebutuhan
                    komersial belum sepenuhnya terlayani.
                  </p>
                </div>

                <div className="space-y-6 pt-2">
                  {/* Clean Timeline Bars */}
                  <div>
                    <div className="h-16 flex items-end gap-3 sm:gap-4 pb-2">
                      <div className="flex-1 flex flex-col items-center gap-1.5">
                        <div className="w-full bg-white/10 rounded-t h-4" />
                        <span className="text-[11px] font-mono text-stone-500">
                          06
                        </span>
                      </div>
                      <div className="flex-1 flex flex-col items-center gap-1.5">
                        <div className="w-full bg-white/15 rounded-t h-8" />
                        <span className="text-[11px] font-mono text-stone-500">
                          09
                        </span>
                      </div>
                      <div className="flex-1 flex flex-col items-center gap-1.5">
                        <div className="w-full bg-white/20 rounded-t h-10" />
                        <span className="text-[11px] font-mono text-stone-500">
                          12
                        </span>
                      </div>
                      <div className="flex-1 flex flex-col items-center gap-1.5">
                        <div className="w-full bg-white/15 rounded-t h-8" />
                        <span className="text-[11px] font-mono text-stone-500">
                          15
                        </span>
                      </div>
                      <div className="flex-1 flex flex-col items-center gap-1.5">
                        <div className="w-full bg-accent-yellow rounded-t h-16 shadow-[0_0_12px_rgba(216,167,46,0.4)]" />
                        <span className="text-[11px] font-mono text-accent-yellow font-semibold">
                          18
                        </span>
                      </div>
                      <div className="flex-1 flex flex-col items-center gap-1.5">
                        <div className="w-full bg-white/10 rounded-t h-6" />
                        <span className="text-[11px] font-mono text-stone-500">
                          21
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Peak Window Highlight & Recommended Use */}
                  <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/10">
                    <div>
                      <div className="text-xs text-stone-400 mb-1">
                        Peak window
                      </div>
                      <div className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-accent-yellow font-mono leading-tight">
                        17.00–19.00
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-stone-400 mb-1">
                        Recommended use
                      </div>
                      <div className="text-sm sm:text-base font-semibold text-surface-bright">
                        Pop-up Store
                      </div>
                      <div className="text-xs text-stone-300">
                        Grab &amp; Go
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-stone-500 font-mono pt-1">
                    Confidence · 82%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: EXPLORE THE PRODUCT (WebGIS UI Showcase with AI Copilot & Evidence Drawer) */}
        <section className="reveal w-full pt-24 pb-10 lg:pt-32 lg:pb-12 px-gutter-sm lg:px-gutter max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-12">
            <span className="font-label-sm uppercase tracking-widest text-text-muted font-semibold">
              The Product
            </span>
            <h2 className="font-headline-lg text-text-primary tracking-tight mt-2 font-normal">
              Dari peta ke keputusan.
            </h2>
            <p className="font-body-lg text-text-secondary leading-relaxed mt-2">
              Pilih stasiun, pintu, kategori, atau waktu. Isi Stasiun
              memperbarui insight spasial secara kontekstual berbasis data
              pergerakan aktual.
            </p>

            {/* Map Feature Tabs Strip */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-8 p-1.5 bg-surface-container-low rounded-full shadow-inner border border-border-subtle">
              {(
                [
                  ["spending-gap", "Spending Gap"],
                  ["missing-category", "Missing Category"],
                  ["pedestrian-flow", "Pedestrian Flow"],
                  ["rent-flow", "Rent–Flow Ratio"],
                  ["confidence", "Confidence Ledger"],
                ] as const
              ).map(([key, label]) => {
                const isActive = activeTab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleTabChange(key)}
                    className={`px-4 py-2 rounded-full font-label-md transition-all ${
                      isActive
                        ? "bg-surface-card text-text-primary shadow-xs font-semibold"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface-card/60"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Central High-Fidelity WebGIS Mockup */}
          <div className="relative w-full rounded-3xl bg-surface-card shadow-2xl p-4 sm:p-6 overflow-hidden border border-border-subtle">
            {/* Top GIS Window Bar */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-border-subtle">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-surface-container-highest"></span>
                  <span className="w-3 h-3 rounded-full bg-surface-container-highest"></span>
                  <span className="w-3 h-3 rounded-full bg-surface-container-highest"></span>
                </div>
                <div className="h-4 w-px bg-surface-container-highest mx-1"></div>
                <span className="font-label-sm text-xs font-semibold text-text-primary">
                  Isi Stasiun WebGIS Studio
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-container text-text-muted text-[11px] font-label-sm">
                  Active Session: Manggarai Core
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-label-sm text-text-muted hidden sm:inline">
                  Coordinate: 6.2099° S, 106.8497° E
                </span>
                <div className="flex items-center gap-1 bg-surface-container-low px-2.5 py-1 rounded-full text-xs font-label-sm text-text-primary border border-border-subtle">
                  <span className="w-2 h-2 rounded-full bg-accent-green"></span>
                  <span>Live Sync</span>
                </div>
              </div>
            </div>

            {/* 3-Pane WebGIS Architecture */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 relative min-h-[580px]">
              {/* PANE 1: Left Spatial Control */}
              <div className="lg:col-span-3 bg-surface-container-low/70 rounded-2xl p-4 flex flex-col justify-between border border-border-subtle">
                <div className="space-y-5">
                  {/* Station Selector */}
                  <div>
                    <label className="block font-label-sm text-[11px] uppercase tracking-wider text-text-muted mb-1.5 font-semibold">
                      Simpul Stasiun
                    </label>
                    <div className="flex items-center justify-between bg-surface-card px-3.5 py-2.5 rounded-xl shadow-xs text-xs font-label-md text-text-primary font-medium border border-border-subtle">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#BA1A1A]"></span>
                        <span>Stasiun Manggarai (MRI)</span>
                      </div>
                      <Icon
                        name="unfold_more"
                        className="text-[18px] text-text-secondary"
                      />
                    </div>
                  </div>

                  {/* Time Slot Filter */}
                  <div>
                    <label className="block font-label-sm text-[11px] uppercase tracking-wider text-text-muted mb-1.5 font-semibold">
                      Jendela Waktu
                    </label>
                    <div className="flex items-center justify-between bg-surface-card px-3.5 py-2.5 rounded-xl shadow-xs text-xs font-label-md text-text-primary font-medium border border-border-subtle">
                      <div className="flex items-center gap-2">
                        <Icon
                          name="schedule"
                          className="text-accent-yellow-dark text-[18px]"
                        />
                        <span>17:00 – 19:00 (Sore Puncak)</span>
                      </div>
                      <Icon
                        name="expand_more"
                        className="text-[18px] text-text-secondary"
                      />
                    </div>
                  </div>

                  {/* Catchment Isochrone Buffer */}
                  <div>
                    <label className="block font-label-sm text-[11px] uppercase tracking-wider text-text-muted mb-2 font-semibold">
                      Catchment Walking Buffer
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 bg-surface-container p-1 rounded-xl text-center font-label-sm text-xs">
                      {(["3", "5", "10"] as const).map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setActiveBuffer(mins)}
                          className={`py-1.5 rounded-lg transition-all ${
                            activeBuffer === mins
                              ? "bg-surface-card text-text-primary font-semibold shadow-xs"
                              : "text-text-secondary hover:text-text-primary"
                          }`}
                        >
                          {mins} min
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Spatial Layer Toggles */}
                  <div>
                    <label className="block font-label-sm text-[11px] uppercase tracking-wider text-text-muted mb-2 font-semibold">
                      Layer Spasial
                    </label>
                    <div className="space-y-2 text-xs font-label-md text-text-primary">
                      <label className="flex items-center justify-between p-2 rounded-lg bg-surface-card shadow-xs cursor-pointer border border-border-subtle/50">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-accent-yellow"></span>
                          <span>Spending Gap Heatmap</span>
                        </span>
                        <input
                          defaultChecked
                          className="accent-accent-yellow rounded"
                          type="checkbox"
                        />
                      </label>
                      <label className="flex items-center justify-between p-2 rounded-lg bg-surface-card shadow-xs cursor-pointer border border-border-subtle/50">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-accent-blue"></span>
                          <span>Pedestrian Flow Vectors</span>
                        </span>
                        <input
                          defaultChecked
                          className="accent-accent-blue rounded"
                          type="checkbox"
                        />
                      </label>
                      <label className="flex items-center justify-between p-2 rounded-lg bg-surface-card shadow-xs cursor-pointer border border-border-subtle/50">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-accent-green"></span>
                          <span>Tenant POI Audit</span>
                        </span>
                        <input
                          defaultChecked
                          className="accent-accent-green rounded"
                          type="checkbox"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-4 text-[11px] text-text-muted flex items-center gap-1.5 border-t border-border-subtle">
                  <Icon name="info" className="text-[14px]" />
                  <span>Radius cakupan: 350m dari peron</span>
                </div>
              </div>

              {/* PANE 2: Center Interactive WebGIS Vector Map Canvas */}
              <div className="lg:col-span-6 relative rounded-2xl bg-[#EBE7DC] overflow-hidden min-h-[420px] border border-border-subtle">
                <svg
                  className="absolute inset-0 w-full h-full"
                  fill="none"
                  viewBox="0 0 600 480"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <radialGradient
                      cx="370"
                      cy="210"
                      gradientUnits="userSpaceOnUse"
                      id="interactiveHeat"
                      r="140"
                    >
                      <stop
                        offset="0%"
                        stopColor="#D8A72E"
                        stopOpacity="0.45"
                      />
                      <stop
                        offset="50%"
                        stopColor="#D8A72E"
                        stopOpacity="0.18"
                      />
                      <stop offset="100%" stopColor="#D8A72E" stopOpacity="0" />
                    </radialGradient>

                    <linearGradient
                      id="headlightBeam"
                      x1="0%"
                      y1="50%"
                      x2="100%"
                      y2="50%"
                    >
                      <stop
                        offset="0%"
                        stopColor="#FFF9D2"
                        stopOpacity="0.85"
                      />
                      <stop offset="100%" stopColor="#D8A72E" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Map Canvas Background */}
                  <rect fill="#EAE6DB" height="100%" width="100%" />

                  {/* Isochrone Walking Buffers */}
                  <circle
                    cx="300"
                    cy="240"
                    fill="none"
                    opacity="0.35"
                    r="180"
                    stroke="#787770"
                    strokeDasharray="3 4"
                    strokeWidth="1"
                  />
                  <circle
                    cx="300"
                    cy="240"
                    fill="none"
                    opacity="0.55"
                    r="110"
                    stroke="#787770"
                    strokeDasharray="3 4"
                    strokeWidth="1"
                  />

                  {/* Spending Gap Heatmap */}
                  <path
                    d="M 230 160 C 330 140, 420 180, 440 250 C 460 320, 360 350, 270 330 C 190 310, 180 220, 230 160 Z"
                    fill="url(#interactiveHeat)"
                  />

                  {/* North-South Red Transit Line */}
                  <path
                    d="M 300 480 L 300 0"
                    opacity="0.8"
                    stroke="#BA1A1A"
                    strokeDasharray="8 3"
                    strokeWidth="4"
                  />

                  {/* East-West Blue Transit Mainline */}
                  <path
                    d="M 0 320 C 180 290, 300 240, 600 170"
                    opacity="0.85"
                    stroke="#4B7FF7"
                    strokeWidth="3.5"
                  />

                  {/* Station Hub Building with Station Logo */}
                  <rect
                    fill="#171714"
                    fillOpacity="0.88"
                    height="96"
                    rx="16"
                    width="96"
                    x="252"
                    y="192"
                  />
                  <rect
                    fill="#F8F7F3"
                    height="76"
                    rx="11"
                    width="76"
                    x="262"
                    y="202"
                  />
                  {/* Station Emblem */}
                  <g transform="translate(283, 223)">
                    <rect
                      x="0"
                      y="0"
                      width="34"
                      height="34"
                      rx="8"
                      fill="#171714"
                    />
                    {/* Train / Station mark */}
                    <rect
                      x="7"
                      y="6"
                      width="20"
                      height="17"
                      rx="3.5"
                      fill="none"
                      stroke="#FAF9F5"
                      strokeWidth="1.6"
                    />
                    <line
                      x1="7"
                      y1="13"
                      x2="27"
                      y2="13"
                      stroke="#D8A72E"
                      strokeWidth="1.5"
                    />
                    <circle cx="11.5" cy="18" r="1.6" fill="#D8A72E" />
                    <circle cx="22.5" cy="18" r="1.6" fill="#D8A72E" />
                    <line
                      x1="10"
                      y1="23"
                      x2="7"
                      y2="27"
                      stroke="#FAF9F5"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <line
                      x1="24"
                      y1="23"
                      x2="27"
                      y2="27"
                      stroke="#FAF9F5"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </g>

                  {/* Passenger Flow Vectors: Base track */}
                  <path
                    d="M 340 240 C 380 240, 410 220, 450 210"
                    stroke="#D8A72E"
                    strokeLinecap="round"
                    strokeWidth="3"
                  />
                  <path
                    d="M 260 250 C 210 260, 170 290, 120 310"
                    stroke="#4B7FF7"
                    strokeLinecap="round"
                    strokeWidth="2.5"
                  />

                  {/* Animated Commuter Dispersal Dashes */}
                  <path
                    className="anim-flow-dashes"
                    d="M 340 240 C 380 240, 410 220, 450 210"
                    stroke="#FAF9F5"
                    strokeDasharray="6 6"
                    strokeLinecap="round"
                    strokeWidth="2"
                  />
                  <path
                    className="anim-flow-dashes"
                    d="M 260 250 C 210 260, 170 290, 120 310"
                    stroke="#FAF9F5"
                    strokeDasharray="6 6"
                    strokeLinecap="round"
                    strokeWidth="2"
                  />

                  {/* Pin Pintu Timur (Active Node) */}
                  <g className="cursor-pointer">
                    <circle cx="450" cy="210" fill="#D8A72E" r="16" />
                    <circle cx="450" cy="210" fill="#FFFFFF" r="7" />
                    <rect
                      fill="#171714"
                      height="28"
                      rx="6"
                      width="80"
                      x="410"
                      y="155"
                    />
                    <text
                      fill="#FAF9F5"
                      fontFamily="Inter, sans-serif"
                      fontSize="11"
                      fontWeight="600"
                      textAnchor="middle"
                      x="450"
                      y="173"
                    >
                      Pintu Timur
                    </text>
                    <polygon fill="#171714" points="445,183 455,183 450,188" />
                  </g>

                  {/* Pin Pintu Barat */}
                  <g>
                    <circle cx="150" cy="300" fill="#171714" r="10" />
                    <circle cx="150" cy="300" fill="#FAF9F5" r="5" />
                    <text
                      fill="#686860"
                      fontFamily="Inter, sans-serif"
                      fontSize="10"
                      fontWeight="500"
                      textAnchor="middle"
                      x="150"
                      y="325"
                    >
                      Pintu Barat
                    </text>
                  </g>

                  {/* ==========================================================
                      ANIMATED COMMUTER TRAIN (Auto-Replay Infinite)
                      ========================================================== */}
                  <g className="anim-train-transit">
                    {/* Headlight Cone */}
                    <polygon
                      fill="url(#headlightBeam)"
                      opacity="0.45"
                      points="28,0 85,-14 85,14"
                    />
                    {/* Shadow */}
                    <rect
                      fill="#000000"
                      height="16"
                      opacity="0.25"
                      rx="6"
                      width="58"
                      x="-30"
                      y="1"
                    />
                    {/* Carriage Body */}
                    <rect
                      fill="#171714"
                      height="15"
                      rx="5"
                      stroke="#D8A72E"
                      strokeWidth="1.4"
                      width="56"
                      x="-28"
                      y="-7.5"
                    />
                    {/* Blue line livery */}
                    <rect
                      fill="#4B7FF7"
                      height="3.5"
                      width="56"
                      x="-28"
                      y="-1"
                    />
                    {/* Headlight bulb */}
                    <circle cx="26" cy="0" fill="#FFF9D2" r="2.5" />
                    {/* Windows */}
                    <rect
                      fill="#FAF9F5"
                      height="4"
                      rx="1"
                      width="9"
                      x="-22"
                      y="-5.5"
                    />
                    <rect
                      fill="#FAF9F5"
                      height="4"
                      rx="1"
                      width="9"
                      x="-9"
                      y="-5.5"
                    />
                    <rect
                      fill="#FAF9F5"
                      height="4"
                      rx="1"
                      width="9"
                      x="4"
                      y="-5.5"
                    />
                    <rect
                      fill="#FAF9F5"
                      height="4"
                      rx="1"
                      width="6"
                      x="17"
                      y="-5.5"
                    />
                  </g>

                  {/* ==========================================================
                      POTENSI TEMPAT MAKAN / F&B SPOTS (Auto-Replay Infinite)
                      Muncul saat kereta transit dan penumpang turun
                      ========================================================== */}

                  {/* SPOT 1: Kopi & Roti (Pintu Timur Concourse) */}
                  <g className="anim-food-spot-1 cursor-pointer">
                    <circle
                      cx="420"
                      cy="150"
                      fill="#D8A72E"
                      r="13"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                    <text
                      fontFamily="Inter, sans-serif"
                      fontSize="11"
                      textAnchor="middle"
                      x="420"
                      y="154"
                    >
                      ☕
                    </text>
                    {/* Badge Card */}
                    <g transform="translate(350, 85)">
                      <rect
                        fill="#171714"
                        fillOpacity="0.94"
                        height="40"
                        rx="7"
                        stroke="#D8A72E"
                        strokeWidth="1.2"
                        width="142"
                      />
                      <text
                        fill="#FAF9F5"
                        fontFamily="Inter, sans-serif"
                        fontSize="9.5"
                        fontWeight="600"
                        x="10"
                        y="16"
                      >
                        Spot F&amp;B: Kopi &amp; Roti
                      </text>
                      <text
                        fill="#D8A72E"
                        fontFamily="Inter, sans-serif"
                        fontSize="8.5"
                        fontWeight="500"
                        x="10"
                        y="30"
                      >
                        Peluang: Rp 1,4 jt / window
                      </text>
                      <polygon fill="#171714" points="70,40 66,45 74,45" />
                    </g>
                  </g>

                  {/* SPOT 2: Makanan Siap Saji / Quick Meal (Plaza Timur) */}
                  <g className="anim-food-spot-2 cursor-pointer">
                    <circle
                      cx="485"
                      cy="285"
                      fill="#6E9F7B"
                      r="13"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                    <text
                      fontFamily="Inter, sans-serif"
                      fontSize="11"
                      textAnchor="middle"
                      x="485"
                      y="289"
                    >
                      🍜
                    </text>
                    {/* Badge Card */}
                    <g transform="translate(415, 310)">
                      <polygon fill="#171714" points="70,0 66,-5 74,-5" />
                      <rect
                        fill="#171714"
                        fillOpacity="0.94"
                        height="40"
                        rx="7"
                        stroke="#6E9F7B"
                        strokeWidth="1.2"
                        width="142"
                      />
                      <text
                        fill="#FAF9F5"
                        fontFamily="Inter, sans-serif"
                        fontSize="9.5"
                        fontWeight="600"
                        x="10"
                        y="16"
                      >
                        Spot F&amp;B: Rice Bowl / Mie
                      </text>
                      <text
                        fill="#6E9F7B"
                        fontFamily="Inter, sans-serif"
                        fontSize="8.5"
                        fontWeight="500"
                        x="10"
                        y="30"
                      >
                        Defisit Tenan · Dwell 14m
                      </text>
                    </g>
                  </g>

                  {/* SPOT 3: Kios Minuman & Snack (Pintu Barat) */}
                  <g className="anim-food-spot-3 cursor-pointer">
                    <circle
                      cx="165"
                      cy="235"
                      fill="#4B7FF7"
                      r="13"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                    <text
                      fontFamily="Inter, sans-serif"
                      fontSize="11"
                      textAnchor="middle"
                      x="165"
                      y="239"
                    >
                      🧋
                    </text>
                    {/* Badge Card */}
                    <g transform="translate(90, 165)">
                      <rect
                        fill="#171714"
                        fillOpacity="0.94"
                        height="40"
                        rx="7"
                        stroke="#4B7FF7"
                        strokeWidth="1.2"
                        width="142"
                      />
                      <text
                        fill="#FAF9F5"
                        fontFamily="Inter, sans-serif"
                        fontSize="9.5"
                        fontWeight="600"
                        x="10"
                        y="16"
                      >
                        Spot F&amp;B: Minuman Cepat
                      </text>
                      <text
                        fill="#86B7D7"
                        fontFamily="Inter, sans-serif"
                        fontSize="8.5"
                        fontWeight="500"
                        x="10"
                        y="30"
                      >
                        Arus Transfer 4.200 org/hari
                      </text>
                      <polygon fill="#171714" points="75,40 71,45 79,45" />
                    </g>
                  </g>

                  {/* SPOT 4: Kios Sarapan Komuter (North Walkway) */}
                  <g className="anim-food-spot-4 cursor-pointer">
                    <circle
                      cx="230"
                      cy="130"
                      fill="#D49A59"
                      r="13"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                    <text
                      fontFamily="Inter, sans-serif"
                      fontSize="11"
                      textAnchor="middle"
                      x="230"
                      y="134"
                    >
                      🥪
                    </text>
                    {/* Badge Card */}
                    <g transform="translate(130, 75)">
                      <rect
                        fill="#171714"
                        fillOpacity="0.94"
                        height="40"
                        rx="7"
                        stroke="#D49A59"
                        strokeWidth="1.2"
                        width="142"
                      />
                      <text
                        fill="#FAF9F5"
                        fontFamily="Inter, sans-serif"
                        fontSize="9.5"
                        fontWeight="600"
                        x="10"
                        y="16"
                      >
                        Spot F&amp;B: Sarapan Cepat
                      </text>
                      <text
                        fill="#D49A59"
                        fontFamily="Inter, sans-serif"
                        fontSize="8.5"
                        fontWeight="500"
                        x="10"
                        y="30"
                      >
                        Jam Puncak: 06:30–09:00
                      </text>
                      <polygon fill="#171714" points="100,40 96,45 104,45" />
                    </g>
                  </g>
                </svg>

                {/* Status bar / Map Legend */}
                <div className="absolute bottom-4 left-4 flex items-center pointer-events-none">
                  <div className="bg-surface-card/95 backdrop-blur-md px-3.5 py-2 rounded-full shadow-md flex items-center gap-3 text-[11px] font-label-sm border border-border-subtle pointer-events-auto">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-accent-blue animate-pulse"></span>{" "}
                      Arus Kereta
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-accent-yellow"></span>{" "}
                      Titik F&amp;B Potensial
                    </span>
                  </div>
                </div>
              </div>

              {/* PANE 3: Right Analytical Node Ledger */}
              <div className="lg:col-span-3 bg-surface-container-low/70 rounded-2xl p-4 flex flex-col justify-between border border-border-subtle">
                <div className="space-y-4">
                  <div className="border-b border-border-subtle pb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase tracking-widest font-label-sm text-text-muted font-semibold">
                        Selected Node
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-accent-green/20 text-[#1f4e2c] font-label-sm text-[10px] font-bold">
                        Confidence 86%
                      </span>
                    </div>
                    <h4 className="font-headline-sm font-medium text-text-primary">
                      Manggarai · Pintu Timur
                    </h4>
                    <p className="font-body-sm text-xs text-text-secondary mt-0.5">
                      Koridor integrasi antar moda &amp; drop-off ojek online
                    </p>
                  </div>

                  <div className="bg-surface-card rounded-xl p-3.5 shadow-xs space-y-2 border border-border-subtle">
                    <div className="text-[11px] font-label-sm text-text-muted font-medium">
                      Spending Gap Terestimasi
                    </div>
                    <div className="font-stat-numeric text-2xl text-text-primary">
                      Rp 2.200.000
                    </div>
                    <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-accent-yellow h-full rounded-full"
                        style={{ width: "65%" }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] font-label-sm text-text-muted pt-0.5">
                      <span>Potensi: Rp 3,4 jt</span>
                      <span>Terserap: Rp 1,2 jt</span>
                    </div>
                  </div>

                  <div className="bg-surface-card rounded-xl p-3.5 shadow-xs space-y-1.5 border border-border-subtle">
                    <div className="text-[11px] font-label-sm text-text-muted font-medium">
                      Rekomendasi Utama Tenan
                    </div>
                    <div className="font-label-md text-sm font-semibold text-text-primary">
                      Convenience Retail &amp; Quick Meal
                    </div>
                    <p className="font-body-sm text-[11px] text-text-secondary leading-snug">
                      Defisit penyedia barang harian dalam radius 3 menit jalan
                      kaki. Komuter butuh transaksi &lt;90 detik.
                    </p>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => setEvidenceOpen((v) => !v)}
                    className="w-full py-2.5 px-3 rounded-xl bg-surface-dark text-surface-bright font-label-sm text-xs font-semibold flex items-center justify-center gap-2 shadow-xs hover:bg-surface-dark/90 transition-all"
                    id="evidence-drawer-toggle"
                  >
                    <Icon
                      name="verified"
                      className="text-[16px] text-accent-yellow"
                    />
                    <span>
                      {evidenceOpen
                        ? "Tutup Data Evidence & Audit"
                        : "Buka Data Evidence & Audit"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Evidence & Transparency Drawer */}
            {evidenceOpen && (
              <div
                className="mt-4 bg-surface-card rounded-2xl p-5 shadow-lg border border-border-subtle animate-in fade-in duration-200"
                id="evidence-drawer"
              >
                <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <Icon
                      name="fact_check"
                      className="text-accent-green text-[20px]"
                    />
                    <h5 className="font-label-md text-sm font-semibold text-text-primary">
                      Why this number? (Evidence &amp; Traceability)
                    </h5>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEvidenceOpen(false)}
                    className="text-text-muted hover:text-text-primary p-1 rounded-md"
                    id="evidence-drawer-close"
                  >
                    <Icon name="close" className="text-[20px]" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                  <div className="bg-surface-container-low p-3.5 rounded-xl border border-border-subtle">
                    <div className="text-[11px] font-label-sm text-text-muted uppercase font-semibold">
                      Pedestrian Observations
                    </div>
                    <div className="font-stat-numeric text-xl text-text-primary mt-1">
                      124 Titik Sensor
                    </div>
                    <p className="font-body-sm text-[11px] text-text-secondary mt-1">
                      Sampel flow dari gate keluar &amp; jembatan layang
                      transfer.
                    </p>
                  </div>
                  <div className="bg-surface-container-low p-3.5 rounded-xl border border-border-subtle">
                    <div className="text-[11px] font-label-sm text-text-muted uppercase font-semibold">
                      Transaction Samples
                    </div>
                    <div className="font-stat-numeric text-xl text-text-primary mt-1">
                      18 Tenan Terverifikasi
                    </div>
                    <p className="font-body-sm text-[11px] text-text-secondary mt-1">
                      Basket size rata-rata dihitung dari data struk &amp;
                      survei wawancara.
                    </p>
                  </div>
                  <div className="bg-surface-container-low p-3.5 rounded-xl border border-border-subtle">
                    <div className="text-[11px] font-label-sm text-text-muted uppercase font-semibold">
                      Spatial Catchment
                    </div>
                    <div className="font-stat-numeric text-xl text-accent-green mt-1">
                      86% High Confidence
                    </div>
                    <p className="font-body-sm text-[11px] text-text-secondary mt-1">
                      Estimasi divalidasi silang dengan data isochrone berjalan
                      kaki 5 menit.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="text-center mt-6">
            <p className="font-headline-md font-serif italic text-text-secondary">
              “Jangan hanya percaya angkanya. Lihat dari mana angka itu
              berasal.”
            </p>
          </div>
        </section>

        {/* SECTION 5: TARGET AUDIENCE & SCIENTIFIC RIGOR & FINAL CTA */}
        <section className="reveal w-full pt-6 pb-20 lg:pt-8 lg:pb-28 px-gutter-sm lg:px-gutter max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="font-label-sm uppercase tracking-widest text-text-muted font-semibold">
              Target Audience
            </span>
            <h2 className="font-headline-lg text-text-primary tracking-tight mt-2 font-normal">
              Satu produk. Dua perspektif.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
            {/* Audience 1: Transit Operator */}
            <div className="bg-surface-card rounded-3xl p-8 shadow-md border border-border-subtle flex flex-col justify-between hover:shadow-lg transition-shadow">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center mb-6">
                  <Icon
                    name="train"
                    className="text-text-primary text-[26px]"
                  />
                </div>
                <div className="font-label-sm text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                  Untuk Operator Transportasi
                </div>
                <h3 className="font-headline-md font-serif text-text-primary mb-4">
                  Ubah ruang stasiun menjadi keputusan komersial berbasis bukti.
                </h3>
                <p className="font-body-md text-text-secondary leading-relaxed mb-6">
                  Tingkatkan pendapatan non-farebox tanpa merusak alur
                  penumpang. Tentukan tenant mix yang tepat pada setiap pintu,
                  tata tarif sewa berbasis traffic nyata, dan alokasikan zona
                  pop-up temporer.
                </p>
                <ul className="space-y-2.5 font-label-md text-xs text-text-primary">
                  <li className="flex items-center gap-2.5">
                    <Icon
                      name="check_circle"
                      className="text-accent-green text-[18px]"
                    />
                    <span>Tenant mix balancing berbasis data undersupply</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Icon
                      name="check_circle"
                      className="text-accent-green text-[18px]"
                    />
                    <span>
                      Valuasi harga sewa per meter persegi yang objektif
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Icon
                      name="check_circle"
                      className="text-accent-green text-[18px]"
                    />
                    <span>
                      Identifikasi titik aktivasi event dan kios musiman
                    </span>
                  </li>
                </ul>
              </div>
              <div className="mt-8 pt-4 border-t border-border-subtle/50">
                <span className="font-label-sm text-xs text-text-muted">
                  Membantu: PT KAI, KCI, MRTJ, LRT &amp; Pengelola TOD
                </span>
              </div>
            </div>

            {/* Audience 2: Retailer & Business Brands */}
            <div className="bg-surface-card rounded-3xl p-8 shadow-md border border-border-subtle flex flex-col justify-between hover:shadow-lg transition-shadow">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center mb-6">
                  <Icon
                    name="store"
                    className="text-text-primary text-[26px]"
                  />
                </div>
                <div className="font-label-sm text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                  Untuk Pelaku Usaha &amp; Brand
                </div>
                <h3 className="font-headline-md font-serif text-text-primary mb-4">
                  Lihat konteks nyata sebelum menandatangani kontrak sewa.
                </h3>
                <p className="font-body-md text-text-secondary leading-relaxed mb-6">
                  Hindari memilih lokasi hanya karena melihat stasiun ramai.
                  Validasi apakah komuter yang lewat memiliki dwell time yang
                  cukup, apakah kategori produk Anda relevan, dan apakah sewa
                  masuk akal.
                </p>
                <ul className="space-y-2.5 font-label-md text-xs text-text-primary">
                  <li className="flex items-center gap-2.5">
                    <Icon
                      name="check_circle"
                      className="text-accent-green text-[18px]"
                    />
                    <span>
                      Estimasi realistis potensi belanja per gate stasiun
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Icon
                      name="check_circle"
                      className="text-accent-green text-[18px]"
                    />
                    <span>
                      Pencegahan kanibalisasi outlet sejenis di radius dekat
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Icon
                      name="check_circle"
                      className="text-accent-green text-[18px]"
                    />
                    <span>
                      Optimasi jam operasional berdasarkan jam puncak transit
                    </span>
                  </li>
                </ul>
              </div>
              <div className="mt-8 pt-4 border-t border-border-subtle/50">
                <span className="font-label-sm text-xs text-text-muted">
                  Membantu: Waralaba F&amp;B, Retail Chains, Farmasi &amp; UMKM
                </span>
              </div>
            </div>
          </div>

          {/* Final Deep Dark CTA Card */}
          <div className="relative w-full rounded-3xl bg-surface-dark text-surface-bright overflow-hidden p-8 sm:p-14 lg:p-20 shadow-2xl border border-white/10">
            <div className="relative z-10 max-w-3xl flex flex-col items-start gap-6">
              <span className="text-[11px] lg:text-[12px] uppercase tracking-[0.08em] text-accent-yellow font-semibold font-mono">
                WebGIS Transit Intelligence
              </span>

              <h2 className="font-headline-lg text-3xl sm:text-4xl lg:text-[44px] leading-[1.15] text-surface-bright tracking-tight font-normal">
                Kota sudah bergerak. Sekarang lihat nilai yang bergerak
                bersamanya.
              </h2>

              <p className="text-[15px] sm:text-[16px] text-stone-400 leading-relaxed max-w-2xl font-normal">
                Eksplorasi potensi ekonomi Manggarai dan Sudirman melalui
                spatial intelligence berbasis pergerakan komuter riil, aktivitas
                kawasan, dan evidence yang dapat ditelusuri secara transparan.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-4 w-full sm:w-auto">
                <Link
                  href="/peta"
                  className="b bp inline-flex items-center justify-center gap-2.5 px-8 py-4 font-label-lg font-semibold shadow-lg hover:brightness-105 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 rounded-xl"
                  style={{ color: "#171714", background: "var(--brand)" }}
                >
                  <span className="w-2 h-2 rounded-full bg-surface-dark"></span>
                  <span>Buka Peta Interaktif</span>
                  <Icon name="arrow_forward" className="text-[18px]" />
                </Link>

                <Link
                  href="/insight"
                  className="b bs inline-flex items-center gap-2 px-6 py-4 transition-colors font-label-md rounded-xl"
                  style={{
                    color: "#FAF9F5",
                    borderColor: "rgba(255,255,255,0.15)",
                    background: "rgba(255,255,255,0.04)",
                  }}
                >
                  <span>Explore Manggarai &amp; Sudirman</span>
                  <Icon name="arrow_forward" className="text-[16px]" />
                </Link>
              </div>

              <div className="pt-6 text-stone-500 font-mono text-xs flex flex-wrap items-center gap-3">
                <span>
                  Tersedia untuk evaluasi perencana transportasi &amp;
                  pengembang
                </span>
                <span>•</span>
                <span>MAPID WebGIS 2026</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full bg-[#F4F2EB] py-16 lg:py-20 border-t border-stone-200/80">
        <div className="max-w-7xl mx-auto px-gutter-sm lg:px-gutter">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16 pb-12 border-b border-stone-200/80">
            {/* Column 1: Brand */}
            <div className="md:col-span-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#171714] flex items-center justify-center shadow-xs">
                  <div className="w-3.5 h-3.5 rounded border border-accent-yellow flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-yellow"></div>
                  </div>
                </div>
                <span className="font-headline-sm text-lg font-semibold text-[#171714] tracking-tight">
                  Isi Stasiun
                </span>
              </div>
              <p className="font-serif italic text-base lg:text-lg text-stone-800 max-w-md leading-snug">
                Melihat nilai ekonomi di balik pergerakan kota.
              </p>
              <p className="text-xs sm:text-sm text-stone-600 max-w-md leading-relaxed">
                Platform inteligensi spasial berbasis web untuk memetakan
                potensi komersial, keterjangkauan isochrone transit, dan
                optimalisasi ruang niaga stasiun perkeretaapian perkotaan.
              </p>
            </div>

            {/* Column 2: Navigasi Spasial */}
            <div className="md:col-span-3 flex flex-col gap-2">
              <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-stone-500 font-semibold mb-2 block">
                Navigasi Spasial
              </span>
              <div className="flex flex-col space-y-1 text-sm font-normal">
                <Link
                  href="/"
                  className="hover:text-[#171714] hover:translate-x-0.5 transition-all py-1 inline-block"
                  style={{ color: "#57564F" }}
                >
                  Beranda
                </Link>
                <Link
                  href="/peta"
                  className="hover:text-[#171714] hover:translate-x-0.5 transition-all py-1 inline-block"
                  style={{ color: "#57564F" }}
                >
                  Peta Spasial Transit
                </Link>
                <Link
                  href="/insight"
                  className="hover:text-[#171714] hover:translate-x-0.5 transition-all py-1 inline-block"
                  style={{ color: "#57564F" }}
                >
                  Katalog Insight Mobilitas
                </Link>
                <Link
                  href="/rekomendasi"
                  className="hover:text-[#171714] hover:translate-x-0.5 transition-all py-1 inline-block"
                  style={{ color: "#57564F" }}
                >
                  Matriks Rekomendasi Tenan
                </Link>
                <Link
                  href="/metodologi"
                  className="hover:text-[#171714] hover:translate-x-0.5 transition-all py-1 inline-block"
                  style={{ color: "#57564F" }}
                >
                  Metodologi &amp; Sumber Data
                </Link>
              </div>
            </div>

            {/* Column 3: Kompetisi & Kolaborasi */}
            <div className="md:col-span-3 flex flex-col gap-3">
              <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-stone-500 font-semibold mb-2 block">
                Kompetisi &amp; Kolaborasi
              </span>
              <p className="text-sm text-stone-700 font-medium leading-normal">
                Built for MAPID WebGIS Competition 2026
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-800 text-xs font-mono font-medium border border-emerald-500/20 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Transit Analytics Track</span>
              </div>
            </div>
          </div>

          {/* Sub-footer */}
          <div className="pt-8">
            <p className="text-xs text-stone-500 font-normal">
              © 2026 Isi Stasiun. All rights reserved. Data spasial dan estimasi
              pergerakan penumpang dikembangkan untuk studi kelayakan komersial.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
