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
              Descrivi il progetto e allega il disegno tecnico (DWG, PDF). È obbligatorio: sarà il
              riferimento oggettivo su cui verrà confrontato il modello consegnato.
            </p>
          </li>
          <li className="border-l-2 border-[var(--blueprint-line)] pl-5">
            <p className="font-mono-cad text-sm text-[var(--blueprint-accent-strong)] mb-1">02 — Ricevi le candidature</p>
            <p className="text-sm text-[var(--blueprint-text-dim)]">
              I disegnatori CAD si propongono con un breve messaggio. Scegli chi assegnare al lavoro.
            </p>
          </li>
          <li className="border-l-2 border-[var(--blueprint-line)] pl-5">
            <p className="font-mono-cad text-sm text-[var(--blueprint-accent-strong)] mb-1">03 — Verifica prima di pagare</p>
            <p className="text-sm text-[var(--blueprint-text-dim)]">
              Quando il lavoro è consegnato, lo ispezioni direttamente nel browser con un
              visualizzatore 3D interattivo — puoi ruotarlo e zoomarlo, ma non scaricarlo finché
              non approvi. Se qualcosa non torna, richiedi una revisione indicando quale dettaglio
              non è conforme al disegno.
            </p>
          </li>
          <li className="border-l-2 border-[var(--blueprint-line)] pl-5">
            <p className="font-mono-cad text-sm text-[var(--blueprint-accent-strong)] mb-1">04 — Approva e sblocca il file</p>
            <p className="text-sm text-[var(--blueprint-text-dim)]">
              Solo dopo la tua approvazione il file originale diventa scaricabile, e il pagamento
              viene rilasciato al disegnatore. Se non rispondi entro 14 giorni, l&apos;approvazione
              scatta automaticamente.
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
            <p className="font-mono-cad text-sm text-[var(--blueprint-accent-strong)] mb-1">01 — Il pagamento è già garantito</p>
            <p className="text-sm text-[var(--blueprint-text-dim)]">
              Quando ti candidi e vieni scelto, l&apos;azienda ha già versato l&apos;importo sulla
              piattaforma. Non lavori mai a rischio di non essere pagato.
            </p>
          </li>
          <li className="border-l-2 border-[var(--blueprint-line)] pl-5">
            <p className="font-mono-cad text-sm text-[var(--blueprint-accent-strong)] mb-1">02 — Consegni il lavoro</p>
            <p className="text-sm text-[var(--blueprint-text-dim)]">
              Carichi il modello 3D finale, conforme al disegno tecnico ricevuto. L&apos;azienda lo
              visiona nel browser, senza poterlo scaricare finché non approva.
            </p>
          </li>
          <li className="border-l-2 border-[var(--blueprint-line)] pl-5">
            <p className="font-mono-cad text-sm text-[var(--blueprint-accent-strong)] mb-1">03 — Vieni pagato</p>
            <p className="text-sm text-[var(--blueprint-text-dim)]">
              Approvazione dell&apos;azienda, o rilascio automatico dopo 14 giorni se non risponde.
              In entrambi i casi, il pagamento arriva.
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
            successo.
          </p>
        </div>
      </section>
    </main>
  );
}
