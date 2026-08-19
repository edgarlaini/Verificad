"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Utente {
  id: string;
  ruolo: "azienda" | "disegnatore";
  nome: string;
}

interface Props {
  lavoroId: string;
  stato: string;
  budget: number;
  disegnatoreUtenteId: string | null | undefined;
  aziendaUtenteId: string | null | undefined;
  consegnaFile: string | null | undefined;
  consegnaNome: string | null | undefined;
  dataConsegna: string | null | undefined;
  motivoRevisione: string | null | undefined;
  revisioniUsate: number;
  giorniRimanenti: number;
}

const REVISIONI_INCLUSE = 3;

export default function PannelloConsegna({
  lavoroId,
  stato,
  budget,
  disegnatoreUtenteId,
  aziendaUtenteId,
  consegnaFile,
  consegnaNome,
  motivoRevisione,
  revisioniUsate,
  giorniRimanenti,
}: Props) {
  const router = useRouter();
  const [utente, setUtente] = useState<Utente | null | undefined>(undefined);
  const [fileNome, setFileNome] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [caricamentoFile, setCaricamentoFile] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [tipoRevisione, setTipoRevisione] = useState<"errore" | "modifica">("errore");
  const [disegnoNome, setDisegnoNome] = useState("");
  const [disegnoUrl, setDisegnoUrl] = useState("");
  const [caricamentoDisegno, setCaricamentoDisegno] = useState(false);
  const [invio, setInvio] = useState(false);
  const [errore, setErrore] = useState("");
  const [bloccatoDaExtra, setBloccatoDaExtra] = useState<{ totale: number } | null>(null);
  const [azione, setAzione] = useState<"nessuna" | "revisione">("nessuna");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUtente(d.utente));
  }, []);

  const revisioniEsaurite = revisioniUsate >= REVISIONI_INCLUSE;
  const extra = Math.round(budget * 0.2 * 100) / 100;

  async function caricaFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrore("");
    setCaricamentoFile(true);
    setFileNome("");
    setFileUrl("");

    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    setCaricamentoFile(false);

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErrore(d.error || "Errore nel caricamento del file.");
      return;
    }
    const data = await res.json();
    setFileNome(data.nome);
    setFileUrl(data.url);
  }

  async function caricaDisegnoRevisione(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrore("");
    setCaricamentoDisegno(true);
    setDisegnoNome("");
    setDisegnoUrl("");

    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    setCaricamentoDisegno(false);

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErrore(d.error || "Errore nel caricamento del disegno.");
      return;
    }
    const data = await res.json();
    setDisegnoNome(data.nome);
    setDisegnoUrl(data.url);
  }

  async function consegna(e: React.FormEvent) {
    e.preventDefault();
    setErrore("");
    setInvio(true);
    const res = await fetch(`/api/lavori/${lavoroId}/consegna`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consegnaFile: fileUrl, consegnaNome: fileNome }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErrore(d.error || "Errore nella consegna.");
      setInvio(false);
      return;
    }
    router.refresh();
  }

  async function approva() {
    setInvio(true);
    const res = await fetch(`/api/lavori/${lavoroId}/approva`, { method: "POST" });
    setInvio(false);
    if (res.ok) router.refresh();
  }

  async function inviaRevisione(e: React.FormEvent) {
    e.preventDefault();
    setErrore("");
    setBloccatoDaExtra(null);
    setInvio(true);
    const res = await fetch(`/api/lavori/${lavoroId}/revisione`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        motivo,
        tipo: tipoRevisione,
        disegnoUrl: tipoRevisione === "modifica" ? disegnoUrl : undefined,
        disegnoNome: tipoRevisione === "modifica" ? disegnoNome : undefined,
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      if (res.status === 402 && d.extra) {
        setBloccatoDaExtra({ totale: d.extra.totale });
        setInvio(false);
        return;
      }
      setErrore(d.error || "Errore nella richiesta di revisione.");
      setInvio(false);
      return;
    }
    router.refresh();
  }

  if (utente === undefined) return null;

  const sonoDisegnatoreAssegnato =
    utente?.ruolo === "disegnatore" && utente.id === disegnatoreUtenteId;
  const sonoAziendaProprietaria =
    utente?.ruolo === "azienda" && utente.id === aziendaUtenteId;

  if (!sonoDisegnatoreAssegnato && !sonoAziendaProprietaria) return null;

  return (
    <div className="border border-[var(--blueprint-line)] p-6 mt-6">
      <h2 className="font-mono-cad text-xs tracking-widest text-[var(--blueprint-text-dim)] mb-4">
        CONSEGNA E APPROVAZIONE
      </h2>

      <p className="font-mono-cad text-[10px] text-[var(--blueprint-text-dim)] mb-4">
        revisioni di progetto usate: {revisioniUsate} / {REVISIONI_INCLUSE}
      </p>

      {motivoRevisione && stato === "in_corso" && (
        <div className="border border-[var(--blueprint-amber)] p-3 mb-4 text-sm">
          <p className="font-mono-cad text-[10px] text-[var(--blueprint-amber)] mb-1">
            REVISIONE RICHIESTA DALL&apos;AZIENDA
          </p>
          <p>{motivoRevisione}</p>
        </div>
      )}

      {sonoDisegnatoreAssegnato && stato === "in_corso" && (
        <form onSubmit={consegna} className="space-y-3">
          <p className="text-sm text-[var(--blueprint-text-dim)]">
            Carica il file finale, conforme all&apos;ultimo disegno tecnico allegato.
          </p>
          <div className="border border-dashed border-[var(--blueprint-line)] p-4 text-center">
            <input type="file" id="consegna-file" className="hidden" onChange={caricaFile} />
            <label
              htmlFor="consegna-file"
              className="cursor-pointer font-mono-cad text-sm text-[var(--blueprint-accent)] hover:text-[var(--blueprint-accent-strong)]"
            >
              {caricamentoFile
                ? "caricamento..."
                : fileNome
                ? `⌗ ${fileNome}`
                : "+ carica file (DWG, DXF, OBJ, FBX, SKP...)"}
            </label>
          </div>
          {errore && <p className="text-sm text-red-400 font-mono-cad">{errore}</p>}
          <button
            type="submit"
            disabled={!fileUrl || caricamentoFile || invio}
            className="font-mono-cad text-sm border border-[var(--blueprint-accent)] text-[var(--blueprint-accent-strong)] px-4 py-2 hover:bg-[var(--blueprint-accent)] hover:text-[var(--blueprint-bg)] transition-colors disabled:opacity-40"
          >
            {invio ? "INVIO..." : "CONSEGNA LAVORO →"}
          </button>
        </form>
      )}

      {sonoDisegnatoreAssegnato && stato === "in_revisione" && (
        <div className="space-y-3">
          <p className="text-sm text-[var(--blueprint-accent-strong)] font-mono-cad">
            ✓ Consegnato: {consegnaNome || consegnaFile}. In attesa di approvazione (
            {giorniRimanenti} {giorniRimanenti === 1 ? "giorno" : "giorni"} al rilascio automatico).
          </p>
        </div>
      )}

      {sonoAziendaProprietaria && stato === "in_revisione" && (
        <div className="space-y-4">
          <div className="border border-[var(--blueprint-accent)] p-3 flex items-center justify-between gap-3">
            <span className="font-mono-cad text-sm">⌗ {consegnaNome || consegnaFile}</span>
            {consegnaFile && (
              <a
                href={consegnaFile}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono-cad text-xs text-[var(--blueprint-accent-strong)] hover:underline shrink-0"
              >
                scarica →
              </a>
            )}
          </div>
          <p className="text-xs text-[var(--blueprint-text-dim)] font-mono-cad">
            approvazione automatica tra {giorniRimanenti}{" "}
            {giorniRimanenti === 1 ? "giorno" : "giorni"} se non rispondi
          </p>

          {azione === "nessuna" && (
            <div className="flex gap-3">
              <button
                onClick={approva}
                disabled={invio}
                className="font-mono-cad text-sm border border-[var(--blueprint-accent)] text-[var(--blueprint-accent-strong)] px-4 py-2 hover:bg-[var(--blueprint-accent)] hover:text-[var(--blueprint-bg)] transition-colors disabled:opacity-40"
              >
                approva e rilascia pagamento
              </button>
              <button
                onClick={() => setAzione("revisione")}
                className="font-mono-cad text-sm border border-[var(--blueprint-amber)] text-[var(--blueprint-amber)] px-4 py-2 hover:bg-[var(--blueprint-amber)] hover:text-[var(--blueprint-bg)] transition-colors"
              >
                richiedi revisione
              </button>
            </div>
          )}

          {azione === "revisione" && (
            <form onSubmit={inviaRevisione} className="space-y-4">
              <div>
                <p className="font-mono-cad text-[10px] tracking-widest text-[var(--blueprint-text-dim)] mb-2">
                  TIPO DI RICHIESTA
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoRevisione("errore")}
                    className={`font-mono-cad text-xs py-2 px-3 border transition-colors text-left ${
                      tipoRevisione === "errore"
                        ? "border-[var(--blueprint-accent)] text-[var(--blueprint-accent-strong)] bg-[var(--blueprint-bg-2)]"
                        : "border-[var(--blueprint-line)] text-[var(--blueprint-text-dim)]"
                    }`}
                  >
                    errore da correggere
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoRevisione("modifica")}
                    className={`font-mono-cad text-xs py-2 px-3 border transition-colors text-left ${
                      tipoRevisione === "modifica"
                        ? "border-[var(--blueprint-amber)] text-[var(--blueprint-amber)] bg-[var(--blueprint-bg-2)]"
                        : "border-[var(--blueprint-line)] text-[var(--blueprint-text-dim)]"
                    }`}
                  >
                    modifica di progetto
                  </button>
                </div>
                <p className="text-xs text-[var(--blueprint-text-dim)] mt-2">
                  {tipoRevisione === "errore"
                    ? "Il file consegnato non rispetta il disegno tecnico originale. Gratuito, illimitato, non conta come revisione."
                    : "Cambi qualcosa rispetto al disegno tecnico di partenza. Richiede un nuovo disegno allegato e conta come una delle 3 revisioni incluse."}
                </p>
              </div>

              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                required
                rows={3}
                placeholder={
                  tipoRevisione === "errore"
                    ? "Indica quale quota o dettaglio del disegno tecnico non è rispettato..."
                    : "Indica cosa cambia rispetto al disegno tecnico originale..."
                }
                className="w-full bg-[var(--blueprint-bg-2)] border border-[var(--blueprint-line)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--blueprint-amber)]"
              />

              {tipoRevisione === "modifica" && !revisioniEsaurite && (
                <div className="border border-dashed border-[var(--blueprint-line)] p-4 text-center">
                  <input
                    type="file"
                    id="disegno-revisione"
                    className="hidden"
                    onChange={caricaDisegnoRevisione}
                  />
                  <label
                    htmlFor="disegno-revisione"
                    className="cursor-pointer font-mono-cad text-sm text-[var(--blueprint-amber)] hover:text-[var(--blueprint-accent-strong)]"
                  >
                    {caricamentoDisegno
                      ? "caricamento..."
                      : disegnoNome
                      ? `⌗ ${disegnoNome}`
                      : "+ allega nuovo disegno tecnico — obbligatorio"}
                  </label>
                </div>
              )}

              {tipoRevisione === "modifica" && revisioniEsaurite && (
                <div className="border border-[var(--blueprint-amber)] p-4 text-sm space-y-2">
                  <p className="font-mono-cad text-[10px] text-[var(--blueprint-amber)]">
                    3 REVISIONI DI PROGETTO GIÀ USATE
                  </p>
                  <p className="text-[var(--blueprint-text-dim)]">
                    Per sbloccarne altre 3 serve un extra del 20% del valore del lavoro:{" "}
                    <span className="text-[var(--blueprint-accent-strong)]">€{extra.toFixed(2)}</span>.
                    I pagamenti extra non sono ancora collegati alla piattaforma — per ora contatta
                    direttamente il disegnatore per accordarvi.
                  </p>
                </div>
              )}

              {bloccatoDaExtra && (
                <div className="border border-[var(--blueprint-amber)] p-4 text-sm space-y-2">
                  <p className="font-mono-cad text-[10px] text-[var(--blueprint-amber)]">
                    3 REVISIONI DI PROGETTO GIÀ USATE
                  </p>
                  <p className="text-[var(--blueprint-text-dim)]">
                    Per sbloccarne altre 3 serve un extra del 20% del valore del lavoro:{" "}
                    <span className="text-[var(--blueprint-accent-strong)]">
                      €{bloccatoDaExtra.totale.toFixed(2)}
                    </span>
                    . I pagamenti extra non sono ancora collegati alla piattaforma.
                  </p>
                </div>
              )}

              {errore && <p className="text-sm text-red-400 font-mono-cad">{errore}</p>}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={
                    invio ||
                    caricamentoDisegno ||
                    (tipoRevisione === "modifica" && (revisioniEsaurite || !disegnoUrl))
                  }
                  className="font-mono-cad text-sm border border-[var(--blueprint-amber)] text-[var(--blueprint-amber)] px-4 py-2 hover:bg-[var(--blueprint-amber)] hover:text-[var(--blueprint-bg)] transition-colors disabled:opacity-40"
                >
                  {invio ? "INVIO..." : "INVIA RICHIESTA DI REVISIONE"}
                </button>
                <button
                  type="button"
                  onClick={() => setAzione("nessuna")}
                  className="font-mono-cad text-sm text-[var(--blueprint-text-dim)] px-4 py-2"
                >
                  annulla
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {stato === "chiuso" && (
        <div className="space-y-3">
          <p className="text-sm text-[var(--blueprint-accent-strong)] font-mono-cad">
            ✓ Lavoro chiuso e pagamento rilasciato al disegnatore.
          </p>
          {(sonoAziendaProprietaria || sonoDisegnatoreAssegnato) && consegnaFile && (
            <div className="border border-[var(--blueprint-accent)] p-3 flex items-center justify-between gap-3">
              <span className="font-mono-cad text-sm">⌗ {consegnaNome || consegnaFile}</span>
              <a
                href={consegnaFile}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono-cad text-xs text-[var(--blueprint-accent-strong)] hover:underline shrink-0"
              >
                scarica →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
