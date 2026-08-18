import { NextRequest, NextResponse } from "next/server";
import { creaLavoro, getLavori } from "@/lib/data";
import { getUtenteCorrente } from "@/lib/auth";

export async function GET() {
  return NextResponse.json(await getLavori());
}

export async function POST(req: NextRequest) {
  const utente = await getUtenteCorrente();
  if (!utente || utente.ruolo !== "azienda") {
    return NextResponse.json(
      { error: "Solo un'azienda autenticata può pubblicare un lavoro." },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { titolo, descrizione, budget, scadenza, disegnoAllegato } = body;

  if (!titolo || !descrizione || !budget || !scadenza || !disegnoAllegato) {
    return NextResponse.json(
      { error: "Tutti i campi sono obbligatori, incluso il disegno tecnico." },
      { status: 400 }
    );
  }

  const id = await creaLavoro({
    titolo,
    descrizione,
    azienda: utente.nome,
    aziendaUtenteId: utente.id,
    budget: Number(budget),
    scadenza,
    disegnoAllegato,
  });

  return NextResponse.json({ id });
}
