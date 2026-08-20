import { NextResponse } from "next/server";
import { getUtenteCorrente } from "@/lib/auth";
import { verificaStatoOnboarding } from "@/lib/pagamenti";

export async function POST() {
  const utente = await getUtenteCorrente();
  if (!utente || utente.ruolo !== "disegnatore") {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
  }

  try {
    const risultato = await verificaStatoOnboarding(utente.id);
    if ("errore" in risultato) {
      return NextResponse.json({ error: risultato.errore }, { status: 400 });
    }
    return NextResponse.json(risultato);
  } catch (err) {
    console.error("Errore imprevisto nella route stripe-status:", err);
    const messaggio = err instanceof Error ? err.message : "Errore sconosciuto.";
    return NextResponse.json({ error: `Errore imprevisto: ${messaggio}` }, { status: 500 });
  }
}
