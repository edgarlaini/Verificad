// Calcolo degli importi reali di un lavoro, tenendo conto del regime fiscale
// del disegnatore assegnato. Sostituisce la stima semplificata di lib/calc.ts
// (che resta usata solo come stima "nominale" prima dell'assegnazione).
//
// Schema di fatturazione deciso:
// - il disegnatore fattura il valore pieno del lavoro DIRETTAMENTE all'azienda,
//   secondo il proprio regime fiscale (forfettario, oppure ordinario con le
//   proprie percentuali di rivalsa/IVA/ritenuta)
// - VerifiCAD fattura solo le due commissioni (10% azienda + 10% disegnatore),
//   sempre con il regime fisso di LAINI STUDIO 3D (rivalsa 4%, IVA 22%, R.A. 20%)

export interface RegimeFiscale {
  regimeFiscale: "forfettario" | "ordinario";
  percentualeRivalsa: number;
  aliquotaIva: number;
  percentualeRitenuta: number;
}

export interface DettaglioFattura {
  compenso: number;
  rivalsa: number;
  totaleCompenso: number;
  iva: number;
  totaleFattura: number;
  ritenuta: number;
  netto: number;
}

// Regime fisso di LAINI STUDIO 3D, usato per le due fatture di commissione
// che VerifiCAD emette ad ogni lavoro (ad azienda e a disegnatore).
export const REGIME_VERIFICAD: RegimeFiscale = {
  regimeFiscale: "ordinario",
  percentualeRivalsa: 4,
  aliquotaIva: 22,
  percentualeRitenuta: 20,
};

// Regime di default per un disegnatore che non ha ancora compilato il
// proprio profilo fiscale — il più semplice e il meno oneroso per l'azienda.
export const REGIME_DEFAULT: RegimeFiscale = {
  regimeFiscale: "forfettario",
  percentualeRivalsa: 0,
  aliquotaIva: 0,
  percentualeRitenuta: 0,
};

function arrotonda(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calcolaFattura(compenso: number, regime: RegimeFiscale): DettaglioFattura {
  if (regime.regimeFiscale === "forfettario") {
    const c = arrotonda(compenso);
    return { compenso: c, rivalsa: 0, totaleCompenso: c, iva: 0, totaleFattura: c, ritenuta: 0, netto: c };
  }

  const c = arrotonda(compenso);
  const rivalsa = arrotonda((c * regime.percentualeRivalsa) / 100);
  const totaleCompenso = arrotonda(c + rivalsa);
  const iva = arrotonda((totaleCompenso * regime.aliquotaIva) / 100);
  const totaleFattura = arrotonda(totaleCompenso + iva);
  const ritenuta = arrotonda((totaleCompenso * regime.percentualeRitenuta) / 100);
  const netto = arrotonda(totaleFattura - ritenuta);

  return { compenso: c, rivalsa, totaleCompenso, iva, totaleFattura, ritenuta, netto };
}

export interface ImportiLavoro {
  fatturaDisegnatore: DettaglioFattura;
  commissioneAzienda: DettaglioFattura;
  commissioneDisegnatore: DettaglioFattura;
  // Importo totale che l'azienda deve versare a inizio lavoro (nella piattaforma,
  // in escrow): copre sia quanto spetta al disegnatore sia la commissione azienda.
  totaleDaVersareAzienda: number;
  // Quanto riceve realmente il disegnatore alla fine, dopo aver pagato la sua
  // quota di commissione a VerifiCAD.
  nettoFinaleDisegnatore: number;
  // true se il calcolo usa un regime non ancora confermato (lavoro non
  // assegnato, o disegnatore che non ha compilato il profilo fiscale) —
  // serve per mostrare in UI che è una stima, non l'importo definitivo.
  stima: boolean;
}

export function calcolaImportiLavoro(
  budget: number,
  regimeDisegnatore: RegimeFiscale | null,
  stima = false
): ImportiLavoro {
  const regime = regimeDisegnatore ?? REGIME_DEFAULT;
  const fatturaDisegnatore = calcolaFattura(budget, regime);
  const quotaCommissione = arrotonda(budget * 0.1);
  const commissioneAzienda = calcolaFattura(quotaCommissione, REGIME_VERIFICAD);
  const commissioneDisegnatore = calcolaFattura(quotaCommissione, REGIME_VERIFICAD);

  return {
    fatturaDisegnatore,
    commissioneAzienda,
    commissioneDisegnatore,
    totaleDaVersareAzienda: arrotonda(fatturaDisegnatore.netto + commissioneAzienda.netto),
    nettoFinaleDisegnatore: arrotonda(fatturaDisegnatore.netto - commissioneDisegnatore.netto),
    stima: stima || regimeDisegnatore === null,
  };
}
