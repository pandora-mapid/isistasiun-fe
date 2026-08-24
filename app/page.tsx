import Link from "next/link";
import { NavBar } from "@/components/NavBar";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";

export default function BerandaPage() {
  return (
    <div className="page-canvas">
      <NavBar
        active="beranda"
        cta={
          <Link href="/peta" className="b bp">
            Buka peta
          </Link>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 560px", gap: 48, padding: "64px 56px 56px", alignItems: "center" }}>
        <div>
          <h1 style={{ font: "800 64px/1.12 var(--font-inter)", letterSpacing: "-.035em", margin: "24px 0 0", maxWidth: "15ch", textWrap: "pretty" }}>
            Berapa rupiah yang <span style={{ color: "#1D4ED8" }}>lewat</span>, berapa yang <span style={{ color: "#1D4ED8" }}>tertangkap</span>.
          </h1>
          <p style={{ fontSize: 16.5, lineHeight: 1.62, color: "#475569", maxWidth: "50ch", margin: "26px 0 0" }}>
            Dua besaran diukur pada simpul transit yang sama dengan instrumen yang sama: potensi belanja komuter, dan belanja yang benar-benar tertangkap gerai di dalam stasiun. Selisihnya adalah batas atas peluang pendapatan non-tiket.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 34 }}>
            <Link href="/peta" className="b bp" style={{ padding: "14px 24px", fontSize: 14 }}>
              Buka peta interaktif
            </Link>
            <Link href="/metodologi" className="b bs" style={{ padding: "14px 24px", fontSize: 14 }}>
              Baca metodologi
            </Link>
          </div>
          <div className="row" style={{ gap: 12, marginTop: 26 }}>
            <span className="chip" style={{ cursor: "default" }}>P10–P90</span>
            <span style={{ fontSize: 12.5, color: "#64748B", maxWidth: "44ch" }}>Setiap angka adalah rentang, dan dapat ditelusuri sampai foto aslinya.</span>
          </div>
        </div>
        <div style={{ borderRadius: 12, overflow: "hidden", position: "relative", height: 420, background: "#F8FAFC", boxShadow: "0 1px 0 #E2E8F0" }}>
          <svg width="560" height="420" viewBox="0 0 560 420" style={{ display: "block" }}>
            <rect x="0" y="0" width="560" height="420" fill="#F8FAFC" />
            <g fill="#E2E8F0">
              <rect x="30" y="40" width="120" height="80" rx="2" />
              <rect x="170" y="30" width="96" height="66" rx="2" />
              <rect x="392" y="52" width="128" height="84" rx="2" />
              <rect x="40" y="270" width="110" height="86" rx="2" />
              <rect x="404" y="256" width="122" height="100" rx="2" />
              <rect x="196" y="336" width="140" height="70" rx="2" />
            </g>
            <g fill="none" stroke="#DEE5ED" strokeLinecap="round">
              <path d="M-10 176 C 140 140 300 200 570 160" strokeWidth="12" />
              <path d="M170 -10 C 190 140 150 280 210 430" strokeWidth="10" />
              <path d="M-10 320 C 180 350 400 300 570 330" strokeWidth="5" />
              <path d="M400 -10 C 420 150 396 290 440 430" strokeWidth="5" />
            </g>
            <path d="M280 60 C 386 66 442 132 448 216 C 454 300 380 358 278 362 C 176 366 116 300 112 214 C 108 128 174 54 280 60 Z" fill="rgba(37,99,235,.06)" stroke="rgba(37,99,235,.28)" strokeWidth="1.5" strokeDasharray="7 6" />
            <path d="M280 130 C 344 134 384 172 388 214 C 392 258 344 292 280 294 C 216 296 178 258 176 214 C 174 170 216 126 280 130 Z" fill="rgba(37,99,235,.13)" stroke="rgba(37,99,235,.45)" strokeWidth="1.5" />
            <path d="M-20 344 C 120 312 200 250 280 214 C 380 170 470 150 580 108" fill="none" stroke="#94A3B8" strokeWidth="2.5" />
            <path d="M-20 344 C 120 312 200 250 280 214 C 380 170 470 150 580 108" fill="none" stroke="#0F172A" strokeWidth="2.5" strokeDasharray="2 10" />
            <g transform="rotate(-20 280 214)">
              <rect x="222" y="200" width="116" height="28" rx="2" fill="#FFFFFF" />
              <text x="230" y="220" fill="#0F172A" style={{ font: "800 11px var(--font-inter)" }}>B</text>
            </g>
            <circle cx="342" cy="262" r="36" fill="rgba(29,78,216,.12)" />
            <circle cx="342" cy="262" r="17" fill="#1D4ED8" />
            <circle cx="228" cy="168" r="24" fill="rgba(71,85,105,.14)" />
            <circle cx="228" cy="168" r="11" fill="#475569" />
            <circle cx="206" cy="272" r="15" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="4 4" />
          </svg>
          <div className="glass" style={{ position: "absolute", left: 20, bottom: 20, borderRadius: 12, padding: "12px 16px" }}>
            <div className="k" style={{ marginBottom: 6 }}>Kesenjangan · Stasiun B</div>
            <div className="mono" style={{ font: "800 19px/1 var(--font-inter)", letterSpacing: "-.02em" }}>
              Rp X,X–X,X jt <span style={{ font: "500 11px/1 var(--font-inter)", color: "#64748B" }}>/ hari</span>
            </div>
          </div>
          <div className="mono" style={{ position: "absolute", right: 18, top: 18, fontSize: 10, color: "rgba(255,255,255,.4)" }}>
            ilustrasi lapisan · angka contoh
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr 1fr", gap: 18, padding: "0 56px 56px" }}>
        <div style={{ borderRadius: 12, background: "#EEF2F6", padding: "30px 32px", display: "flex", flexDirection: "column" }}>
          <div className="k" style={{ marginBottom: 16 }}>Cara datanya dikumpulkan</div>
          <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "#475569", margin: 0 }}>
            Dua pencacah berdiri di garis pengamatan tiap pintu selama blok 15 menit, lalu foto struk dari gerai yang bersedia dibaca ulang oleh AI dengan aturan yang ditetapkan sebelum survei dimulai.
          </p>
          <div style={{ marginTop: "auto", paddingTop: 24, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="chip" style={{ cursor: "default" }}>3 stasiun</span>
            <span className="chip" style={{ cursor: "default" }}>4 slot waktu</span>
            <span className="chip" style={{ cursor: "default" }}>12–19 Agustus</span>
          </div>
        </div>
        <div style={{ borderRadius: 12, overflow: "hidden", height: 300, background: "#EEF2F6" }}>
          <ImagePlaceholder label="Foto pencacahan di pintu stasiun" />
        </div>
        <div style={{ borderRadius: 12, overflow: "hidden", height: 300, background: "#EEF2F6" }}>
          <ImagePlaceholder label="Foto gerai / struk (identitas diredaksi)" />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18, padding: "0 56px 56px" }}>
        <div style={{ borderRadius: 12, background: "rgba(37,99,235,.09)", padding: "26px 28px" }}>
          <div className="mono" style={{ font: "800 46px/1 var(--font-inter)", letterSpacing: "-.03em", color: "#1D4ED8" }}>96%</div>
          <p style={{ fontSize: 13, lineHeight: 1.58, color: "#475569", margin: "14px 0 0" }}>pendapatan KAI berasal dari operasi kereta — hanya 4% dari luar tiket (pernyataan Direktur Utama, Juli 2026)</p>
        </div>
        <div style={{ borderRadius: 12, background: "rgba(71,85,105,.08)", padding: "26px 28px" }}>
          <div className="mono" style={{ font: "800 46px/1 var(--font-inter)", letterSpacing: "-.03em", color: "#334155" }}>2,1%</div>
          <p style={{ fontSize: 13, lineHeight: 1.58, color: "#475569", margin: "14px 0 0" }}>return on asset terhadap target 6% — aset 327,82 juta m² dinyatakan masih underleverage</p>
        </div>
        <div style={{ borderRadius: 12, background: "rgba(29,78,216,.1)", padding: "26px 28px" }}>
          <div className="mono" style={{ font: "800 46px/1 var(--font-inter)", letterSpacing: "-.03em", color: "#1D4ED8" }}>Rp X jt</div>
          <p style={{ fontSize: 13, lineHeight: 1.58, color: "#475569", margin: "14px 0 0" }}>kesenjangan belanja harian yang kami ukur di tiga simpul, disajikan sebagai rentang P10–P90</p>
        </div>
      </div>

      <div style={{ padding: "0 56px 56px" }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
          <h2 style={{ font: "800 32px/1.1 var(--font-inter)", letterSpacing: "-.025em", margin: 0 }}>Empat variabel, satu instrumen</h2>
          <span style={{ fontSize: 12.5, color: "#64748B", maxWidth: "46ch", textAlign: "right" }}>Tiga variabel pertama tidak ada di dataset mana pun — dicacah sendiri di lapangan. Yang keempat diekstraksi AI dari foto struk.</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          <div style={{ borderRadius: 12, background: "#EEF2F6", padding: 24 }}>
            <span style={{ width: 44, height: 44, borderRadius: 12, background: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", font: "800 18px/1 var(--font-inter)", color: "#F8FAFC" }}>F</span>
            <div style={{ font: "700 15px/1.2 var(--font-inter)", margin: "16px 0 8px" }}>Arus pejalan</div>
            <p style={{ fontSize: 12.5, lineHeight: 1.58, color: "#64748B", margin: 0 }}>Pejalan kaki yang melintasi garis pengamatan di satu pintu, blok menerus 15 menit.</p>
            <div style={{ marginTop: 14 }}><span className="chip" style={{ cursor: "default", fontSize: 11 }}>Survei lapangan</span></div>
          </div>
          <div style={{ borderRadius: 12, background: "#EEF2F6", padding: 24 }}>
            <span style={{ width: 44, height: 44, borderRadius: 12, background: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", font: "800 18px/1 var(--font-inter)", color: "#fff" }}>E</span>
            <div style={{ font: "700 15px/1.2 var(--font-inter)", margin: "16px 0 8px" }}>Entry ratio</div>
            <p style={{ fontSize: 12.5, lineHeight: 1.58, color: "#64748B", margin: 0 }}>Proporsi dari mereka yang berhenti dan benar-benar masuk ke gerai.</p>
            <div style={{ marginTop: 14 }}><span className="chip" style={{ cursor: "default", fontSize: 11 }}>Survei lapangan</span></div>
          </div>
          <div style={{ borderRadius: 12, background: "#EEF2F6", padding: 24 }}>
            <span style={{ width: 44, height: 44, borderRadius: 12, background: "#475569", display: "flex", alignItems: "center", justifyContent: "center", font: "800 18px/1 var(--font-inter)", color: "#fff" }}>C</span>
            <div style={{ font: "700 15px/1.2 var(--font-inter)", margin: "16px 0 8px" }}>Konversi</div>
            <p style={{ fontSize: 12.5, lineHeight: 1.58, color: "#64748B", margin: 0 }}>Proporsi dari yang sudah masuk yang menyelesaikan pembayaran.</p>
            <div style={{ marginTop: 14 }}><span className="chip" style={{ cursor: "default", fontSize: 11 }}>Survei lapangan</span></div>
          </div>
          <div style={{ borderRadius: 12, background: "rgba(29,78,216,.08)", padding: 24 }}>
            <span style={{ width: 44, height: 44, borderRadius: 12, background: "#1D4ED8", display: "flex", alignItems: "center", justifyContent: "center", font: "800 18px/1 var(--font-inter)", color: "#fff" }}>V</span>
            <div style={{ font: "700 15px/1.2 var(--font-inter)", margin: "16px 0 8px" }}>Nilai transaksi</div>
            <p style={{ fontSize: 12.5, lineHeight: 1.58, color: "#64748B", margin: 0 }}>Jumlah akhir yang dibayarkan, diambil dari foto struk dengan aturan yang ditetapkan di muka.</p>
            <div style={{ marginTop: 14 }}><span className="chip" style={{ background: "rgba(29,78,216,.14)", borderColor: "transparent", color: "#1D4ED8", cursor: "default", fontSize: 11 }}>Ekstraksi AI</span></div>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 56px 56px" }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
          <h2 style={{ font: "800 32px/1.1 var(--font-inter)", letterSpacing: "-.025em", margin: 0 }}>Tiga simpul, tiga tipe kawasan</h2>
          <Link href="/peta" style={{ fontSize: 13, fontWeight: 600 }}>Lihat semuanya di peta →</Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
          <div className="hover-lift" style={{ borderRadius: 12, overflow: "hidden", background: "#EEF2F6", cursor: "pointer" }}>
            <svg width="100%" height="150" viewBox="0 0 420 150" preserveAspectRatio="xMidYMid slice" style={{ display: "block", background: "#F8FAFC" }}>
              <g fill="#E2E8F0"><rect x="20" y="16" width="90" height="52" rx="2" /><rect x="300" y="20" width="94" height="46" rx="2" /><rect x="30" y="100" width="80" height="42" rx="2" /></g>
              <g fill="none" stroke="#DEE5ED" strokeLinecap="round"><path d="M-10 82 C 120 58 260 96 430 70" strokeWidth="10" /><path d="M250 -10 C 266 60 240 110 268 160" strokeWidth="5" /></g>
              <path d="M210 34 C 268 38 296 62 298 76 C 300 104 260 122 208 124 C 156 126 128 100 126 76 C 124 50 152 30 210 34 Z" fill="rgba(37,99,235,.1)" stroke="rgba(37,99,235,.35)" strokeWidth="1.2" />
              <path d="M-10 122 C 100 104 160 88 210 76 C 290 56 350 46 430 26" fill="none" stroke="#94A3B8" strokeWidth="2" />
              <g transform="rotate(-14 210 76)"><rect x="176" y="66" width="70" height="20" rx="2" fill="#FFFFFF" /><text x="182" y="81" fill="#0F172A" style={{ font: "800 10px var(--font-inter)" }}>A</text></g>
              <circle cx="252" cy="98" r="18" fill="rgba(71,85,105,.14)" /><circle cx="252" cy="98" r="9" fill="#475569" />
            </svg>
            <div style={{ padding: "20px 22px 22px" }}>
              <div className="row" style={{ justifyContent: "space-between" }}><span className="k">Hunian</span><span className="chip" style={{ cursor: "default", fontSize: 11 }}>3 pintu</span></div>
              <div style={{ font: "800 21px/1.1 var(--font-inter)", margin: "12px 0 14px" }}>Stasiun A</div>
              <div className="row" style={{ justifyContent: "space-between", padding: "9px 0", borderTop: "1px solid rgba(15,23,42,.1)" }}><span style={{ fontSize: 12, color: "#64748B" }}>Kesenjangan</span><span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>Rp X,X–X,X jt</span></div>
              <div className="row" style={{ justifyContent: "space-between", padding: "9px 0", borderTop: "1px solid rgba(15,23,42,.1)" }}><span style={{ fontSize: 12, color: "#64748B" }}>Puncak arus</span><span className="mono" style={{ fontSize: 12 }}>06–09</span></div>
              <div className="row" style={{ justifyContent: "space-between", padding: "9px 0", borderTop: "1px solid rgba(15,23,42,.1)" }}><span style={{ fontSize: 12, color: "#64748B" }}>Kategori hilang</span><span className="mono" style={{ fontSize: 12 }}>X</span></div>
            </div>
          </div>
          <div className="hover-lift" style={{ borderRadius: 12, overflow: "hidden", background: "rgba(29,78,216,.06)", cursor: "pointer" }}>
            <svg width="100%" height="150" viewBox="0 0 420 150" preserveAspectRatio="xMidYMid slice" style={{ display: "block", background: "#F8FAFC" }}>
              <g fill="#E2E8F0"><rect x="16" y="20" width="100" height="50" rx="2" /><rect x="290" y="14" width="106" height="52" rx="2" /><rect x="120" y="104" width="96" height="42" rx="2" /></g>
              <g fill="none" stroke="#DEE5ED" strokeLinecap="round"><path d="M-10 88 C 130 62 270 100 430 76" strokeWidth="11" /><path d="M300 -10 C 316 60 290 110 318 160" strokeWidth="5" /></g>
              <path d="M212 26 C 280 30 310 60 312 78 C 314 110 266 128 210 130 C 154 132 120 102 118 76 C 116 48 144 22 212 26 Z" fill="rgba(37,99,235,.12)" stroke="rgba(37,99,235,.45)" strokeWidth="1.2" />
              <path d="M-10 128 C 100 108 160 92 212 78 C 292 58 352 46 430 24" fill="none" stroke="#94A3B8" strokeWidth="2" />
              <g transform="rotate(-14 212 78)"><rect x="176" y="68" width="74" height="20" rx="2" fill="#FFFFFF" /><text x="182" y="83" fill="#0F172A" style={{ font: "800 10px var(--font-inter)" }}>B</text></g>
              <circle cx="262" cy="104" r="24" fill="rgba(29,78,216,.14)" /><circle cx="262" cy="104" r="12" fill="#1D4ED8" />
              <circle cx="166" cy="60" r="14" fill="rgba(37,99,235,.14)" /><circle cx="166" cy="60" r="7" fill="#2563EB" />
            </svg>
            <div style={{ padding: "20px 22px 22px" }}>
              <div className="row" style={{ justifyContent: "space-between" }}><span className="k">Campuran</span><span className="chip" style={{ background: "rgba(29,78,216,.14)", borderColor: "transparent", color: "#1D4ED8", cursor: "default", fontSize: 11 }}>4 pintu</span></div>
              <div style={{ font: "800 21px/1.1 var(--font-inter)", margin: "12px 0 14px" }}>Stasiun B</div>
              <div className="row" style={{ justifyContent: "space-between", padding: "9px 0", borderTop: "1px solid rgba(15,23,42,.1)" }}><span style={{ fontSize: 12, color: "#64748B" }}>Kesenjangan</span><span className="mono" style={{ fontSize: 12, fontWeight: 600, color: "#1D4ED8" }}>Rp X,X–X,X jt</span></div>
              <div className="row" style={{ justifyContent: "space-between", padding: "9px 0", borderTop: "1px solid rgba(15,23,42,.1)" }}><span style={{ fontSize: 12, color: "#64748B" }}>Puncak arus</span><span className="mono" style={{ fontSize: 12 }}>11–14</span></div>
              <div className="row" style={{ justifyContent: "space-between", padding: "9px 0", borderTop: "1px solid rgba(15,23,42,.1)" }}><span style={{ fontSize: 12, color: "#64748B" }}>Kategori hilang</span><span className="mono" style={{ fontSize: 12 }}>X</span></div>
            </div>
          </div>
          <div className="hover-lift" style={{ borderRadius: 12, overflow: "hidden", background: "#EEF2F6", cursor: "pointer" }}>
            <svg width="100%" height="150" viewBox="0 0 420 150" preserveAspectRatio="xMidYMid slice" style={{ display: "block", background: "#F8FAFC" }}>
              <g fill="#E2E8F0"><rect x="24" y="14" width="86" height="56" rx="2" /><rect x="292" y="24" width="100" height="44" rx="2" /><rect x="240" y="104" width="110" height="42" rx="2" /></g>
              <g fill="none" stroke="#DEE5ED" strokeLinecap="round"><path d="M-10 78 C 130 54 270 92 430 66" strokeWidth="10" /><path d="M190 -10 C 206 60 180 110 208 160" strokeWidth="5" /></g>
              <path d="M208 40 C 258 44 284 64 286 78 C 288 102 254 118 206 120 C 158 122 134 100 132 78 C 130 56 158 36 208 40 Z" fill="rgba(37,99,235,.08)" stroke="rgba(37,99,235,.3)" strokeWidth="1.2" />
              <path d="M-10 118 C 100 100 160 86 208 74 C 288 54 348 44 430 22" fill="none" stroke="#94A3B8" strokeWidth="2" />
              <g transform="rotate(-14 208 76)"><rect x="174" y="66" width="68" height="20" rx="2" fill="#FFFFFF" /><text x="180" y="81" fill="#0F172A" style={{ font: "800 10px var(--font-inter)" }}>C</text></g>
              <circle cx="248" cy="94" r="16" fill="rgba(37,99,235,.14)" /><circle cx="248" cy="94" r="8" fill="#2563EB" />
              <circle cx="164" cy="98" r="12" fill="none" stroke="#94A3B8" strokeWidth="1.4" strokeDasharray="4 4" />
            </svg>
            <div style={{ padding: "20px 22px 22px" }}>
              <div className="row" style={{ justifyContent: "space-between" }}><span className="k">Perkantoran</span><span className="chip" style={{ cursor: "default", fontSize: 11 }}>5 pintu</span></div>
              <div style={{ font: "800 21px/1.1 var(--font-inter)", margin: "12px 0 14px" }}>Stasiun C</div>
              <div className="row" style={{ justifyContent: "space-between", padding: "9px 0", borderTop: "1px solid rgba(15,23,42,.1)" }}><span style={{ fontSize: 12, color: "#64748B" }}>Kesenjangan</span><span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>Rp X,X–X,X jt</span></div>
              <div className="row" style={{ justifyContent: "space-between", padding: "9px 0", borderTop: "1px solid rgba(15,23,42,.1)" }}><span style={{ fontSize: 12, color: "#64748B" }}>Puncak arus</span><span className="mono" style={{ fontSize: 12 }}>16–19</span></div>
              <div className="row" style={{ justifyContent: "space-between", padding: "9px 0", borderTop: "1px solid rgba(15,23,42,.1)" }}><span style={{ fontSize: 12, color: "#64748B" }}>Kategori hilang</span><span className="mono" style={{ fontSize: 12 }}>X</span></div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 56px 56px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <div style={{ borderRadius: 12, overflow: "hidden", height: 420, background: "#EEF2F6" }}>
            <ImagePlaceholder label="Foto peron / area komersial stasiun" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ borderRadius: 12, background: "#EEF2F6", padding: 32 }}>
              <div className="k" style={{ marginBottom: 16 }}>Keputusan yang bisa diambil</div>
              <h2 style={{ font: "800 28px/1.12 var(--font-inter)", letterSpacing: "-.025em", margin: "0 0 20px", textWrap: "pretty" }}>Dari peta ke keputusan sewa</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="row" style={{ gap: 14, alignItems: "flex-start" }}><span className="dot" style={{ background: "#1D4ED8", marginTop: 7 }} /><div><div style={{ fontSize: 14, fontWeight: 600 }}>Komposisi kategori penyewa per pintu</div><div style={{ fontSize: 12.5, lineHeight: 1.55, color: "#64748B", marginTop: 3 }}>Kategori yang permintaannya terbaca tinggi namun gerainya nol jadi prioritas pertama.</div></div></div>
                <div className="row" style={{ gap: 14, alignItems: "flex-start" }}><span className="dot" style={{ background: "#475569", marginTop: 7 }} /><div><div style={{ fontSize: 14, fontWeight: 600 }}>Harga sewa yang mengikuti arus, bukan luas</div><div style={{ fontSize: 12.5, lineHeight: 1.55, color: "#64748B", marginTop: 3 }}>Indeks sewa terhadap arus pejalan membuat perbedaan nilai antar pintu terlihat.</div></div></div>
                <div className="row" style={{ gap: 14, alignItems: "flex-start" }}><span className="dot" style={{ background: "#2563EB", marginTop: 7 }} /><div><div style={{ fontSize: 14, fontWeight: 600 }}>Jadwal aktivasi pada slot yang tepat</div><div style={{ fontSize: 12.5, lineHeight: 1.55, color: "#64748B", marginTop: 3 }}>Slot dengan gap terbesar menunjukkan jam yang paling layak diisi lebih dahulu.</div></div></div>
              </div>
            </div>
            <div className="row" style={{ gap: 18, borderRadius: 12, background: "rgba(29,78,216,.08)", padding: "26px 32px" }}>
              <div style={{ flex: 1 }}>
                <div className="mono" style={{ font: "800 30px/1 var(--font-inter)", letterSpacing: "-.03em", color: "#1E3A8A" }}>1 hari kerja</div>
                <p style={{ fontSize: 12.5, lineHeight: 1.55, color: "#475569", margin: "10px 0 0" }}>waktu yang dibutuhkan satu tim untuk mencacah satu simpul dan menghasilkan brief seperti di halaman peta</p>
              </div>
              <Link href="/peta" className="b bp" style={{ alignSelf: "flex-end" }}>Lihat contoh brief</Link>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, padding: "0 56px 56px" }}>
        <div style={{ borderRadius: 12, background: "#EEF2F6", padding: 32 }}>
          <h2 style={{ font: "800 26px/1.15 var(--font-inter)", letterSpacing: "-.02em", margin: "0 0 22px" }}>Untuk siapa</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="row" style={{ gap: 16, alignItems: "flex-start" }}><span style={{ width: 26, height: 26, borderRadius: 12, background: "#2563EB", flex: "none", display: "flex", alignItems: "center", justifyContent: "center", font: "700 11px/1 var(--font-inter)", color: "#F8FAFC" }}>01</span><div><div style={{ fontSize: 14, fontWeight: 600 }}>Operator transportasi &amp; pengelola kawasan</div><div style={{ fontSize: 12.5, lineHeight: 1.55, color: "#64748B", marginTop: 4 }}>Dasar terukur untuk komposisi kategori penyewa dan peninjauan harga sewa.</div></div></div>
            <div className="row" style={{ gap: 16, alignItems: "flex-start" }}><span style={{ width: 26, height: 26, borderRadius: 12, background: "#2563EB", flex: "none", display: "flex", alignItems: "center", justifyContent: "center", font: "700 11px/1 var(--font-inter)", color: "#fff" }}>02</span><div><div style={{ fontSize: 14, fontWeight: 600 }}>Pelaku usaha kecil</div><div style={{ fontSize: 12.5, lineHeight: 1.55, color: "#64748B", marginTop: 4 }}>Akses terbuka ke informasi arus dan potensi belanja yang selama ini hanya dimiliki pihak bermodal besar.</div></div></div>
            <div className="row" style={{ gap: 16, alignItems: "flex-start" }}><span style={{ width: 26, height: 26, borderRadius: 12, background: "#475569", flex: "none", display: "flex", alignItems: "center", justifyContent: "center", font: "700 11px/1 var(--font-inter)", color: "#fff" }}>03</span><div><div style={{ fontSize: 14, fontWeight: 600 }}>Pemerintah daerah, perencana kota, akademisi</div><div style={{ fontSize: 12.5, lineHeight: 1.55, color: "#64748B", marginTop: 4 }}>Protokol pencacahan diterbitkan terbuka agar kota lain dapat menghasilkan lapisan setara.</div></div></div>
          </div>
        </div>
        <div style={{ borderRadius: 12, background: "#EEF2F6", padding: 32 }}>
          <h2 style={{ font: "800 26px/1.15 var(--font-inter)", letterSpacing: "-.02em", margin: "0 0 22px" }}>Yang kami nyatakan terbuka</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 12.5, lineHeight: 1.6, color: "#475569" }}>
            <div className="row" style={{ gap: 11, alignItems: "flex-start" }}><span className="dot" style={{ background: "#1D4ED8", marginTop: 6 }} /><span>Estimasi potensi <b style={{ color: "#0F172A" }}>bukan</b> proyeksi pendapatan pasti — biaya operasi dan risiko usaha tidak diperhitungkan.</span></div>
            <div className="row" style={{ gap: 11, alignItems: "flex-start" }}><span className="dot" style={{ background: "#475569", marginTop: 6 }} /><span>Tiga stasiun berarti hasilnya indikatif; seluruh pengujian bersifat kalibrasi, bukan pembuktian.</span></div>
            <div className="row" style={{ gap: 11, alignItems: "flex-start" }}><span className="dot" style={{ background: "#2563EB", marginTop: 6 }} /><span>Kawasan dengan sampel tipis ditandai dan tidak diberi estimasi.</span></div>
            <div className="row" style={{ gap: 11, alignItems: "flex-start" }}><span className="dot" style={{ background: "#2563EB", marginTop: 6 }} /><span>Peta potensi tinggi dapat mendorong kenaikan sewa. Risiko ini dan mitigasinya dinyatakan, bukan disembunyikan.</span></div>
          </div>
          <Link href="/metodologi" style={{ display: "inline-block", fontSize: 13, fontWeight: 600, marginTop: 20 }}>Baca keterbatasan lengkap →</Link>
        </div>
      </div>

      <div style={{ padding: "44px 56px 56px", borderTop: "1px solid #E2E8F0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 56, alignItems: "end" }}>
          <div>
            <div className="k" style={{ marginBottom: 16 }}>Rantai sebabnya sederhana</div>
            <h2 style={{ fontSize: 34, lineHeight: 1.15, letterSpacing: "-.02em", margin: 0, maxWidth: "26ch", textWrap: "pretty" }}>Setiap rupiah non-tiket yang tertangkap mengurangi ketergantungan pada subsidi.</h2>
          </div>
          <div>
            <p style={{ fontSize: 13.5, lineHeight: 1.62, color: "#475569", margin: "0 0 22px" }}>Ruang fiskal yang terbebas dapat dipakai memperluas jangkauan layanan.</p>
            <Link href="/peta" className="b bp" style={{ padding: "14px 24px", fontSize: 14 }}>Buka peta interaktif</Link>
          </div>
        </div>
      </div>

      <div className="row" style={{ justifyContent: "space-between", padding: "20px 56px 28px", borderTop: "1px solid rgba(15,23,42,.1)" }}>
        <span style={{ fontSize: 11.5, color: "#94A3B8" }}>Isi Stasiun · dibangun di atas GEO MAPID · seluruh angka pada halaman ini bersifat ilustratif</span>
        <span className="mono" style={{ fontSize: 11.5, color: "#94A3B8" }}>Protokol &amp; data terbuka</span>
      </div>
    </div>
  );
}
