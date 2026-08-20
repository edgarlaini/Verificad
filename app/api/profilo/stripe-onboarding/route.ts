import { NextRequest, NextResponse } from "next/server";
import { getUtenteCorrente } from "@/lib/auth";
import { creaOnboardingDisegnatore } from "@/lib/pagamenti";

export async function POST(req: NextRequest) {
  const utente = await getUtenteCorrente();
  if (!utente || utente.ruolo !== "disegnatore") {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
  }

  try {
    const baseUrl = req.nextUrl.origin;
    const risultato = await creaOnboardingDisegnatore({
      utenteId: utente.id,
      email: utente.email,
      baseUrl,
    });

    if ("errore" in risultato) {
      return NextResponse.json({ error: risultato.errore }, { status: 400 });
    }
    return NextResponse.json({ url: risultato.url });
  } catch (err) {
    console.error("Errore imprevisto nella route stripe-onboarding:", err);
    const messaggio = err instanceof Error ? err.message : "Errore sconosciuto.";
    return NextResponse.json({ error: `Errore imprevisto: ${messaggio}` }, { status: 500 });
  }
}
