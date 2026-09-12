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

/**
 * Brand mark ("IS" square + wordmark) — shared by both nav variants so the
 * two look identical wherever the nav appears.
 *
 * Colours come from `--nav-*` custom properties whose defaults, set in
 * `globals.css`, are the exact literals this file used to hardcode — so every
 * screen that hasn't been restyled renders pixel-identically. A screen that
 * *has* been restyled (Beranda, Insight, Metodologi, Rekomendasi — every
 * `.paper-canvas` screen) overrides those variables inside its own scope. That
 * is deliberately not a second `NavBar`: one nav, one set of markup, repainted
 * by whatever page it lands on.
 */
function Brand() {
  return (
    <div className="row" style={{ gap: 10, marginRight: 8 }}>
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: "var(--nav-brand-radius, 12px)",
          background: "var(--nav-brand-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          font: "800 11px/1 var(--font-inter)",
          color: "var(--nav-brand-fg)",
        }}
      >
        IS
      </span>
      <span
        style={{
          font: "800 16px/1 var(--font-inter)",
          letterSpacing: "-.01em",
          color: "var(--nav-wordmark)",
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
            className="pill nav-link"
            style={{
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              background: isActive ? "var(--nav-active-bg)" : undefined,
              color: isActive ? "var(--nav-active-fg)" : undefined,
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
 * Metodologi, Rekomendasi). `cta` is the page-specific action button.
 *
 * Shape (radius/margin/background/shadow/border-width) travels through the
 * same `--nav-*` custom-property seam as the colours above, with defaults
 * that reproduce today's plain border-bottom row exactly — so a screen that
 * hasn't opted in (Peta) stays pixel-identical. The `.paper-canvas` scope
 * (Beranda, Insight, Metodologi, Rekomendasi) overrides them, turning this same
 * markup into a floating pill bar without a second NavBar existing anywhere. */
export function NavBar({ active, cta }: { active: NavKey; cta: ReactNode }) {
  return (
    <div
      className="row"
      style={{
        gap: 22,
        padding: "20px 28px",
        margin: "var(--nav-margin, 0)",
        background: "var(--nav-bg, transparent)",
        borderRadius: "var(--nav-radius, 0)",
        borderBottom: "var(--nav-border-w, 1px) solid var(--nav-border)",
        boxShadow: "var(--nav-shadow, none)",
      }}
    >
      <Brand />
      <NavLinks active={active} />
      {cta}
    </div>
  );
}
