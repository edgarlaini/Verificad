# VerifiCAD

Portale per reclutare disegnatori CAD verificati. Le aziende pubblicano lavori con disegno tecnico allegato, i disegnatori si candidano, e ogni consegna viene verificata (visualizzatore 3D integrato) prima del rilascio del pagamento.

## Sviluppo locale

```bash
npm install --legacy-peer-deps
npm run dev
```

## Note

- Database: SQLite locale (`cadconnect.db`) — da sostituire con Supabase/Postgres prima del lancio pubblico, perché su hosting serverless (Vercel) il filesystem non persiste tra le richieste.
- Pagamenti: split 10% azienda + 10% disegnatore calcolato ma non ancora collegato a Stripe Connect.
