"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Utente {
  id: string;
  email: string;
  ruolo: "azienda" | "disegnatore";
  nome: string;
}

export default function HeaderNav() {
  const router = useRouter();
  const [utente, setUtente] = useState<Utente | null | undefined>(undefined);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUtente(d.utente));
  }, []);

  async function esci() {
    await fetch("/api/auth/esci", { method: "POST" });
    setUtente(null);
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="flex items-center gap-6 text-sm font-mono-cad text-[var(--blueprint-text-dim)]">
      <a href="/come-funziona" className="hover:text-[var(--blueprint-accent-strong)] transition-colors">
        come funziona
      </a>
      <a href="/" className="hover:text-[var(--blueprint-accent-strong)] transition-colors">
        bacheca
      </a>
      <a href="/disegnatori" className="hover:text-[var(--blueprint-accent-strong)] transition-colors">
        disegnatori
      </a>

      {utente === undefined ? null : utente ? (
        <>
          {utente.ruolo === "azienda" && (
            <a
              href="/lavori/nuovo"
              className="border border-[var(--blueprint-accent)] text-[var(--blueprint-accent-strong)] px-3 py-1.5 hover:bg-[var(--blueprint-accent)] hover:text-[var(--blueprint-bg)] transition-colors"
            >
              + pubblica lavoro
            </a>
          )}
          <span className="text-xs text-[var(--blueprint-text-dim)]">
            {utente.nome} · {utente.ruolo}
          </span>
          <button
            onClick={esci}
            className="hover:text-[var(--blueprint-accent-strong)] transition-colors"
          >
            esci
          </button>
        </>
      ) : (
        <>
          <a href="/accedi" className="hover:text-[var(--blueprint-accent-strong)] transition-colors">
            accedi
          </a>
          <a
            href="/registrati"
            className="border border-[var(--blueprint-accent)] text-[var(--blueprint-accent-strong)] px-3 py-1.5 hover:bg-[var(--blueprint-accent)] hover:text-[var(--blueprint-bg)] transition-colors"
          >
            registrati
          </a>
        </>
      )}
    </nav>
  );
}
