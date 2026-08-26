import Link from "next/link";
import { NavBar } from "@/components/NavBar";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";

export default function RekomendasiPage() {
  return (
    <div className="page-canvas">
      <NavBar active="rekomendasi" cta={<button className="b bp">Unduh paket rekomendasi</button>} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 48, padding: "60px 56px 52px", alignItems: "end" }}>
        <div>
          <h1 style={{ font: "800 56px/1.02 var(--font-inter)", letterSpacing: "-.035em", margin: "24px 0 0", maxWidth: "22ch", textWrap: "pretty" }}>
            Slot mana yang diisi lebih dahulu, dan mengapa.
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.62, color: "#475569", maxWidth: "56ch", margin: "24px 0 0" }}>
            Rekomendasi hanya diberikan untuk pintu dan slot yang sampelnya memadai. Urutannya mengikuti besar kesenjangan, bukan luas ruang yang tersedia.
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="row" style={{ justifyContent: "space-between", borderRadius: 12, background: "rgba(29,78,216,.08)", padding: "20px 24px" }}>
            <span style={{ fontSize: 13, color: "#475569" }}>Total kesenjangan tiga simpul</span>
            <span className="mono" style={{ font: "800 18px/1 var(--font-inter)", color: "#1D4ED8" }}>Rp 6.400.000</span>
          </div>
          <div className="row" style={{ justifyContent: "space-between", borderRadius: 12, background: "#F1F5F9", padding: "20px 24px" }}>
            <span style={{ fontSize: 13, color: "#475569" }}>Slot layak direkomendasikan</span>
            <span className="mono" style={{ font: "800 18px/1 var(--font-inter)" }}>34 dari 48</span>
          </div>
          <div className="row" style={{ justifyContent: "space-between", borderRadius: 12, background: "#F1F5F9", padding: "20px 24px" }}>
            <span style={{ fontSize: 13, color: "#475569" }}>Ditunda karena sampel tipis</span>
            <span className="mono" style={{ font: "800 18px/1 var(--font-inter)", color: "#64748B" }}>14 slot</span>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 56px 56px" }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
          <h2 style={{ font: "800 32px/1.1 var(--font-inter)", letterSpacing: "-.025em", margin: 0 }}>Urutan prioritas</h2>
          <div className="row" style={{ gap: 6 }}>
            <span className="chip" style={{ background: "#0F172A", color: "#fff", borderColor: "#0F172A" }}>Semua simpul</span>
            <span className="chip">Stasiun A</span>
            <span className="chip">Stasiun B</span>
            <span className="chip">Stasiun C</span>
          </div>
        </div>
        <div style={{ borderRadius: 12, overflow: "hidden", background: "#EEF2F6" }}>
          <div className="row" style={{ gap: 16, padding: "14px 24px", background: "#F1F5F9" }}>
            <span className="k" style={{ width: 34 }}>#</span>
            <span className="k" style={{ flex: 1.4 }}>Lokasi</span>
            <span className="k" style={{ flex: 1.1 }}>Kategori yang disarankan</span>
            <span className="k" style={{ width: 96 }}>Slot</span>
            <span className="k" style={{ width: 120, textAlign: "right" }}>Kesenjangan</span>
            <span className="k" style={{ width: 118 }}>Kepercayaan</span>
          </div>
          <div className="row" style={{ gap: 16, padding: "18px 24px", background: "rgba(29,78,216,.06)" }}>
            <span className="mono" style={{ width: 34, font: "800 14px/1 var(--font-inter)", color: "#1D4ED8" }}>01</span>
            <span style={{ flex: 1.4, fontSize: 13.5, fontWeight: 600 }}>Stasiun B · Pintu 4</span>
            <span style={{ flex: 1.1, fontSize: 13 }} className="row"><span className="dot" style={{ background: "#2563EB", marginRight: 8 }} />Apotek &amp; kesehatan</span>
            <span className="mono" style={{ width: 96, fontSize: 12.5 }}>06–09</span>
            <span className="mono" style={{ width: 120, textAlign: "right", fontSize: 13, fontWeight: 700, color: "#1D4ED8" }}>Rp 1.800.000</span>
            <span style={{ width: 118 }} className="row"><span className="pill" style={{ width: 56, height: 6, background: "rgba(15,23,42,.1)" }}><span className="pill" style={{ display: "block", width: "86%", height: 6, background: "#1D4ED8" }} /></span><span className="mono" style={{ fontSize: 10.5, color: "#64748B", marginLeft: 8 }}>tinggi</span></span>
          </div>
          <div className="row" style={{ gap: 16, padding: "18px 24px", background: "#fff" }}>
            <span className="mono" style={{ width: 34, font: "800 14px/1 var(--font-inter)", color: "#94A3B8" }}>02</span>
            <span style={{ flex: 1.4, fontSize: 13.5, fontWeight: 600 }}>Stasiun C · Pintu 2</span>
            <span style={{ flex: 1.1, fontSize: 13 }} className="row"><span className="dot" style={{ background: "#1D4ED8", marginRight: 8 }} />F&amp;B cepat</span>
            <span className="mono" style={{ width: 96, fontSize: 12.5 }}>16–19</span>
            <span className="mono" style={{ width: 120, textAlign: "right", fontSize: 13, fontWeight: 700 }}>Rp 1.400.000</span>
            <span style={{ width: 118 }} className="row"><span className="pill" style={{ width: 56, height: 6, background: "rgba(15,23,42,.1)" }}><span className="pill" style={{ display: "block", width: "74%", height: 6, background: "#1D4ED8" }} /></span><span className="mono" style={{ fontSize: 10.5, color: "#64748B", marginLeft: 8 }}>tinggi</span></span>
          </div>
          <div className="row" style={{ gap: 16, padding: "18px 24px", background: "#F1F5F9" }}>
            <span className="mono" style={{ width: 34, font: "800 14px/1 var(--font-inter)", color: "#94A3B8" }}>03</span>
            <span style={{ flex: 1.4, fontSize: 13.5, fontWeight: 600 }}>Stasiun A · Pintu 1</span>
            <span style={{ flex: 1.1, fontSize: 13 }} className="row"><span className="dot" style={{ background: "#475569", marginRight: 8 }} />Ritel kebutuhan harian</span>
            <span className="mono" style={{ width: 96, fontSize: 12.5 }}>06–09</span>
            <span className="mono" style={{ width: 120, textAlign: "right", fontSize: 13, fontWeight: 700 }}>Rp 900.000</span>
            <span style={{ width: 118 }} className="row"><span className="pill" style={{ width: 56, height: 6, background: "rgba(15,23,42,.1)" }}><span className="pill" style={{ display: "block", width: "58%", height: 6, background: "#60A5FA" }} /></span><span className="mono" style={{ fontSize: 10.5, color: "#64748B", marginLeft: 8 }}>sedang</span></span>
          </div>
          <div className="row" style={{ gap: 16, padding: "18px 24px", background: "#fff" }}>
            <span className="mono" style={{ width: 34, font: "800 14px/1 var(--font-inter)", color: "#94A3B8" }}>04</span>
            <span style={{ flex: 1.4, fontSize: 13.5, fontWeight: 600 }}>Stasiun B · Pintu 1</span>
            <span style={{ flex: 1.1, fontSize: 13 }} className="row"><span className="dot" style={{ background: "#2563EB", marginRight: 8 }} />Jasa titip &amp; kurir</span>
            <span className="mono" style={{ width: 96, fontSize: 12.5 }}>11–14</span>
            <span className="mono" style={{ width: 120, textAlign: "right", fontSize: 13, fontWeight: 700 }}>Rp 700.000</span>
            <span style={{ width: 118 }} className="row"><span className="pill" style={{ width: 56, height: 6, background: "rgba(15,23,42,.1)" }}><span className="pill" style={{ display: "block", width: "52%", height: 6, background: "#60A5FA" }} /></span><span className="mono" style={{ fontSize: 10.5, color: "#64748B", marginLeft: 8 }}>sedang</span></span>
          </div>
          <div className="row" style={{ gap: 16, padding: "18px 24px", background: "#F1F5F9" }}>
            <span className="mono" style={{ width: 34, font: "800 14px/1 var(--font-inter)", color: "#CBD5E1" }}>—</span>
            <span style={{ flex: 1.4, fontSize: 13.5, color: "#94A3B8" }}>Stasiun B · Pintu 3</span>
            <span style={{ flex: 1.1, fontSize: 13, color: "#94A3B8" }} className="row"><span style={{ width: 9, height: 9, borderRadius: 12, border: "1.5px dashed #94A3B8", marginRight: 8 }} />Belum direkomendasikan</span>
            <span className="mono" style={{ width: 96, fontSize: 12.5, color: "#94A3B8" }}>—</span>
            <span className="mono" style={{ width: 120, textAlign: "right", fontSize: 12, color: "#94A3B8" }}>tidak diestimasi</span>
            <span style={{ width: 118, fontSize: 10.5, color: "#94A3B8" }}>sampel tipis</span>
          </div>
        </div>
        <div className="row" style={{ gap: 10, marginTop: 14, alignItems: "flex-start" }}>
          <span className="dot" style={{ background: "#94A3B8", marginTop: 6 }} />
          <span style={{ fontSize: 11.5, lineHeight: 1.5, color: "#64748B", maxWidth: "80ch" }}>Baris tanpa peringkat berarti data belum memadai. Slot tersebut menunggu putaran pencacahan berikutnya, dan tidak diisi dengan angka pinjaman.</span>
        </div>
      </div>

      <div style={{ padding: "0 56px 56px" }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
          <h2 style={{ font: "800 32px/1.1 var(--font-inter)", letterSpacing: "-.025em", margin: 0 }}>Tiga rekomendasi utama</h2>
          <span style={{ fontSize: 12.5, color: "#64748B", maxWidth: "44ch", textAlign: "right" }}>Setiap rekomendasi menyebut dasar datanya, dan apa yang harus diukur ulang setelah dijalankan.</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
          <div style={{ borderRadius: 12, background: "rgba(29,78,216,.07)", padding: 30, display: "flex", flexDirection: "column" }}>
            <div className="row" style={{ justifyContent: "space-between" }}><span className="k" style={{ color: "#1D4ED8" }}>Prioritas 01</span><span className="chip" style={{ background: "rgba(29,78,216,.14)", borderColor: "transparent", color: "#1D4ED8", cursor: "default" }}>Kuartal ini</span></div>
            <h3 style={{ font: "800 21px/1.15 var(--font-inter)", letterSpacing: "-.015em", margin: "18px 0 12px" }}>Isi Pintu 4 dengan gerai apotek berformat kecil</h3>
            <p style={{ fontSize: 13, lineHeight: 1.58, color: "#475569", margin: "0 0 20px" }}>Permintaan kategori ini terbaca 37% pada slot 06–09 tanpa satu pun gerai di dalam stasiun, sementara arus pintu tergolong tertinggi.</p>
            <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 9 }}>
              <div className="row" style={{ justifyContent: "space-between", fontSize: 12 }}><span style={{ color: "#64748B" }}>Potensi tertangkap</span><span className="mono" style={{ fontWeight: 700, color: "#1D4ED8" }}>Rp 1.800.000 / hari</span></div>
              <div className="row" style={{ justifyContent: "space-between", fontSize: 12 }}><span style={{ color: "#64748B" }}>Ukur ulang setelah</span><span className="mono">6 minggu</span></div>
              <div className="row" style={{ justifyContent: "space-between", fontSize: 12 }}><span style={{ color: "#64748B" }}>Dasar data</span><span className="mono">4 slot · 96 struk</span></div>
            </div>
          </div>
          <div style={{ borderRadius: 12, background: "rgba(71,85,105,.08)", padding: 30, display: "flex", flexDirection: "column" }}>
            <div className="row" style={{ justifyContent: "space-between" }}><span className="k" style={{ color: "#334155" }}>Prioritas 02</span><span className="chip" style={{ background: "rgba(71,85,105,.14)", borderColor: "transparent", color: "#334155", cursor: "default" }}>2 kuartal</span></div>
            <h3 style={{ font: "800 21px/1.15 var(--font-inter)", letterSpacing: "-.015em", margin: "18px 0 12px" }}>Ubah dasar sewa dari luas ruang ke arus pintu</h3>
            <p style={{ fontSize: 13, lineHeight: 1.58, color: "#475569", margin: "0 0 20px" }}>Indeks sewa terhadap arus menunjukkan pintu dengan arus tinggi dihargai setara pintu sepi, sehingga nilai ruang tidak tercermin.</p>
            <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 9 }}>
              <div className="row" style={{ justifyContent: "space-between", fontSize: 12 }}><span style={{ color: "#64748B" }}>Cakupan</span><span className="mono" style={{ fontWeight: 700 }}>24 titik sewa</span></div>
              <div className="row" style={{ justifyContent: "space-between", fontSize: 12 }}><span style={{ color: "#64748B" }}>Ukur ulang setelah</span><span className="mono">3 bulan</span></div>
              <div className="row" style={{ justifyContent: "space-between", fontSize: 12 }}><span style={{ color: "#64748B" }}>Dasar data</span><span className="mono">3 simpul · 4 slot</span></div>
            </div>
          </div>
          <div style={{ borderRadius: 12, background: "rgba(37,99,235,.09)", padding: 30, display: "flex", flexDirection: "column" }}>
            <div className="row" style={{ justifyContent: "space-between" }}><span className="k" style={{ color: "#1D4ED8" }}>Prioritas 03</span><span className="chip" style={{ background: "rgba(37,99,235,.16)", borderColor: "transparent", color: "#1D4ED8", cursor: "default" }}>Berjalan</span></div>
            <h3 style={{ font: "800 21px/1.15 var(--font-inter)", letterSpacing: "-.015em", margin: "18px 0 12px" }}>Perluas pencacahan ke simpul dengan sampel tipis</h3>
            <p style={{ fontSize: 13, lineHeight: 1.58, color: "#475569", margin: "0 0 20px" }}>Kawasan bertanda sampel tipis menahan sebagian rekomendasi. Satu putaran tambahan cukup untuk menaikkannya ke tingkat kepercayaan yang sama.</p>
            <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 9 }}>
              <div className="row" style={{ justifyContent: "space-between", fontSize: 12 }}><span style={{ color: "#64748B" }}>Slot terbuka</span><span className="mono" style={{ fontWeight: 700 }}>14 slot</span></div>
              <div className="row" style={{ justifyContent: "space-between", fontSize: 12 }}><span style={{ color: "#64748B" }}>Kebutuhan</span><span className="mono">5 hari kerja</span></div>
              <div className="row" style={{ justifyContent: "space-between", fontSize: 12 }}><span style={{ color: "#64748B" }}>Hasil</span><span className="mono">lapisan penuh</span></div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 56px 56px" }}>
        <div style={{ borderRadius: 12, background: "#0F172A", padding: 44, position: "relative", overflow: "hidden" }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end", marginBottom: 34, position: "relative" }}>
            <h2 style={{ font: "800 30px/1.1 var(--font-inter)", letterSpacing: "-.025em", color: "#fff", margin: 0 }}>Urutan pelaksanaan</h2>
            <span className="mono" style={{ fontSize: 12, color: "rgba(255,255,255,.55)" }}>tiga fase · satu tahun</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 0, position: "relative" }}>
            <div style={{ paddingRight: 28 }}>
              <div className="row" style={{ gap: 10, marginBottom: 18 }}><span style={{ width: 12, height: 12, borderRadius: 12, background: "#2563EB", flex: "none" }} /><span style={{ flex: 1, height: 2, background: "rgba(255,255,255,.16)" }} /></div>
              <div className="k" style={{ color: "#93C5FD", marginBottom: 10 }}>Fase 1 · Kuartal ini</div>
              <div style={{ font: "700 17px/1.25 var(--font-inter)", color: "#fff", marginBottom: 10 }}>Isi slot prioritas pertama</div>
              <p style={{ fontSize: 12.5, lineHeight: 1.58, color: "rgba(255,255,255,.62)", margin: 0 }}>Satu gerai baru di pintu dengan gap terbesar, dengan pengukuran sebelum dan sesudah pada slot yang sama.</p>
            </div>
            <div style={{ paddingRight: 28 }}>
              <div className="row" style={{ gap: 10, marginBottom: 18 }}><span style={{ width: 12, height: 12, borderRadius: 12, background: "#475569", flex: "none" }} /><span style={{ flex: 1, height: 2, background: "rgba(255,255,255,.16)" }} /></div>
              <div className="k" style={{ color: "#93C5FD", marginBottom: 10 }}>Fase 2 · 2 kuartal</div>
              <div style={{ font: "700 17px/1.25 var(--font-inter)", color: "#fff", marginBottom: 10 }}>Tinjau dasar penetapan sewa</div>
              <p style={{ fontSize: 12.5, lineHeight: 1.58, color: "rgba(255,255,255,.62)", margin: 0 }}>Indeks sewa terhadap arus dipakai sebagai salah satu dasar peninjauan harga di seluruh titik sewa.</p>
            </div>
            <div>
              <div className="row" style={{ gap: 10, marginBottom: 18 }}><span style={{ width: 12, height: 12, borderRadius: 12, background: "#1D4ED8", flex: "none" }} /></div>
              <div className="k" style={{ color: "#93C5FD", marginBottom: 10 }}>Fase 3 · Tahun berjalan</div>
              <div style={{ font: "700 17px/1.25 var(--font-inter)", color: "#fff", marginBottom: 10 }}>Perluas ke simpul lain</div>
              <p style={{ fontSize: 12.5, lineHeight: 1.58, color: "rgba(255,255,255,.62)", margin: 0 }}>Protokol yang sama dijalankan di simpul berikutnya agar lapisannya dapat dibandingkan langsung.</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, padding: "0 56px 56px" }}>
        <div style={{ borderRadius: 12, background: "#EEF2F6", padding: 34 }}>
          <h2 style={{ font: "800 26px/1.15 var(--font-inter)", letterSpacing: "-.02em", margin: "0 0 22px" }}>Risiko dan penanganannya</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div><div className="row" style={{ gap: 10, marginBottom: 5 }}><span className="dot" style={{ background: "#1D4ED8" }} /><span style={{ fontSize: 14, fontWeight: 600 }}>Peta potensi mendorong kenaikan sewa</span></div><p style={{ fontSize: 12.5, lineHeight: 1.58, color: "#64748B", margin: "0 0 0 18px" }}>Lapisan diterbitkan bersama indeks sewa terhadap arus, sehingga kenaikan yang tidak sebanding dengan arus terlihat sebagai kejanggalan.</p></div>
            <div><div className="row" style={{ gap: 10, marginBottom: 5 }}><span className="dot" style={{ background: "#475569" }} /><span style={{ fontSize: 14, fontWeight: 600 }}>Angka dibaca sebagai jaminan pendapatan</span></div><p style={{ fontSize: 12.5, lineHeight: 1.58, color: "#64748B", margin: "0 0 0 18px" }}>Setiap tampilan menyebut rentang dan batasannya; tidak ada satu angka tunggal yang berdiri sendiri.</p></div>
            <div><div className="row" style={{ gap: 10, marginBottom: 5 }}><span className="dot" style={{ background: "#2563EB" }} /><span style={{ fontSize: 14, fontWeight: 600 }}>Tiga simpul belum mewakili jaringan</span></div><p style={{ fontSize: 12.5, lineHeight: 1.58, color: "#64748B", margin: "0 0 0 18px" }}>Hasilnya dinyatakan indikatif, dan protokolnya dibuka agar simpul lain dapat diukur dengan cara yang sama.</p></div>
          </div>
        </div>
        <div style={{ borderRadius: 12, overflow: "hidden", background: "#EEF2F6", minHeight: 340 }}>
          <ImagePlaceholder label="Foto area komersial / gerai stasiun" />
        </div>
      </div>

      <div style={{ padding: "44px 56px 56px", borderTop: "1px solid #E2E8F0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 56, alignItems: "end" }}>
          <div>
            <div className="k" style={{ marginBottom: 16 }}>Langkah berikutnya</div>
            <h2 style={{ fontSize: 32, lineHeight: 1.15, letterSpacing: "-.02em", margin: 0, maxWidth: "28ch", textWrap: "pretty" }}>Satu simpul, satu hari kerja, satu brief yang bisa langsung dibahas.</h2>
          </div>
          <div>
            <p style={{ fontSize: 13.5, lineHeight: 1.62, color: "#475569", margin: "0 0 22px" }}>Kami siap menjalankan putaran pencacahan berikutnya di simpul pilihan Anda.</p>
            <button className="b bp" style={{ padding: "14px 24px", fontSize: 14 }}>Unduh paket rekomendasi</button>
          </div>
        </div>
      </div>

      <div className="row" style={{ justifyContent: "space-between", padding: "20px 56px 28px", borderTop: "1px solid rgba(15,23,42,.1)" }}>
        <span style={{ fontSize: 11.5, color: "#94A3B8" }}>Isi Stasiun · dibangun di atas GEO MAPID · seluruh angka pada halaman ini bersifat ilustratif</span>
        <Link href="/peta" style={{ fontSize: 11.5, fontWeight: 600 }}>Kembali ke peta →</Link>
      </div>
    </div>
  );
}
