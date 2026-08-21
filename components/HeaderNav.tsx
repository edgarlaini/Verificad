"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

interface Utente {
  id: string;
  email: string;
  ruolo: "azienda" | "disegnatore";
  nome: string;
}

export default function HeaderNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [utente, setUtente] = useState<Utente | null | undefined>(undefined);
  const [menuAperto, setMenuAperto] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUtente(d.utente));
    // Rilegge lo stato utente ad ogni cambio pagina: dopo un login o una
    // registrazione, la pagina reindirizza con una navigazione client-side
    // (senza ricaricare il sito), quindi senza questa dipendenza l'header
    // resterebbe fermo allo stato letto al primo caricamento.
  }, [pathname]);

  async function esci() {
    await fetch("/api/auth/esci", { method: "POST" });
    setUtente(null);
    setMenuAperto(false);
    router.push("/");
    router.refresh();
  }

  const linkClass =
    "hover:text-[var(--blueprint-accent-strong)] transition-colors py-2 sm:py-0";
  const bottoneClass =
    "border border-[var(--blueprint-accent)] text-[var(--blueprint-accent-strong)] px-3 py-1.5 hover:bg-[var(--blueprint-accent)] hover:text-[var(--blueprint-bg)] transition-colors text-center";

  return (
    <>
      {/* Pulsante hamburger, solo su mobile */}
      <button
        onClick={() => setMenuAperto(!menuAperto)}
        aria-label="Apri menu"
        className="sm:hidden font-mono-cad text-[var(--blueprint-accent-strong)] text-xl leading-none px-1"
      >
        {menuAperto ? "✕" : "☰"}
      </button>

      {/* Menu su schermi normali: riga orizzontale */}
      <nav className="hidden sm:flex items-center gap-6 text-sm font-mono-cad text-[var(--blueprint-text-dim)]">
        <Link href="/come-funziona" className={linkClass}>come funziona</Link>
        <Link href="/" className={linkClass}>bacheca</Link>
        <Link href="/disegnatori" className={linkClass}>disegnatori</Link>
        <Link href="/contatti" className={linkClass}>contatti</Link>

        {utente === undefined ? null : utente ? (
          <>
            {utente.ruolo === "azienda" && (
              <Link href="/lavori/nuovo" className={bottoneClass}>+ pubblica lavoro</Link>
            )}
            <Link href="/profilo" className={linkClass}>il mio profilo</Link>
            <span className="text-xs text-[var(--blueprint-text-dim)]">
              {utente.nome} · {utente.ruolo}
            </span>
            <button onClick={esci} className={linkClass}>esci</button>
          </>
        ) : (
          <>
            <Link href="/accedi" className={linkClass}>accedi</Link>
            <Link href="/registrati" className={bottoneClass}>registrati</Link>
          </>
        )}
      </nav>

      {/* Menu a tendina su mobile, sotto l'header */}
      {menuAperto && (
        <nav className="sm:hidden absolute top-full left-0 right-0 bg-[#0b1e2e] border-b border-[var(--blueprint-line)] flex flex-col px-6 py-4 gap-1 text-sm font-mono-cad text-[var(--blueprint-text-dim)] z-50 shadow-xl">
          <Link href="/come-funziona" className={linkClass} onClick={() => setMenuAperto(false)}>come funziona</Link>
          <Link href="/" className={linkClass} onClick={() => setMenuAperto(false)}>bacheca</Link>
          <Link href="/disegnatori" className={linkClass} onClick={() => setMenuAperto(false)}>disegnatori</Link>
          <Link href="/contatti" className={linkClass} onClick={() => setMenuAperto(false)}>contatti</Link>

          {utente === undefined ? null : utente ? (
            <>
              {utente.ruolo === "azienda" && (
                <Link
                  href="/lavori/nuovo"
                  onClick={() => setMenuAperto(false)}
                  className={`${bottoneClass} mt-2`}
                >
                  + pubblica lavoro
                </Link>
              )}
              <Link href="/profilo" className={linkClass} onClick={() => setMenuAperto(false)}>
                il mio profilo
              </Link>
              <span className="text-xs text-[var(--blueprint-text-dim)] pt-3 border-t border-[var(--blueprint-line)] mt-2">
                {utente.nome} · {utente.ruolo}
              </span>
              <button onClick={esci} className={`${linkClass} text-left`}>esci</button>
            </>
          ) : (
            <>
              <Link href="/accedi" className={linkClass} onClick={() => setMenuAperto(false)}>accedi</Link>
              <Link
                href="/registrati"
                onClick={() => setMenuAperto(false)}
                className={`${bottoneClass} mt-2`}
              >
                registrati
              </Link>
            </>
          )}
        </nav>
      )}
    </>
  );
}
