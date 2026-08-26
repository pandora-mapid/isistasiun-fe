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

/** Brand mark ("IS" square + wordmark) — shared by both nav variants so the
 * two look identical wherever the nav appears. */
function Brand() {
  return (
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
  );
}

/** The 5 route pills with the active/inactive treatment — shared by both nav
 * variants so the active state looks identical wherever the nav appears. */
function NavLinks({ active }: { active: NavKey }) {
  return (
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
  );
}

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
      <Brand />
      <NavLinks active={active} />
      {cta}
    </div>
  );
}
