// Cron-jobb: hämtar dagens USD→SEK kurs och cachar i app_settings.
// Triggas dagligen via pg_cron.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Försök gratis API först
    let rate: number | null = null;
    try {
      const resp = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=SEK');
      if (resp.ok) {
        const data = await resp.json();
        rate = data.rates?.SEK;
      }
    } catch (err) {
      console.warn('exchangerate.host failed:', err);
    }

    // Fallback om API är nere
    if (!rate || rate < 5 || rate > 20) {
      console.warn('Invalid rate, using fallback');
      rate = 10.5;
    }

    await supabase.from('app_settings').upsert({
      key: 'usd_to_sek_rate',
      value: { rate, updated_at: new Date().toISOString() },
    });

    return new Response(
      JSON.stringify({ success: true, rate }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating exchange rate:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
