import { NextRequest, NextResponse } from "next/server";
import { autenticaUtente, creaSessione, impostaCookieSessione } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email e password obbligatorie." }, { status: 400 });
  }

  const risultato = await autenticaUtente(email, password);
  if (!risultato.ok) {
    return NextResponse.json({ error: risultato.errore }, { status: 401 });
  }

  const token = await creaSessione(risultato.utente.id);
  await impostaCookieSessione(token);

  return NextResponse.json({ utente: risultato.utente });
}
