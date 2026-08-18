export function calcolaCommissione(budget: number) {
  const commissioneAzienda = Math.round(budget * 0.1 * 100) / 100;
  const commissioneDisegnatore = Math.round(budget * 0.1 * 100) / 100;
  return {
    totalePagatoAzienda: budget + commissioneAzienda,
    nettoDisegnatore: budget - commissioneDisegnatore,
    commissioneAzienda,
    commissioneDisegnatore,
    commissioneTotalePiattaforma: commissioneAzienda + commissioneDisegnatore,
  };
}
