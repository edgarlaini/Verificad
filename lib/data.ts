import { supabase } from "./supabase";
import { inviaEmailAssegnazione } from "./email";

export type StatoLavoro = "aperto" | "in_corso" | "in_revisione" | "chiuso";

export interface Lavoro {
  id: string;
  titolo: string;
  descrizione: string;
  azienda: string;
  aziendaUtenteId?: string | null;
  budget: number;
  scadenza: string;
  disegnoAllegato: string;
  disegnoNome?: string | null;
  stato: StatoLavoro;
  disegnatoreAssegnato?: string | null;
  disegnatoreUtenteId?: string | null;
  consegnaFile?: string | null;
  consegnaNome?: string | null;
  dataConsegna?: string | null;
  motivoRevisione?: string | null;
  revisioniUsate: number;
  pagamentoStato: "in_attesa" | "pagato" | "trasferito";
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  stripeTransferId?: string | null;
  contestato: boolean;
  contestazioneMotivo?: string | null;
  contestazioneRispostaDisegnatore?: string | null;
  contestazioneApertaIl?: string | null;
  contestazioneRisoltaIl?: string | null;
  percentualeRimborso?: number | null;
}

export interface Profilo {
  utenteId: string;
  competenze: string;
  programmiCad: string[];
  cvUrl: string | null;
  cvNome: string | null;
  regimeFiscale: "forfettario" | "ordinario";
  percentualeRivalsa: number;
  aliquotaIva: number;
  percentualeRitenuta: number;
  stripeAccountId: string | null;
  stripeOnboardingCompletato: boolean;
}

export const PROGRAMMI_CAD_DISPONIBILI = [
  "AutoCAD 2D",
  "AutoCAD 3D",
  "Rhino",
  "SolidWorks",
  "Revit",
  "Inventor",
  "SketchUp",
  "Allplan",
];

export interface Candidatura {
  id: string;
  lavoroId: string;
  disegnatoreUtenteId: string;
  disegnatoreNome: string;
  messaggio: string;
  stato: "in_attesa" | "accettata" | "rifiutata";
  creatoIl: string;
}

const GIORNI_APPROVAZIONE_AUTOMATICA = 30;
export const REVISIONI_INCLUSE = 3;
export const PERCENTUALE_EXTRA_REVISIONE = 0.2;

// Base del sito usata per costruire link cliccabili nelle email (es. notifica
// assegnazione lavoro). Quando colleghi un dominio tuo (es. verificad.it),
// aggiorna questo valore o imposta la variabile d'ambiente NEXT_PUBLIC_SITE_URL su Vercel.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://verificad-yaxu.vercel.app";

export function calcolaExtraRevisione(budget: number) {
  const totale = Math.round(budget * PERCENTUALE_EXTRA_REVISIONE * 100) / 100;
  const commissioneAzienda = Math.round(budget * 0.1 * 100) / 100;
  const commissioneDisegnatore = Math.round(budget * 0.1 * 100) / 100;
  return { totale, commissioneAzienda, commissioneDisegnatore };
}

function scadenzaSuperata(dataConsegna: string): boolean {
  const consegnata = new Date(dataConsegna);
  const limite = new Date(
    consegnata.getTime() + GIORNI_APPROVAZIONE_AUTOMATICA * 24 * 60 * 60 * 1000
  );
  return new Date() > limite;
}

async function applicaApprovazioneAutomatica(lavoro: Lavoro): Promise<Lavoro> {
  // Una contestazione aperta congela il rilascio automatico: il timer non
  // riparte finché VerifiCAD non la risolve manualmente.
  if (lavoro.contestato && !lavoro.contestazioneRisoltaIl) return lavoro;

  if (lavoro.stato === "in_revisione" && lavoro.dataConsegna) {
    if (scadenzaSuperata(lavoro.dataConsegna)) {
      await supabase.from("lavori").update({ stato: "chiuso" }).eq("id", lavoro.id);
      return { ...lavoro, stato: "chiuso" };
    }
  }
  return lavoro;
}

