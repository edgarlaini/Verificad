import { NextRequest, NextResponse } from "next/server";
import { creaLavoro, getLavori } from "@/lib/data";
import { getUtenteCorrente } from "@/lib/auth";
import { inviaEmailNotificaAdmin } from "@/lib/email";

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
  const { titolo, descrizione, budget, scadenza, disegnoAllegato, disegnoNome } = body;
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
    disegnoNome: disegnoNome || disegnoAllegato,
  });

  // Notifica a Edgar quando un'azienda pubblica un nuovo lavoro — non blocca
  // né fa fallire la pubblicazione se l'invio dovesse avere problemi.
  try {
    const baseUrl = req.nextUrl.origin;
    await inviaEmailNotificaAdmin(
      "Nuovo lavoro pubblicato",
      `${utente.nome} ha pubblicato il lavoro "${titolo}" — budget €${budget}.`,
      `${baseUrl}/lavori/${id}`
    );
  } catch (err) {
    console.error("Errore invio notifica nuovo lavoro:", err);
  }

  return NextResponse.json({ id });
}
