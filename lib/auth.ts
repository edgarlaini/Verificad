import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import db from "./db";

export type Ruolo = "azienda" | "disegnatore";

export interface Utente {
  id: string;
  email: string;
  ruolo: Ruolo;
  nome: string;
}

const COOKIE_NAME = "cadconnect_sessione";

export async function registraUtente(input: {
  email: string;
  password: string;
  ruolo: Ruolo;
  nome: string;
}): Promise<{ ok: true; utente: Utente } | { ok: false; errore: string }> {
  const esistente = db
    .prepare("SELECT id FROM utenti WHERE email = ?")
    .get(input.email.toLowerCase());
  if (esistente) {
    return { ok: false, errore: "Esiste già un account con questa email." };
  }

  const id = "u" + crypto.randomUUID();
  const passwordHash = await bcrypt.hash(input.password, 10);

  db.prepare(
    `INSERT INTO utenti (id, email, passwordHash, ruolo, nome) VALUES (?, ?, ?, ?, ?)`
  ).run(id, input.email.toLowerCase(), passwordHash, input.ruolo, input.nome);

  return {
    ok: true,
    utente: { id, email: input.email.toLowerCase(), ruolo: input.ruolo, nome: input.nome },
  };
}

export async function autenticaUtente(
  email: string,
  password: string
): Promise<{ ok: true; utente: Utente } | { ok: false; errore: string }> {
  const riga = db
    .prepare("SELECT * FROM utenti WHERE email = ?")
    .get(email.toLowerCase()) as
    | { id: string; email: string; passwordHash: string; ruolo: Ruolo; nome: string }
    | undefined;

  if (!riga) return { ok: false, errore: "Email o password non corretti." };

  const valida = await bcrypt.compare(password, riga.passwordHash);
  if (!valida) return { ok: false, errore: "Email o password non corretti." };

  return {
    ok: true,
    utente: { id: riga.id, email: riga.email, ruolo: riga.ruolo, nome: riga.nome },
  };
}

export function creaSessione(utenteId: string): string {
  const token = crypto.randomBytes(32).toString("hex");
  db.prepare("INSERT INTO sessioni (token, utenteId) VALUES (?, ?)").run(
    token,
    utenteId
  );
  return token;
}

export async function impostaCookieSessione(token: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function rimuoviCookieSessione() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) {
    db.prepare("DELETE FROM sessioni WHERE token = ?").run(token);
  }
  store.delete(COOKIE_NAME);
}

export async function getUtenteCorrente(): Promise<Utente | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const riga = db
    .prepare(
      `SELECT u.id, u.email, u.ruolo, u.nome
       FROM sessioni s JOIN utenti u ON u.id = s.utenteId
       WHERE s.token = ?`
    )
    .get(token) as Utente | undefined;

  return riga ?? null;
}
