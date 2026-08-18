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

  const { motivo } = await req.json();
  if (!motivo || String(motivo).trim().length < 5) {
    return NextResponse.json(
      { error: "Indica quale quota o dettaglio del disegno non è rispettato." },
      { status: 400 }
    );
  }

  await richiediRevisione(id, String(motivo).trim());
  return NextResponse.json({ ok: true });
}
