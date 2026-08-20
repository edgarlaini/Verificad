import { getStripe } from "./stripe";
import {
  getLavoro,
  getProfilo,
  registraCheckoutLavoro,
  registraTrasferimentoLavoro,
  salvaStripeAccountId,
  segnaContestazioneRisolta,
} from "./data";
import { calcolaImportiLavoro, RegimeFiscale } from "./fiscale";
import { supabase } from "./supabase";

function centesimi(euro: number): number {
  return Math.round(euro * 100);
}

// Crea la sessione di pagamento Stripe che l'azienda deve completare per
// assegnare davvero il lavoro. Il lavoro NON viene assegnato qui: lo fa il
// webhook Stripe solo dopo la conferma di pagamento (vedi
// app/api/stripe/webhook/route.ts).
export async function creaCheckoutCandidatura(input: {
  candidaturaId: string;
  lavoroId: string;
  baseUrl: string;
}): Promise<{ url: string } | { errore: string }> {
  const stripe = getStripe();
  const lavoro = await getLavoro(input.lavoroId);
  if (!lavoro) return { errore: "Lavoro non trovato." };

  const { data: cand } = await supabase
    .from("candidature")
    .select("*")
    .eq("id", input.candidaturaId)
    .maybeSingle();
  if (!cand) return { errore: "Candidatura non trovata." };

  const profiloDisegnatore = await getProfilo(cand.disegnatoreUtenteId);
  if (!profiloDisegnatore.stripeAccountId || !profiloDisegnatore.stripeOnboardingCompletato) {
    return {
      errore:
        "Il disegnatore non ha ancora completato il collegamento del proprio conto Stripe. Contattalo prima di accettare la sua candidatura.",
    };
  }

  const regime: RegimeFiscale = {
    regimeFiscale: profiloDisegnatore.regimeFiscale,
    percentualeRivalsa: profiloDisegnatore.percentualeRivalsa,
    aliquotaIva: profiloDisegnatore.aliquotaIva,
    percentualeRitenuta: profiloDisegnatore.percentualeRitenuta,
  };
  const importi = calcolaImportiLavoro(lavoro.budget, regime);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: centesimi(importi.totaleDaVersareAzienda),
            product_data: {
              name: `Pagamento lavoro: ${lavoro.titolo}`,
              description: "Comprende il compenso del disegnatore e la commissione VerifiCAD.",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        candidaturaId: input.candidaturaId,
        lavoroId: input.lavoroId,
      },
      success_url: `${input.baseUrl}/lavori/${input.lavoroId}?pagamento=ok`,
      cancel_url: `${input.baseUrl}/lavori/${input.lavoroId}?pagamento=annullato`,
    });

    await registraCheckoutLavoro(input.lavoroId, session.id);

    if (!session.url) return { errore: "Stripe non ha restituito un link di pagamento." };
    return { url: session.url };
  } catch (err) {
    console.error("Errore checkout Stripe:", err);
    const messaggio = err instanceof Error ? err.message : "Errore sconosciuto.";
    return { errore: `Errore Stripe: ${messaggio}` };
  }
}

