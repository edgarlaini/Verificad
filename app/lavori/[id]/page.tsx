export const dynamic = "force-dynamic";

import { getLavoro, statoLabel, giorniRimanentiRevisione, getRevisioniLavoro } from "@/lib/data";
import { calcolaCommissione } from "@/lib/calc";
import { getUtenteCorrente } from "@/lib/auth";
import { notFound } from "next/navigation";
import PannelloCandidature from "@/components/PannelloCandidature";
import PannelloConsegna from "@/components/PannelloConsegna";
import ChatLavoro from "@/components/ChatLavoro";

export default async function DettaglioLavoro({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lavoro = await getLavoro(id);
  if (!lavoro) notFound();

  const split = calcolaCommissione(lavoro.budget);
  const revisioni = await getRevisioniLavoro(id);
  const utente = await getUtenteCorrente();

  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <p className="font-mono-cad text-xs tracking-[0.3em] text-[var(--blueprint-accent)] mb-4">
        TAV. 04 — DETTAGLIO LAVORO
      </p>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4 mb-2">
        <h1 className="text-2xl font-semibold">{lavoro.titolo}</h1>
        <span className="font-mono-cad text-[10px] tracking-widest border border-[var(--blueprint-accent)] text-[var(--blueprint-accent-strong)] px-2 py-1 shrink-0">
          {statoLabel[lavoro.stato].toUpperCase()}
        </span>
      </div>
      <p className="text-[var(--blueprint-text-dim)] font-mono-cad text-sm mb-8">
        {lavoro.azienda} · scadenza {lavoro.scadenza}
      </p>

      <div className="border border-[var(--blueprint-line)] bg-[var(--blueprint-bg-2)]/60 p-6 mb-6">
        <p className="text-sm leading-relaxed">{lavoro.descrizione}</p>
        <div className="mt-4 pt-4 border-t border-[var(--blueprint-line)] flex items-center gap-2">
          <span className="font-mono-cad text-[var(--blueprint-accent)] text-sm">⌗</span>
          <a
            href={lavoro.disegnoAllegato}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono-cad text-sm text-[var(--blueprint-accent-strong)] hover:underline"
          >
            {lavoro.disegnoNome || lavoro.disegnoAllegato}
          </a>
          <span className="text-xs text-[var(--blueprint-text-dim)] ml-auto">
            riferimento per la verifica del modello consegnato
          </span>
        </div>
      </div>

      {lavoro.disegnatoreAssegnato && (
        <div className="border border-[var(--blueprint-line)] p-4 mb-6 text-sm">
          <span className="text-[var(--blueprint-text-dim)]">assegnato a </span>
          <span className="text-[var(--blueprint-accent-strong)]">
            {lavoro.disegnatoreAssegnato}
          </span>
        </div>
      )}

      <div className="border border-[var(--blueprint-line)] p-6">
        <h2 className="font-mono-cad text-xs tracking-widest text-[var(--blueprint-text-dim)] mb-4">
          RIPARTIZIONE PAGAMENTO
        </h2>
        <dl className="space-y-3 text-sm font-mono-cad">
          <div className="flex justify-between">
            <dt className="text-[var(--blueprint-text-dim)]">valore lavoro</dt>
            <dd>€{lavoro.budget.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--blueprint-text-dim)]">+ commissione azienda (10%)</dt>
            <dd>€{split.commissioneAzienda.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between border-t border-[var(--blueprint-line)] pt-3">
            <dt>totale addebitato all&apos;azienda</dt>
            <dd className="text-[var(--blueprint-accent-strong)]">
              €{split.totalePagatoAzienda.toFixed(2)}
            </dd>
          </div>
          <div className="flex justify-between pt-3">
            <dt className="text-[var(--blueprint-text-dim)]">− commissione disegnatore (10%)</dt>
            <dd>−€{split.commissioneDisegnatore.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between border-t border-[var(--blueprint-line)] pt-3">
            <dt>netto al disegnatore</dt>
            <dd className="text-[var(--blueprint-amber)]">
              €{split.nettoDisegnatore.toFixed(2)}
            </dd>
          </div>
        </dl>
        <p className="text-xs text-[var(--blueprint-text-dim)] mt-4">
          fondi bloccati in escrow fino ad approvazione consegna, o rilascio automatico dopo 30 giorni. Includono 3 revisioni gratuite.
        </p>
      </div>

      <PannelloCandidature
        lavoroId={lavoro.id}
        lavoroStato={lavoro.stato}
        aziendaUtenteId={lavoro.aziendaUtenteId}
      />

      <PannelloConsegna
        lavoroId={lavoro.id}
        stato={lavoro.stato}
        budget={lavoro.budget}
        disegnatoreUtenteId={lavoro.disegnatoreUtenteId}
        aziendaUtenteId={lavoro.aziendaUtenteId}
        consegnaFile={lavoro.consegnaFile}
        consegnaNome={lavoro.consegnaNome}
        dataConsegna={lavoro.dataConsegna}
        motivoRevisione={lavoro.motivoRevisione}
        revisioniUsate={lavoro.revisioniUsate}
        giorniRimanenti={
          lavoro.dataConsegna ? giorniRimanentiRevisione(lavoro.dataConsegna) : 30
        }
      />

      {utente && (utente.id === lavoro.aziendaUtenteId || utente.id === lavoro.disegnatoreUtenteId) && (
        <ChatLavoro lavoroId={lavoro.id} stato={lavoro.stato} utenteCorrenteId={utente.id} />
      )}

      {revisioni.length > 0 && (
        <div className="border border-[var(--blueprint-line)] p-6 mt-6">
          <h2 className="font-mono-cad text-xs tracking-widest text-[var(--blueprint-text-dim)] mb-4">
            CRONOLOGIA REVISIONI
          </h2>
          <ul className="space-y-4">
            {revisioni.map((r) => (
              <li key={r.id} className="border-l-2 border-[var(--blueprint-line)] pl-4">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`font-mono-cad text-[10px] tracking-widest px-2 py-0.5 border ${
                      r.tipo === "modifica"
                        ? "border-[var(--blueprint-amber)] text-[var(--blueprint-amber)]"
                        : "border-[var(--blueprint-line)] text-[var(--blueprint-text-dim)]"
                    }`}
                  >
                    {r.tipo === "modifica" ? "MODIFICA DI PROGETTO" : "ERRORE DA CORREGGERE"}
                  </span>
                  <span className="font-mono-cad text-[10px] text-[var(--blueprint-text-dim)]">
                    {new Date(r.creatoIl).toLocaleDateString("it-IT")}
                  </span>
                </div>
                <p className="text-sm text-[var(--blueprint-text-dim)]">{r.motivo}</p>
                {r.tipo === "modifica" && r.disegnoUrl && (
                  <a
                    href={r.disegnoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono-cad text-xs text-[var(--blueprint-accent-strong)] hover:underline"
                  >
                    ⌗ {r.disegnoNome} →
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
