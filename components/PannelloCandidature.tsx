"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Candidatura {
  id: string;
  disegnatoreUtenteId: string;
  disegnatoreNome: string;
  messaggio: string;
  stato: "in_attesa" | "accettata" | "rifiutata";
  cvUrl?: string | null;
  cvNome?: string | null;
}

interface Utente {
  id: string;
  ruolo: "azienda" | "disegnatore";
  nome: string;
}

export default function PannelloCandidature({
  lavoroId,
  lavoroStato,
  aziendaUtenteId,
}: {
  lavoroId: string;
  lavoroStato: string;
  aziendaUtenteId: string | null | undefined;
}) {
  const router = useRouter();
  const [utente, setUtente] = useState<Utente | null | undefined>(undefined);
  const [candidature, setCandidature] = useState<Candidatura[]>([]);
  const [messaggio, setMessaggio] = useState("");
  const [invio, setInvio] = useState(false);
  const [errore, setErrore] = useState("");
  const [inviata, setInviata] = useState(false);

  async function carica() {
    const [meRes, candRes] = await Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch(`/api/lavori/${lavoroId}/candidature`).then((r) => r.json()),
    ]);
    setUtente(meRes.utente);
    setCandidature(candRes);
  }

  useEffect(() => {
    carica();
  }, []);

  async function candidati(e: React.FormEvent) {
    e.preventDefault();
    setErrore("");
    setInvio(true);
    const res = await fetch(`/api/lavori/${lavoroId}/candidature`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messaggio }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErrore(d.error || "Errore nell'invio della candidatura.");
      setInvio(false);
      return;
    }
    setInviata(true);
    setInvio(false);
    carica();
  }

  async function accetta(candidaturaId: string) {
    const res = await fetch(`/api/candidature/${candidaturaId}/accetta`, {
      method: "POST",
    });
    if (res.ok) {
      router.refresh();
      carica();
    }
  }

  if (utente === undefined) return null;

  const mieGiaCandidata = candidature.some(
    (c) => c.disegnatoreUtenteId === utente?.id
  );
  const sonoProprietario = utente?.ruolo === "azienda" && utente.id === aziendaUtenteId;

  return (
    <div className="border border-[var(--blueprint-line)] p-6 mt-6">
      <h2 className="font-mono-cad text-xs tracking-widest text-[var(--blueprint-text-dim)] mb-4">
        CANDIDATURE {candidature.length > 0 && `(${candidature.length})`}
      </h2>

      {sonoProprietario && (
        <div className="space-y-3 mb-4">
          {candidature.length === 0 && (
            <p className="text-sm text-[var(--blueprint-text-dim)]">
              Nessuna candidatura ricevuta finora.
            </p>
          )}
          {candidature.map((c) => (
            <div
              key={c.id}
              className="border border-[var(--blueprint-line)] p-4 flex items-start justify-between gap-4"
            >
              <div>
                <p className="text-sm font-medium">{c.disegnatoreNome}</p>
                <p className="text-sm text-[var(--blueprint-text-dim)] mt-1">
                  {c.messaggio}
                </p>
                {c.cvUrl && (
                  <a
                    href={c.cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 font-mono-cad text-xs text-[var(--blueprint-accent-strong)] hover:underline"
                  >
                    ⌗ {c.cvNome || "CV"} →
                  </a>
                )}
              </div>
              {c.stato === "in_attesa" && lavoroStato === "aperto" && (
                <button
                  onClick={() => accetta(c.id)}
                  className="shrink-0 font-mono-cad text-xs border border-[var(--blueprint-accent)] text-[var(--blueprint-accent-strong)] px-3 py-1.5 hover:bg-[var(--blueprint-accent)] hover:text-[var(--blueprint-bg)] transition-colors"
                >
                  accetta
                </button>
              )}
              {c.stato === "accettata" && (
                <span className="shrink-0 font-mono-cad text-xs text-[var(--blueprint-amber)]">
                  accettata
                </span>
              )}
              {c.stato === "rifiutata" && (
                <span className="shrink-0 font-mono-cad text-xs text-[var(--blueprint-text-dim)]">
                  non selezionata
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {utente?.ruolo === "disegnatore" && lavoroStato === "aperto" && (
        <>
          {inviata || mieGiaCandidata ? (
            <p className="text-sm text-[var(--blueprint-accent-strong)] font-mono-cad">
              ✓ Candidatura inviata. L&apos;azienda la valuterà a breve.
            </p>
          ) : (
            <form onSubmit={candidati} className="space-y-3">
              <textarea
                value={messaggio}
                onChange={(e) => setMessaggio(e.target.value)}
                required
                rows={3}
                placeholder="Presentati brevemente e spiega perché sei adatto a questo lavoro..."
                className="w-full bg-[var(--blueprint-bg-2)] border border-[var(--blueprint-line)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--blueprint-accent)]"
              />
              {errore && (
                <p className="text-sm text-red-400 font-mono-cad">{errore}</p>
              )}
              <button
                type="submit"
                disabled={invio}
                className="font-mono-cad text-sm border border-[var(--blueprint-accent)] text-[var(--blueprint-accent-strong)] px-4 py-2 hover:bg-[var(--blueprint-accent)] hover:text-[var(--blueprint-bg)] transition-colors disabled:opacity-40"
              >
                {invio ? "INVIO..." : "CANDIDATI →"}
              </button>
            </form>
          )}
        </>
      )}

      {!utente && lavoroStato === "aperto" && (
        <p className="text-sm text-[var(--blueprint-text-dim)]">
          <Link href="/accedi" className="text-[var(--blueprint-accent)] hover:text-[var(--blueprint-accent-strong)]">
            Accedi
          </Link>{" "}
          come disegnatore per candidarti a questo lavoro.
        </p>
      )}
    </div>
  );
}

