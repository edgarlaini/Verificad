import { NextRequest, NextResponse } from "next/server";
import { getUtenteCorrente } from "@/lib/auth";
import { getProfilo, salvaProfilo, PROGRAMMI_CAD_DISPONIBILI } from "@/lib/data";

export async function GET() {
  const utente = await getUtenteCorrente();
  if (!utente) {
    return NextResponse.json({ error: "Devi accedere per vedere il profilo." }, { status: 401 });
  }
  const profilo = await getProfilo(utente.id);
  return NextResponse.json({ profilo });
}

export async function POST(req: NextRequest) {
  const utente = await getUtenteCorrente();
  if (!utente) {
    return NextResponse.json({ error: "Devi accedere per modificare il profilo." }, { status: 401 });
  }

  const body = await req.json();
  const competenze = typeof body.competenze === "string" ? body.competenze : "";
  const programmiCad = Array.isArray(body.programmiCad)
    ? body.programmiCad.filter((p: string) => PROGRAMMI_CAD_DISPONIBILI.includes(p))
    : [];

  await salvaProfilo({ utenteId: utente.id, competenze, programmiCad });

  return NextResponse.json({ ok: true });
}
