import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const action = pathParts[pathParts.length - 1];

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY not found');
      return new Response(
        JSON.stringify({ error: 'AI not connected', placeholder: true }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /ai-assistant/chat - Chat with AI
    if (action === 'chat' && req.method === 'POST') {
      const body = await req.json();
      const { message, history } = body;

      if (!message) {
        return new Response(
          JSON.stringify({ error: 'Message required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Processing chat message:', message);

      // Save user message to chat history
      await supabaseClient
        .from('chat_history')
        .insert({
          user_id: user.id,
          role: 'user',
          message,
        });

      // Prepare messages for AI
      const messages = [
        {
          role: 'system',
          content: 'Du är Promotely AI-assistent. Du hjälper UF-företag och unga entreprenörer med marknadsföring, sociala medier och strategier. Svara alltid på svenska och var hjälpsam och engagerande.'
        },
        ...(history || []).map((msg: any) => ({
          role: msg.role,
          content: msg.message
        })),
        {
          role: 'user',
          content: message
        }
      ];

      console.log('Calling OpenAI...');

      // Call OpenAI API
      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('OpenAI API error:', aiResponse.status, errorText);
        throw new Error(`AI API error: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      console.log('AI response received');
      
      const assistantMessage = aiData.choices[0].message.content;

      // Save AI response to chat history
      await supabaseClient
        .from('chat_history')
        .insert({
          user_id: user.id,
          role: 'assistant',
          message: assistantMessage,
        });

      return new Response(
        JSON.stringify({ response: assistantMessage }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /ai-assistant/generate-plan - Generate content plan
    if (action === 'generate-plan' && req.method === 'POST') {
      return new Response(
        JSON.stringify({ 
          error: 'AI not fully connected', 
          placeholder: true,
          message: 'Innehållsplan-generering kommer snart!' 
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /ai-assistant/analyze - Analyze statistics
    if (action === 'analyze' && req.method === 'POST') {
      return new Response(
        JSON.stringify({ 
          error: 'AI not fully connected', 
          placeholder: true,
          message: 'Statistik-analys kommer snart!' 
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /ai-assistant/history - Get chat history
    if (action === 'history' && req.method === 'GET') {
      const { data, error } = await supabaseClient
        .from('chat_history')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error fetching chat history:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(data || []),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action or method' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in AI assistant function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});