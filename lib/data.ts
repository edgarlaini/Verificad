import db from "./db";

export type StatoLavoro =
  | "aperto"
  | "in_corso"
  | "in_revisione"
  | "chiuso";

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

export function getLavori(): Lavoro[] {
  const righe = db
    .prepare("SELECT * FROM lavori ORDER BY creatoIl DESC")
    .all() as Lavoro[];
  return righe.map(applicaApprovazioneAutomatica);
}

export function getLavoro(id: string): Lavoro | undefined {
  const riga = db.prepare("SELECT * FROM lavori WHERE id = ?").get(id) as
    | Lavoro
    | undefined;
  return riga ? applicaApprovazioneAutomatica(riga) : undefined;
}

export function creaLavoro(input: {
  titolo: string;
  descrizione: string;
  azienda: string;
  aziendaUtenteId: string;
  budget: number;
  scadenza: string;
  disegnoAllegato: string;
}) {
  const id = "l" + Date.now();
  db.prepare(
    `INSERT INTO lavori (id, titolo, descrizione, azienda, aziendaUtenteId, budget, scadenza, disegnoAllegato, stato)
     VALUES (@id, @titolo, @descrizione, @azienda, @aziendaUtenteId, @budget, @scadenza, @disegnoAllegato, 'aperto')`
  ).run({ id, ...input });
  return id;
}

export interface Candidatura {
  id: string;
  lavoroId: string;
  disegnatoreUtenteId: string;
  disegnatoreNome: string;
  messaggio: string;
  stato: "in_attesa" | "accettata" | "rifiutata";
  creatoIl: string;
}

export function creaCandidatura(input: {
  lavoroId: string;
  disegnatoreUtenteId: string;
  disegnatoreNome: string;
  messaggio: string;
}) {
  const id = "c" + Date.now();
  db.prepare(
    `INSERT INTO candidature (id, lavoroId, disegnatoreUtenteId, disegnatoreNome, messaggio, stato)
     VALUES (@id, @lavoroId, @disegnatoreUtenteId, @disegnatoreNome, @messaggio, 'in_attesa')`
  ).run({ id, ...input });
  return id;
}

export function getCandidatureLavoro(lavoroId: string): Candidatura[] {
  return db
    .prepare("SELECT * FROM candidature WHERE lavoroId = ? ORDER BY creatoIl DESC")
    .all(lavoroId) as Candidatura[];
}

export function haGiaCandidato(lavoroId: string, disegnatoreUtenteId: string): boolean {
  const riga = db
    .prepare(
      "SELECT id FROM candidature WHERE lavoroId = ? AND disegnatoreUtenteId = ?"
    )
    .get(lavoroId, disegnatoreUtenteId);
  return !!riga;
}

export function accettaCandidatura(candidaturaId: string) {
  const cand = db
    .prepare("SELECT * FROM candidature WHERE id = ?")
    .get(candidaturaId) as Candidatura | undefined;
  if (!cand) throw new Error("Candidatura non trovata");

  db.prepare("UPDATE candidature SET stato = 'accettata' WHERE id = ?").run(
    candidaturaId
  );
  db.prepare(
    "UPDATE candidature SET stato = 'rifiutata' WHERE lavoroId = ? AND id != ?"
  ).run(cand.lavoroId, candidaturaId);
  db.prepare(
    "UPDATE lavori SET stato = 'in_corso', disegnatoreAssegnato = ?, disegnatoreUtenteId = ? WHERE id = ?"
  ).run(cand.disegnatoreNome, cand.disegnatoreUtenteId, cand.lavoroId);
}

const GIORNI_APPROVAZIONE_AUTOMATICA = 14;

function scadenzaSuperata(dataConsegna: string): boolean {
  const consegnata = new Date(dataConsegna + "Z");
  const limite = new Date(
    consegnata.getTime() + GIORNI_APPROVAZIONE_AUTOMATICA * 24 * 60 * 60 * 1000
  );
  return new Date() > limite;
}

function applicaApprovazioneAutomatica(lavoro: Lavoro): Lavoro {
  if (lavoro.stato === "in_revisione" && lavoro.dataConsegna) {
    if (scadenzaSuperata(lavoro.dataConsegna)) {
      db.prepare("UPDATE lavori SET stato = 'chiuso' WHERE id = ?").run(lavoro.id);
      return { ...lavoro, stato: "chiuso" };
    }
  }
  return lavoro;
}

export function consegnaLavoro(input: {
  lavoroId: string;
  disegnatoreUtenteId: string;
  consegnaFile: string;
}) {
  const lavoro = getLavoro(input.lavoroId);
  if (!lavoro) throw new Error("Lavoro non trovato");
  if (lavoro.disegnatoreUtenteId !== input.disegnatoreUtenteId) {
    throw new Error("Non sei il disegnatore assegnato a questo lavoro.");
  }
  db.prepare(
    `UPDATE lavori
     SET stato = 'in_revisione', consegnaFile = ?, dataConsegna = datetime('now'), motivoRevisione = NULL
     WHERE id = ?`
  ).run(input.consegnaFile, input.lavoroId);
}

export function approvaLavoro(lavoroId: string) {
  db.prepare("UPDATE lavori SET stato = 'chiuso' WHERE id = ?").run(lavoroId);
}

export function richiediRevisione(lavoroId: string, motivo: string) {
  db.prepare(
    `UPDATE lavori
     SET stato = 'in_corso', consegnaFile = NULL, dataConsegna = NULL, motivoRevisione = ?
     WHERE id = ?`
  ).run(motivo, lavoroId);
}

export function giorniRimanentiRevisione(dataConsegna: string): number {
  const consegnata = new Date(dataConsegna + "Z");
  const limite = new Date(
    consegnata.getTime() + GIORNI_APPROVAZIONE_AUTOMATICA * 24 * 60 * 60 * 1000
  );
  const diff = limite.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

export function getDisegnatori(): Disegnatore[] {
  const rows = db.prepare("SELECT * FROM disegnatori").all() as Array<{
    id: string;
    nome: string;
    competenze: string;
    lavoriCompletati: number;
    valutazione: number;
  }>;
  return rows.map((r) => ({ ...r, competenze: r.competenze.split(",") }));
}

export { calcolaCommissione } from "./calc";

export const statoLabel: Record<StatoLavoro, string> = {
  aperto: "Aperto",
  in_corso: "In corso",
  in_revisione: "In revisione",
  chiuso: "Chiuso",
};
