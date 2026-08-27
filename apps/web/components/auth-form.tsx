"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { signIn } = useAuthActions();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      await signIn("password", {
        flow: mode === "login" ? "signIn" : "signUp",
        email: String(form.get("email")),
        password: String(form.get("password")),
      });
    } catch {
      setError("Impossible de se connecter pour le moment. Vérifie tes informations.");
    } finally {
      setLoading(false);
    }
  }

  const login = mode === "login";
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-5 py-10">
      <section className="w-full max-w-md rounded-[20px] bg-white p-7 shadow-[0_18px_50px_rgba(74,38,48,.08)] sm:p-10">
        <Link href="/" className="inline-block">
          <Image src="/brand/wordmark-framboise.png" alt="Sutura" width={108} height={34} priority />
        </Link>
        <p className="mt-12 text-xs font-bold uppercase tracking-[0.2em] text-framboise">{login ? "Ton atelier" : "Bienvenue"}</p>
        <h1 className="display-font mt-3 text-5xl font-semibold leading-none text-prune">{login ? "Ravi de te revoir." : "Créer mon espace."}</h1>
        <p className="mt-4 text-sm leading-6 text-prune/65">{login ? "Retrouve tes collections et continue tes décisions." : "Un espace simple pour tester tes idées avant de produire."}</p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block text-sm font-semibold text-prune">Adresse email<input required name="email" type="email" autoComplete="email" className="mt-2 h-12 w-full rounded-[14px] border border-line bg-canvas px-4 outline-none transition focus:border-framboise" /></label>
          <label className="block text-sm font-semibold text-prune">Mot de passe<input required name="password" type="password" minLength={8} autoComplete={login ? "current-password" : "new-password"} className="mt-2 h-12 w-full rounded-[14px] border border-line bg-canvas px-4 outline-none transition focus:border-framboise" /></label>
          {error && <p role="alert" className="rounded-[10px] bg-rose-pale px-3 py-2 text-sm text-[#a12936]">{error}</p>}
          <button disabled={loading} className="h-[52px] w-full rounded-[14px] bg-framboise text-sm font-bold text-white transition hover:bg-[#c9003d] disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Un instant…" : login ? "Se connecter" : "Créer mon atelier"}</button>
        </form>
        <p className="mt-7 text-center text-sm text-prune/60">{login ? "Pas encore de compte ? " : "Tu as déjà un compte ? "}<Link href={login ? "/register" : "/login"} className="font-bold text-framboise hover:underline">{login ? "Créer mon espace" : "Se connecter"}</Link></p>
      </section>
    </main>
  );
}
