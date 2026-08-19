import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const baseUrl = req.nextUrl.origin;

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/email-verificata?esito=errore`);
  }

  const { data: utente } = await supabase
    .from("utenti")
    .select("id")
    .eq("tokenVerifica", token)
    .maybeSingle();

  if (!utente) {
    return NextResponse.redirect(`${baseUrl}/email-verificata?esito=errore`);
  }

  await supabase
    .from("utenti")
    .update({ emailVerificata: true, tokenVerifica: null })
    .eq("id", utente.id);

  return NextResponse.redirect(`${baseUrl}/email-verificata?esito=ok`);
}
