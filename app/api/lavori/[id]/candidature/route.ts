import { NextRequest, NextResponse } from "next/server";
import { getUtenteCorrente } from "@/lib/auth";
import {
  creaCandidatura,
  getCandidatureLavoro,
  haGiaCandidato,
  getLavoro,
} from "@/lib/data";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json(await getCandidatureLavoro(id));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: lavoroId } = await params;
  const utente = await getUtenteCorrente();

  if (!utente || utente.ruolo !== "disegnatore") {
    return NextResponse.json(
      { error: "Solo un disegnatore autenticato può candidarsi." },
      { status: 401 }
    );
  }

  const lavoro = await getLavoro(lavoroId);
  if (!lavoro || lavoro.stato !== "aperto") {
    return NextResponse.json(
      { error: "Questo lavoro non accetta più candidature." },
      { status: 400 }
    );
  }

  if (await haGiaCandidato(lavoroId, utente.id)) {
    return NextResponse.json(
      { error: "Ti sei già candidato per questo lavoro." },
      { status: 400 }
    );
  }

  const { messaggio } = await req.json();
  if (!messaggio || String(messaggio).trim().length < 5) {
    return NextResponse.json(
      { error: "Scrivi un breve messaggio per la tua candidatura." },
      { status: 400 }
    );
  }

  const id = await creaCandidatura({
    lavoroId,
    disegnatoreUtenteId: utente.id,
    disegnatoreNome: utente.nome,
    messaggio: String(messaggio).trim(),
  });

  return NextResponse.json({ id });
}
