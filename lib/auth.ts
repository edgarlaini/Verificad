import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import { supabase } from "./supabase";
import { inviaEmailVerifica } from "./email";

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
  baseUrl: string;
}): Promise<{ ok: true; utente: Utente } | { ok: false; errore: string }> {
  const emailLower = input.email.toLowerCase();
  const { data: esistente } = await supabase
    .from("utenti")
    .select("id")
    .eq("email", emailLower)
    .maybeSingle();
  if (esistente) {
    return { ok: false, errore: "Esiste già un account con questa email." };
  }

  const id = "u" + crypto.randomUUID();
  const passwordHash = await bcrypt.hash(input.password, 10);
  const tokenVerifica = crypto.randomBytes(24).toString("hex");

  const { error } = await supabase.from("utenti").insert({
    id,
    email: emailLower,
    passwordHash,
    ruolo: input.ruolo,
    nome: input.nome,
    emailVerificata: false,
    tokenVerifica,
  });
  if (error) return { ok: false, errore: "Errore nella registrazione." };

  const link = `${input.baseUrl}/api/auth/verifica-email?token=${tokenVerifica}`;
  await inviaEmailVerifica(emailLower, input.nome, link);

  return { ok: true, utente: { id, email: emailLower, ruolo: input.ruolo, nome: input.nome } };
}

export async function autenticaUtente(
  email: string,
  password: string
): Promise<{ ok: true; utente: Utente } | { ok: false; errore: string }> {
  const { data: riga } = await supabase
    .from("utenti")
    .select("*")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (!riga) return { ok: false, errore: "Email o password non corretti." };

  const valida = await bcrypt.compare(password, riga.passwordHash);
  if (!valida) return { ok: false, errore: "Email o password non corretti." };

  return {
    ok: true,
    utente: { id: riga.id, email: riga.email, ruolo: riga.ruolo, nome: riga.nome },
  };
}

export async function creaSessione(utenteId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  await supabase.from("sessioni").insert({ token, utenteId });
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
    await supabase.from("sessioni").delete().eq("token", token);
  }
  store.delete(COOKIE_NAME);
}

export async function getUtenteCorrente(): Promise<Utente | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const { data: sessione } = await supabase
    .from("sessioni")
    .select("utenteId")
    .eq("token", token)
    .maybeSingle();
  if (!sessione) return null;

  const { data: utente } = await supabase
    .from("utenti")
    .select("id, email, ruolo, nome")
    .eq("id", sessione.utenteId)
    .maybeSingle();

  return (utente as Utente) ?? null;
}
