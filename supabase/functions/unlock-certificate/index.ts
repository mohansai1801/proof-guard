import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { authCode } = await req.json();

    if (!authCode || authCode.length !== 6) {
      return new Response(JSON.stringify({ success: false, error: 'Valid 6-digit auth code required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Look up certificate by auth code
    const { data: cert, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('auth_code', authCode)
      .eq('status', 'minted')
      .single();

    if (error || !cert) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid authentication code',
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      certificate: {
        certificateId: cert.certificate_id,
        recipientName: cert.recipient_name,
        degree: cert.degree,
        institution: cert.institution,
        gpa: cert.gpa,
        issueDate: cert.issue_date,
        ipfsHash: cert.ipfs_hash,
        ipfsUrl: cert.ipfs_url,
        txHash: cert.tx_hash,
        blockNumber: cert.polygon_block_number,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Unlock error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
