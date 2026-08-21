export default function ComeFunziona() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <p className="font-mono-cad text-xs tracking-[0.3em] text-[var(--blueprint-accent)] mb-4">
        TAV. 01 — COME FUNZIONA
      </p>
      <h1 className="text-3xl font-semibold mb-3">Come funziona VerifiCAD</h1>
      <p className="text-[var(--blueprint-text-dim)] max-w-xl mb-12">
        Un flusso pensato perché sia oggettivo, protetto, e senza sorprese —
        per chi pubblica un lavoro e per chi lo esegue.
      </p>

      <section className="mb-14">
        <h2 className="font-mono-cad text-xs tracking-widest text-[var(--blueprint-accent)] mb-6">
          PER LE AZIENDE
        </h2>
        <ol className="space-y-6">
          <li className="border-l-2 border-[var(--blueprint-line)] pl-5">
            <p className="font-mono-cad text-sm text-[var(--blueprint-accent-strong)] mb-1">01 — Pubblica il lavoro</p>
            <p className="text-sm text-[var(--blueprint-text-dim)]">
              Descrivi il progetto, indica il budget a disposizione e allega il disegno tecnico
              (DWG, PDF) obbligatorio: sarà il riferimento oggettivo su cui verrà confrontato il
              modello consegnato.
            </p>
          </li>
          <li className="border-l-2 border-[var(--blueprint-line)] pl-5">
            <p className="font-mono-cad text-sm text-[var(--blueprint-accent-strong)] mb-1">02 — Ricevi le candidature</p>
            <p className="text-sm text-[var(--blueprint-text-dim)]">
              I disegnatori CAD si propongono con un messaggio. Scegli ed effettui il pagamento
              sulla piattaforma, bloccato fino all&apos;approvazione finale.
            </p>
          </li>
          <li className="border-l-2 border-[var(--blueprint-line)] pl-5">
            <p className="font-mono-cad text-sm text-[var(--blueprint-accent-strong)] mb-1">03 — Verifica e scarica</p>
            <p className="text-sm text-[var(--blueprint-text-dim)]">
              Il file è scaricabile alla consegna. Se qualcosa non è conforme, richiedi una
              revisione — sono incluse 3 revisioni gratuite.
            </p>
          </li>
          <li className="border-l-2 border-[var(--blueprint-line)] pl-5">
            <p className="font-mono-cad text-sm text-[var(--blueprint-accent-strong)] mb-1">04 — Approva e libera il pagamento</p>
            <p className="text-sm text-[var(--blueprint-text-dim)]">
              L&apos;approvazione rilascia il pagamento. Rilascio automatico dopo 30 giorni se non
              rispondi.
            </p>
          </li>
        </ol>
      </section>

      <section className="mb-14">
        <h2 className="font-mono-cad text-xs tracking-widest text-[var(--blueprint-accent)] mb-6">
          PER I DISEGNATORI CAD
        </h2>
        <ol className="space-y-6">
          <li className="border-l-2 border-[var(--blueprint-line)] pl-5">
            <p className="font-mono-cad text-sm text-[var(--blueprint-accent-strong)] mb-1">01 — Il pagamento è garantito</p>
            <p className="text-sm text-[var(--blueprint-text-dim)]">
              Quando ti candidi e vieni scelto, l&apos;azienda ha già versato l&apos;importo sulla
              piattaforma. Non lavori mai a rischio di non essere pagato.
            </p>
          </li>
          <li className="border-l-2 border-[var(--blueprint-line)] pl-5">
            <p className="font-mono-cad text-sm text-[var(--blueprint-accent-strong)] mb-1">02 — Consegni il lavoro</p>
            <p className="text-sm text-[var(--blueprint-text-dim)]">
              Carichi il file conforme al disegno tecnico ricevuto. L&apos;azienda può scaricarlo
              subito e darti conferma, oppure richiedere fino a 3 revisioni comprese nel budget
              iniziale.
            </p>
          </li>
          <li className="border-l-2 border-[var(--blueprint-line)] pl-5">
            <p className="font-mono-cad text-sm text-[var(--blueprint-accent-strong)] mb-1">03 — Vieni pagato</p>
            <p className="text-sm text-[var(--blueprint-text-dim)]">
              Approvazione finale dell&apos;azienda, o conferma automatica dopo 30 giorni se
              nessuno risponde. In entrambi i casi, vieni pagato.
            </p>
          </li>
        </ol>
      </section>

      <section>
        <h2 className="font-mono-cad text-xs tracking-widest text-[var(--blueprint-accent)] mb-4">
          COMMISSIONI
        </h2>
        <div className="border border-[var(--blueprint-line)] p-5">
          <p className="text-sm text-[var(--blueprint-text-dim)]">
            10% a carico dell&apos;azienda + 10% a carico del disegnatore, calcolati sul valore del
            lavoro. Nessun costo di iscrizione: si paga solo quando un lavoro viene chiuso con
            successo. Ogni lavoro include 3 revisioni gratuite.
          </p>
        </div>
      </section>
    </main>
  );
}
