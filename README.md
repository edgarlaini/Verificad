# VerifiCAD

Portale per reclutare disegnatori CAD verificati. Le aziende pubblicano lavori con disegno tecnico allegato, i disegnatori si candidano, e ogni consegna viene verificata (visualizzatore 3D integrato) prima del rilascio del pagamento.

## Sviluppo locale

```bash
npm install --legacy-peer-deps
npm run dev
```

Serve un progetto Supabase: crea `.env.local` con

```
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

e incolla il contenuto di `supabase-schema.sql` nel SQL Editor di Supabase per creare le tabelle.

## Note

- Database: Postgres via Supabase (persistente, funziona su Vercel).
- Pagamenti: split 10% azienda + 10% disegnatore calcolato ma non ancora collegato a Stripe Connect.
