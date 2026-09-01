/**
 * Empat batang: kesenjangan satu titik pada keempat slot yang dicacah.
 *
 * Menggantikan tiga SVG peta-mini palsu yang dulu menghiasi kartu simpul —
 * gambar yang tidak mengandung satu pun informasi. Empat batang ini kecil, tapi
 * setiap batangnya adalah angka yang benar-benar ada di payload.
 *
 * Jam di antara slot **tidak** diinterpolasi, jadi sengaja digambar sebagai
 * batang terpisah, bukan garis. Garis akan menjanjikan kesinambungan yang tidak
 * pernah diukur.
 */
import type { SlotNilai } from "./BerandaData";
import { rupiahRingkas } from "@/lib/format";

export function SlotSparkline({
  slot,
  height = 34,
}: {
  slot: SlotNilai[];
  height?: number;
}) {
  // Skala batang, bukan angka yang ditampilkan — sama seperti `stationMax` di
  // PetaScreen. Dijaga minimal 1 supaya pembagiannya tidak pernah 0.
  const puncak = Math.max(1, ...slot.map((s) => s.nilai ?? 0));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height }}>
        {slot.map((s) => {
          const kosong = s.nilai === null;
          return (
            <div
              key={s.key}
              title={
                kosong
                  ? `${s.jam} · tidak diestimasi`
                  : `${s.jam} · ${rupiahRingkas(s.nilai)}`
              }
              style={{
                flex: 1,
                height: kosong ? "100%" : `${Math.max(6, ((s.nilai ?? 0) / puncak) * 100)}%`,
                minHeight: 3,
                background: kosong ? "transparent" : "var(--data-soft)",
                // Sampel tipis tidak boleh terbaca sebagai batang terpendek —
                // itu kebalikan dari maksudnya. Ia digambar sebagai bidang
                // kosong bergaris putus.
                border: kosong ? "1px dashed var(--rule-strong)" : undefined,
                borderRadius: "var(--r-xs)",
              }}
            />
          );
        })}
      </div>
      <div
        className="fig"
        style={{
          display: "flex",
          gap: 4,
          marginTop: 6,
          fontSize: 9.5,
          color: "var(--ink-faint)",
        }}
      >
        {slot.map((s) => (
          <span key={s.key} style={{ flex: 1, textAlign: "center" }}>
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
