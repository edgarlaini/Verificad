import { NextRequest, NextResponse } from "next/server";
import { getUtenteCorrente } from "@/lib/auth";
import { consegnaLavoro, getLavoro } from "@/lib/data";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const utente = await getUtenteCorrente();
  if (!utente || utente.ruolo !== "disegnatore") {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
  }

  const lavoro = await getLavoro(id);
  if (!lavoro || lavoro.disegnatoreUtenteId !== utente.id) {
    return NextResponse.json(
      { error: "Non sei il disegnatore assegnato a questo lavoro." },
      { status: 403 }
    );
  }
  if (lavoro.stato !== "in_corso") {
    return NextResponse.json(
      { error: "Il lavoro non è nello stato corretto per la consegna." },
      { status: 400 }
    );
  }

  const { consegnaFile } = await req.json();
  if (!consegnaFile) {
    return NextResponse.json(
      { error: "Carica il file del modello 3D per completare la consegna." },
      { status: 400 }
    );
  }

  await consegnaLavoro({ lavoroId: id, disegnatoreUtenteId: utente.id, consegnaFile });
  return NextResponse.json({ ok: true });
}