export async function getLavori(): Promise<Lavoro[]> {
  const { data, error } = await supabase
    .from("lavori")
    .select("*")
    .order("creatoIl", { ascending: false });
  if (error || !data) return [];
  return Promise.all((data as Lavoro[]).map(applicaApprovazioneAutomatica));
}

export async function getLavoro(id: string): Promise<Lavoro | undefined> {
  const { data, error } = await supabase.from("lavori").select("*").eq("id", id).single();
  if (error || !data) return undefined;
  return applicaApprovazioneAutomatica(data as Lavoro);
}

export async function creaLavoro(input: {
  titolo: string;
  descrizione: string;
  azienda: string;
  aziendaUtenteId: string;
  budget: number;
  scadenza: string;
  disegnoAllegato: string;
  disegnoNome: string;
}): Promise<string> {
  const id = "l" + Date.now();
  await supabase.from("lavori").insert({ id, ...input, stato: "aperto" });
  return id;
}

export interface DisegnatoreReale {
  id: string;
  nome: string;
  competenze: string;
  programmiCad: string[];
  cvUrl: string | null;
  lavoriCompletati: number;
}

export async function getDisegnatori(): Promise<DisegnatoreReale[]> {
  const { data: utenti, error } = await supabase
    .from("utenti")
    .select("id, nome")
    .eq("ruolo", "disegnatore");
  if (error || !utenti || utenti.length === 0) return [];

  const ids = utenti.map((u) => u.id);

  const [{ data: profili }, { data: lavoriChiusi }] = await Promise.all([
    supabase.from("profili").select("*").in("utenteId", ids),
    supabase.from("lavori").select("disegnatoreUtenteId").eq("stato", "chiuso").in("disegnatoreUtenteId", ids),
  ]);

  const profiloPerUtente = new Map((profili ?? []).map((p) => [p.utenteId, p]));
  const completatiPerUtente = new Map<string, number>();
  for (const l of lavoriChiusi ?? []) {
    const id = l.disegnatoreUtenteId as string;
    completatiPerUtente.set(id, (completatiPerUtente.get(id) ?? 0) + 1);
  }

  return utenti.map((u) => {
    const p = profiloPerUtente.get(u.id);
    return {
      id: u.id,
      nome: u.nome,
      competenze: p?.competenze ?? "",
      programmiCad: p?.programmiCad ? (p.programmiCad as string).split(",").filter(Boolean) : [],
      cvUrl: p?.cvUrl ?? null,
      lavoriCompletati: completatiPerUtente.get(u.id) ?? 0,
    };
  });
}

export async function getProfilo(utenteId: string): Promise<Profilo> {
  const { data } = await supabase
    .from("profili")
    .select("*")
    .eq("utenteId", utenteId)
    .maybeSingle();

  if (!data) {
    return {
      utenteId,
      competenze: "",
      programmiCad: [],
      cvUrl: null,
      cvNome: null,
      regimeFiscale: "forfettario",
      percentualeRivalsa: 4,
      aliquotaIva: 22,
      percentualeRitenuta: 20,
      stripeAccountId: null,
      stripeOnboardingCompletato: false,
    };
  }

  return {
    utenteId,
    competenze: data.competenze ?? "",
    programmiCad: data.programmiCad ? data.programmiCad.split(",").filter(Boolean) : [],
    cvUrl: data.cvUrl ?? null,
    cvNome: data.cvNome ?? null,
    regimeFiscale: data.regimeFiscale === "ordinario" ? "ordinario" : "forfettario",
    percentualeRivalsa: data.percentualeRivalsa ?? 4,
    aliquotaIva: data.aliquotaIva ?? 22,
    percentualeRitenuta: data.percentualeRitenuta ?? 20,
    stripeAccountId: data.stripeAccountId ?? null,
    stripeOnboardingCompletato: data.stripeOnboardingCompletato ?? false,
  };
}

