"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { calcolaCommissione } from "@/lib/calc";

export default function NuovoLavoro() {
  const router = useRouter();
  const [budget, setBudget] = useState<number>(500);
  const [fileNome, setFileNome] = useState<string>("");
  const [fileUrl, setFileUrl] = useState<string>("");
  const [caricamentoFile, setCaricamentoFile] = useState(false);
  const [invio, setInvio] = useState(false);
  const [errore, setErrore] = useState("");
  const split = calcolaCommissione(budget || 0);

  async function caricaDisegno(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrore("");
    setCaricamentoFile(true);
    setFileNome("");
    setFileUrl("");

    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    setCaricamentoFile(false);

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErrore(d.error || "Errore nel caricamento del disegno.");
      return;
    }
    const data = await res.json();
    setFileNome(data.nome);
    setFileUrl(data.url);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrore("");
    setInvio(true);
    const form = new FormData(e.currentTarget);
    const payload = {
      titolo: form.get("titolo"),
      descrizione: form.get("descrizione"),
      budget: Number(form.get("budget")),
      scadenza: form.get("scadenza"),
      disegnoAllegato: fileUrl,
      disegnoNome: fileNome,
    };

    const res = await fetch("/api/lavori", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErrore(data.error || "Errore nella pubblicazione del lavoro.");
      setInvio(false);
      return;
    }

    const { id } = await res.json();
    router.push(`/lavori/${id}`);
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <p className="font-mono-cad text-xs tracking-[0.3em] text-[var(--blueprint-accent)] mb-4">
        TAV. 05 — PUBBLICA LAVORO
      </p>
      <h1 className="text-2xl font-semibold mb-1">Nuovo lavoro</h1>
      <p className="text-[var(--blueprint-text-dim)] text-sm mb-8">
        Il disegno tecnico è obbligatorio: sarà il riferimento su cui verrà confrontato il modello consegnato.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">

        <div>
          <label className="font-mono-cad text-xs tracking-widest text-[var(--blueprint-text-dim)] block mb-2">
            TITOLO
          </label>
          <input
            name="titolo"
            required
            className="w-full bg-[var(--blueprint-bg-2)] border border-[var(--blueprint-line)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--blueprint-accent)]"
            placeholder="es. Modello 3D reception ufficio"
          />
        </div>

        <div>
          <label className="font-mono-cad text-xs tracking-widest text-[var(--blueprint-text-dim)] block mb-2">
            DESCRIZIONE
          </label>
          <textarea
            name="descrizione"
            required
            rows={4}
            className="w-full bg-[var(--blueprint-bg-2)] border border-[var(--blueprint-line)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--blueprint-accent)]"
            placeholder="Cosa deve riprodurre il disegnatore, materiali, dettagli richiesti..."
          />
        </div>

        <div>
          <label className="font-mono-cad text-xs tracking-widest text-[var(--blueprint-text-dim)] block mb-2">
            DISEGNO TECNICO — OBBLIGATORIO
          </label>
          <div className="border border-dashed border-[var(--blueprint-line)] p-6 text-center">
            <input
              type="file"
              id="disegno"
              className="hidden"
              onChange={caricaDisegno}
            />
            <label
              htmlFor="disegno"
              className="cursor-pointer font-mono-cad text-sm text-[var(--blueprint-accent)] hover:text-[var(--blueprint-accent-strong)]"
            >
              {caricamentoFile
                ? "caricamento..."
                : fileNome
                ? `⌗ ${fileNome}`
                : "+ carica DWG / DXF / PDF"}
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-mono-cad text-xs tracking-widest text-[var(--blueprint-text-dim)] block mb-2">
              BUDGET (€)
            </label>
            <input
              type="number"
              name="budget"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full bg-[var(--blueprint-bg-2)] border border-[var(--blueprint-line)] px-3 py-2 text-sm font-mono-cad focus:outline-none focus:border-[var(--blueprint-accent)]"
            />
          </div>
          <div>
            <label className="font-mono-cad text-xs tracking-widest text-[var(--blueprint-text-dim)] block mb-2">
              SCADENZA
            </label>
            <input
              type="date"
              name="scadenza"
              required
              className="w-full bg-[var(--blueprint-bg-2)] border border-[var(--blueprint-line)] px-3 py-2 text-sm font-mono-cad focus:outline-none focus:border-[var(--blueprint-accent)]"
            />
          </div>
        </div>

        <div className="border border-[var(--blueprint-line)] p-4">
          <p className="font-mono-cad text-[10px] tracking-widest text-[var(--blueprint-text-dim)] mb-3">
            ANTEPRIMA COSTO
          </p>
          <div className="flex justify-between text-sm font-mono-cad">
            <span className="text-[var(--blueprint-text-dim)]">totale da versare</span>
            <span className="text-[var(--blueprint-accent-strong)]">
              €{split.totalePagatoAzienda.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-xs font-mono-cad text-[var(--blueprint-text-dim)] mt-1">
            <span>di cui commissione piattaforma (10%)</span>
            <span>€{split.commissioneAzienda.toFixed(2)}</span>
          </div>
        </div>

        {errore && (
          <p className="text-sm text-red-400 font-mono-cad">{errore}</p>
        )}

        <button
          type="submit"
          disabled={!fileUrl || caricamentoFile || invio}
          className="w-full font-mono-cad text-sm tracking-widest border border-[var(--blueprint-accent)] text-[var(--blueprint-accent-strong)] py-3 hover:bg-[var(--blueprint-accent)] hover:text-[var(--blueprint-bg)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[var(--blueprint-accent-strong)]"
        >
          {!fileUrl
            ? "CARICA IL DISEGNO PER CONTINUARE"
            : invio
            ? "PUBBLICAZIONE IN CORSO..."
            : "PUBBLICA LAVORO →"}
        </button>
      </form>
    </main>
  );
}
