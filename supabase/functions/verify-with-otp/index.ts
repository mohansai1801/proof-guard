import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const OTP_WINDOW_MS = 5 * 60 * 1000;

function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0x7fffffff;
  }
  return hash;
}

function verifyOTP(certId: string, authCode: string, otp: string): boolean {
  const now = Date.now();
  const currentWindow = Math.floor(now / OTP_WINDOW_MS);
  
  for (let offset = 0; offset >= -1; offset--) {
    const window = currentWindow + offset;
    const input = `${certId}:${authCode}:${window}`;
    const hash = djb2Hash(input);
    const expected = String(hash % 1000000).padStart(6, '0');
    if (expected === otp) return true;
  }
  return false;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { certificateId, otp } = await req.json();

    if (!certificateId || !otp) {
      return new Response(JSON.stringify({ verified: false, error: 'Missing certificateId or otp' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Look up certificate
    const { data: cert, error: dbError } = await supabase
      .from('certificates')
      .select('*')
      .eq('certificate_id', certificateId)
      .single();

    if (dbError || !cert) {
      // Log failed verification
      await supabase.from('verification_logs').insert({
        certificate_id: certificateId,
        verification_result: false,
        metadata: { reason: 'not_found' },
      });

      return new Response(JSON.stringify({ verified: false, error: 'Certificate not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify OTP
    const otpValid = verifyOTP(cert.certificate_id, cert.auth_code, otp);

    // Log verification attempt
    await supabase.from('verification_logs').insert({
      certificate_id: certificateId,
      verification_result: otpValid,
      metadata: { method: 'otp_verification', otp_valid: otpValid },
    });

    if (!otpValid) {
      return new Response(JSON.stringify({ verified: false, error: 'Invalid OTP' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      verified: true,
      certificate: {
        certificateId: cert.certificate_id,
        name: cert.recipient_name,
        degree: cert.degree,
        issuer: cert.institution,
        gpa: cert.gpa,
        date: cert.issue_date,
        txHash: cert.tx_hash,
        ipfsHash: cert.ipfs_hash,
        blockNumber: cert.polygon_block_number,
        status: cert.status,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Verify OTP error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ verified: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
