import Link from "next/link";

import { LoginForm } from "@/components/auth/LoginForm";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";

function safeNext(value: string | string[] | undefined): string {
  const path = Array.isArray(value) ? value[0] : value;
  return path?.startsWith("/") && !path.startsWith("//") ? path : "/peta";
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const query = await searchParams;
  const nextPath = safeNext(query.next);

  return (
    <main className="page-canvas paper-canvas auth-page">
      <NavBar
        active="login"
        showAuth={false}
        cta={
          <Link href="/peta" className="b bs">
            Kembali ke peta
          </Link>
        }
      />
      <section className="auth-shell" aria-labelledby="login-title">
        <div className="auth-intro">
          <span className="eyebrow-chip">Masuk diperlukan</span>
          <h1 id="login-title">Masuk untuk membuka peta dan analitiknya.</h1>
          <p>
            Akun gratis sudah cukup untuk peta dan analitik dasar. Yang butuh
            langganan atau akun operator hanya lapisan yang lebih rinci:
          </p>
          <ul>
            <li>Kesenjangan belanja per slot waktu, bukan hanya totalnya.</li>
            <li>Petak sewa yang harganya menyimpang dari arus pengunjungnya.</li>
            <li>Jumlah sampel di balik tiap angka, termasuk yang masih tipis.</li>
          </ul>
        </div>
        <div className="auth-card">
          <div className="auth-card-head">
            <span className="k">Masuk</span>
            <span className="auth-lock" aria-hidden="true">
              ↗
            </span>
          </div>
          <LoginForm nextPath={nextPath} />
        </div>
      </section>
      <Footer />
    </main>
  );
}
