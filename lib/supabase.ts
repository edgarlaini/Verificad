import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Client lato server, con permessi completi (service role).
// Non esporre mai SUPABASE_SERVICE_ROLE_KEY al browser: resta solo in variabili
// d'ambiente server-side, mai in NEXT_PUBLIC_*.
export const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});
