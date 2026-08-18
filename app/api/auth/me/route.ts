import { NextResponse } from "next/server";
import { getUtenteCorrente } from "@/lib/auth";

export async function GET() {
  const utente = await getUtenteCorrente();
  return NextResponse.json({ utente });
}
