"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Ruolo } from "@/lib/auth";

export default function Registrati() {
  const router = useRouter();
  const [ruolo, setRuolo] = useState<Ruolo>("azienda");
  const [errore, setErrore] = useState("");
  const [invio, setInvio] = useState(false);
  const [accettaTermini, setAccettaTermini] = useState(false);
  const [accettaClausoleSpecifiche, setAccettaClausoleSpecifiche] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrore("");

    if (!accettaTermini || !accettaClausoleSpecifiche) {
      setErrore("Devi spuntare entrambe le caselle sui Termini di Servizio per creare l'account.");
      return;
    }

    setInvio(true);
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/auth/registrati", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
        nome: form.get("nome"),
        ruolo,
        // Il backend può ignorare questi due campi se non ancora predisposto a
        // registrarli; idealmente andrebbero salvati con data/ora sull'utente
        // come prova dell'accettazione (vedi nota consegnata a Edgar).
        accettaTermini,
        accettaClausoleSpecifiche,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErrore(data.error || "Errore nella registrazione.");
      setInvio(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="max-w-md mx-auto px-6 py-16">
      <p className="font-mono-cad text-xs tracking-[0.3em] text-[var(--blueprint-accent)] mb-4">
        TAV. 00 — REGISTRAZIONE
      </p>
      <h1 className="text-2xl font-semibold mb-8">Crea un account</h1>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={() => setRuolo("azienda")}
          className={`font-mono-cad text-sm py-3 border transition-colors ${
            ruolo === "azienda"
              ? "border-[var(--blueprint-accent)] text-[var(--blueprint-accent-strong)] bg-[var(--blueprint-bg-2)]"
              : "border-[var(--blueprint-line)] text-[var(--blueprint-text-dim)]"
          }`}
        >
          Sono un&apos;azienda
        </button>
        <button
          type="button"
          onClick={() => setRuolo("disegnatore")}
          className={`font-mono-cad text-sm py-3 border transition-colors ${
            ruolo === "disegnatore"
              ? "border-[var(--blueprint-accent)] text-[var(--blueprint-accent-strong)] bg-[var(--blueprint-bg-2)]"
              : "border-[var(--blueprint-line)] text-[var(--blueprint-text-dim)]"
          }`}
        >
          Sono un disegnatore
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="font-mono-cad text-xs tracking-widest text-[var(--blueprint-text-dim)] block mb-2">
            {ruolo === "azienda" ? "NOME AZIENDA" : "NOME E COGNOME"}
          </label>
          <input
            name="nome"
            required
            className="w-full bg-[var(--blueprint-bg-2)] border border-[var(--blueprint-line)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--blueprint-accent)]"
          />
        </div>
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
            minLength={6}
            className="w-full bg-[var(--blueprint-bg-2)] border border-[var(--blueprint-line)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--blueprint-accent)]"
          />
        </div>

        <div className="space-y-3 border border-[var(--blueprint-line)] p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={accettaTermini}
              onChange={(e) => setAccettaTermini(e.target.checked)}
              className="mt-0.5 accent-[var(--blueprint-accent)]"
            />
            <span className="text-xs text-[var(--blueprint-text-dim)] leading-relaxed">
              Ho letto e accetto i{" "}
              <Link
                href="/termini"
                target="_blank"
                className="text-[var(--blueprint-accent)] hover:text-[var(--blueprint-accent-strong)] underline"
              >
                Termini di Servizio
              </Link>{" "}
              di VerifiCAD.
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={accettaClausoleSpecifiche}
              onChange={(e) => setAccettaClausoleSpecifiche(e.target.checked)}
              className="mt-0.5 accent-[var(--blueprint-accent)]"
            />
            <span className="text-xs text-[var(--blueprint-text-dim)] leading-relaxed">
              Dichiaro di approvare specificamente, ai sensi degli artt. 1341 e 1342 c.c., le
              clausole di cui agli artt. 6 e 8 dei{" "}
              <Link
                href="/termini"
                target="_blank"
                className="text-[var(--blueprint-accent)] hover:text-[var(--blueprint-accent-strong)] underline"
              >
                Termini di Servizio
              </Link>
              .
            </span>
          </label>
        </div>

        {errore && <p className="text-sm text-red-400 font-mono-cad">{errore}</p>}

        <button
          type="submit"
          disabled={invio}
          className="w-full font-mono-cad text-sm tracking-widest border border-[var(--blueprint-accent)] text-[var(--blueprint-accent-strong)] py-3 hover:bg-[var(--blueprint-accent)] hover:text-[var(--blueprint-bg)] transition-colors disabled:opacity-40"
        >
          {invio ? "CREAZIONE ACCOUNT..." : "CREA ACCOUNT →"}
        </button>
      </form>

      <p className="text-sm text-[var(--blueprint-text-dim)] mt-6 text-center">
        Hai già un account?{" "}
        <Link href="/accedi" className="text-[var(--blueprint-accent)] hover:text-[var(--blueprint-accent-strong)]">
          Accedi
        </Link>
      </p>
    </main>
  );
}
