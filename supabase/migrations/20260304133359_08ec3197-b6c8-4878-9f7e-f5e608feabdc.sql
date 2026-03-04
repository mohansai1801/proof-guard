-- Drop overly permissive policies
DROP POLICY "Service role can insert certificates" ON public.certificates;
DROP POLICY "Service role can update certificates" ON public.certificates;
DROP POLICY "Anyone can create verification logs" ON public.verification_logs;

-- Certificates: only service role can insert/update (service role bypasses RLS)
-- No INSERT/UPDATE policy means only service_role can write
-- Verification logs: edge function uses service role to insert
-- We keep SELECT open for public reads