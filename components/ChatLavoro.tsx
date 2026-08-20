"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface Messaggio {
  id: string;
  lavoroId: string;
  mittenteId: string;
  mittenteNome: string;
  mittenteRuolo: "azienda" | "disegnatore";
  testo: string;
  allegatoUrl: string | null;
  allegatoNome: string | null;
  creatoIl: string;
}

interface Props {
  lavoroId: string;
  stato: string;
  utenteCorrenteId: string;
}

const STATI_CHAT_ATTIVA = ["in_corso", "in_revisione"];
const INTERVALLO_POLLING_MS = 8000;

export default function ChatLavoro({ lavoroId, stato, utenteCorrenteId }: Props) {
  const [messaggi, setMessaggi] = useState<Messaggio[]>([]);
  const [testo, setTesto] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [inviando, setInviando] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [caricato, setCaricato] = useState(false);
  const fineListaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const attiva = STATI_CHAT_ATTIVA.includes(stato);

  const caricaMessaggi = useCallback(async () => {
    if (!attiva) return;
    try {
      const res = await fetch(`/api/lavori/${lavoroId}/messaggi`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setMessaggi(data.messaggi ?? []);
    } catch {
      // errore silenzioso sul polling: non interrompe l'esperienza
    } finally {
      setCaricato(true);
    }
  }, [lavoroId, attiva]);

  useEffect(() => {
    caricaMessaggi();
    if (!attiva) return;
    const intervallo = setInterval(caricaMessaggi, INTERVALLO_POLLING_MS);
    return () => clearInterval(intervallo);
  }, [caricaMessaggi, attiva]);

  useEffect(() => {
    fineListaRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messaggi.length]);

  if (!attiva) return null;

  async function inviaMessaggio() {
    if (!testo.trim() && !file) return;
    setInviando(true);
    setErrore(null);

    try {
      let allegatoUrl: string | null = null;
      let allegatoNome: string | null = null;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const resUpload = await fetch("/api/upload", { method: "POST", body: formData });
        const dataUpload = await resUpload.json();
        if (!resUpload.ok) {
          setErrore(dataUpload.error || "Errore nel caricamento dell'allegato.");
          setInviando(false);
          return;
        }
        allegatoUrl = dataUpload.url;
        allegatoNome = dataUpload.nome;
      }

      const res = await fetch(`/api/lavori/${lavoroId}/messaggi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testo: testo.trim(), allegatoUrl, allegatoNome }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrore(data.error || "Errore nell'invio del messaggio.");
        setInviando(false);
        return;
      }

      setTesto("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await caricaMessaggi();
    } catch {
      setErrore("Errore di rete. Riprova.");
    } finally {
      setInviando(false);
    }
  }

  function formattaOra(iso: string) {
    return new Date(iso).toLocaleString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="border border-[var(--blueprint-line)] p-6 mt-6">
      <h2 className="font-mono-cad text-xs tracking-widest text-[var(--blueprint-text-dim)] mb-4">
        MESSAGGI SUL LAVORO
      </h2>
      <p className="text-xs text-[var(--blueprint-text-dim)] mb-4">
        Comunicazioni tra azienda e disegnatore durante la lavorazione. Non conta come revisione.
      </p>

      <div className="max-h-96 overflow-y-auto space-y-3 mb-4 pr-1">
        {!caricato && (
          <p className="text-xs text-[var(--blueprint-text-dim)] font-mono-cad">caricamento…</p>
        )}
        {caricato && messaggi.length === 0 && (
          <p className="text-xs text-[var(--blueprint-text-dim)] font-mono-cad">
            nessun messaggio ancora — scrivi il primo.
          </p>
        )}
        {messaggi.map((m) => {
          const proprio = m.mittenteId === utenteCorrenteId;
          return (
            <div
              key={m.id}
              className={`flex ${proprio ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] border p-3 text-sm ${
                  proprio
                    ? "border-[var(--blueprint-accent)] bg-[var(--blueprint-accent)]/10"
                    : "border-[var(--blueprint-line)] bg-[var(--blueprint-bg-2)]/60"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono-cad text-[10px] tracking-widest text-[var(--blueprint-accent-strong)]">
                    {m.mittenteNome} · {m.mittenteRuolo === "azienda" ? "AZIENDA" : "DISEGNATORE"}
                  </span>
                  <span className="font-mono-cad text-[10px] text-[var(--blueprint-text-dim)] ml-auto">
                    {formattaOra(m.creatoIl)}
                  </span>
                </div>
                {m.testo && <p className="leading-relaxed whitespace-pre-wrap">{m.testo}</p>}
                {m.allegatoUrl && (
                  <a
                    href={m.allegatoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono-cad text-xs text-[var(--blueprint-accent-strong)] hover:underline mt-2 inline-block"
                  >
                    ⌗ {m.allegatoNome || "allegato"} →
                  </a>
                )}
              </div>
            </div>
          );
        })}
        <div ref={fineListaRef} />
      </div>

      {errore && <p className="text-xs text-red-500 mb-2">{errore}</p>}

      <div className="border-t border-[var(--blueprint-line)] pt-4 space-y-2">
        <textarea
          value={testo}
          onChange={(e) => setTesto(e.target.value)}
          placeholder="Scrivi un messaggio…"
          rows={2}
          className="w-full bg-transparent border border-[var(--blueprint-line)] p-2 text-sm resize-none focus:outline-none focus:border-[var(--blueprint-accent)]"
        />
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-xs font-mono-cad text-[var(--blueprint-text-dim)] flex-1"
          />
          <button
            onClick={inviaMessaggio}
            disabled={inviando || (!testo.trim() && !file)}
            className="font-mono-cad text-[10px] tracking-widest border border-[var(--blueprint-accent)] text-[var(--blueprint-accent-strong)] px-4 py-2 disabled:opacity-40 hover:bg-[var(--blueprint-accent)]/10 shrink-0"
          >
            {inviando ? "INVIO…" : "INVIA"}
          </button>
        </div>
      </div>
    </div>
  );
}
