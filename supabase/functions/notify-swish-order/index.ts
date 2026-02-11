import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, productName, amount, customerName, customerEmail } = await req.json();

    // Validate required fields
    if (!orderId || !productName || !amount) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Fetch Discord webhook URL from notification_settings
    const { data: settings, error: settingsError } = await supabaseClient
      .from("notification_settings")
      .select("discord_webhook_url")
      .single();

    if (settingsError) {
      console.error("Error fetching settings:", settingsError);
      return new Response(JSON.stringify({ error: "Failed to fetch notification settings" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let discordSent = false;

    // Send Discord notification if webhook is configured
    if (settings?.discord_webhook_url) {
      try {
        const discordResponse = await fetch(settings.discord_webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "Promotely Betalningar",
            avatar_url: "https://promotley.lovable.app/favicon.png",
            embeds: [{
              title: "💳 Ny Swish-betalning väntar på verifiering!",
              description: `[Öppna Admin-panel för att verifiera](https://promotley.se/admin/swish)`,
              color: 0x22c55e, // Green color
              fields: [
                { 
                  name: "📦 Produkt", 
                  value: productName, 
                  inline: true 
                },
                { 
                  name: "💰 Belopp", 
                  value: `${amount} kr`, 
                  inline: true 
                },
                { 
                  name: "🆔 Order-ID", 
                  value: `\`${orderId}\``, 
                  inline: false 
                },
                { 
                  name: "👤 Kund", 
                  value: customerName || "Ej angivet", 
                  inline: true 
                },
                { 
                  name: "📧 E-post", 
                  value: customerEmail || "Ej angivet", 
                  inline: true 
                },
              ],
              footer: { 
                text: "Promotely UF – Swish-betalning" 
              },
              timestamp: new Date().toISOString(),
            }],
          }),
        });
        
        discordSent = discordResponse.ok;
        console.log("Discord notification sent:", discordSent);
      } catch (error) {
        console.error("Discord notification failed:", error);
      }
    } else {
      console.log("No Discord webhook configured");
    }

    return new Response(JSON.stringify({ 
      success: true, 
      discordSent 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Error in notify-swish-order:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
