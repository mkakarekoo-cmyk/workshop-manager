import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Obsługa CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Pobranie klucza API (any zapobiega błędom typowania Deno)
    const RESEND_API_KEY = (Deno as any).env.get('RESEND_API_KEY')

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Konfiguracja serwera niekompletna (brak klucza API).' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Pobranie danych wejściowych
    const { to, subject, html } = await req.json()
    const recipients = Array.isArray(to) ? to : [to]

    // 4. Komunikacja z API Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'System Logistyki <powiadomienia@agronarzedziownia.com>',
        to: recipients,
        subject: subject,
        html: html,
      }),
    })

    const responseData = await res.json()

    return new Response(JSON.stringify(responseData), {
      status: res.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})