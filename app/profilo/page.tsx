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

type StatoLavoro = "aperto" | "in_corso" | "in_revisione" | "chiuso";

const STATO_LABEL: Record<StatoLavoro, string> = {
  aperto: "Aperto",
  in_corso: "In corso",
  in_revisione: "In revisione",
  chiuso: "Chiuso",
};

const STATO_COLORE: Record<StatoLavoro, string> = {
  aperto: "text-[var(--blueprint-accent-strong)] border-[var(--blueprint-accent)]",
  in_corso: "text-blue-300 border-blue-400/50",
  in_revisione: "text-amber-300 border-amber-400/50",
  chiuso: "text-[var(--blueprint-text-dim)] border-[var(--blueprint-line)]",
};

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

interface LavoroAzienda {
  id: string;
  titolo: string;
  descrizione: string;
  budget: number;
  scadenza: string;
  stato: StatoLavoro;
  disegnatoreAssegnato?: string | null;
  disegnoNome?: string | null;
}

function LavoriAziendaSection({ utente }: { utente: Utente }) {
  const [lavori, setLavori] = useState<LavoroAzienda[] | null>(null);

  useEffect(() => {
    fetch("/api/lavori/miei")
      .then((r) => r.json())
      .then((data) => setLavori(Array.isArray(data) ? data : []));
  }, []);

  if (lavori === null) {
    return (
      <p className="font-mono-cad text-sm text-[var(--blueprint-text-dim)]">
        Caricamento lavori...
      </p>
    );
  }

  const attivi = lavori.filter((l) => l.stato !== "chiuso");
  const conclusi = lavori.filter((l) => l.stato === "chiuso");

  function Card({ lavoro }: { lavoro: LavoroAzienda }) {
    return (
      <Link
        href={`/lavori/${lavoro.id}`}
        className="block border border-[var(--blueprint-line)] p-4 hover:border-[var(--blueprint-accent)] transition-colors"
      >
        <div className="flex items-center justify-between gap-4 mb-2">
          <span
            className={`font-mono-cad text-[10px] tracking-widest border px-2 py-0.5 ${STATO_COLORE[lavoro.stato]}`}
          >
            {STATO_LABEL[lavoro.stato].toUpperCase()}
          </span>
          <span className="font-mono-cad text-sm text-[var(--blueprint-accent-strong)]">
            €{lavoro.budget}
          </span>
        </div>
        <h3 className="font-semibold mb-1">{lavoro.titolo}</h3>
        <p className="text-sm text-[var(--blueprint-text-dim)] line-clamp-2 mb-2">
          {lavoro.descrizione}
        </p>
        <div className="flex items-center justify-between gap-4 text-xs font-mono-cad text-[var(--blueprint-text-dim)]">
          <span>
            {lavoro.disegnatoreAssegnato
              ? `disegnatore: ${lavoro.disegnatoreAssegnato}`
              : "nessun disegnatore assegnato"}
          </span>
          <span>scad. {lavoro.scadenza}</span>
        </div>
      </Link>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <label className="font-mono-cad text-xs tracking-widest text-[var(--blueprint-text-dim)] block mb-3">
          LAVORI ATTIVI ({attivi.length})
        </label>
        {attivi.length === 0 ? (
          <p className="text-sm text-[var(--blueprint-text-dim)]">
            Nessun lavoro attivo al momento.
          </p>
        ) : (
          <div className="space-y-3">
            {attivi.map((l) => (
              <Card key={l.id} lavoro={l} />
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="font-mono-cad text-xs tracking-widest text-[var(--blueprint-text-dim)] block mb-3">
          LAVORI CONCLUSI ({conclusi.length})
        </label>
        {conclusi.length === 0 ? (
          <p className="text-sm text-[var(--blueprint-text-dim)]">
            Nessun lavoro concluso ancora.
          </p>
        ) : (
          <div className="space-y-3">
            {conclusi.map((l) => (
              <Card key={l.id} lavoro={l} />
            ))}
          </div>
        )}
      </div>

      <p className="text-xs font-mono-cad text-[var(--blueprint-text-dim)] text-center">
        <Link href="/pubblica-lavoro" className="hover:text-[var(--blueprint-accent-strong)]">
          + pubblica un nuovo lavoro →
        </Link>
      </p>
    </div>
  );
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
        if (d.utente.ruolo === "azienda") return;
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

  if (utente.ruolo === "azienda") {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16">
        <p className="font-mono-cad text-xs tracking-[0.3em] text-[var(--blueprint-accent)] mb-4">
          TAV. 07 — I MIEI LAVORI
        </p>
        <h1 className="text-2xl font-semibold mb-1">I miei lavori</h1>
        <p className="text-[var(--blueprint-text-dim)] text-sm mb-8">
          I lavori che hai pubblicato su VerifiCAD, attivi e conclusi.
        </p>
        <LavoriAziendaSection utente={utente} />
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <p className="font-mono-cad text-xs tracking-[0.3em] text-[var(--blueprint-accent)] mb-4">
        TAV. 07 — IL MIO PROFILO
      </p>
      <h1 className="text-2xl font-semibold mb-1">Il mio profilo</h1>
      <p className="text-[var(--blueprint-text-dim)] text-sm mb-8">
        Queste informazioni sono quello che le aziende vedono quando valutano il tuo profilo.
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border border-[var(--blueprint-line)] p-4">
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
              <p className="col-span-1 sm:col-span-3 text-[11px] text-[var(--blueprint-text-dim)] mt-1">
                Valori standard per un professionista con Gestione Separata INPS: 4% / 22% / 20%. Se hai una cassa diversa (es. Inarcassa), modifica pure.
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="font-mono-cad text-xs tracking-widest text-[var(--blueprint-text-dim)] block mb-2">
            PAGAMENTI
          </label>
          <p className="text-xs text-[var(--blueprint-text-dim)] mb-3">
            Collega il tuo conto Stripe per poter ricevere i pagamenti dei lavori assegnati. Senza questo passaggio, le aziende non potranno pagarti tramite la piattaforma.
          </p>
          <div className="border border-[var(--blueprint-line)] p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <span
              className={`font-mono-cad text-xs ${
                stripeOnboardingCompletato
                  ? "text-[var(--blueprint-accent-strong)]"
                  : "text-[var(--blueprint-text-dim)]"
              }`}
            >
              {stripeOnboardingCompletato ? "✓ Stripe collegato" : "Stripe non ancora collegato"}
            </span>
            <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto">
              <button
                type="button"
                onClick={verificaStripe}
                disabled={verificandoStripe}
                className="font-mono-cad text-xs border border-[var(--blueprint-line)] text-[var(--blueprint-text-dim)] px-3 py-1.5 hover:border-[var(--blueprint-accent)] hover:text-[var(--blueprint-accent-strong)] transition-colors disabled:opacity-40 whitespace-nowrap text-center"
              >
                {verificandoStripe ? "verifica..." : "verifica stato"}
              </button>
              <button
                type="button"
                onClick={collegaStripe}
                disabled={collegandoStripe}
                className="font-mono-cad text-xs border border-[var(--blueprint-accent)] text-[var(--blueprint-accent-strong)] px-3 py-1.5 hover:bg-[var(--blueprint-accent)] hover:text-[var(--blueprint-bg)] transition-colors disabled:opacity-40 whitespace-nowrap text-center"
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
