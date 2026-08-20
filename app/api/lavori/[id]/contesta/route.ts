import { NextRequest, NextResponse } from "next/server";
import { getUtenteCorrente } from "@/lib/auth";
import { getLavoro, apriContestazione } from "@/lib/data";
import { inviaEmailContestazioneAperta, inviaEmailNotificaAdmin } from "@/lib/email";
import { supabase } from "@/lib/supabase";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const utente = await getUtenteCorrente();
  if (!utente) {
    return NextResponse.json({ error: "Devi accedere." }, { status: 401 });
  }
  const lavoro = await getLavoro(id);
  if (!lavoro) {
    return NextResponse.json({ error: "Lavoro non trovato." }, { status: 404 });
  }
  if (lavoro.aziendaUtenteId !== utente.id) {
    return NextResponse.json(
      { error: "Non sei il proprietario di questo lavoro." },
      { status: 403 }
    );
  }
  if (lavoro.stato !== "in_revisione") {
    return NextResponse.json(
      { error: "Puoi contestare solo un lavoro consegnato e in attesa di approvazione." },
      { status: 400 }
    );
  }
  if (lavoro.contestato) {
    return NextResponse.json({ error: "È già stata aperta una contestazione su questo lavoro." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const motivo = (body?.motivo ?? "").trim();
  if (!motivo) {
    return NextResponse.json({ error: "Spiega il motivo della contestazione." }, { status: 400 });
  }

  await apriContestazione(id, motivo);

  const link = `${req.nextUrl.origin}/lavori/${id}`;
  try {
    if (lavoro.disegnatoreUtenteId) {
      const { data: disegnatore } = await supabase
        .from("utenti")
        .select("email, nome")
        .eq("id", lavoro.disegnatoreUtenteId)
        .maybeSingle();
      if (disegnatore?.email) {
        await inviaEmailContestazioneAperta(disegnatore.email, disegnatore.nome, lavoro.titolo, motivo, link);
      }
    }
    await inviaEmailNotificaAdmin(
      "Nuova contestazione aperta",
      `Lavoro: ${lavoro.titolo}\nAzienda: ${lavoro.azienda}\nMotivo:\n${motivo}`,
      link
    );
  } catch (err) {
    console.error("Errore invio email contestazione:", err);
  }

  return NextResponse.json({ ok: true });
}
