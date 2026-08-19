import { NextRequest, NextResponse } from "next/server";
import { registraUtente, creaSessione, impostaCookieSessione } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password, ruolo, nome } = await req.json();

  if (!email || !password || !ruolo || !nome) {
    return NextResponse.json({ error: "Tutti i campi sono obbligatori." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "La password deve avere almeno 6 caratteri." },
      { status: 400 }
    );
  }
  if (ruolo !== "azienda" && ruolo !== "disegnatore") {
    return NextResponse.json({ error: "Ruolo non valido." }, { status: 400 });
  }

  const baseUrl = req.nextUrl.origin;
  const risultato = await registraUtente({ email, password, ruolo, nome, baseUrl });
  if (!risultato.ok) {
    return NextResponse.json({ error: risultato.errore }, { status: 400 });
  }

  const token = await creaSessione(risultato.utente.id);
  await impostaCookieSessione(token);

  return NextResponse.json({ utente: risultato.utente });
}
