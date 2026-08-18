import { getDisegnatori } from "@/lib/data";

export default function Disegnatori() {
  const disegnatori = getDisegnatori();
  return (
    <main className="max-w-5xl mx-auto px-6 py-16">
      <p className="font-mono-cad text-xs tracking-[0.3em] text-[var(--blueprint-accent)] mb-4">
        TAV. 04 — DISEGNATORI VERIFICATI
      </p>
      <h1 className="text-2xl font-semibold mb-8">Disegnatori CAD</h1>

      <div className="grid sm:grid-cols-2 gap-4">
        {disegnatori.map((d) => (
          <div
            key={d.id}
            className="border border-[var(--blueprint-line)] bg-[var(--blueprint-bg-2)]/60 p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-medium">{d.nome}</h3>
              <span className="font-mono-cad text-sm text-[var(--blueprint-amber)]">
                ★ {d.valutazione}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {d.competenze.map((c) => (
                <span
                  key={c}
                  className="font-mono-cad text-[10px] border border-[var(--blueprint-line)] text-[var(--blueprint-text-dim)] px-2 py-1"
                >
                  {c}
                </span>
              ))}
            </div>
            <p className="text-xs text-[var(--blueprint-text-dim)] font-mono-cad">
              {d.lavoriCompletati} lavori completati
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
