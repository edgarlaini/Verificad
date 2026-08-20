"use client";
import { useEffect, useState } from "react";

interface Contestazione {
  id: string;
  titolo: string;
  azienda: string;
  disegnatoreAssegnato: string | null;
  budget: number;
  contestazioneMotivo: string | null;
  contestazioneRispostaDisegnatore: string | null;
  contestazioneApertaIl: string | null;
}

export default function ContestazioniAdminPage() {
  const [contestazioni, setContestazioni] = useState<Contestazione[] | null>(null);
  const [erroreCaricamento, setErroreCaricamento] = useState("");
  const [percentuali, setPercentuali] = useState<Record<string, number>>({});
  const [invioIn, setInvioIn] = useState<string | null>(null);
  const [messaggi, setMessaggi] = useState<Record<string, string>>({});

  async function carica() {
    const res = await fetch("/api/admin/contestazioni");
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErroreCaricamento(d.error || "Errore nel caricamento.");
      setContestazioni([]);
      return;
    }
    const data = await res.json();
    setContestazioni(data.contestazioni);
  }

  useEffect(() => {
    carica();
  }, []);

  async function risolvi(id: string) {
    const pct = percentuali[id] ?? 0;
    setInvioIn(id);
    setMessaggi((m) => ({ ...m, [id]: "" }));
    const res = await fetch(`/api/admin/contestazioni/${id}/risolvi`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ percentualeRimborsoAzienda: pct }),
    });
    const data = await res.json().catch(() => ({}));
    setInvioIn(null);
    if (!res.ok) {
      setMessaggi((m) => ({ ...m, [id]: data.error || "Errore nella risoluzione." }));
      return;
    }
    carica();
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <p className="font-mono-cad text-xs tracking-[0.3em] text-[var(--blueprint-accent)] mb-4">
        ADMIN — CONTESTAZIONI APERTE
      </p>
      <h1 className="text-2xl font-semibold mb-8">Contestazioni da risolvere</h1>

      {erroreCaricamento && (
        <p className="text-sm text-red-400 font-mono-cad">{erroreCaricamento}</p>
      )}

      {contestazioni === null && !erroreCaricamento && (
        <p className="text-sm text-[var(--blueprint-text-dim)] font-mono-cad">caricamento...</p>
      )}

      {contestazioni?.length === 0 && (
        <p className="text-sm text-[var(--blueprint-text-dim)] font-mono-cad">
          nessuna contestazione aperta al momento.
        </p>
      )}

      <div className="space-y-6">
        {contestazioni?.map((c) => (
          <div key={c.id} className="border border-[var(--blueprint-amber)] p-6">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h2 className="text-lg font-medium">{c.titolo}</h2>
                <p className="text-xs text-[var(--blueprint-text-dim)] font-mono-cad mt-1">
                  {c.azienda} · disegnatore: {c.disegnatoreAssegnato || "—"} · €{c.budget}
                </p>
              </div>
              {c.contestazioneApertaIl && (
                <span className="font-mono-cad text-[10px] text-[var(--blueprint-text-dim)] shrink-0">
                  aperta il {new Date(c.contestazioneApertaIl).toLocaleDateString("it-IT")}
                </span>
              )}
            </div>

            <div className="border-l-2 border-[var(--blueprint-amber)] pl-4 mb-3">
              <p className="font-mono-cad text-[10px] text-[var(--blueprint-amber)] mb-1">
                MOTIVO (AZIENDA)
              </p>
              <p className="text-sm whitespace-pre-wrap">{c.contestazioneMotivo}</p>
            </div>

            {c.contestazioneRispostaDisegnatore ? (
              <div className="border-l-2 border-[var(--blueprint-accent)] pl-4 mb-4">
                <p className="font-mono-cad text-[10px] text-[var(--blueprint-accent)] mb-1">
                  RISPOSTA DISEGNATORE
                </p>
                <p className="text-sm whitespace-pre-wrap">{c.contestazioneRispostaDisegnatore}</p>
              </div>
            ) : (
              <p className="text-xs text-[var(--blueprint-text-dim)] font-mono-cad mb-4">
                il disegnatore non ha ancora risposto — puoi comunque decidere se necessario
              </p>
            )}

            <div className="flex items-end gap-3">
              <div>
                <label className="font-mono-cad text-[10px] text-[var(--blueprint-text-dim)] block mb-1">
                  % RIMBORSO AZIENDA (0-100)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={percentuali[c.id] ?? 0}
                  onChange={(e) =>
                    setPercentuali((p) => ({ ...p, [c.id]: parseFloat(e.target.value) || 0 }))
                  }
                  className="w-24 bg-[var(--blueprint-bg-2)] border border-[var(--blueprint-line)] px-2 py-1.5 text-sm font-mono-cad focus:outline-none focus:border-[var(--blueprint-accent)]"
                />
              </div>
              <button
                onClick={() => risolvi(c.id)}
                disabled={invioIn === c.id}
                className="font-mono-cad text-xs border border-[var(--blueprint-accent)] text-[var(--blueprint-accent-strong)] px-4 py-2 hover:bg-[var(--blueprint-accent)] hover:text-[var(--blueprint-bg)] transition-colors disabled:opacity-40"
              >
                {invioIn === c.id ? "elaborazione..." : "risolvi contestazione"}
              </button>
            </div>
            {messaggi[c.id] && (
              <p className="text-sm text-red-400 font-mono-cad mt-2">{messaggi[c.id]}</p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
