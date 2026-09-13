import Link from "next/link";

import { RegisterForm } from "@/components/auth/RegisterForm";
import { NavBar } from "@/components/NavBar";

function safeNext(value: string | string[] | undefined): string {
  const path = Array.isArray(value) ? value[0] : value;
  return path?.startsWith("/") && !path.startsWith("//") ? path : "/peta";
}

export default async function RegisterPage({
  searchParams,
}: PageProps<"/register">) {
  const query = await searchParams;
  const nextPath = safeNext(query.next);

  return (
    <main className="page-canvas paper-canvas auth-page">
      <NavBar
        active="register"
        showAuth={false}
        cta={
          <Link href="/login" className="b bs">
            Sudah punya akun?
          </Link>
        }
      />
      <section className="auth-shell" aria-labelledby="register-title">
        <div className="auth-intro">
          <span className="eyebrow-chip">Akun gratis</span>
          <h1 id="register-title">Daftar untuk membuka peta dan analitiknya.</h1>
          <p>
            Akun gratis cukup untuk peta dan analitik dasar. Kalau nanti mau
            lapisan yang lebih rinci, akun ini bisa di-upgrade ke premium
            kapan saja dari halaman Premium.
          </p>
          <ul>
            <li>Peta interaktif, filter slot dan kategori.</li>
            <li>Panel transparansi bukti di balik tiap angka.</li>
            <li>Upgrade ke premium kapan saja, tanpa akun baru.</li>
          </ul>
        </div>
        <div className="auth-card">
          <div className="auth-card-head">
            <span className="k">Daftar</span>
            <span className="auth-lock" aria-hidden="true">
              ↗
            </span>
          </div>
          <RegisterForm nextPath={nextPath} />
        </div>
      </section>
    </main>
  );
}
