import { NextResponse } from "next/server";
import { getUtenteCorrente } from "@/lib/auth";
import { getContestazioniAperte } from "@/lib/data";

const ADMIN_EMAIL = "edgar.laini@gmail.com";

export async function GET() {
  const utente = await getUtenteCorrente();
  if (!utente || utente.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
  }

  const contestazioni = await getContestazioniAperte();
  return NextResponse.json({ contestazioni });
}
