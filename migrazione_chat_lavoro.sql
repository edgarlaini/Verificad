-- Migrazione: chat interna al lavoro
-- Incolla questo nel SQL Editor di Supabase ed esegui (una volta sola).

create table if not exists messaggi_lavoro (
  id text primary key,
  "lavoroId" text not null references lavori(id),
  "mittenteId" text not null references utenti(id),
  "mittenteNome" text not null,
  "mittenteRuolo" text not null check ("mittenteRuolo" in ('azienda', 'disegnatore')),
  testo text not null default '',
  "allegatoUrl" text,
  "allegatoNome" text,
  "creatoIl" timestamptz not null default now()
);

-- indice per rendere veloce il caricamento dei messaggi di un lavoro in ordine cronologico
create index if not exists messaggi_lavoro_lavoro_idx
  on messaggi_lavoro ("lavoroId", "creatoIl");