export async function salvaProfilo(input: {
  utenteId: string;
  competenze: string;
  programmiCad: string[];
  regimeFiscale: "forfettario" | "ordinario";
  percentualeRivalsa: number;
  aliquotaIva: number;
  percentualeRitenuta: number;
}): Promise<void> {
  await supabase.from("profili").upsert(
    {
      utenteId: input.utenteId,
      competenze: input.competenze,
      programmiCad: input.programmiCad.join(","),
      regimeFiscale: input.regimeFiscale,
      percentualeRivalsa: input.percentualeRivalsa,
      aliquotaIva: input.aliquotaIva,
      percentualeRitenuta: input.percentualeRitenuta,
      aggiornatoIl: new Date().toISOString(),
    },
    { onConflict: "utenteId" }
  );
}

export async function salvaCvProfilo(input: {
  utenteId: string;
  cvUrl: string;
  cvNome: string;
}): Promise<void> {
  await supabase.from("profili").upsert(
    {
      utenteId: input.utenteId,
      cvUrl: input.cvUrl,
      cvNome: input.cvNome,
      aggiornatoIl: new Date().toISOString(),
    },
    { onConflict: "utenteId" }
  );
}

export async function creaCandidatura(input: {
  lavoroId: string;
  disegnatoreUtenteId: string;
  disegnatoreNome: string;
  messaggio: string;
}): Promise<string> {
  const id = "c" + Date.now();
  await supabase.from("candidature").insert({ id, ...input, stato: "in_attesa" });
  return id;
}

export async function getCandidatureLavoro(lavoroId: string): Promise<Candidatura[]> {
  const { data, error } = await supabase
    .from("candidature")
    .select("*")
    .eq("lavoroId", lavoroId)
    .order("creatoIl", { ascending: false });
  if (error || !data) return [];
  return data as Candidatura[];
}

export async function haGiaCandidato(
  lavoroId: string,
  disegnatoreUtenteId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("candidature")
    .select("id")
    .eq("lavoroId", lavoroId)
    .eq("disegnatoreUtenteId", disegnatoreUtenteId)
    .maybeSingle();
  return !!data;
}

export async function accettaCandidatura(candidaturaId: string): Promise<void> {
  const { data: cand } = await supabase
    .from("candidature")
    .select("*")
    .eq("id", candidaturaId)
    .single();
  if (!cand) throw new Error("Candidatura non trovata");

  await supabase.from("candidature").update({ stato: "accettata" }).eq("id", candidaturaId);
  await supabase
    .from("candidature")
    .update({ stato: "rifiutata" })
    .eq("lavoroId", cand.lavoroId)
    .neq("id", candidaturaId);
  await supabase
    .from("lavori")
    .update({
      stato: "in_corso",
      disegnatoreAssegnato: cand.disegnatoreNome,
      disegnatoreUtenteId: cand.disegnatoreUtenteId,
    })
    .eq("id", cand.lavoroId);

  // Notifica email al disegnatore assegnato — non blocca né fa fallire
  // l'assegnazione del lavoro se l'invio dovesse avere problemi.
  try {
    const [{ data: lavoro }, { data: disegnatore }] = await Promise.all([
      supabase.from("lavori").select("titolo").eq("id", cand.lavoroId).single(),
      supabase.from("utenti").select("email").eq("id", cand.disegnatoreUtenteId).single(),
    ]);
    if (lavoro && disegnatore?.email) {
      const link = `${SITE_URL}/lavori/${cand.lavoroId}`;
      await inviaEmailAssegnazione(disegnatore.email, cand.disegnatoreNome, lavoro.titolo, link);
    }
  } catch (err) {
    console.error("Errore invio email di assegnazione lavoro:", err);
  }
}

