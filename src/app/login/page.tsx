"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Loader2, Lock, User } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Não foi possível entrar.");
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(600px circle at 20% 20%, rgba(63,107,255,0.08), transparent 60%), radial-gradient(500px circle at 85% 80%, rgba(212,168,83,0.10), transparent 60%)",
        }}
      />
      <div className="w-full max-w-sm rounded-2xl border border-control-line bg-control-surface p-8 shadow-[0_1px_2px_rgba(15,23,41,0.04),0_24px_48px_-24px_rgba(15,23,41,0.18)]">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Image
            src="/logo-icon.png"
            alt="Control"
            width={56}
            height={56}
            className="size-14 rounded-2xl shadow-[0_4px_14px_-4px_rgba(37,84,240,0.35)]"
            priority
          />
          <div>
            <span className="text-xl font-bold tracking-tight text-control-ink">CONTROL</span>
            <p className="mt-0.5 text-sm text-control-ink/45">
              Painel Marketing · Comercial · Operacional
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className="text-sm font-medium text-control-ink/70">
              Usuário
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-control-ink/30" />
              <input
                id="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-[10px] border border-control-line py-2 pl-9 pr-3 text-sm outline-none transition focus:border-control-blue-500 focus:ring-4 focus:ring-control-blue-500/10"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-control-ink/70">
              Senha
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-control-ink/30" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-[10px] border border-control-line py-2 pl-9 pr-9 text-sm outline-none transition focus:border-control-blue-500 focus:ring-4 focus:ring-control-blue-500/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-control-ink/30 transition hover:text-control-ink/60"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-control-danger-100 px-3 py-2 text-sm text-control-danger-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-[10px] bg-control-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(37,84,240,0.25),0_4px_10px_-4px_rgba(37,84,240,0.35)] transition hover:bg-control-blue-700 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
