import { NextRequest, NextResponse } from "next/server";
import { getUtenteCorrente } from "@/lib/auth";
import { getLavoro } from "@/lib/data";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Stati del lavoro in cui la chat interna è attiva:
// il lavoro è stato assegnato (in_corso) o è stato consegnato ed è in fase
// di revisione (in_revisione) — non prima (aperto) né dopo (chiuso).
const STATI_CHAT_ATTIVA = ["in_corso", "in_revisione"];

async function verificaAccesso(lavoroId: string) {
  const utente = await getUtenteCorrente();
  if (!utente) {
    return { ok: false as const, status: 401, errore: "Devi accedere." };
  }
  const lavoro = await getLavoro(lavoroId);
  if (!lavoro) {
    return { ok: false as const, status: 404, errore: "Lavoro non trovato." };
  }
  const autorizzato =
    utente.id === lavoro.aziendaUtenteId || utente.id === lavoro.disegnatoreUtenteId;
  if (!autorizzato) {
    return { ok: false as const, status: 403, errore: "Non hai accesso a questo lavoro." };
  }
  if (!STATI_CHAT_ATTIVA.includes(lavoro.stato)) {
    return {
      ok: false as const,
      status: 403,
      errore: "La chat è disponibile solo per lavori assegnati o in revisione.",
    };
  }
  return { ok: true as const, utente, lavoro };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const accesso = await verificaAccesso(id);
  if (!accesso.ok) {
    return NextResponse.json({ error: accesso.errore }, { status: accesso.status });
  }

  const { data, error } = await supabase
    .from("messaggi_lavoro")
    .select("*")
    .eq("lavoroId", id)
    .order("creatoIl", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Errore nel caricamento dei messaggi." }, { status: 500 });
  }

  return NextResponse.json({ messaggi: data ?? [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const accesso = await verificaAccesso(id);
  if (!accesso.ok) {
    return NextResponse.json({ error: accesso.errore }, { status: accesso.status });
  }
  const { utente, lavoro } = accesso;

  const body = await req.json().catch(() => null);
  const testo = (body?.testo ?? "").trim();
  const allegatoUrl = body?.allegatoUrl || null;
  const allegatoNome = body?.allegatoNome || null;

  if (!testo && !allegatoUrl) {
    return NextResponse.json(
      { error: "Scrivi un messaggio o allega un file." },
      { status: 400 }
    );
  }

  const mittenteRuolo = utente.id === lavoro.aziendaUtenteId ? "azienda" : "disegnatore";
  const idMessaggio = "m" + Date.now();

  const { error } = await supabase.from("messaggi_lavoro").insert({
    id: idMessaggio,
    lavoroId: id,
    mittenteId: utente.id,
    mittenteNome: utente.nome,
    mittenteRuolo,
    testo,
    allegatoUrl,
    allegatoNome,
  });

  if (error) {
    return NextResponse.json({ error: "Errore nell'invio del messaggio." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