export async function consegnaLavoro(input: {
  lavoroId: string;
  disegnatoreUtenteId: string;
  consegnaFile: string;
  consegnaNome: string;
}): Promise<void> {
  const lavoro = await getLavoro(input.lavoroId);
  if (!lavoro) throw new Error("Lavoro non trovato");
  if (lavoro.disegnatoreUtenteId !== input.disegnatoreUtenteId) {
    throw new Error("Non sei il disegnatore assegnato a questo lavoro.");
  }
  await supabase
    .from("lavori")
    .update({
      stato: "in_revisione",
      consegnaFile: input.consegnaFile,
      consegnaNome: input.consegnaNome,
      dataConsegna: new Date().toISOString(),
      motivoRevisione: null,
    })
    .eq("id", input.lavoroId);
}

export async function approvaLavoro(lavoroId: string): Promise<void> {
  await supabase.from("lavori").update({ stato: "chiuso" }).eq("id", lavoroId);
}

export async function registraCheckoutLavoro(lavoroId: string, sessionId: string): Promise<void> {
  await supabase.from("lavori").update({ stripeCheckoutSessionId: sessionId }).eq("id", lavoroId);
}

export async function confermaPagamentoLavoro(
  lavoroId: string,
  paymentIntentId: string
): Promise<void> {
  await supabase
    .from("lavori")
    .update({ pagamentoStato: "pagato", stripePaymentIntentId: paymentIntentId })
    .eq("id", lavoroId);
}

export async function registraTrasferimentoLavoro(lavoroId: string, transferId: string): Promise<void> {
  await supabase
    .from("lavori")
    .update({ pagamentoStato: "trasferito", stripeTransferId: transferId })
    .eq("id", lavoroId);
}

// L'azienda apre una contestazione formale su un lavoro consegnato ma non
// accettabile — diversa dalla revisione ordinaria: congela il rilascio
// automatico dei 30 giorni finché VerifiCAD non decide.
export async function apriContestazione(lavoroId: string, motivo: string): Promise<void> {
  await supabase
    .from("lavori")
    .update({
      contestato: true,
      contestazioneMotivo: motivo,
      contestazioneApertaIl: new Date().toISOString(),
    })
    .eq("id", lavoroId);
}

// Il disegnatore assegnato può rispondere con la propria versione prima
// che VerifiCAD decida.
export async function rispondiContestazione(lavoroId: string, risposta: string): Promise<void> {
  await supabase
    .from("lavori")
    .update({ contestazioneRispostaDisegnatore: risposta })
    .eq("id", lavoroId);
}

export interface ContestazioneAperta {
  id: string;
  titolo: string;
  azienda: string;
  disegnatoreAssegnato: string | null;
  budget: number;
  contestazioneMotivo: string | null;
  contestazioneRispostaDisegnatore: string | null;
  contestazioneApertaIl: string | null;
}

export async function getContestazioniAperte(): Promise<ContestazioneAperta[]> {
  const { data, error } = await supabase
    .from("lavori")
    .select("id, titolo, azienda, disegnatoreAssegnato, budget, contestazioneMotivo, contestazioneRispostaDisegnatore, contestazioneApertaIl")
    .eq("contestato", true)
    .is("contestazioneRisoltaIl", null)
    .order("contestazioneApertaIl", { ascending: true });
  if (error || !data) return [];
  return data as ContestazioneAperta[];
}

// Chiude una contestazione: registra la percentuale rimborsata all'azienda
// (0 = respinta, 100 = rimborso pieno) e chiude il lavoro. Lo split
// economico vero e proprio (rimborso Stripe + trasferimento parziale al
// disegnatore) lo fa lib/pagamenti.ts PRIMA di chiamare questa funzione.
export async function segnaContestazioneRisolta(
  lavoroId: string,
  percentualeRimborso: number
): Promise<void> {
  await supabase
    .from("lavori")
    .update({
      contestazioneRisoltaIl: new Date().toISOString(),
      percentualeRimborso,
      stato: "chiuso",
    })
    .eq("id", lavoroId);
}

