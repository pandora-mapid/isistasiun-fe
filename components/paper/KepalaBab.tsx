import type { CSSProperties, ReactNode } from "react";

import { KickerBernomor } from "./KickerBernomor";
import { Judul } from "./Judul";

/**
 * Kepala bab — kicker bernomor + judul + garis-rambut.
 *
 * Nomor bab hidup di `KickerBernomor` (angka di LUAR pil kicker, fontnya
 * diperbesar sendiri). `KepalaBab` tinggal menyusun kicker → judul → garis-
 * rambut. Dipakai full-width ATAU sebagai satu kolom grid yang berselang-
 * seling kiri/kanan. Garis-rambut ikut lebar wadahnya — di kolom sempit itu
 * disengaja (gaya Klim).
 *
 * `align="right"` merata-kanankan kicker + judul; garis-rambut tetap selebar
 * wadah. `halfRule` memotong garis-rambut jadi setengah kiri saja — dihitung
 * untuk grid `1fr 1fr` yang gap-nya `--s5`. Kalau grid pemakainya beda gap,
 * oper `gap`; kalau butuh lebar lain sama sekali, oper `ruleWidth` langsung.
 */
export function KepalaBab({
  n,
  kicker,
  judul,
  align = "left",
  halfRule = false,
  gap = "var(--s5)",
  ruleWidth,
}: {
  n: number;
  kicker: string;
  judul: ReactNode;
  align?: "left" | "right";
  halfRule?: boolean;
  /** Gap grid pemakai — dipakai menghitung endpoint `halfRule`. Default `--s5`. */
  gap?: string;
  /** Lebar garis-rambut eksplisit; menang atas `halfRule`. */
  ruleWidth?: string;
}) {
  const rule: CSSProperties = {
    marginTop: "var(--s3)",
    borderBottom: "1px solid var(--rule)",
  };
  if (ruleWidth) rule.width = ruleWidth;
  else if (halfRule) rule.width = `calc(50% - (${gap}) / 2)`;

  return (
    <div style={{ marginBottom: "var(--s4)" }}>
      <KickerBernomor n={n} kicker={kicker} align={align} />
      <div style={{ marginTop: "var(--s2)", textAlign: align }}>
        <Judul>{judul}</Judul>
      </div>
      <div style={rule} />
    </div>
  );
}
