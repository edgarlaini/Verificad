import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "cadconnect.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS lavori (
    id TEXT PRIMARY KEY,
    titolo TEXT NOT NULL,
    descrizione TEXT NOT NULL,
    azienda TEXT NOT NULL,
    budget REAL NOT NULL,
    scadenza TEXT NOT NULL,
    disegnoAllegato TEXT NOT NULL,
    stato TEXT NOT NULL DEFAULT 'aperto',
    disegnatoreAssegnato TEXT,
    disegnatoreUtenteId TEXT,
    aziendaUtenteId TEXT,
    consegnaFile TEXT,
    dataConsegna TEXT,
    motivoRevisione TEXT,
    creatoIl TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS disegnatori (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    competenze TEXT NOT NULL,
    lavoriCompletati INTEGER NOT NULL DEFAULT 0,
    valutazione REAL NOT NULL DEFAULT 5.0
  );

  CREATE TABLE IF NOT EXISTS utenti (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    passwordHash TEXT NOT NULL,
    ruolo TEXT NOT NULL CHECK (ruolo IN ('azienda', 'disegnatore')),
    nome TEXT NOT NULL,
    creatoIl TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessioni (
    token TEXT PRIMARY KEY,
    utenteId TEXT NOT NULL,
    creatoIl TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (utenteId) REFERENCES utenti(id)
  );

  CREATE TABLE IF NOT EXISTS candidature (
    id TEXT PRIMARY KEY,
    lavoroId TEXT NOT NULL,
    disegnatoreUtenteId TEXT NOT NULL,
    disegnatoreNome TEXT NOT NULL,
    messaggio TEXT NOT NULL,
    stato TEXT NOT NULL DEFAULT 'in_attesa',
    creatoIl TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (lavoroId) REFERENCES lavori(id)
  );
`);

const contaLavori = db.prepare("SELECT COUNT(*) as n FROM lavori").get() as {
  n: number;
};

if (contaLavori.n === 0) {
  const inserisciLavoro = db.prepare(`
    INSERT INTO lavori (id, titolo, descrizione, azienda, budget, scadenza, disegnoAllegato, stato, disegnatoreAssegnato)
    VALUES (@id, @titolo, @descrizione, @azienda, @budget, @scadenza, @disegnoAllegato, @stato, @disegnatoreAssegnato)
  `);

  const seed = [
    {
      id: "l1",
      titolo: "Modello 3D cameretta bambini su misura",
      descrizione:
        "Conversione da disegno 2D a modello 3D completo, arredi su misura, doppia altezza.",
      azienda: "Nomade Architettura",
      budget: 450,
      scadenza: "2026-09-05",
      disegnoAllegato: "cameretta_pianta_quote.dwg",
      stato: "in_revisione",
      disegnatoreAssegnato: "Marco B.",
    },
    {
      id: "l2",
      titolo: "Modello 3D negozio retail — scaffalature custom",
      descrizione:
        "Riproduzione fedele delle scaffalature e banco cassa secondo tavole tecniche fornite.",
      azienda: "Nomade Architettura",
      budget: 600,
      scadenza: "2026-09-12",
      disegnoAllegato: "retail_layout_quote.pdf",
      stato: "aperto",
      disegnatoreAssegnato: null,
    },
    {
      id: "l3",
      titolo: "Design nautico — interni cabina",
      descrizione:
        "Modello 3D interni cabina barca a vela 12m, rispetto rigoroso delle quote di ingombro.",
      azienda: "Cantiere Adriatico",
      budget: 800,
      scadenza: "2026-09-20",
      disegnoAllegato: "cabina_sezioni.dwg",
      stato: "aperto",
      disegnatoreAssegnato: null,
    },
  ];

  for (const l of seed) inserisciLavoro.run(l);

  const inserisciDisegnatore = db.prepare(`
    INSERT INTO disegnatori (id, nome, competenze, lavoriCompletati, valutazione)
    VALUES (@id, @nome, @competenze, @lavoriCompletati, @valutazione)
  `);

  const seedDisegnatori = [
    { id: "d1", nome: "Marco B.", competenze: "AutoCAD,SolidWorks,Revit", lavoriCompletati: 12, valutazione: 4.8 },
    { id: "d2", nome: "Giulia T.", competenze: "Rhino,AutoCAD,SketchUp", lavoriCompletati: 7, valutazione: 4.9 },
    { id: "d3", nome: "Luca F.", competenze: "AutoCAD,Inventor", lavoriCompletati: 21, valutazione: 4.7 },
  ];

  for (const d of seedDisegnatori) inserisciDisegnatore.run(d);
}

export default db;