export async function salvaStripeAccountId(utenteId: string, stripeAccountId: string): Promise<void> {
  await supabase.from("profili").upsert(
    { utenteId, stripeAccountId, aggiornatoIl: new Date().toISOString() },
    { onConflict: "utenteId" }
  );
}

export async function impostaOnboardingCompletato(
  utenteId: string,
  completato: boolean
): Promise<void> {
  await supabase
    .from("profili")
    .update({ stripeOnboardingCompletato: completato })
    .eq("utenteId", utenteId);
}

export interface Revisione {
  id: string;
  lavoroId: string;
  tipo: "errore" | "modifica";
  motivo: string;
  disegnoUrl: string | null;
  disegnoNome: string | null;
  creatoIl: string;
}

export async function getRevisioniLavoro(lavoroId: string): Promise<Revisione[]> {
  const { data, error } = await supabase
    .from("revisioni")
    .select("*")
    .eq("lavoroId", lavoroId)
    .order("creatoIl", { ascending: false });
  if (error || !data) return [];
  return data as Revisione[];
}

export type RisultatoRevisione =
  | { ok: true }
  | { ok: false; bloccatoDaExtra: true; extra: ReturnType<typeof calcolaExtraRevisione> }
  | { ok: false; bloccatoDaExtra: false; errore: string };

export async function richiediRevisione(input: {
  lavoroId: string;
  tipo: "errore" | "modifica";
  motivo: string;
  disegnoUrl: string;
  disegnoNome: string;
}): Promise<RisultatoRevisione> {
  const lavoro = await getLavoro(input.lavoroId);
  if (!lavoro) return { ok: false, bloccatoDaExtra: false, errore: "Lavoro non trovato." };

  if (!input.disegnoUrl || !input.disegnoNome) {
    return {
      ok: false,
      bloccatoDaExtra: false,
      errore:
        input.tipo === "modifica"
          ? "Per una modifica di progetto è obbligatorio allegare il nuovo disegno tecnico."
          : "Allega uno screenshot, una foto o un file che mostri l'errore da correggere.",
    };
  }

  if (input.tipo === "modifica" && lavoro.revisioniUsate >= REVISIONI_INCLUSE) {
    return {
      ok: false,
      bloccatoDaExtra: true,
      extra: calcolaExtraRevisione(lavoro.budget),
    };
  }

  const id = "r" + Date.now();
  await supabase.from("revisioni").insert({
    id,
    lavoroId: input.lavoroId,
    tipo: input.tipo,
    motivo: input.motivo,
    disegnoUrl: input.disegnoUrl,
    disegnoNome: input.disegnoNome,
  });

  const aggiornamento: Record<string, unknown> = {
    stato: "in_corso",
    consegnaFile: null,
    consegnaNome: null,
    dataConsegna: null,
    motivoRevisione: input.motivo,
  };

  if (input.tipo === "modifica") {
    aggiornamento.revisioniUsate = lavoro.revisioniUsate + 1;
    aggiornamento.disegnoAllegato = input.disegnoUrl;
    aggiornamento.disegnoNome = input.disegnoNome;
  }

  await supabase.from("lavori").update(aggiornamento).eq("id", input.lavoroId);
  return { ok: true };
}

export function giorniRimanentiRevisione(dataConsegna: string): number {
  const consegnata = new Date(dataConsegna);
  const limite = new Date(
    consegnata.getTime() + GIORNI_APPROVAZIONE_AUTOMATICA * 24 * 60 * 60 * 1000
  );
  const diff = limite.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

export const statoLabel: Record<StatoLavoro, string> = {
  aperto: "Aperto",
  in_corso: "In corso",
  in_revisione: "In revisione",
  chiuso: "Chiuso",
};
