-- Migrazione: prova di accettazione dei Termini di Servizio
-- Incolla questo nel SQL Editor di Supabase ed esegui (una volta sola).
--
-- "versioneTermini" è la data di ultimo aggiornamento della pagina /termini
-- al momento dell'accettazione (oggi: "2026-08-20") — se in futuro cambi i
-- Termini in modo sostanziale, aggiorna quella data sul sito e da quel
-- momento i nuovi utenti registreranno la nuova versione, mentre resta
-- tracciato quale versione avevano accettato gli utenti già registrati.

alter table utenti add column if not exists "terminiAccettatiIl" timestamptz;
alter table utenti add column if not exists "versioneTermini" text;
alter table utenti add column if not exists "accettazioneClausoleSpecifiche" boolean not null default false;
