import { NextRequest, NextResponse } from "next/server";
import { getUtenteCorrente } from "@/lib/auth";
import { accettaCandidatura, getLavoro } from "@/lib/data";
import db from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: candidaturaId } = await params;
  const utente = await getUtenteCorrente();
  if (!utente || utente.ruolo !== "azienda") {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
  }

  const cand = db
    .prepare("SELECT * FROM candidature WHERE id = ?")
    .get(candidaturaId) as { lavoroId: string } | undefined;
  if (!cand) {
    return NextResponse.json({ error: "Candidatura non trovata." }, { status: 404 });
  }

  const lavoro = getLavoro(cand.lavoroId);
  if (!lavoro || lavoro.aziendaUtenteId !== utente.id) {
    return NextResponse.json(
      { error: "Non sei il proprietario di questo lavoro." },
      { status: 403 }
    );
  }

  accettaCandidatura(candidaturaId);
  return NextResponse.json({ ok: true });
}
