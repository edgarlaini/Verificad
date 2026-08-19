import { NextRequest, NextResponse } from "next/server";
import { getUtenteCorrente } from "@/lib/auth";
import { richiediRevisione, getLavoro } from "@/lib/data";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const utente = await getUtenteCorrente();
  const lavoro = await getLavoro(id);
  if (!utente || !lavoro || lavoro.aziendaUtenteId !== utente.id) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });
  }
  if (lavoro.stato !== "in_revisione") {
    return NextResponse.json(
      { error: "Il lavoro non è in revisione." },
      { status: 400 }
    );
  }

  const { motivo, tipo, disegnoUrl, disegnoNome } = await req.json();
  if (!motivo || String(motivo).trim().length < 5) {
    return NextResponse.json(
      { error: "Indica quale quota o dettaglio del disegno non è rispettato." },
      { status: 400 }
    );
  }
  if (tipo !== "errore" && tipo !== "modifica") {
    return NextResponse.json(
      { error: "Specifica se è un errore da correggere o una modifica di progetto." },
      { status: 400 }
    );
  }

  const risultato = await richiediRevisione({
    lavoroId: id,
    tipo,
    motivo: String(motivo).trim(),
    disegnoUrl,
    disegnoNome,
  });

  if (!risultato.ok) {
    if (risultato.bloccatoDaExtra) {
      return NextResponse.json(
        {
          error:
            "Hai già usato le 3 revisioni di progetto incluse. Serve un extra del 20% per sbloccarne altre.",
          extra: risultato.extra,
        },
        { status: 402 }
      );
    }
    return NextResponse.json({ error: risultato.errore }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