// Crea (se non esiste) il conto Stripe Express del disegnatore e restituisce
// il link di onboarding a cui reindirizzarlo dal profilo.
export async function creaOnboardingDisegnatore(input: {
  utenteId: string;
  email: string;
  baseUrl: string;
}): Promise<{ url: string } | { errore: string }> {
  try {
    const stripe = getStripe();
    const profilo = await getProfilo(input.utenteId);

    let accountId = profilo.stripeAccountId;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "IT",
        email: input.email,
        capabilities: {
          transfers: { requested: true },
        },
        business_type: "individual",
      });
      accountId = account.id;
      await salvaStripeAccountId(input.utenteId, accountId);
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${input.baseUrl}/profilo`,
      return_url: `${input.baseUrl}/profilo?stripe=collegato`,
      type: "account_onboarding",
    });

    return { url: link.url };
  } catch (err) {
    console.error("Errore onboarding Stripe:", err);
    const messaggio = err instanceof Error ? err.message : "Errore sconosciuto.";
    return { errore: `Errore Stripe: ${messaggio}` };
  }
}

// Trasferisce al disegnatore assegnato il netto che gli spetta, secondo il
// proprio regime fiscale. Chiamata sia dall'approvazione manuale
// dell'azienda sia dal rilascio automatico dopo 30 giorni (cron).
export async function trasferisciPagamentoDisegnatore(lavoroId: string): Promise<void> {
  const stripe = getStripe();
  const lavoro = await getLavoro(lavoroId);
  if (!lavoro) return;
  if (lavoro.pagamentoStato !== "pagato") return; // niente da trasferire (già fatto, o mai pagato)
  if (!lavoro.disegnatoreUtenteId) return;

  const profiloDisegnatore = await getProfilo(lavoro.disegnatoreUtenteId);
  if (!profiloDisegnatore.stripeAccountId) return;

  const regime: RegimeFiscale = {
    regimeFiscale: profiloDisegnatore.regimeFiscale,
    percentualeRivalsa: profiloDisegnatore.percentualeRivalsa,
    aliquotaIva: profiloDisegnatore.aliquotaIva,
    percentualeRitenuta: profiloDisegnatore.percentualeRitenuta,
  };
  const importi = calcolaImportiLavoro(lavoro.budget, regime);

  const transfer = await stripe.transfers.create({
    amount: centesimi(importi.nettoFinaleDisegnatore),
    currency: "eur",
    destination: profiloDisegnatore.stripeAccountId,
    description: `Pagamento lavoro: ${lavoro.titolo}`,
    metadata: { lavoroId },
  });

  await registraTrasferimentoLavoro(lavoroId, transfer.id);
}

// Chiude una contestazione con la percentuale decisa da VerifiCAD (0-100):
// rimborsa quella percentuale del totale pagato dall'azienda, e trasferisce
// al disegnatore la parte restante del suo netto, proporzionalmente.
// percentualeRimborsoAzienda = 0   → contestazione respinta, disegnatore pagato per intero
// percentualeRimborsoAzienda = 100 → rimborso pieno, disegnatore non riceve nulla
export async function risolviContestazione(
  lavoroId: string,
  percentualeRimborsoAzienda: number
): Promise<{ ok: true } | { errore: string }> {
  const stripe = getStripe();
  const lavoro = await getLavoro(lavoroId);
  if (!lavoro) return { errore: "Lavoro non trovato." };
  if (lavoro.pagamentoStato !== "pagato") {
    return { errore: "Questo lavoro non risulta pagato tramite la piattaforma." };
  }
  if (!lavoro.stripePaymentIntentId) {
    return { errore: "Nessun pagamento Stripe collegato a questo lavoro." };
  }

  const pct = Math.max(0, Math.min(100, percentualeRimborsoAzienda));

  let regime: RegimeFiscale | null = null;
  if (lavoro.disegnatoreUtenteId) {
    const profiloDisegnatore = await getProfilo(lavoro.disegnatoreUtenteId);
    regime = {
      regimeFiscale: profiloDisegnatore.regimeFiscale,
      percentualeRivalsa: profiloDisegnatore.percentualeRivalsa,
      aliquotaIva: profiloDisegnatore.aliquotaIva,
      percentualeRitenuta: profiloDisegnatore.percentualeRitenuta,
    };
  }
  const importi = calcolaImportiLavoro(lavoro.budget, regime);

  if (pct > 0) {
    await stripe.refunds.create({
      payment_intent: lavoro.stripePaymentIntentId,
      amount: centesimi((importi.totaleDaVersareAzienda * pct) / 100),
    });
  }

  const pctDisegnatore = 100 - pct;
  if (pctDisegnatore > 0 && lavoro.disegnatoreUtenteId) {
    const profiloDisegnatore = await getProfilo(lavoro.disegnatoreUtenteId);
    if (profiloDisegnatore.stripeAccountId) {
      const transfer = await stripe.transfers.create({
        amount: centesimi((importi.nettoFinaleDisegnatore * pctDisegnatore) / 100),
        currency: "eur",
        destination: profiloDisegnatore.stripeAccountId,
        description: `Pagamento lavoro (contestazione risolta ${pctDisegnatore}%): ${lavoro.titolo}`,
        metadata: { lavoroId },
      });
      await registraTrasferimentoLavoro(lavoroId, transfer.id);
    }
  }

  await segnaContestazioneRisolta(lavoroId, pct);
  return { ok: true };
}
