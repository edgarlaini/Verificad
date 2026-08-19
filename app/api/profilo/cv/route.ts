import { NextRequest, NextResponse } from "next/server";
import { getUtenteCorrente } from "@/lib/auth";
import { salvaCvProfilo } from "@/lib/data";
import { supabase } from "@/lib/supabase";

const BUCKET = "cv";

export async function POST(req: NextRequest) {
  const utente = await getUtenteCorrente();
  if (!utente) {
    return NextResponse.json({ error: "Devi accedere per caricare il CV." }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("cv");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Nessun file ricevuto." }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Il CV deve essere un file PDF." }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Il file supera i 5 MB." }, { status: 400 });
  }

  const percorso = `${utente.id}/cv.pdf`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: erroreUpload } = await supabase.storage
    .from(BUCKET)
    .upload(percorso, buffer, { contentType: "application/pdf", upsert: true });

  if (erroreUpload) {
    return NextResponse.json(
      { error: "Errore nel caricamento del CV. Riprova più tardi." },
      { status: 500 }
    );
  }

  const { data: pubblico } = supabase.storage.from(BUCKET).getPublicUrl(percorso);

  await salvaCvProfilo({
    utenteId: utente.id,
    cvUrl: pubblico.publicUrl,
    cvNome: file.name,
  });

  return NextResponse.json({ ok: true, cvUrl: pubblico.publicUrl, cvNome: file.name });
}
