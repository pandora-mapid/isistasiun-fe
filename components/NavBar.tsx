import Link from "next/link";
import type { ReactNode } from "react";

export type NavKey =
  | "beranda"
  | "peta"
  | "insight"
  | "metodologi"
  | "rekomendasi";

const NAV_ITEMS: { key: NavKey; href: string; label: string }[] = [
  { key: "beranda", href: "/", label: "Beranda" },
  { key: "peta", href: "/peta", label: "Peta" },
  { key: "insight", href: "/insight", label: "Insight" },
  { key: "metodologi", href: "/metodologi", label: "Metodologi" },
  { key: "rekomendasi", href: "/rekomendasi", label: "Rekomendasi" },
];

/** Border-bottom nav row used on the content pages (Beranda, Insight,
 * Metodologi, Rekomendasi). `cta` is the page-specific action button. */
export function NavBar({ active, cta }: { active: NavKey; cta: ReactNode }) {
  return (
    <div
      className="row"
      style={{
        gap: 22,
        padding: "20px 28px",
        borderBottom: "1px solid rgba(15,23,42,.1)",
      }}
    >
      <div className="row" style={{ gap: 10, marginRight: 8 }}>
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: 12,
            background: "#1D4ED8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            font: "800 11px/1 var(--font-inter)",
            color: "#fff",
          }}
        >
          IS
        </span>
        <span
          style={{
            font: "800 16px/1 var(--font-inter)",
            letterSpacing: "-.01em",
          }}
        >
          Isi Stasiun
        </span>
      </div>
      <div className="row" style={{ gap: 4, marginRight: "auto" }}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === active;
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className="pill"
              style={{
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                background: isActive ? "rgba(29,78,216,.1)" : "transparent",
                color: isActive ? "#1D4ED8" : "#475569",
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      {cta}
    </div>
  );
}

/** Floating glass-pill nav overlaying the map on the Peta screen. */
export function FloatingNavBar({
  active,
  onCompare,
  onBriefPdf,
}: {
  active: NavKey;
  onCompare?: () => void;
  onBriefPdf?: () => void;
}) {
  return (
    <div
      className="glass pill"
      style={{
        position: "absolute",
        left: 24,
        right: 24,
        top: 24,
        height: 60,
        display: "flex",
        alignItems: "center",
        gap: 22,
        padding: "0 12px 0 24px",
        zIndex: 20,
      }}
    >
      <div
        style={{
          alignSelf: "stretch",
          display: "flex",
          alignItems: "center",
          marginRight: 8,
        }}
      >
        <span
          style={{
            font: "600 17px/1 var(--font-inter)",
            letterSpacing: "-.01em",
          }}
        >
          Isi Stasiun
        </span>
      </div>
      <div
        style={{
          display: "flex",
          gap: 26,
          marginRight: "auto",
          alignSelf: "stretch",
        }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === active;
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "#1D4ED8" : "#475569",
                borderBottom: isActive
                  ? "2px solid #1D4ED8"
                  : "2px solid transparent",
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      <span
        className="mono pill"
        style={{
          padding: "6px 12px",
          background: "#F1F5F9",
          fontSize: 11,
          color: "#64748B",
        }}
      >
        survei 12–19 Agu · v0.3
      </span>
      <button className="b bs" onClick={onCompare}>
        Bandingkan
      </button>
      <button className="b bp" onClick={onBriefPdf}>
        Brief PDF
      </button>
    </div>
  );
}
