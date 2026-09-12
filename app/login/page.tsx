import Link from "next/link";

import { LoginForm } from "@/components/auth/LoginForm";
import { NavBar } from "@/components/NavBar";

function safeNext(value: string | string[] | undefined): string {
  const path = Array.isArray(value) ? value[0] : value;
  return path?.startsWith("/") && !path.startsWith("//") ? path : "/premium";
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
          <span className="eyebrow-chip">Akses operator</span>
          <h1 id="login-title">Masuk untuk membaca lapisan yang lebih dalam.</h1>
          <p>
            Peta dan analitik dasar tetap terbuka untuk siapa pun. Akun ini
            hanya diperlukan untuk lapisan yang lebih rinci:
          </p>
          <ul>
            <li>Kesenjangan belanja per slot waktu, bukan hanya totalnya.</li>
            <li>Petak sewa yang harganya menyimpang dari arus pengunjungnya.</li>
            <li>Jumlah sampel di balik tiap angka, termasuk yang masih tipis.</li>
          </ul>
        </div>
        <div className="auth-card">
          <div className="auth-card-head">
            <span className="k">Akun operator</span>
            <span className="auth-lock" aria-hidden="true">
              ↗
            </span>
          </div>
          <LoginForm nextPath={nextPath} />
        </div>
      </section>
    </main>
  );
}
