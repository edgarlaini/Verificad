import { NextRequest, NextResponse } from "next/server";
import { getUtenteCorrente } from "@/lib/auth";
import { approvaLavoro, getLavoro } from "@/lib/data";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const utente = await getUtenteCorrente();
  const lavoro = getLavoro(id);
  if (!utente || !lavoro || lavoro.aziendaUtenteId !== utente.id) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });
  }
  if (lavoro.stato !== "in_revisione") {
    return NextResponse.json(
      { error: "Il lavoro non è in revisione." },
      { status: 400 }
    );
  }

  approvaLavoro(id);
  return NextResponse.json({ ok: true });
}
