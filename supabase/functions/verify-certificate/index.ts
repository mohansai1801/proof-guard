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

    const { certificateId } = await req.json();

    if (!certificateId) {
      return new Response(JSON.stringify({ success: false, error: 'Certificate ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Look up certificate
    const { data: cert, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('certificate_id', certificateId.trim().toUpperCase())
      .single();

    // Log the verification attempt
    await supabase.from('verification_logs').insert({
      certificate_id: certificateId.trim().toUpperCase(),
      verification_result: !!cert && !error,
      metadata: { timestamp: new Date().toISOString() },
    });

    if (error || !cert) {
      return new Response(JSON.stringify({
        success: true,
        verified: false,
        message: 'No matching credential found on the Polygon ledger',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      verified: true,
      certificate: {
        certificateId: cert.certificate_id,
        name: cert.recipient_name,
        issuer: cert.institution,
        degree: cert.degree,
        date: cert.issue_date,
        txHash: cert.tx_hash,
        ipfsHash: cert.ipfs_hash,
        ipfsUrl: cert.ipfs_url,
        blockNumber: cert.polygon_block_number,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Verify error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
