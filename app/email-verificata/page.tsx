import Link from "next/link";

export default async function EmailVerificata({
  searchParams,
}: {
  searchParams: Promise<{ esito?: string }>;
}) {
  const { esito } = await searchParams;
  const ok = esito === "ok";

  return (
    <main className="max-w-md mx-auto px-6 py-24 text-center">
      <p className="font-mono-cad text-xs tracking-[0.3em] text-[var(--blueprint-accent)] mb-6">
        VERIFICA EMAIL
      </p>
      {ok ? (
        <>
          <h1 className="text-2xl font-semibold mb-3 text-[var(--blueprint-accent-strong)]">
            ✓ Email confermata
          </h1>
          <p className="text-[var(--blueprint-text-dim)] text-sm mb-8">
            Il tuo indirizzo email è stato verificato. Il tuo account è ora completamente attivo.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-semibold mb-3 text-red-400">
            Link non valido
          </h1>
          <p className="text-[var(--blueprint-text-dim)] text-sm mb-8">
            Il link di conferma non è valido o è già stato usato. Se pensi sia un errore,
            contattaci o prova a registrarti di nuovo.
          </p>
        </>
      )}
      <Link
        href="/"
        className="inline-block font-mono-cad text-sm border border-[var(--blueprint-accent)] text-[var(--blueprint-accent-strong)] px-4 py-2 hover:bg-[var(--blueprint-accent)] hover:text-[var(--blueprint-bg)] transition-colors"
      >
        vai alla bacheca →
      </Link>
    </main>
  );
}
