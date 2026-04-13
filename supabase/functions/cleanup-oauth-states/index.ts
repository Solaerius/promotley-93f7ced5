import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-secret',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Verify internal secret OR admin JWT
    const internalSecret = Deno.env.get('INTERNAL_API_SECRET');
    const providedSecret = req.headers.get('x-internal-secret');
    const authHeader = req.headers.get('Authorization');
    
    let isAuthorized = false;
    
    // Check internal secret first (for scheduled jobs/cron)
    if (internalSecret && providedSecret === internalSecret) {
      isAuthorized = true;
      console.log('Authorized via internal secret');
    }
    
    // If no internal secret match, check for admin JWT
    if (!isAuthorized && authHeader) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );
      
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
      
      if (!userError && user) {
        // Check if user is admin
        const { data: roleData } = await supabaseAdmin
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();
        
        if (roleData) {
          isAuthorized = true;
          console.log('Authorized via admin JWT:', user.id);
        }
      }
    }
    
    if (!isAuthorized) {
      console.error('Unauthorized cleanup attempt');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      );
    }

    console.log('Starting OAuth state cleanup...');

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Call the cleanup function
    const { data, error } = await supabaseAdmin.rpc('cleanup_expired_oauth_states');

    if (error) {
      console.error('Error cleaning up OAuth states:', error);
      throw error;
    }

    console.log('OAuth state cleanup completed successfully');

    // Log the security event
    await supabaseAdmin.rpc('log_security_event', {
      _user_id: null,
      _event_type: 'oauth_cleanup',
      _event_details: {
        timestamp: new Date().toISOString(),
        status: 'success'
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'OAuth states cleaned up successfully',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('OAuth cleanup error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
