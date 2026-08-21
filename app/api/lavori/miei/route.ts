import { NextResponse } from "next/server";
import { getLavoriByAzienda } from "@/lib/data";
import { getUtenteCorrente } from "@/lib/auth";

export async function GET() {
  const utente = await getUtenteCorrente();
  if (!utente || utente.ruolo !== "azienda") {
    return NextResponse.json(
      { error: "Solo un'azienda autenticata può vedere i propri lavori." },
      { status: 401 }
    );
  }
  const lavori = await getLavoriByAzienda(utente.id);
  return NextResponse.json(lavori);
}
