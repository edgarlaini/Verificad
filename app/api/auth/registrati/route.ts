import { NextRequest, NextResponse } from "next/server";
import { registraUtente, creaSessione, impostaCookieSessione } from "@/lib/auth";
import { inviaEmailNotificaAdmin } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { email, password, ruolo, nome, accettaTermini, accettaClausoleSpecifiche } =
    await req.json();
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
  if (accettaTermini !== true || accettaClausoleSpecifiche !== true) {
    return NextResponse.json(
      { error: "Devi accettare i Termini di Servizio e le clausole specifiche per registrarti." },
      { status: 400 }
    );
  }
  const baseUrl = req.nextUrl.origin;
  const risultato = await registraUtente({
    email,
    password,
    ruolo,
    nome,
    baseUrl,
    accettaTermini,
    accettaClausoleSpecifiche,
  });
  if (!risultato.ok) {
    return NextResponse.json({ error: risultato.errore }, { status: 400 });
  }
  const token = await creaSessione(risultato.utente.id);
  await impostaCookieSessione(token);

  // Notifica a Edgar quando si registra un nuovo disegnatore — non blocca
  // né fa fallire la registrazione se l'invio dovesse avere problemi.
  if (ruolo === "disegnatore") {
    try {
      await inviaEmailNotificaAdmin(
        "Nuovo disegnatore registrato",
        `${nome} (${email}) si è appena registrato come disegnatore CAD.`,
        `${baseUrl}/disegnatori`
      );
    } catch (err) {
      console.error("Errore invio notifica nuovo disegnatore:", err);
    }
  }

  return NextResponse.json({ utente: risultato.utente });
}
