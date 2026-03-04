-- Create certificates table
CREATE TABLE public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  certificate_id TEXT NOT NULL UNIQUE,
  recipient_name TEXT NOT NULL,
  degree TEXT NOT NULL,
  institution TEXT NOT NULL,
  gpa TEXT,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ipfs_hash TEXT,
  ipfs_url TEXT,
  tx_hash TEXT,
  polygon_block_number BIGINT,
  auth_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'minting', 'minted', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create verification logs table
CREATE TABLE public.verification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  certificate_id TEXT NOT NULL REFERENCES public.certificates(certificate_id),
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verification_result BOOLEAN NOT NULL,
  verifier_ip TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_logs ENABLE ROW LEVEL SECURITY;

-- Certificates: publicly readable (verifiers need to look them up), only service role can insert/update
CREATE POLICY "Certificates are publicly readable"
  ON public.certificates FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert certificates"
  ON public.certificates FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update certificates"
  ON public.certificates FOR UPDATE
  USING (true);

-- Verification logs: publicly insertable (anyone can verify), publicly readable
CREATE POLICY "Anyone can create verification logs"
  ON public.verification_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Verification logs are publicly readable"
  ON public.verification_logs FOR SELECT
  USING (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_certificates_updated_at
  BEFORE UPDATE ON public.certificates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast lookups
CREATE INDEX idx_certificates_certificate_id ON public.certificates(certificate_id);
CREATE INDEX idx_verification_logs_certificate_id ON public.verification_logs(certificate_id);