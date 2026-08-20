import { NextRequest, NextResponse } from "next/server";
import { getUtenteCorrente } from "@/lib/auth";
import { risolviContestazione } from "@/lib/pagamenti";

const ADMIN_EMAIL = "edgar.laini@gmail.com";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const utente = await getUtenteCorrente();
  if (!utente || utente.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const percentuale = Number(body?.percentualeRimborsoAzienda);
  if (!isFinite(percentuale) || percentuale < 0 || percentuale > 100) {
    return NextResponse.json({ error: "Percentuale non valida (0-100)." }, { status: 400 });
  }

  const risultato = await risolviContestazione(id, percentuale);
  if ("errore" in risultato) {
    return NextResponse.json({ error: risultato.errore }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
