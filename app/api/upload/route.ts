import { NextRequest, NextResponse } from "next/server";
import { getUtenteCorrente } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const BUCKET = "allegati";
const MAX_SIZE = 25 * 1024 * 1024; // 25MB
const ESTENSIONI_CONSENTITE = [
  "dwg", "dxf", "dwf", "dwfx", "pdf",
  "obj", "fbx", "skp", "stp", "step",
  "iges", "igs", "3dm", "glb", "gltf",
  "zip", "rar", "rvt",
  "png", "jpg", "jpeg", "webp", "gif",
];

function estensione(nomeFile: string): string {
  return nomeFile.split(".").pop()?.toLowerCase() ?? "";
}

export async function POST(req: NextRequest) {
  const utente = await getUtenteCorrente();
  if (!utente) {
    return NextResponse.json({ error: "Devi accedere per caricare un file." }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Nessun file ricevuto." }, { status: 400 });
  }

  const ext = estensione(file.name);
  if (!ESTENSIONI_CONSENTITE.includes(ext)) {
    return NextResponse.json(
      { error: `Formato .${ext} non supportato. Formati ammessi: ${ESTENSIONI_CONSENTITE.join(", ")}.` },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Il file supera i 25 MB." }, { status: 400 });
  }

  const nomeSicuro = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const percorso = `${utente.id}/${Date.now()}-${nomeSicuro}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: erroreUpload } = await supabase.storage
    .from(BUCKET)
    .upload(percorso, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (erroreUpload) {
    return NextResponse.json(
      { error: "Errore nel caricamento del file. Riprova più tardi." },
      { status: 500 }
    );
  }

  const { data: pubblico } = supabase.storage.from(BUCKET).getPublicUrl(percorso);

  return NextResponse.json({ url: pubblico.publicUrl, nome: file.name });
}
