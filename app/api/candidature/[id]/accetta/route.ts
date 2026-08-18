import { NextRequest, NextResponse } from "next/server";
import { getUtenteCorrente } from "@/lib/auth";
import { accettaCandidatura, getLavoro } from "@/lib/data";
import { supabase } from "@/lib/supabase";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: candidaturaId } = await params;
  const utente = await getUtenteCorrente();
  if (!utente || utente.ruolo !== "azienda") {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
  }

  const { data: cand } = await supabase
    .from("candidature")
    .select("lavoroId")
    .eq("id", candidaturaId)
    .maybeSingle();
  if (!cand) {
    return NextResponse.json({ error: "Candidatura non trovata." }, { status: 404 });
  }

  const lavoro = await getLavoro(cand.lavoroId);
  if (!lavoro || lavoro.aziendaUtenteId !== utente.id) {
    return NextResponse.json(
      { error: "Non sei il proprietario di questo lavoro." },
      { status: 403 }
    );
  }

  await accettaCandidatura(candidaturaId);
  return NextResponse.json({ ok: true });
}
