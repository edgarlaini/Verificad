export const dynamic = "force-dynamic";
import { getDisegnatori } from "@/lib/data";

function formattaNomePubblico(nomeCompleto: string): string {
  const parti = nomeCompleto.trim().split(/\s+/);
  if (parti.length < 2) return nomeCompleto;
  const nome = parti[0];
  const cognome = parti[parti.length - 1];
  return `${nome} ${cognome.charAt(0).toUpperCase()}.`;
}

export default async function Disegnatori() {
  const disegnatori = await getDisegnatori();
  return (
    <main className="max-w-5xl mx-auto px-6 py-16">
      <p className="font-mono-cad text-xs tracking-[0.3em] text-[var(--blueprint-accent)] mb-4">
        TAV. 03 — DISEGNATORI VERIFICATI
      </p>
      <h1 className="text-2xl font-semibold mb-8">Disegnatori CAD</h1>
      {disegnatori.length === 0 ? (
        <p className="text-sm text-[var(--blueprint-text-dim)] font-mono-cad">
          Nessun disegnatore registrato ancora.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {disegnatori.map((d) => (
            <div
              key={d.id}
              className="border border-[var(--blueprint-line)] bg-[var(--blueprint-bg-2)]/60 p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-medium">{formattaNomePubblico(d.nome)}</h3>
                <span className="font-mono-cad text-xs text-[var(--blueprint-text-dim)]">
                  {d.lavoriCompletati > 0 ? `${d.lavoriCompletati} lavori completati` : "nuovo profilo"}
                </span>
              </div>
              {d.competenze && (
                <p className="text-sm text-[var(--blueprint-text-dim)] mb-3">{d.competenze}</p>
              )}
              {d.programmiCad.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {d.programmiCad.map((c) => (
                    <span
                      key={c}
                      className="font-mono-cad text-[10px] border border-[var(--blueprint-line)] text-[var(--blueprint-text-dim)] px-2 py-1"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

