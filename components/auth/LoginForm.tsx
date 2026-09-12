"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { ApiError } from "@/lib/auth/client";
import { useAuth } from "./AuthProvider";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const { status, login } = useAuth();
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
    if (!email || !email.includes("@")) {
      setError("Masukkan alamat email operator yang valid.");
      return;
    }
    if (password.length < 8) {
      setError("Kata sandi minimal 8 karakter.");
      return;
    }

    setPending(true);
    try {
      await login(email, password);
      router.replace(nextPath);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        setError("Email atau kata sandi tidak cocok.");
      } else if (cause instanceof Error) {
        setError(cause.message);
      } else {
        setError("Login gagal. Coba kembali.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      <div className="auth-field">
        <label htmlFor="operator-email">Email operator</label>
        <input
          id="operator-email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          placeholder="operator@contoh.id"
          required
          autoFocus
        />
      </div>

      <div className="auth-field">
        <label htmlFor="operator-password">Kata sandi</label>
        <div className="auth-password-wrap">
          <input
            id="operator-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
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

      {error && (
        <p className="auth-error" role="alert" aria-live="polite">
          {error}
        </p>
      )}

      <button className="b bp auth-submit" type="submit" disabled={pending}>
        {pending ? "Memeriksa…" : "Masuk ke analisis premium"}
      </button>
      <p className="auth-security-note">
        Refresh session disimpan sebagai cookie HttpOnly. Token tidak disimpan
        di localStorage.
      </p>
    </form>
  );
}
