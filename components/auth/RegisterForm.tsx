"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { ApiError } from "@/lib/auth/client";
import { useAuth } from "./AuthProvider";

export function RegisterForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const { status, register } = useAuth();
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") router.replace(nextPath);
  }, [status, nextPath, router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    if (!email || !email.includes("@")) {
      setError("Masukkan alamat email yang valid.");
      return;
    }
    if (password.length < 8) {
      setError("Kata sandi minimal 8 karakter.");
      return;
    }
    if (password !== confirm) {
      setError("Kata sandi dan konfirmasinya tidak sama.");
      return;
    }

    setPending(true);
    try {
      await register(email, password);
      router.replace(nextPath);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 400) {
        setError("Email ini sudah terdaftar.");
      } else if (cause instanceof Error) {
        setError(cause.message);
      } else {
        setError("Pendaftaran gagal. Coba kembali.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      <div className="auth-field">
        <label htmlFor="register-email">Email</label>
        <input
          id="register-email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          placeholder="nama@contoh.id"
          required
          autoFocus
        />
      </div>

      <div className="auth-field">
        <label htmlFor="register-password">Kata sandi</label>
        <div className="auth-password-wrap">
          <input
            id="register-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            minLength={8}
            required
          />
          <button
            type="button"
            className="auth-password-toggle"
            aria-pressed={showPassword}
            onClick={() => setShowPassword((visible) => !visible)}
          >
            {showPassword ? "Sembunyikan" : "Tampilkan"}
          </button>
        </div>
      </div>

      <div className="auth-field">
        <label htmlFor="register-confirm">Ulangi kata sandi</label>
        <input
          id="register-confirm"
          name="confirm"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="••••••••"
          minLength={8}
          required
        />
      </div>

      {error && (
        <p className="auth-error" role="alert" aria-live="polite">
          {error}
        </p>
      )}

      <button className="b bp auth-submit" type="submit" disabled={pending}>
        {pending ? "Mendaftar…" : "Daftar"}
      </button>
      <p className="auth-help">
        Sudah punya akun? <Link href="/login">Masuk</Link>.
      </p>
    </form>
  );
}
