import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Fix: Property 'env' does not exist on type 'typeof Deno' error by using type assertion
const RESEND_API_KEY = (Deno as any).env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Obsługa zapytań preflight (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html } = await req.json()

    // Resend wymaga tablicy stringów dla wielu odbiorców. 
    // Nasza aplikacja wysyła maile oddzielone przecinkami.
    const recipients = typeof to === 'string' 
      ? to.split(',').map((e: string) => e.trim()).filter((e: string) => e !== '')
      : [to];

    console.log(`Próba wysłania e-maila do: ${recipients.join(', ')}`);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'System Logistyki <powiadomienia@contractus.com.pl>', // Zmień na zweryfikowany adres po weryfikacji domeny
        to: recipients,
        subject: subject,
        html: html,
      }),
    })

    const data = await res.json()

    if (res.ok) {
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else {
      console.error('Błąd Resend:', data);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: res.status,
      })
    }
  } catch (error: any) {
    // Fix: Added type annotation to handle 'error' as any for accessing .message property
    console.error('Błąd krytyczny funkcji:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
