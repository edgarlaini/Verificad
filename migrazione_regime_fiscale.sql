-- Migrazione: regime fiscale del disegnatore
-- Incolla questo nel SQL Editor di Supabase ed esegui (una volta sola).
--
-- Default "forfettario": è il regime più semplice (nessuna IVA, nessuna ritenuta),
-- così un disegnatore che non ha ancora compilato questo campo non fa pagare
-- all'azienda importi aggiuntivi che potrebbero non spettargli.

alter table profili add column if not exists "regimeFiscale" text not null default 'forfettario'
  check ("regimeFiscale" in ('forfettario', 'ordinario'));
alter table profili add column if not exists "percentualeRivalsa" numeric not null default 4;
alter table profili add column if not exists "aliquotaIva" numeric not null default 22;
alter table profili add column if not exists "percentualeRitenuta" numeric not null default 20;
