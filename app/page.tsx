import Link from "next/link";
import { getLavori, statoLabel } from "@/lib/data";

const statoColor: Record<string, string> = {
  aperto: "text-[var(--blueprint-accent-strong)] border-[var(--blueprint-accent)]",
  in_corso: "text-[var(--blueprint-amber)] border-[var(--blueprint-amber)]",
  in_revisione: "text-[var(--blueprint-amber)] border-[var(--blueprint-amber)]",
  chiuso: "text-[var(--blueprint-text-dim)] border-[var(--blueprint-line)]",
};

export default function Home() {
  const lavori = getLavori();
  return (
    <main className="max-w-5xl mx-auto px-6">
      <section className="py-16 border-b border-[var(--blueprint-line)]">
        <p className="font-mono-cad text-xs tracking-[0.3em] text-[var(--blueprint-accent)] mb-4">
          TAV. 01 — BACHECA LAVORI
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold max-w-2xl leading-tight">
          Trova il disegnatore CAD giusto per il tuo progetto.
        </h1>
        <p className="mt-4 text-[var(--blueprint-text-dim)] max-w-xl">
          Competenze verificate, consegne conformi alle richieste, pagamento sempre protetto.
        </p>
      </section>

      <section className="py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-mono-cad text-sm tracking-widest text-[var(--blueprint-text-dim)]">
            LAVORI ATTIVI ({lavori.length})
          </h2>
        </div>

        <div className="grid gap-4">
          {lavori.map((lavoro) => (
            <Link
              key={lavoro.id}
              href={`/lavori/${lavoro.id}`}
              className="group border border-[var(--blueprint-line)] bg-[var(--blueprint-bg-2)]/60 hover:border-[var(--blueprint-accent)] transition-colors p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span
                      className={`font-mono-cad text-[10px] tracking-widest border px-2 py-0.5 ${statoColor[lavoro.stato]}`}
                    >
                      {statoLabel[lavoro.stato].toUpperCase()}
                    </span>
                    <span className="font-mono-cad text-[10px] text-[var(--blueprint-text-dim)]">
                      {lavoro.azienda}
                    </span>
                  </div>
                  <h3 className="text-lg font-medium group-hover:text-[var(--blueprint-accent-strong)] transition-colors">
                    {lavoro.titolo}
                  </h3>
                  <p className="text-sm text-[var(--blueprint-text-dim)] mt-1 max-w-xl">
                    {lavoro.descrizione}
                  </p>
                  <p className="font-mono-cad text-[11px] text-[var(--blueprint-accent)] mt-3">
                    ⌗ {lavoro.disegnoAllegato}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono-cad text-xl text-[var(--blueprint-accent-strong)]">
                    €{lavoro.budget}
                  </p>
                  <p className="text-xs text-[var(--blueprint-text-dim)] mt-1">
                    scad. {lavoro.scadenza}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
