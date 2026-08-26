import Link from "next/link";
import { NavBar } from "@/components/NavBar";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";

export default function MetodologiPage() {
  return (
    <div className="page-canvas">
      <NavBar active="metodologi" cta={<button className="b bs">Unduh protokol</button>} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 500px", gap: 48, padding: "60px 56px 52px", alignItems: "end" }}>
        <div>
          <h1 style={{ font: "800 56px/1.02 var(--font-inter)", letterSpacing: "-.035em", margin: "24px 0 0", maxWidth: "20ch", textWrap: "pretty" }}>
            Bagaimana angkanya dibuat, dan di mana batasnya.
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.62, color: "#475569", maxWidth: "56ch", margin: "24px 0 0" }}>
            Tiga variabel dicacah manusia di lapangan, satu variabel dibaca AI dari foto struk, dan hasilnya disajikan sebagai rentang. Halaman ini memuat aturan yang dipakai — termasuk aturan untuk membuang data yang tidak layak dipakai.
          </p>
        </div>
        <div style={{ borderRadius: 12, background: "#0F172A", padding: 34, position: "relative", overflow: "hidden" }}>
          <div className="k" style={{ color: "#2563EB", position: "relative" }}>Persamaan potensi</div>
          <div className="row" style={{ gap: 10, marginTop: 22, position: "relative", flexWrap: "wrap" }}>
            <span className="pill" style={{ padding: "9px 15px", background: "rgba(37,99,235,.14)", color: "#93C5FD", font: "800 15px/1 var(--font-inter)" }}>F</span>
            <span style={{ color: "#94A3B8", font: "700 15px/1 var(--font-inter)" }}>×</span>
            <span className="pill" style={{ padding: "9px 15px", background: "rgba(37,99,235,.16)", color: "#93C5FD", font: "800 15px/1 var(--font-inter)" }}>E</span>
            <span style={{ color: "#94A3B8", font: "700 15px/1 var(--font-inter)" }}>×</span>
            <span className="pill" style={{ padding: "9px 15px", background: "rgba(168,85,247,.2)", color: "#93C5FD", font: "800 15px/1 var(--font-inter)" }}>C</span>
            <span style={{ color: "#94A3B8", font: "700 15px/1 var(--font-inter)" }}>×</span>
            <span className="pill" style={{ padding: "9px 15px", background: "rgba(236,72,153,.2)", color: "#93C5FD", font: "800 15px/1 var(--font-inter)" }}>V</span>
            <span style={{ color: "#94A3B8", font: "700 15px/1 var(--font-inter)" }}>=</span>
            <span className="pill" style={{ padding: "9px 15px", background: "#fff", color: "#0F172A", font: "800 15px/1 var(--font-inter)" }}>Potensi belanja</span>
          </div>
          <div style={{ height: 1, background: "rgba(255,255,255,.12)", margin: "26px 0", position: "relative" }} />
          <div className="row" style={{ gap: 10, position: "relative", flexWrap: "wrap" }}>
            <span className="pill" style={{ padding: "9px 15px", background: "rgba(255,255,255,.1)", color: "#94A3B8", font: "600 13px/1 var(--font-inter)" }}>Potensi</span>
            <span style={{ color: "#94A3B8", font: "700 15px/1 var(--font-inter)" }}>−</span>
            <span className="pill" style={{ padding: "9px 15px", background: "rgba(255,255,255,.1)", color: "#94A3B8", font: "600 13px/1 var(--font-inter)" }}>Tertangkap</span>
            <span style={{ color: "#94A3B8", font: "700 15px/1 var(--font-inter)" }}>=</span>
            <span className="pill" style={{ padding: "9px 15px", background: "#1D4ED8", color: "#fff", font: "800 13px/1 var(--font-inter)" }}>Kesenjangan</span>
          </div>
          <p style={{ fontSize: 12.5, lineHeight: 1.6, color: "rgba(255,255,255,.6)", margin: "24px 0 0", position: "relative" }}>
            Keduanya diukur pada pintu yang sama, slot waktu yang sama, dan instrumen yang sama — sehingga selisihnya dapat dibandingkan antar simpul.
          </p>
        </div>
      </div>

      <div style={{ padding: "0 56px 56px" }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end", marginBottom: 30 }}>
          <h2 style={{ font: "800 32px/1.1 var(--font-inter)", letterSpacing: "-.025em", margin: 0 }}>Lima langkah, dari lapangan ke lapisan peta</h2>
          <span className="mono" style={{ fontSize: 12, color: "#94A3B8" }}>satu simpul · satu hari kerja</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14 }}>
          <div style={{ borderRadius: 12, background: "rgba(37,99,235,.09)", padding: 24 }}>
            <div className="row" style={{ justifyContent: "space-between" }}><span className="mono" style={{ font: "800 13px/1 var(--font-inter)", color: "#1D4ED8" }}>01</span><span className="dot" style={{ background: "#2563EB" }} /></div>
            <div style={{ font: "700 15px/1.2 var(--font-inter)", margin: "16px 0 8px" }}>Tetapkan simpul &amp; pintu</div>
            <p style={{ fontSize: 12.5, lineHeight: 1.55, color: "#64748B", margin: 0 }}>Garis pengamatan digambar di setiap pintu, lalu dibekukan sebelum survei agar tidak berubah antar slot.</p>
          </div>
          <div style={{ borderRadius: 12, background: "rgba(37,99,235,.09)", padding: 24 }}>
            <div className="row" style={{ justifyContent: "space-between" }}><span className="mono" style={{ font: "800 13px/1 var(--font-inter)", color: "#1D4ED8" }}>02</span><span className="dot" style={{ background: "#2563EB" }} /></div>
            <div style={{ font: "700 15px/1.2 var(--font-inter)", margin: "16px 0 8px" }}>Cacah F, E, C</div>
            <p style={{ fontSize: 12.5, lineHeight: 1.55, color: "#64748B", margin: 0 }}>Blok menerus 15 menit per slot, dua pencacah per pintu, hitungan dibandingkan di akhir blok.</p>
          </div>
          <div style={{ borderRadius: 12, background: "rgba(71,85,105,.08)", padding: 24 }}>
            <div className="row" style={{ justifyContent: "space-between" }}><span className="mono" style={{ font: "800 13px/1 var(--font-inter)", color: "#334155" }}>03</span><span className="dot" style={{ background: "#475569" }} /></div>
            <div style={{ font: "700 15px/1.2 var(--font-inter)", margin: "16px 0 8px" }}>Baca struk dengan AI</div>
            <p style={{ fontSize: 12.5, lineHeight: 1.55, color: "#64748B", margin: 0 }}>Yang diambil hanya jumlah dibayarkan dan kategori. Identitas diredaksi sebelum foto diunggah.</p>
          </div>
          <div style={{ borderRadius: 12, background: "rgba(29,78,216,.08)", padding: 24 }}>
            <div className="row" style={{ justifyContent: "space-between" }}><span className="mono" style={{ font: "800 13px/1 var(--font-inter)", color: "#334155" }}>04</span><span className="dot" style={{ background: "#1D4ED8" }} /></div>
            <div style={{ font: "700 15px/1.2 var(--font-inter)", margin: "16px 0 8px" }}>Simulasi rentang</div>
            <p style={{ fontSize: 12.5, lineHeight: 1.55, color: "#64748B", margin: 0 }}>10.000 iterasi atas ketidakpastian tiap variabel, dilaporkan sebagai P10–P90, bukan angka tunggal.</p>
          </div>
          <div style={{ borderRadius: 12, background: "rgba(29,78,216,.08)", padding: 24 }}>
            <div className="row" style={{ justifyContent: "space-between" }}><span className="mono" style={{ font: "800 13px/1 var(--font-inter)", color: "#1D4ED8" }}>05</span><span className="dot" style={{ background: "#CBD5E1" }} /></div>
            <div style={{ font: "700 15px/1.2 var(--font-inter)", margin: "16px 0 8px" }}>Publikasi lapisan</div>
            <p style={{ fontSize: 12.5, lineHeight: 1.55, color: "#64748B", margin: 0 }}>Lapisan, protokol, dan catatan keterbatasan diterbitkan bersamaan agar dapat diperiksa ulang.</p>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 56px 56px" }}>
        <div style={{ borderRadius: 12, background: "#EEF2F6", padding: 40 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
            <div>
              <div className="k" style={{ color: "#1D4ED8", marginBottom: 12 }}>Panel transparansi</div>
              <h2 style={{ font: "800 30px/1.1 var(--font-inter)", letterSpacing: "-.025em", margin: 0 }}>Dari foto struk ke satu angka</h2>
            </div>
            <span style={{ fontSize: 12.5, color: "#64748B", maxWidth: "40ch", textAlign: "right" }}>Setiap nilai V pada peta dapat dibuka sampai foto aslinya, lengkap dengan keyakinan bacaan dan alasan bila datanya dibuang.</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24 }}>
            <div>
              <div style={{ borderRadius: 12, overflow: "hidden", height: 290, background: "#F1F5F9" }}>
                <ImagePlaceholder label="Foto struk (identitas diredaksi)" />
              </div>
              <div className="row" style={{ gap: 7, marginTop: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#E9EEF3", boxShadow: "0 0 0 2px #1D4ED8" }} />
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#E9EEF3" }} />
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#E9EEF3" }} />
                <div style={{ width: 44, height: 44, borderRadius: 12, border: "1.5px dashed rgba(15,23,42,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, color: "#94A3B8" }}>+18</div>
              </div>
            </div>
            <div>
              <div className="k" style={{ marginBottom: 11 }}>Hasil baca AI</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <div className="row" style={{ justifyContent: "space-between", padding: "13px 16px", borderRadius: "12px 12px 0 0", background: "#fff", fontSize: 13 }}><span style={{ color: "#64748B" }}>Kategori (dinormalisasi)</span><span style={{ fontWeight: 600 }}>F&amp;B siap saji</span></div>
                <div className="row" style={{ justifyContent: "space-between", padding: "13px 16px", background: "#fff", fontSize: 13 }}><span style={{ color: "#64748B" }}>Subtotal sebelum pajak</span><span style={{ color: "#94A3B8" }}>Rp 47.500 — tidak dipakai</span></div>
                <div className="row" style={{ justifyContent: "space-between", padding: "13px 16px", background: "#fff", fontSize: 13 }}><span style={{ color: "#64748B" }}>Waktu transaksi</span><span className="mono">07.42 · slot 06–09</span></div>
                <div className="row" style={{ justifyContent: "space-between", padding: "14px 16px", borderRadius: "0 0 14px 14px", background: "rgba(29,78,216,.1)", fontSize: 13 }}><span style={{ fontWeight: 600 }}>Jumlah dibayarkan → V</span><span className="mono" style={{ fontWeight: 700, color: "#1D4ED8" }}>Rp 42.000</span></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginTop: 14 }}>
                <div style={{ borderRadius: 12, background: "#fff", padding: 16 }}>
                  <div className="k" style={{ fontSize: 9, marginBottom: 9 }}>Keyakinan bacaan</div>
                  <div className="mono" style={{ font: "700 20px/1 var(--font-inter)" }}>0,91</div>
                  <div className="pill" style={{ height: 5, background: "rgba(15,23,42,.1)", marginTop: 10 }}><div className="pill" style={{ width: "84%", height: 5, background: "#1D4ED8" }} /></div>
                </div>
                <div style={{ borderRadius: 12, background: "#fff", padding: 16 }}>
                  <div className="k" style={{ fontSize: 9, marginBottom: 9 }}>Cakupan</div>
                  <div className="mono" style={{ font: "700 20px/1 var(--font-inter)" }}>182 / 196</div>
                  <div style={{ fontSize: 10.5, lineHeight: 1.4, color: "#64748B", marginTop: 7 }}>struk terbaca</div>
                </div>
                <div style={{ borderRadius: 12, background: "#fff", padding: 16 }}>
                  <div className="k" style={{ fontSize: 9, marginBottom: 9 }}>Dibuang</div>
                  <div className="mono" style={{ font: "700 20px/1 var(--font-inter)" }}>4</div>
                  <div style={{ fontSize: 10.5, lineHeight: 1.4, color: "#64748B", marginTop: 7 }}>bacaan ambigu</div>
                </div>
              </div>
              <div className="row" style={{ gap: 11, alignItems: "flex-start", marginTop: 14, borderRadius: 12, background: "rgba(29,78,216,.08)", padding: "15px 17px", fontSize: 12.5, lineHeight: 1.55 }}>
                <span className="dot" style={{ background: "#1D4ED8", marginTop: 6 }} />
                <span>Bila sampel satu kategori terlalu tipis, nilai V <b>dialihkan</b> dari kawasan sejenis dan simpul itu ditandai pada lapisan kepercayaan data — bukan diisi diam-diam.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 18, padding: "0 56px 56px" }}>
        <div style={{ borderRadius: 12, background: "#EEF2F6", padding: 34 }}>
          <div className="k" style={{ marginBottom: 14 }}>Sebaran hasil simulasi</div>
          <h2 style={{ font: "800 26px/1.12 var(--font-inter)", letterSpacing: "-.02em", margin: "0 0 6px" }}>Mengapa jawabannya rentang</h2>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: "#64748B", margin: "0 0 26px", maxWidth: "48ch" }}>Tiap variabel punya ketidakpastian sendiri. Setelah dikalikan, ketidakpastiannya menumpuk — maka yang dilaporkan adalah rentang P10–P90.</p>
          <svg width="100%" height="180" viewBox="0 0 560 180" preserveAspectRatio="none" style={{ display: "block" }}>
            <g fill="rgba(15,23,42,.14)">
              <rect x="4" y="160" width="18" height="20" rx="2" />
              <rect x="26" y="150" width="18" height="30" rx="2" />
              <rect x="48" y="134" width="18" height="46" rx="2" />
              <rect x="70" y="116" width="18" height="64" rx="2" />
            </g>
            <g fill="#2563EB">
              <rect x="92" y="96" width="18" height="84" rx="2" />
              <rect x="114" y="76" width="18" height="104" rx="2" />
              <rect x="136" y="58" width="18" height="122" rx="2" />
              <rect x="158" y="42" width="18" height="138" rx="2" />
              <rect x="180" y="30" width="18" height="150" rx="2" />
            </g>
            <g fill="#60A5FA">
              <rect x="202" y="20" width="18" height="160" rx="2" />
              <rect x="224" y="14" width="18" height="166" rx="2" />
              <rect x="246" y="18" width="18" height="162" rx="2" />
              <rect x="268" y="26" width="18" height="154" rx="2" />
            </g>
            <g fill="#1D4ED8">
              <rect x="290" y="38" width="18" height="142" rx="2" />
              <rect x="312" y="54" width="18" height="126" rx="2" />
              <rect x="334" y="72" width="18" height="108" rx="2" />
              <rect x="356" y="92" width="18" height="88" rx="2" />
              <rect x="378" y="112" width="18" height="68" rx="2" />
            </g>
            <g fill="rgba(15,23,42,.14)">
              <rect x="400" y="130" width="18" height="50" rx="2" />
              <rect x="422" y="144" width="18" height="36" rx="2" />
              <rect x="444" y="154" width="18" height="26" rx="2" />
              <rect x="466" y="162" width="18" height="18" rx="2" />
              <rect x="488" y="168" width="18" height="12" rx="2" />
              <rect x="510" y="172" width="18" height="8" rx="2" />
              <rect x="532" y="175" width="18" height="5" rx="2" />
            </g>
            <line x1="92" y1="0" x2="92" y2="180" stroke="#0F172A" strokeWidth="1.5" strokeDasharray="4 4" />
            <line x1="233" y1="0" x2="233" y2="180" stroke="#0F172A" strokeWidth="2" />
            <line x1="396" y1="0" x2="396" y2="180" stroke="#0F172A" strokeWidth="1.5" strokeDasharray="4 4" />
          </svg>
          <div className="row" style={{ justifyContent: "space-between", marginTop: 12 }}>
            <span className="mono" style={{ fontSize: 11, color: "#64748B" }}>P10</span>
            <span className="mono" style={{ fontSize: 11, fontWeight: 700 }}>median</span>
            <span className="mono" style={{ fontSize: 11, color: "#64748B" }}>P90</span>
          </div>
          <div className="row" style={{ gap: 14, marginTop: 20, flexWrap: "wrap" }}>
            <span className="chip" style={{ cursor: "default" }}>10.000 iterasi</span>
            <span className="chip" style={{ cursor: "default" }}>per pintu · per slot</span>
            <span className="chip" style={{ cursor: "default" }}>tanpa penghalusan antar jam</span>
          </div>
        </div>
        <div style={{ borderRadius: 12, background: "#0F172A", padding: 34, position: "relative", overflow: "hidden" }}>
          <div className="k" style={{ color: "#93C5FD", position: "relative", marginBottom: 22 }}>Yang kami buang, dan alasannya</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "relative" }}>
            <div className="row" style={{ gap: 14, alignItems: "flex-start" }}><span className="dot" style={{ background: "#1D4ED8", marginTop: 7 }} /><div><div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>Blok dengan selisih antar pencacah &gt; 15%</div><div style={{ fontSize: 12.5, lineHeight: 1.55, color: "rgba(255,255,255,.62)", marginTop: 4 }}>Blok diulang; bila tetap berselisih, slot itu tidak dipakai.</div></div></div>
            <div className="row" style={{ gap: 14, alignItems: "flex-start" }}><span className="dot" style={{ background: "#475569", marginTop: 7 }} /><div><div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>Struk yang tidak terbaca utuh</div><div style={{ fontSize: 12.5, lineHeight: 1.55, color: "rgba(255,255,255,.62)", marginTop: 4 }}>Tidak ditebak. Dikeluarkan dari perhitungan dan dilaporkan jumlahnya.</div></div></div>
            <div className="row" style={{ gap: 14, alignItems: "flex-start" }}><span className="dot" style={{ background: "#2563EB", marginTop: 7 }} /><div><div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>Kawasan dengan sampel di bawah ambang</div><div style={{ fontSize: 12.5, lineHeight: 1.55, color: "rgba(255,255,255,.62)", marginTop: 4 }}>Ditandai sebagai sampel tipis, tidak diberi estimasi, dan tidak dibaca aman maupun bermasalah.</div></div></div>
            <div className="row" style={{ gap: 14, alignItems: "flex-start" }}><span className="dot" style={{ background: "#2563EB", marginTop: 7 }} /><div><div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>Hari dengan gangguan operasi</div><div style={{ fontSize: 12.5, lineHeight: 1.55, color: "rgba(255,255,255,.62)", marginTop: 4 }}>Rekayasa lalu lintas atau gangguan perjalanan membuat arus tidak mewakili hari biasa.</div></div></div>
          </div>
          <div className="row" style={{ gap: 10, marginTop: 28, position: "relative" }}>
            <button className="b bw">Unduh protokol pencacahan</button>
            <button className="b bs" style={{ background: "rgba(255,255,255,.12)", color: "#fff" }}>Catatan keterbatasan</button>
          </div>
        </div>
      </div>

      <div className="row" style={{ justifyContent: "space-between", padding: "20px 56px 28px", borderTop: "1px solid rgba(15,23,42,.1)" }}>
        <span style={{ fontSize: 11.5, color: "#94A3B8" }}>Isi Stasiun · seluruh angka pada halaman ini bersifat ilustratif</span>
        <Link href="/rekomendasi" style={{ fontSize: 11.5, fontWeight: 600 }}>Lanjut ke rekomendasi →</Link>
      </div>
    </div>
  );
}
