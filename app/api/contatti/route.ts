import { NextRequest, NextResponse } from "next/server";
import { inviaEmailContatto } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { nome, email, messaggio } = await req.json();

  if (!nome || !email || !messaggio) {
    return NextResponse.json(
      { error: "Compila tutti i campi." },
      { status: 400 }
    );
  }
  if (String(messaggio).trim().length < 10) {
    return NextResponse.json(
      { error: "Scrivi un messaggio un po' più dettagliato." },
      { status: 400 }
    );
  }

  const inviata = await inviaEmailContatto({
    nome: String(nome).trim(),
    email: String(email).trim(),
    messaggio: String(messaggio).trim(),
  });

  if (!inviata) {
    return NextResponse.json(
      { error: "Errore nell'invio del messaggio. Riprova più tardi." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
