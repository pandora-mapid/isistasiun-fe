import Link from "next/link";
import { NavBar } from "@/components/NavBar";

export default function InsightPage() {
  return (
    <div className="page-canvas">
      <NavBar
        active="insight"
        cta={
          <Link href="/peta" className="b bp">
            Buka di peta
          </Link>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 460px", gap: 48, padding: "60px 56px 48px", alignItems: "end" }}>
        <div>
          <h1 style={{ font: "800 56px/1.02 var(--font-inter)", letterSpacing: "-.035em", margin: "24px 0 0", maxWidth: "18ch", textWrap: "pretty" }}>
            Apa yang terbaca dari tiga simpul.
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.62, color: "#475569", maxWidth: "56ch", margin: "24px 0 0" }}>
            Setiap angka di halaman ini dapat diklik dan membuka peta yang sudah terfilter ke lapisan, pintu, dan slot yang dimaksud. Temuan yang datanya tipis ditandai, bukan disembunyikan.
          </p>
        </div>
        <div style={{ borderRadius: 12, background: "#0F172A", padding: 32, position: "relative", overflow: "hidden" }}>
          <div className="k" style={{ color: "#93C5FD", position: "relative" }}>Kesenjangan terbesar</div>
          <div className="mono" style={{ font: "800 46px/1 var(--font-inter)", letterSpacing: "-.03em", color: "#fff", margin: "18px 0 0", position: "relative" }}>
            Rp 1.800.000<span style={{ fontSize: 18, color: "#94A3B8", fontWeight: 600 }}> / hari</span>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,.62)", margin: "14px 0 0", position: "relative" }}>
            Stasiun B · pintu 4 · slot 06–09. Potensi terbaca jauh di atas belanja yang tertangkap, dan tidak ada slot komersial aktif di sisi itu.
          </p>
          <div style={{ height: 1, background: "rgba(255,255,255,.12)", margin: "24px 0", position: "relative" }} />
          <div className="row" style={{ gap: 26, position: "relative" }}>
            <div><div className="k" style={{ color: "#94A3B8", fontSize: 9 }}>Simpul diamati</div><div className="mono" style={{ font: "800 22px/1 var(--font-inter)", color: "#93C5FD", marginTop: 8 }}>3</div></div>
            <div><div className="k" style={{ color: "#94A3B8", fontSize: 9 }}>Struk terbaca</div><div className="mono" style={{ font: "800 22px/1 var(--font-inter)", color: "#93C5FD", marginTop: 8 }}>612</div></div>
            <div><div className="k" style={{ color: "#94A3B8", fontSize: 9 }}>Slot kosong</div><div className="mono" style={{ font: "800 22px/1 var(--font-inter)", color: "#93C5FD", marginTop: 8 }}>3</div></div>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 56px 48px" }}>
        <div className="row" style={{ gap: 8, marginBottom: 26 }}>
          <span className="chip" style={{ background: "#0F172A", borderColor: "transparent", color: "#fff", fontWeight: 600 }}>Uji tipologi</span>
          <span className="chip">Kategori hilang</span>
          <span className="chip">Sewa / arus</span>
          <span className="chip">Event &amp; aktivasi</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 40, alignItems: "start" }}>
          <div>
            <div className="k" style={{ color: "#1D4ED8", marginBottom: 12 }}>Hipotesis yang diuji</div>
            <h2 style={{ font: "800 28px/1.14 var(--font-inter)", letterSpacing: "-.025em", margin: 0 }}>Kawasan hunian jadi simpul asal, perkantoran jadi simpul tujuan.</h2>
            <p style={{ fontSize: 13.5, lineHeight: 1.62, color: "#64748B", margin: "16px 0 0" }}>Yang diuji adalah apakah tipe kawasan sebagai masukan memang menghasilkan profil arus berbeda sebagai keluaran. Hasilnya ditulis apa adanya: terverifikasi, terbantah sebagian, atau tidak konklusif.</p>
          </div>
          <div style={{ borderRadius: 12, overflow: "hidden", background: "#EEF2F6" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1.1fr", padding: "14px 22px", background: "#0F172A" }}>
              <span className="k" style={{ color: "rgba(255,255,255,.55)", fontSize: 9 }}>Simpul</span>
              <span className="k" style={{ color: "rgba(255,255,255,.55)", fontSize: 9 }}>Arus pagi dominan</span>
              <span className="k" style={{ color: "rgba(255,255,255,.55)", fontSize: 9 }}>Puncak belanja</span>
              <span className="k" style={{ color: "rgba(255,255,255,.55)", fontSize: 9 }}>Sesuai hipotesis</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1.1fr", alignItems: "center", padding: "17px 22px", background: "#fff", borderBottom: "1px solid rgba(15,23,42,.08)" }}>
              <span className="row" style={{ gap: 9, fontSize: 13.5, fontWeight: 600 }}><span className="dot" style={{ background: "#2563EB" }} />A · hunian</span>
              <span style={{ fontSize: 13, color: "#64748B" }}>Keluar 61%</span>
              <span className="mono" style={{ fontSize: 13, color: "#64748B" }}>06–09</span>
              <span className="pill" style={{ justifySelf: "start", padding: "5px 12px", background: "rgba(29,78,216,.1)", color: "#1D4ED8", font: "600 12px/1 var(--font-inter)" }}>Terverifikasi</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1.1fr", alignItems: "center", padding: "17px 22px", background: "#fff", borderBottom: "1px solid rgba(15,23,42,.08)" }}>
              <span className="row" style={{ gap: 9, fontSize: 13.5, fontWeight: 600 }}><span className="dot" style={{ background: "#2563EB" }} />B · campuran</span>
              <span style={{ fontSize: 13, color: "#64748B" }}>Seimbang</span>
              <span className="mono" style={{ fontSize: 13, color: "#64748B" }}>11–14</span>
              <span className="pill" style={{ justifySelf: "start", padding: "5px 12px", background: "rgba(147,197,253,.55)", color: "#3B82F6", font: "600 12px/1 var(--font-inter)" }}>Sebagian</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1.1fr", alignItems: "center", padding: "17px 22px", background: "#fff" }}>
              <span className="row" style={{ gap: 9, fontSize: 13.5, fontWeight: 600 }}><span className="dot" style={{ background: "#475569" }} />C · perkantoran</span>
              <span style={{ fontSize: 13, color: "#64748B" }}>Masuk 58%</span>
              <span className="mono" style={{ fontSize: 13, color: "#64748B" }}>16–19</span>
              <span className="pill" style={{ justifySelf: "start", padding: "5px 12px", background: "rgba(29,78,216,.1)", color: "#1D4ED8", font: "600 12px/1 var(--font-inter)" }}>Terverifikasi</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 56px 48px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div style={{ borderRadius: 12, background: "#EEF2F6", padding: "32px 34px 28px" }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div className="k" style={{ marginBottom: 10 }}>Profil arus per slot</div>
              <div style={{ font: "700 19px/1.2 var(--font-inter)" }}>Pagi menyumbang arus terbesar, tetapi belanja tertangkapnya paling kecil.</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 18, height: 190, marginTop: 28 }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 5 }}><span className="mono" style={{ font: "700 12px/1 var(--font-inter)", color: "#1D4ED8" }}>38%</span><div style={{ height: 150, borderRadius: 12, background: "#3B82F6" }} /></div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 5 }}><span className="mono" style={{ font: "700 12px/1 var(--font-inter)", color: "#94A3B8" }}>20%</span><div style={{ height: 78, borderRadius: 12, background: "rgba(15,23,42,.12)" }} /></div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 5 }}><span className="mono" style={{ font: "700 12px/1 var(--font-inter)", color: "#94A3B8" }}>29%</span><div style={{ height: 118, borderRadius: 12, background: "rgba(15,23,42,.12)" }} /></div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 5 }}><span className="mono" style={{ font: "700 12px/1 var(--font-inter)", color: "#94A3B8" }}>13%</span><div style={{ height: 54, borderRadius: 12, background: "rgba(15,23,42,.12)" }} /></div>
          </div>
          <div className="row" style={{ gap: 18, marginTop: 10 }}>
            <span className="mono" style={{ flex: 1, textAlign: "center", fontSize: 11.5, color: "#64748B" }}>06–09</span>
            <span className="mono" style={{ flex: 1, textAlign: "center", fontSize: 11.5, color: "#94A3B8" }}>11–14</span>
            <span className="mono" style={{ flex: 1, textAlign: "center", fontSize: 11.5, color: "#94A3B8" }}>16–19</span>
            <span className="mono" style={{ flex: 1, textAlign: "center", fontSize: 11.5, color: "#94A3B8" }}>19–21</span>
          </div>
          <p style={{ fontSize: 12.5, lineHeight: 1.6, color: "#64748B", margin: "20px 0 0" }}>Nilai adalah bagian arus harian per slot, dirata-rata atas tiga simpul. Klik satu batang untuk membuka peta pada slot tersebut.</p>
        </div>

        <div style={{ borderRadius: 12, background: "#fff", border: "1px solid rgba(15,23,42,.1)", padding: "32px 34px 28px" }}>
          <div className="k" style={{ marginBottom: 16 }}>Temuan yang bisa diklik</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Link href="/peta" style={{ display: "block", borderRadius: 12, background: "rgba(29,78,216,.08)", padding: "18px 20px", color: "#0F172A" }}>
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}><span className="k" style={{ color: "#1D4ED8", fontSize: 9 }}>Kesenjangan tertinggi</span><span style={{ fontSize: 13, color: "#1D4ED8" }}>→</span></div>
              <div style={{ fontSize: 14, lineHeight: 1.5 }}>Selisih terbesar ada di <b>pintu 4 Stasiun B</b>, slot 06–09, tanpa slot komersial aktif di sisi tersebut.</div>
            </Link>
            <Link href="/peta" style={{ display: "block", borderRadius: 12, background: "rgba(37,99,235,.09)", padding: "18px 20px", color: "#0F172A" }}>
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}><span className="k" style={{ color: "#1D4ED8", fontSize: 9 }}>Kategori hilang</span><span style={{ fontSize: 13, color: "#1D4ED8" }}>→</span></div>
              <div style={{ fontSize: 14, lineHeight: 1.5 }}>Apotek tidak tersedia di <b>2 dari 3 simpul</b>, meski permintaan kawasan terbaca 37% di atas rata-rata.</div>
            </Link>
            <Link href="/peta" style={{ display: "block", borderRadius: 12, background: "rgba(37,99,235,.1)", padding: "18px 20px", color: "#0F172A" }}>
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}><span className="k" style={{ color: "#1D4ED8", fontSize: 9 }}>Sewa / arus</span><span style={{ fontSize: 13, color: "#1D4ED8" }}>→</span></div>
              <div style={{ fontSize: 14, lineHeight: 1.5 }}>Tarif per m² di <b>Stasiun C</b> setara Stasiun A, padahal arus yang lewat 24% lebih tinggi.</div>
            </Link>
            <div style={{ borderRadius: 12, background: "#F1F5F9", padding: "18px 20px" }}>
              <div className="k" style={{ color: "#94A3B8", fontSize: 9, marginBottom: 8 }}>Tidak diberi estimasi</div>
              <div style={{ fontSize: 14, lineHeight: 1.5, color: "#64748B" }}>Slot malam Stasiun A ditandai sampel tipis (n &lt; 30). Angkanya ditahan sampai survei putaran kedua.</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 56px 60px" }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
          <h2 style={{ font: "800 30px/1.1 var(--font-inter)", letterSpacing: "-.025em", margin: 0 }}>Kategori yang hilang di tiap simpul</h2>
          <span style={{ fontSize: 12.5, color: "#94A3B8" }}>Terisi · Kurang · Kosong — dibaca dari survei lapangan, bukan dari data sewa</span>
        </div>
        <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(15,23,42,.1)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr repeat(3,1fr) 1.2fr", padding: "14px 24px", background: "#F1F5F9" }}>
            <span className="k" style={{ fontSize: 9 }}>Kategori</span>
            <span className="k" style={{ fontSize: 9 }}>Stasiun A</span>
            <span className="k" style={{ fontSize: 9 }}>Stasiun B</span>
            <span className="k" style={{ fontSize: 9 }}>Stasiun C</span>
            <span className="k" style={{ fontSize: 9 }}>Permintaan terbaca</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr repeat(3,1fr) 1.2fr", alignItems: "center", padding: "16px 24px", background: "#fff", borderTop: "1px solid rgba(15,23,42,.08)" }}>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>F&amp;B siap saji</span>
            <span className="pill" style={{ justifySelf: "start", padding: "5px 12px", background: "rgba(29,78,216,.1)", color: "#1D4ED8", font: "600 12px/1 var(--font-inter)" }}>Terisi</span>
            <span className="pill" style={{ justifySelf: "start", padding: "5px 12px", background: "rgba(29,78,216,.1)", color: "#1D4ED8", font: "600 12px/1 var(--font-inter)" }}>Terisi</span>
            <span className="pill" style={{ justifySelf: "start", padding: "5px 12px", background: "rgba(147,197,253,.55)", color: "#3B82F6", font: "600 12px/1 var(--font-inter)" }}>Kurang</span>
            <span className="mono" style={{ fontSize: 13, color: "#64748B" }}>Tinggi · 82%</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr repeat(3,1fr) 1.2fr", alignItems: "center", padding: "16px 24px", background: "#fff", borderTop: "1px solid rgba(15,23,42,.08)" }}>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>Apotek &amp; kebutuhan mendesak</span>
            <span className="pill" style={{ justifySelf: "start", padding: "5px 12px", background: "rgba(29,78,216,.12)", color: "#1D4ED8", font: "600 12px/1 var(--font-inter)" }}>Kosong</span>
            <span className="pill" style={{ justifySelf: "start", padding: "5px 12px", background: "rgba(29,78,216,.12)", color: "#1D4ED8", font: "600 12px/1 var(--font-inter)" }}>Kosong</span>
            <span className="pill" style={{ justifySelf: "start", padding: "5px 12px", background: "rgba(29,78,216,.1)", color: "#1D4ED8", font: "600 12px/1 var(--font-inter)" }}>Terisi</span>
            <span className="mono" style={{ fontSize: 13, color: "#64748B" }}>Tinggi · 78%</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr repeat(3,1fr) 1.2fr", alignItems: "center", padding: "16px 24px", background: "#fff", borderTop: "1px solid rgba(15,23,42,.08)" }}>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>Titipan &amp; loker</span>
            <span className="pill" style={{ justifySelf: "start", padding: "5px 12px", background: "rgba(147,197,253,.55)", color: "#3B82F6", font: "600 12px/1 var(--font-inter)" }}>Kurang</span>
            <span className="pill" style={{ justifySelf: "start", padding: "5px 12px", background: "rgba(29,78,216,.12)", color: "#1D4ED8", font: "600 12px/1 var(--font-inter)" }}>Kosong</span>
            <span className="pill" style={{ justifySelf: "start", padding: "5px 12px", background: "rgba(147,197,253,.55)", color: "#3B82F6", font: "600 12px/1 var(--font-inter)" }}>Kurang</span>
            <span className="mono" style={{ fontSize: 13, color: "#64748B" }}>Sedang · 46%</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr repeat(3,1fr) 1.2fr", alignItems: "center", padding: "16px 24px", background: "#fff", borderTop: "1px solid rgba(15,23,42,.08)" }}>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>Ritel oleh-oleh</span>
            <span className="pill" style={{ justifySelf: "start", padding: "5px 12px", background: "rgba(29,78,216,.1)", color: "#1D4ED8", font: "600 12px/1 var(--font-inter)" }}>Terisi</span>
            <span className="pill" style={{ justifySelf: "start", padding: "5px 12px", background: "rgba(147,197,253,.55)", color: "#3B82F6", font: "600 12px/1 var(--font-inter)" }}>Kurang</span>
            <span className="pill" style={{ justifySelf: "start", padding: "5px 12px", background: "rgba(29,78,216,.1)", color: "#1D4ED8", font: "600 12px/1 var(--font-inter)" }}>Terisi</span>
            <span className="mono" style={{ fontSize: 13, color: "#94A3B8" }}>Rendah · 21%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
