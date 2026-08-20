"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  regimeFiscale: "forfettario" | "ordinario";
  percentualeRivalsa: number;
  aliquotaIva: number;
  percentualeRitenuta: number;
  stripeOnboardingCompletato: boolean;
}

function ProfiloContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [utente, setUtente] = useState<Utente | null | undefined>(undefined);
  const [competenze, setCompetenze] = useState("");
  const [programmiCad, setProgrammiCad] = useState<string[]>([]);
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [cvNome, setCvNome] = useState<string | null>(null);
  const [regimeFiscale, setRegimeFiscale] = useState<"forfettario" | "ordinario">("forfettario");
  const [percentualeRivalsa, setPercentualeRivalsa] = useState(4);
  const [aliquotaIva, setAliquotaIva] = useState(22);
  const [percentualeRitenuta, setPercentualeRitenuta] = useState(20);
  const [stripeOnboardingCompletato, setStripeOnboardingCompletato] = useState(false);
  const [collegandoStripe, setCollegandoStripe] = useState(false);
  const [verificandoStripe, setVerificandoStripe] = useState(false);
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
            setRegimeFiscale(p.regimeFiscale ?? "forfettario");
            setPercentualeRivalsa(p.percentualeRivalsa ?? 4);
            setAliquotaIva(p.aliquotaIva ?? 22);
            setPercentualeRitenuta(p.percentualeRitenuta ?? 20);
            setStripeOnboardingCompletato(p.stripeOnboardingCompletato ?? false);
          });
      })
      .finally(() => setCaricamento(false));
  }, [router]);

  useEffect(() => {
    if (searchParams.get("stripe") === "collegato") {
      setMessaggio("Collegamento a Stripe avviato — potrebbero volerci alcuni minuti prima che risulti attivo.");
    }
  }, [searchParams]);

  async function collegaStripe() {
    setCollegandoStripe(true);
    setErrore("");
    const res = await fetch("/api/profilo/stripe-onboarding", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setCollegandoStripe(false);
    if (!res.ok) {
      setErrore(data.error || "Errore nel collegamento a Stripe.");
      return;
    }
    if (data.url) window.location.href = data.url;
  }

  async function verificaStripe() {
    setVerificandoStripe(true);
    setErrore("");
    setMessaggio("");
    const res = await fetch("/api/profilo/stripe-status", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setVerificandoStripe(false);
    if (!res.ok) {
      setErrore(data.error || "Errore nella verifica dello stato Stripe.");
      return;
    }
    setStripeOnboardingCompletato(data.stripeOnboardingCompletato);
    setMessaggio(
      data.stripeOnboardingCompletato
        ? "Stripe risulta collegato e pronto."
        : "Stripe non risulta ancora pronto — l'onboarding potrebbe non essere completo."
    );
  }

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
      body: JSON.stringify({
        competenze,
        programmiCad,
        regimeFiscale,
        percentualeRivalsa,
        aliquotaIva,
        percentualeRitenuta,
      }),
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

        {utente.ruolo === "disegnatore" && (
          <div>
            <label className="font-mono-cad text-xs tracking-widest text-[var(--blueprint-text-dim)] block mb-2">
              REGIME FISCALE
            </label>
            <p className="text-xs text-[var(--blueprint-text-dim)] mb-3">
              Serve per calcolare l&apos;importo esatto che l&apos;azienda deve versare quando ti viene assegnato un lavoro — fatturi tu direttamente all&apos;azienda, secondo il tuo regime.
            </p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {(["forfettario", "ordinario"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRegimeFiscale(r)}
                  className={`font-mono-cad text-sm py-2 px-3 border transition-colors ${
                    regimeFiscale === r
                      ? "border-[var(--blueprint-accent)] text-[var(--blueprint-accent-strong)] bg-[var(--blueprint-bg-2)]"
                      : "border-[var(--blueprint-line)] text-[var(--blueprint-text-dim)]"
                  }`}
                >
                  {regimeFiscale === r ? "✓ " : ""}
                  {r === "forfettario" ? "Forfettario" : "Ordinario"}
                </button>
              ))}
            </div>

            {regimeFiscale === "ordinario" && (
              <div className="grid grid-cols-3 gap-3 border border-[var(--blueprint-line)] p-4">
                <div>
                  <label className="font-mono-cad text-[10px] text-[var(--blueprint-text-dim)] block mb-1">
                    RIVALSA CASSA %
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={percentualeRivalsa}
                    onChange={(e) => setPercentualeRivalsa(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[var(--blueprint-bg-2)] border border-[var(--blueprint-line)] px-2 py-1.5 text-sm font-mono-cad focus:outline-none focus:border-[var(--blueprint-accent)]"
                  />
                </div>
                <div>
                  <label className="font-mono-cad text-[10px] text-[var(--blueprint-text-dim)] block mb-1">
                    IVA %
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={aliquotaIva}
                    onChange={(e) => setAliquotaIva(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[var(--blueprint-bg-2)] border border-[var(--blueprint-line)] px-2 py-1.5 text-sm font-mono-cad focus:outline-none focus:border-[var(--blueprint-accent)]"
                  />
                </div>
                <div>
                  <label className="font-mono-cad text-[10px] text-[var(--blueprint-text-dim)] block mb-1">
                    RITENUTA %
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={percentualeRitenuta}
                    onChange={(e) => setPercentualeRitenuta(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[var(--blueprint-bg-2)] border border-[var(--blueprint-line)] px-2 py-1.5 text-sm font-mono-cad focus:outline-none focus:border-[var(--blueprint-accent)]"
                  />
                </div>
                <p className="col-span-3 text-[11px] text-[var(--blueprint-text-dim)] mt-1">
                  Valori standard per un professionista con Gestione Separata INPS: 4% / 22% / 20%. Se hai una cassa diversa (es. Inarcassa), modifica pure.
                </p>
              </div>
            )}
          </div>
        )}

        {utente.ruolo === "disegnatore" && (
          <div>
            <label className="font-mono-cad text-xs tracking-widest text-[var(--blueprint-text-dim)] block mb-2">
              PAGAMENTI
            </label>
            <p className="text-xs text-[var(--blueprint-text-dim)] mb-3">
              Collega il tuo conto Stripe per poter ricevere i pagamenti dei lavori assegnati. Senza questo passaggio, le aziende non potranno pagarti tramite la piattaforma.
            </p>
            <div className="border border-[var(--blueprint-line)] p-4 flex items-center justify-between gap-4">
              <span
                className={`font-mono-cad text-xs ${
                  stripeOnboardingCompletato
                    ? "text-[var(--blueprint-accent-strong)]"
                    : "text-[var(--blueprint-text-dim)]"
                }`}
              >
                {stripeOnboardingCompletato ? "✓ Stripe collegato" : "Stripe non ancora collegato"}
              </span>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={verificaStripe}
                  disabled={verificandoStripe}
                  className="font-mono-cad text-xs border border-[var(--blueprint-line)] text-[var(--blueprint-text-dim)] px-3 py-1.5 hover:border-[var(--blueprint-accent)] hover:text-[var(--blueprint-accent-strong)] transition-colors disabled:opacity-40"
                >
                  {verificandoStripe ? "verifica..." : "verifica stato"}
                </button>
                <button
                  type="button"
                  onClick={collegaStripe}
                  disabled={collegandoStripe}
                  className="font-mono-cad text-xs border border-[var(--blueprint-accent)] text-[var(--blueprint-accent-strong)] px-3 py-1.5 hover:bg-[var(--blueprint-accent)] hover:text-[var(--blueprint-bg)] transition-colors disabled:opacity-40"
                >
                  {collegandoStripe
                    ? "reindirizzamento..."
                    : stripeOnboardingCompletato
                    ? "aggiorna dati Stripe"
                    : "collega Stripe →"}
                </button>
              </div>
            </div>
          </div>
        )}

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

export default function ProfiloPage() {
  return (
    <Suspense fallback={null}>
      <ProfiloContent />
    </Suspense>
  );
}
