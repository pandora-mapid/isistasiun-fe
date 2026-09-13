import type { ReactNode } from "react";

/** Judul section dengan ukuran dan famili yang sama di seluruh sistem paper. */
export function Judul({ children }: { children: ReactNode }) {
  return (
    <h2
      style={{
        font: "800 var(--t-h2)/1.06 var(--font-serif), Newsreader, Georgia, serif",
        letterSpacing: "-0.02em",
        margin: 0,
      }}
    >
      {children}
    </h2>
  );
}
