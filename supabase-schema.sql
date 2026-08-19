-- Schema VerifiCAD per Supabase — incolla tutto questo nel SQL Editor di Supabase ed esegui.

create table if not exists lavori (
  id text primary key,
  titolo text not null,
  descrizione text not null,
  azienda text not null,
  "aziendaUtenteId" text,
  budget numeric not null,
  scadenza text not null,
  "disegnoAllegato" text not null,
  "disegnoNome" text,
  stato text not null default 'aperto',
  "disegnatoreAssegnato" text,
  "disegnatoreUtenteId" text,
  "consegnaFile" text,
  "consegnaNome" text,
  "dataConsegna" timestamptz,
  "motivoRevisione" text,
  "creatoIl" timestamptz not null default now()
);

-- Se la tabella lavori esisteva già da prima di questa modifica, esegui anche:
alter table lavori add column if not exists "disegnoNome" text;
alter table lavori add column if not exists "consegnaNome" text;
alter table lavori add column if not exists "revisioniUsate" integer not null default 0;

create table if not exists revisioni (
  id text primary key,
  "lavoroId" text not null references lavori(id),
  tipo text not null check (tipo in ('errore', 'modifica')),
  motivo text not null,
  "disegnoUrl" text,
  "disegnoNome" text,
  "creatoIl" timestamptz not null default now()
);

create table if not exists disegnatori (
  id text primary key,
  nome text not null,
  competenze text not null,
  "lavoriCompletati" integer not null default 0,
  valutazione numeric not null default 5.0
);

create table if not exists utenti (
  id text primary key,
  email text not null unique,
  "passwordHash" text not null,
  ruolo text not null check (ruolo in ('azienda', 'disegnatore')),
  nome text not null,
  "creatoIl" timestamptz not null default now()
);

create table if not exists sessioni (
  token text primary key,
  "utenteId" text not null references utenti(id),
  "creatoIl" timestamptz not null default now()
);

create table if not exists profili (
  "utenteId" text primary key references utenti(id),
  competenze text not null default '',
  "programmiCad" text not null default '',
  "cvUrl" text,
  "cvNome" text,
  "aggiornatoIl" timestamptz not null default now()
);

create table if not exists candidature (
  id text primary key,
  "lavoroId" text not null references lavori(id),
  "disegnatoreUtenteId" text not null,
  "disegnatoreNome" text not null,
  messaggio text not null,
  stato text not null default 'in_attesa',
  "creatoIl" timestamptz not null default now()
);

-- Dati di esempio (solo se le tabelle sono vuote)
insert into lavori (id, titolo, descrizione, azienda, budget, scadenza, "disegnoAllegato", stato, "disegnatoreAssegnato")
select 'l1', 'Modello 3D cameretta bambini su misura', 'Conversione da disegno 2D a modello 3D completo, arredi su misura, doppia altezza.', 'Nomade Architettura', 450, '2026-09-05', 'cameretta_pianta_quote.dwg', 'in_revisione', 'Marco B.'
where not exists (select 1 from lavori where id = 'l1');

insert into lavori (id, titolo, descrizione, azienda, budget, scadenza, "disegnoAllegato", stato)
select 'l2', 'Modello 3D negozio retail — scaffalature custom', 'Riproduzione fedele delle scaffalature e banco cassa secondo tavole tecniche fornite.', 'Nomade Architettura', 600, '2026-09-12', 'retail_layout_quote.pdf', 'aperto'
where not exists (select 1 from lavori where id = 'l2');

insert into lavori (id, titolo, descrizione, azienda, budget, scadenza, "disegnoAllegato", stato)
select 'l3', 'Design nautico — interni cabina', 'Modello 3D interni cabina barca a vela 12m, rispetto rigoroso delle quote di ingombro.', 'Cantiere Adriatico', 800, '2026-09-20', 'cabina_sezioni.dwg', 'aperto'
where not exists (select 1 from lavori where id = 'l3');
