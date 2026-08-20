import { NextRequest, NextResponse } from "next/server";
import { getUtenteCorrente } from "@/lib/auth";
import { getLavoro, rispondiContestazione } from "@/lib/data";
import { inviaEmailNotificaAdmin } from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const utente = await getUtenteCorrente();
  if (!utente) {
    return NextResponse.json({ error: "Devi accedere." }, { status: 401 });
  }
  const lavoro = await getLavoro(id);
  if (!lavoro) {
    return NextResponse.json({ error: "Lavoro non trovato." }, { status: 404 });
  }
  if (lavoro.disegnatoreUtenteId !== utente.id) {
    return NextResponse.json(
      { error: "Non sei il disegnatore assegnato a questo lavoro." },
      { status: 403 }
    );
  }
  if (!lavoro.contestato || lavoro.contestazioneRisoltaIl) {
    return NextResponse.json(
      { error: "Non c'è nessuna contestazione aperta su questo lavoro." },
      { status: 400 }
    );
  }
  if (lavoro.contestazioneRispostaDisegnatore) {
    return NextResponse.json({ error: "Hai già risposto a questa contestazione." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const risposta = (body?.risposta ?? "").trim();
  if (!risposta) {
    return NextResponse.json({ error: "Scrivi la tua versione dei fatti." }, { status: 400 });
  }

  await rispondiContestazione(id, risposta);

  try {
    await inviaEmailNotificaAdmin(
      "Risposta del disegnatore a una contestazione",
      `Lavoro: ${lavoro.titolo}\nRisposta del disegnatore:\n${risposta}`,
      `${req.nextUrl.origin}/admin/contestazioni`
    );
  } catch (err) {
    console.error("Errore invio email risposta contestazione:", err);
  }

  return NextResponse.json({ ok: true });
}
