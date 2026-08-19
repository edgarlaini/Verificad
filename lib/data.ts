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
  stato: StatoLavoro;
  disegnatoreAssegnato?: string | null;
  disegnatoreUtenteId?: string | null;
  consegnaFile?: string | null;
  dataConsegna?: string | null;
  motivoRevisione?: string | null;
}

export interface Disegnatore {
  id: string;
  nome: string;
  competenze: string[];
  lavoriCompletati: number;
  valutazione: number;
}

export interface Profilo {
  utenteId: string;
  competenze: string;
  programmiCad: string[];
  cvUrl: string | null;
  cvNome: string | null;
}

export const PROGRAMMI_CAD_DISPONIBILI = [
  "AutoCAD",
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

const GIORNI_APPROVAZIONE_AUTOMATICA = 14;

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
}): Promise<string> {
  const id = "l" + Date.now();
  await supabase.from("lavori").insert({ id, ...input, stato: "aperto" });
  return id;
}

export async function getDisegnatori(): Promise<Disegnatore[]> {
  const { data, error } = await supabase.from("disegnatori").select("*");
  if (error || !data) return [];
  return (data as Array<Disegnatore & { competenze: string }>).map((r) => ({
    ...r,
    competenze: r.competenze.split(","),
  }));
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
      dataConsegna: new Date().toISOString(),
      motivoRevisione: null,
    })
    .eq("id", input.lavoroId);
}

export async function approvaLavoro(lavoroId: string): Promise<void> {
  await supabase.from("lavori").update({ stato: "chiuso" }).eq("id", lavoroId);
}

export async function richiediRevisione(lavoroId: string, motivo: string): Promise<void> {
  await supabase
    .from("lavori")
    .update({
      stato: "in_corso",
      consegnaFile: null,
      dataConsegna: null,
      motivoRevisione: motivo,
    })
    .eq("id", lavoroId);
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
