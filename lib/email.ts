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
