import { Resend } from "resend";

// Con un dominio non ancora verificato su Resend, il mittente deve restare
// onboarding@resend.dev. Quando colleghi un dominio tuo (es. verificad.it)
// su Resend, cambia questo indirizzo in qualcosa come noreply@verificad.it.
const MITTENTE = "VerifiCAD <onboarding@resend.dev>";

export async function inviaEmailVerifica(destinatario: string, nome: string, link: string) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: MITTENTE,
      to: destinatario,
      subject: "Conferma il tuo indirizzo email — VerifiCAD",
      html: `
        <div style="font-family: monospace; max-width: 480px; margin: 0 auto; padding: 24px; background: #0b1e2e; color: #dce8f0;">
          <p style="color: #5fb4dd; letter-spacing: 0.2em; font-size: 12px;">VERIFICAD</p>
          <h1 style="font-size: 20px; margin: 8px 0 16px;">Ciao ${nome},</h1>
          <p style="color: #7d97a8; font-size: 14px; line-height: 1.6;">
            Conferma il tuo indirizzo email per attivare completamente il tuo account su VerifiCAD.
          </p>
          <a href="${link}" style="display: inline-block; margin-top: 16px; padding: 10px 20px; background: #5fb4dd; color: #0b1e2e; text-decoration: none; font-weight: bold;">
            Conferma email →
          </a>
          <p style="color: #7d97a8; font-size: 12px; margin-top: 24px;">
            Se non hai richiesto tu questa registrazione, ignora questa email.
          </p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error("Errore invio email di verifica:", err);
    return false;
  }
}

export async function inviaEmailContatto(input: {
  nome: string;
  email: string;
  messaggio: string;
}) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: MITTENTE,
      to: "edgar.laini@gmail.com",
      replyTo: input.email,
      subject: `Nuovo messaggio da ${input.nome} — VerifiCAD`,
      html: `
        <div style="font-family: monospace; max-width: 480px; margin: 0 auto; padding: 24px; background: #0b1e2e; color: #dce8f0;">
          <p style="color: #5fb4dd; letter-spacing: 0.2em; font-size: 12px;">VERIFICAD — CONTATTI</p>
          <p style="font-size: 14px; margin: 16px 0 4px;"><strong>Da:</strong> ${input.nome} (${input.email})</p>
          <p style="color: #7d97a8; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${input.messaggio}</p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error("Errore invio email di contatto:", err);
    return false;
  }
}

// Inviata al disegnatore nel momento in cui l'azienda accetta la sua
// candidatura e il lavoro gli viene assegnato (stato -> in_corso).
export async function inviaEmailAssegnazione(
  destinatario: string,
  nomeDisegnatore: string,
  titoloLavoro: string,
  link: string
) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: MITTENTE,
      to: destinatario,
      subject: `Ti è stato assegnato un lavoro — ${titoloLavoro}`,
      html: `
        <div style="font-family: monospace; max-width: 480px; margin: 0 auto; padding: 24px; background: #0b1e2e; color: #dce8f0;">
          <p style="color: #5fb4dd; letter-spacing: 0.2em; font-size: 12px;">VERIFICAD</p>
          <h1 style="font-size: 20px; margin: 8px 0 16px;">Ciao ${nomeDisegnatore},</h1>
          <p style="color: #7d97a8; font-size: 14px; line-height: 1.6;">
            La tua candidatura è stata accettata. Ti è stato assegnato il lavoro:
          </p>
          <p style="font-size: 16px; margin: 12px 0; color: #dce8f0;">
            «${titoloLavoro}»
          </p>
          <a href="${link}" style="display: inline-block; margin-top: 16px; padding: 10px 20px; background: #5fb4dd; color: #0b1e2e; text-decoration: none; font-weight: bold;">
            Apri il lavoro →
          </a>
          <p style="color: #7d97a8; font-size: 12px; margin-top: 24px;">
            Trovi tutti i dettagli, il disegno tecnico di riferimento e la chat con l'azienda direttamente sulla pagina del lavoro.
          </p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error("Errore invio email di assegnazione:", err);
    return false;
  }
}

// Inviata al disegnatore quando l'azienda apre una contestazione formale
// sul lavoro consegnato.
export async function inviaEmailContestazioneAperta(
  destinatario: string,
  nomeDisegnatore: string,
  titoloLavoro: string,
  motivo: string,
  link: string
) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: MITTENTE,
      to: destinatario,
      subject: `Contestazione aperta sul lavoro — ${titoloLavoro}`,
      html: `
        <div style="font-family: monospace; max-width: 480px; margin: 0 auto; padding: 24px; background: #0b1e2e; color: #dce8f0;">
          <p style="color: #5fb4dd; letter-spacing: 0.2em; font-size: 12px;">VERIFICAD</p>
          <h1 style="font-size: 20px; margin: 8px 0 16px;">Ciao ${nomeDisegnatore},</h1>
          <p style="color: #7d97a8; font-size: 14px; line-height: 1.6;">
            L'azienda ha aperto una contestazione formale sul lavoro «${titoloLavoro}». Motivo:
          </p>
          <p style="font-size: 14px; margin: 12px 0; color: #dce8f0; white-space: pre-wrap;">${motivo}</p>
          <p style="color: #7d97a8; font-size: 14px; line-height: 1.6;">
            Hai la possibilità di rispondere con la tua versione prima che VerifiCAD prenda una decisione.
          </p>
          <a href="${link}" style="display: inline-block; margin-top: 16px; padding: 10px 20px; background: #5fb4dd; color: #0b1e2e; text-decoration: none; font-weight: bold;">
            Rispondi alla contestazione →
          </a>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error("Errore invio email di contestazione:", err);
    return false;
  }
}

// Notifica interna a VerifiCAD (Edgar) — apertura o risposta a una
// contestazione, così sa che c'è un caso da valutare.
export async function inviaEmailNotificaAdmin(oggetto: string, corpo: string, link: string) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: MITTENTE,
      to: "edgar.laini@gmail.com",
      subject: `[VerifiCAD] ${oggetto}`,
      html: `
        <div style="font-family: monospace; max-width: 480px; margin: 0 auto; padding: 24px; background: #0b1e2e; color: #dce8f0;">
          <p style="color: #5fb4dd; letter-spacing: 0.2em; font-size: 12px;">VERIFICAD — ADMIN</p>
          <p style="font-size: 14px; margin: 16px 0; color: #dce8f0; white-space: pre-wrap;">${corpo}</p>
          <a href="${link}" style="display: inline-block; margin-top: 16px; padding: 10px 20px; background: #5fb4dd; color: #0b1e2e; text-decoration: none; font-weight: bold;">
            Vai alla contestazione →
          </a>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error("Errore invio email notifica admin:", err);
    return false;
  }
}
