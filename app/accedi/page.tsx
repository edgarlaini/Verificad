"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Accedi() {
  const router = useRouter();
  const [errore, setErrore] = useState("");
  const [invio, setInvio] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrore("");
    setInvio(true);
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/auth/accedi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErrore(data.error || "Errore nell'accesso.");
      setInvio(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="max-w-md mx-auto px-6 py-16">
      <p className="font-mono-cad text-xs tracking-[0.3em] text-[var(--blueprint-accent)] mb-4">
        TAV. 00 — ACCESSO
      </p>
      <h1 className="text-2xl font-semibold mb-8">Accedi</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="font-mono-cad text-xs tracking-widest text-[var(--blueprint-text-dim)] block mb-2">
            EMAIL
          </label>
          <input
            type="email"
            name="email"
            required
            className="w-full bg-[var(--blueprint-bg-2)] border border-[var(--blueprint-line)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--blueprint-accent)]"
          />
        </div>
        <div>
          <label className="font-mono-cad text-xs tracking-widest text-[var(--blueprint-text-dim)] block mb-2">
            PASSWORD
          </label>
          <input
            type="password"
            name="password"
            required
            className="w-full bg-[var(--blueprint-bg-2)] border border-[var(--blueprint-line)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--blueprint-accent)]"
          />
        </div>

        {errore && <p className="text-sm text-red-400 font-mono-cad">{errore}</p>}

        <button
          type="submit"
          disabled={invio}
          className="w-full font-mono-cad text-sm tracking-widest border border-[var(--blueprint-accent)] text-[var(--blueprint-accent-strong)] py-3 hover:bg-[var(--blueprint-accent)] hover:text-[var(--blueprint-bg)] transition-colors disabled:opacity-40"
        >
          {invio ? "ACCESSO IN CORSO..." : "ACCEDI →"}
        </button>
      </form>

      <p className="text-sm text-[var(--blueprint-text-dim)] mt-6 text-center">
        Non hai un account?{" "}
        <a href="/registrati" className="text-[var(--blueprint-accent)] hover:text-[var(--blueprint-accent-strong)]">
          Registrati
        </a>
      </p>
    </main>
  );
}
