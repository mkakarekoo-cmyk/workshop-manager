
import { supabase } from '../supabase';

export interface EmailPayload {
  to: string;
  subject: string;
  toolName: string;
  fromBranch: string;
  toBranch: string;
  operator: string;
  notes?: string;
}

/**
 * emailService - Integracja z Supabase Edge Functions i Resend.
 * Ten serwis wywołuje funkcję serwerową, która bezpiecznie wysyła e-mail.
 */
export const emailService = {
  async sendNotification(payload: EmailPayload) {
    try {
      console.log(`[EmailService] Inicjowanie wysyłki do: ${payload.to}`);
      
      const { data, error } = await supabase.functions.invoke('resend-email', {
        body: {
          to: payload.to,
          subject: payload.subject,
          html: `
            <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; padding: 40px; background-color: #f8fafc;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
                <div style="background-color: #0f172a; padding: 40px; text-align: center;">
                  <h1 style="color: #22c55e; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; font-style: italic;">LOGISTYKA NARZĘDZI</h1>
                </div>
                <div style="padding: 40px;">
                  <h2 style="color: #0f172a; font-size: 20px; margin-top: 0; border-bottom: 2px solid #22c55e; padding-bottom: 10px; text-transform: uppercase;">SZCZEGÓŁY OPERACJI</h2>
                  <div style="margin: 24px 0;">
                    <p style="color: #475569; font-size: 16px; margin: 8px 0;"><strong>Narzędzie:</strong> <span style="color: #0f172a; font-weight: 800;">${payload.toolName}</span></p>
                    <p style="color: #475569; font-size: 14px; margin: 8px 0;"><strong>Z oddziału:</strong> ${payload.fromBranch}</p>
                    <p style="color: #475569; font-size: 14px; margin: 8px 0;"><strong>Do oddziału:</strong> ${payload.toBranch}</p>
                    <p style="color: #475569; font-size: 14px; margin: 8px 0;"><strong>Operator:</strong> ${payload.operator}</p>
                  </div>
                  
                  ${payload.notes ? `
                    <div style="background-color: #f1f5f9; padding: 20px; border-radius: 12px; margin-top: 20px; border-left: 4px solid #22c55e;">
                      <p style="color: #0f172a; font-size: 11px; margin: 0; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Uwagi do transportu:</p>
                      <p style="color: #475569; font-size: 14px; margin-top: 8px; font-style: italic;">"${payload.notes}"</p>
                    </div>
                  ` : ''}
                  
                  <div style="margin-top: 40px; text-align: center;">
                    <div style="display: inline-block; padding: 12px 24px; background-color: #22c55e; color: white; border-radius: 12px; font-weight: 800; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Status: W TRANSPORCIE</div>
                  </div>
                </div>
                <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="font-size: 11px; color: #94a3b8; margin: 0;">Wiadomość wygenerowana automatycznie. Prosimy nie odpowiadać na ten e-mail.</p>
                  <p style="font-size: 11px; color: #94a3b8; margin: 4px 0;">© 2026 Contractus - System Zarządzania Zasobami</p>
                </div>
              </div>
            </div>
          `
        },
      });

      if (error) {
        console.error("[EmailService] Błąd funkcji Edge:", error);
        return { success: false, error };
      }

      console.log("[EmailService] Powiadomienie wysłane pomyślnie.");
      return { success: true, data };
    } catch (e) {
      console.error("[EmailService] Błąd krytyczny:", e);
      return { success: false, error: e };
    }
  }
};
