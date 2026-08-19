"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const PROGRAMMI_CAD_DISPONIBILI = [
  "AutoCAD 2D",
  "AutoCAD 3D",
  "Rhino",
  "SolidWorks",
  "Revit",
  "Inventor",
  "SketchUp",
  "Allplan",
];

interface Utente {
  id: string;
  email: string;
  ruolo: "azienda" | "disegnatore";
  nome: string;
}

interface Profilo {
  competenze: string;
  programmiCad: string[];
  cvUrl: string | null;
  cvNome: string | null;
}

export default function ProfiloPage() {
  const router = useRouter();
  const [utente, setUtente] = useState<Utente | null | undefined>(undefined);
  const [competenze, setCompetenze] = useState("");
  const [programmiCad, setProgrammiCad] = useState<string[]>([]);
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [cvNome, setCvNome] = useState<string | null>(null);
  const [caricamento, setCaricamento] = useState(true);
  const [salvataggio, setSalvataggio] = useState(false);
  const [uploadCv, setUploadCv] = useState(false);
  const [messaggio, setMessaggio] = useState("");
  const [errore, setErrore] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        setUtente(d.utente);
        if (!d.utente) {
          router.push("/accedi");
          return;
        }
        return fetch("/api/profilo")
          .then((r) => r.json())
          .then((data) => {
            const p: Profilo = data.profilo;
            setCompetenze(p.competenze);
            setProgrammiCad(p.programmiCad);
            setCvUrl(p.cvUrl);
            setCvNome(p.cvNome);
          });
      })
      .finally(() => setCaricamento(false));
  }, [router]);

  function toggleProgramma(programma: string) {
    setProgrammiCad((prev) =>
      prev.includes(programma) ? prev.filter((p) => p !== programma) : [...prev, programma]
    );
  }

  async function salvaProfilo() {
    setSalvataggio(true);
    setErrore("");
    setMessaggio("");
    const res = await fetch("/api/profilo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ competenze, programmiCad }),
    });
    setSalvataggio(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErrore(data.error || "Errore nel salvataggio del profilo.");
      return;
    }
    setMessaggio("Profilo aggiornato.");
  }

  async function caricaCv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrore("");
    setMessaggio("");

    if (file.type !== "application/pdf") {
      setErrore("Il CV deve essere un file PDF.");
      return;
    }

    setUploadCv(true);
    const formData = new FormData();
    formData.append("cv", file);
    const res = await fetch("/api/profilo/cv", { method: "POST", body: formData });
    setUploadCv(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErrore(data.error || "Errore nel caricamento del CV.");
      return;
    }
    const data = await res.json();
    setCvUrl(data.cvUrl);
    setCvNome(data.cvNome);
    setMessaggio("CV caricato.");
  }

  if (utente === undefined || caricamento) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16">
        <p className="font-mono-cad text-sm text-[var(--blueprint-text-dim)]">Caricamento...</p>
      </main>
    );
  }

  if (!utente) return null;

  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <p className="font-mono-cad text-xs tracking-[0.3em] text-[var(--blueprint-accent)] mb-4">
        TAV. 07 — IL MIO PROFILO
      </p>
      <h1 className="text-2xl font-semibold mb-1">Il mio profilo</h1>
      <p className="text-[var(--blueprint-text-dim)] text-sm mb-8">
        {utente.ruolo === "disegnatore"
          ? "Queste informazioni sono quello che le aziende vedono quando valutano il tuo profilo."
          : "Competenze e CV sono pensati per i profili disegnatore, ma puoi comunque tenerli aggiornati."}
      </p>

      <div className="space-y-8">
        <div>
          <label className="font-mono-cad text-xs tracking-widest text-[var(--blueprint-text-dim)] block mb-2">
            COMPETENZE
          </label>
          <textarea
            value={competenze}
            onChange={(e) => setCompetenze(e.target.value)}
            rows={4}
            className="w-full bg-[var(--blueprint-bg-2)] border border-[var(--blueprint-line)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--blueprint-accent)]"
            placeholder="es. 8 anni di esperienza in modellazione arredi su misura, specializzato in interni residenziali..."
          />
        </div>

        <div>
          <label className="font-mono-cad text-xs tracking-widest text-[var(--blueprint-text-dim)] block mb-3">
            PROGRAMMI CAD CHE CONOSCI
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PROGRAMMI_CAD_DISPONIBILI.map((programma) => {
              const attivo = programmiCad.includes(programma);
              return (
                <button
                  key={programma}
                  type="button"
                  onClick={() => toggleProgramma(programma)}
                  className={`font-mono-cad text-sm py-2 px-3 border transition-colors text-left ${
                    attivo
                      ? "border-[var(--blueprint-accent)] text-[var(--blueprint-accent-strong)] bg-[var(--blueprint-bg-2)]"
                      : "border-[var(--blueprint-line)] text-[var(--blueprint-text-dim)]"
                  }`}
                >
                  {attivo ? "✓ " : ""}
                  {programma}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="font-mono-cad text-xs tracking-widest text-[var(--blueprint-text-dim)] block mb-2">
            CURRICULUM (PDF)
          </label>
          <div className="border border-dashed border-[var(--blueprint-line)] p-6 text-center">
            <input
              type="file"
              id="cv"
              accept="application/pdf"
              className="hidden"
              onChange={caricaCv}
            />
            <label
              htmlFor="cv"
              className="cursor-pointer font-mono-cad text-sm text-[var(--blueprint-accent)] hover:text-[var(--blueprint-accent-strong)]"
            >
              {uploadCv ? "caricamento..." : cvNome ? `⌗ ${cvNome} — sostituisci` : "+ carica CV in PDF"}
            </label>
          </div>
          {cvUrl && (
            <a
              href={cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-xs font-mono-cad text-[var(--blueprint-accent)] hover:text-[var(--blueprint-accent-strong)]"
            >
              apri CV caricato →
            </a>
          )}
        </div>

        {errore && <p className="text-sm text-red-400 font-mono-cad">{errore}</p>}
        {messaggio && <p className="text-sm text-[var(--blueprint-accent-strong)] font-mono-cad">{messaggio}</p>}

        <button
          onClick={salvaProfilo}
          disabled={salvataggio}
          className="w-full font-mono-cad text-sm tracking-widest border border-[var(--blueprint-accent)] text-[var(--blueprint-accent-strong)] py-3 hover:bg-[var(--blueprint-accent)] hover:text-[var(--blueprint-bg)] transition-colors disabled:opacity-40"
        >
          {salvataggio ? "SALVATAGGIO..." : "SALVA PROFILO →"}
        </button>

        <p className="text-xs font-mono-cad text-[var(--blueprint-text-dim)] text-center">
          <Link href="/disegnatori" className="hover:text-[var(--blueprint-accent-strong)]">
            vedi come appaiono gli altri disegnatori →
          </Link>
        </p>
      </div>
    </main>
  );
}
