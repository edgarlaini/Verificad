import { supabase } from "./supabase";

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
}

export interface Profilo {
  utenteId: string;
  competenze: string;
  programmiCad: string[];
  cvUrl: string | null;
  cvNome: string | null;
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
    return { utenteId, competenze: "", programmiCad: [], cvUrl: null, cvNome: null };
  }

  return {
    utenteId,
    competenze: data.competenze ?? "",
    programmiCad: data.programmiCad ? data.programmiCad.split(",").filter(Boolean) : [],
    cvUrl: data.cvUrl ?? null,
    cvNome: data.cvNome ?? null,
  };
}

export async function salvaProfilo(input: {
  utenteId: string;
  competenze: string;
  programmiCad: string[];
}): Promise<void> {
  await supabase.from("profili").upsert(
    {
      utenteId: input.utenteId,
      competenze: input.competenze,
      programmiCad: input.programmiCad.join(","),
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
  disegnoUrl?: string;
  disegnoNome?: string;
}): Promise<RisultatoRevisione> {
  const lavoro = await getLavoro(input.lavoroId);
  if (!lavoro) return { ok: false, bloccatoDaExtra: false, errore: "Lavoro non trovato." };

  if (input.tipo === "modifica") {
    if (!input.disegnoUrl || !input.disegnoNome) {
      return {
        ok: false,
        bloccatoDaExtra: false,
        errore: "Per una modifica di progetto è obbligatorio allegare il nuovo disegno tecnico.",
      };
    }
    if (lavoro.revisioniUsate >= REVISIONI_INCLUSE) {
      return {
        ok: false,
        bloccatoDaExtra: true,
        extra: calcolaExtraRevisione(lavoro.budget),
      };
    }
  }

  const id = "r" + Date.now();
  await supabase.from("revisioni").insert({
    id,
    lavoroId: input.lavoroId,
    tipo: input.tipo,
    motivo: input.motivo,
    disegnoUrl: input.disegnoUrl ?? null,
    disegnoNome: input.disegnoNome ?? null,
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
