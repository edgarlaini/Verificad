"use client";
import { useEffect } from "react";

// Modello dimostrativo pubblico (Google model-viewer sample assets).
// In produzione: il file caricato dal disegnatore (OBJ/FBX/SKP...) verrebbe
// convertito automaticamente in GLB lato server per la sola visualizzazione,
// mentre il file originale resta bloccato finché l'azienda non approva.
const MODELLO_DEMO = "/demo/astronaut.glb";

export default function Visualizzatore3D({ nomeFile }: { nomeFile: string }) {
  useEffect(() => {
    import("@google/model-viewer");
  }, []);

  return (
    <div>
      <div className="border border-[var(--blueprint-line)] bg-[var(--blueprint-bg-2)]">
        {/* @ts-expect-error -- model-viewer è un custom element, non tipizzato da React */}
        <model-viewer
          src={MODELLO_DEMO}
          alt={`Anteprima 3D — ${nomeFile}`}
          camera-controls
          auto-rotate
          shadow-intensity="1"
          style={{ width: "100%", height: "360px" }}
        >
          {/* @ts-expect-error -- model-viewer è un custom element */}
        </model-viewer>
      </div>
      <p className="font-mono-cad text-[10px] text-[var(--blueprint-text-dim)] mt-2 text-center">
        anteprima demo — trascina per ruotare · scroll per zoomare · nessun download disponibile prima dell&apos;approvazione
      </p>
    </div>
  );
}
