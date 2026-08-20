import { NextRequest, NextResponse } from "next/server";
import { getUtenteCorrente } from "@/lib/auth";
import { getProfilo, salvaProfilo } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const utente = await getUtenteCorrente();
  if (!utente) {
    return NextResponse.json({ error: "Devi accedere." }, { status: 401 });
  }
  const profilo = await getProfilo(utente.id);
  return NextResponse.json({ profilo });
}

export async function POST(req: NextRequest) {
  const utente = await getUtenteCorrente();
  if (!utente) {
    return NextResponse.json({ error: "Devi accedere." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Dati non validi." }, { status: 400 });
  }

  const competenze = typeof body.competenze === "string" ? body.competenze : "";
  const programmiCad = Array.isArray(body.programmiCad) ? body.programmiCad : [];
  const regimeFiscale = body.regimeFiscale === "ordinario" ? "ordinario" : "forfettario";

  // Le percentuali contano solo in regime ordinario, ma le validiamo comunque
  // per evitare valori assurdi salvati per errore.
  const clamp = (v: unknown, fallback: number) => {
    const n = typeof v === "number" ? v : parseFloat(v as string);
    if (!isFinite(n) || n < 0 || n > 100) return fallback;
    return n;
  };
  const percentualeRivalsa = clamp(body.percentualeRivalsa, 4);
  const aliquotaIva = clamp(body.aliquotaIva, 22);
  const percentualeRitenuta = clamp(body.percentualeRitenuta, 20);

  await salvaProfilo({
    utenteId: utente.id,
    competenze,
    programmiCad,
    regimeFiscale,
    percentualeRivalsa,
    aliquotaIva,
    percentualeRitenuta,
  });

  return NextResponse.json({ ok: true });
}
