import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { approvaLavoro } from "@/lib/data";
import { trasferisciPagamentoDisegnatore } from "@/lib/pagamenti";

export const dynamic = "force-dynamic";

// Chiamata una volta al giorno da Vercel Cron (vedi vercel.json). Fa due cose:
// 1) chiude e paga i lavori pagati, consegnati da oltre 30 giorni, mai approvati
// 2) rete di sicurezza: ritenta il trasferimento su lavori già chiusi e pagati
//    per cui, per qualsiasi motivo, il trasferimento Stripe non fosse riuscito
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
  }

  const oraLimite = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: scaduti } = await supabase
    .from("lavori")
    .select("id")
    .eq("stato", "in_revisione")
    .eq("pagamentoStato", "pagato")
    .eq("contestato", false)
    .lt("dataConsegna", oraLimite);

  for (const l of scaduti ?? []) {
    await approvaLavoro(l.id);
    await trasferisciPagamentoDisegnatore(l.id);
  }

  const { data: daTrasferire } = await supabase
    .from("lavori")
    .select("id")
    .eq("stato", "chiuso")
    .eq("pagamentoStato", "pagato")
    .is("stripeTransferId", null);

  for (const l of daTrasferire ?? []) {
    await trasferisciPagamentoDisegnatore(l.id);
  }

  return NextResponse.json({
    ok: true,
    rilasciatiAutomaticamente: scaduti?.length ?? 0,
    trasferimentiRete: daTrasferire?.length ?? 0,
  });
}
