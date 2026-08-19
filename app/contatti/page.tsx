"use client";
import { useState } from "react";

export default function Contatti() {
  const [invio, setInvio] = useState(false);
  const [inviato, setInviato] = useState(false);
  const [errore, setErrore] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrore("");
    setInvio(true);
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/contatti", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: form.get("nome"),
        email: form.get("email"),
        messaggio: form.get("messaggio"),
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErrore(data.error || "Errore nell'invio del messaggio.");
      setInvio(false);
      return;
    }

    setInviato(true);
    setInvio(false);
  }

  return (
    <main className="max-w-md mx-auto px-6 py-16">
      <p className="font-mono-cad text-xs tracking-[0.3em] text-[var(--blueprint-accent)] mb-4">
        TAV. 06 — CONTATTI
      </p>
      <h1 className="text-2xl font-semibold mb-1">Scrivici</h1>
      <p className="text-[var(--blueprint-text-dim)] text-sm mb-8">
        Domande, segnalazioni, o proposte di collaborazione — rispondiamo il prima possibile.
      </p>

      {inviato ? (
        <p className="text-[var(--blueprint-accent-strong)] font-mono-cad text-sm border border-[var(--blueprint-accent)] p-4">
          ✓ Messaggio inviato. Ti risponderemo via email a breve.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="font-mono-cad text-xs tracking-widest text-[var(--blueprint-text-dim)] block mb-2">
              NOME
            </label>
            <input
              name="nome"
              required
              className="w-full bg-[var(--blueprint-bg-2)] border border-[var(--blueprint-line)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--blueprint-accent)]"
            />
          </div>
          <div>
            <label className="font-mono-cad text-xs tracking-widest text-[var(--blueprint-text-dim)] block mb-2">
              LA TUA EMAIL
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
              MESSAGGIO
            </label>
            <textarea
              name="messaggio"
              required
              rows={5}
              className="w-full bg-[var(--blueprint-bg-2)] border border-[var(--blueprint-line)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--blueprint-accent)]"
            />
          </div>

          {errore && <p className="text-sm text-red-400 font-mono-cad">{errore}</p>}

          <button
            type="submit"
            disabled={invio}
            className="w-full font-mono-cad text-sm tracking-widest border border-[var(--blueprint-accent)] text-[var(--blueprint-accent-strong)] py-3 hover:bg-[var(--blueprint-accent)] hover:text-[var(--blueprint-bg)] transition-colors disabled:opacity-40"
          >
            {invio ? "INVIO..." : "INVIA MESSAGGIO →"}
          </button>
        </form>
      )}
    </main>
  );
}
