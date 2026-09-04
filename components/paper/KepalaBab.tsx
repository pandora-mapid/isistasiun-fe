import type { ReactNode } from "react";

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
 * untuk grid `1fr 1fr` yang gap-nya `--s5`.
 */
export function KepalaBab({
  n,
  kicker,
  judul,
  align = "left",
  halfRule = false,
}: {
  n: number;
  kicker: string;
  judul: ReactNode;
  align?: "left" | "right";
  halfRule?: boolean;
}) {
  return (
    <div style={{ marginBottom: "var(--s4)" }}>
      <KickerBernomor n={n} kicker={kicker} align={align} />
      <div style={{ marginTop: "var(--s2)", textAlign: align }}>
        <Judul>{judul}</Judul>
      </div>
      <div
        style={{
          marginTop: "var(--s3)",
          borderBottom: "1px solid var(--rule)",
          // Setengah kiri: berhenti persis di tepi kolom pertama grid `1fr 1fr`
          // yang gap-nya `--s5`.
          ...(halfRule ? { width: "calc(50% - var(--s5) / 2)" } : null),
        }}
      />
    </div>
  );
}
