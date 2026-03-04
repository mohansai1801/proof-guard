import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShieldCheck, ShieldX, QrCode, Hash, Building, CalendarDays, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";

interface VerifiedCert {
  certificateId: string;
  name: string;
  issuer: string;
  degree: string;
  date: string;
  txHash: string;
  ipfsHash: string | null;
  blockNumber: number | null;
}

type VerifyState = "idle" | "searching" | "verified" | "invalid";

const VerifierPortal = () => {
  const [code, setCode] = useState("");
  const [state, setState] = useState<VerifyState>("idle");
  const [result, setResult] = useState<VerifiedCert | null>(null);

  const handleVerify = async () => {
    if (!code.trim()) return;
    setState("searching");

    try {
      const { data, error } = await supabase.functions.invoke('verify-certificate', {
        body: { certificateId: code.trim() },
      });

      if (error) throw error;

      if (data.verified) {
        setResult(data.certificate);
        setState("verified");
      } else {
        setResult(null);
        setState("invalid");
      }
    } catch (e) {
      console.error('Verify failed:', e);
      setResult(null);
      setState("invalid");
    }
  };

  const reset = () => {
    setCode("");
    setState("idle");
    setResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Search Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 cyber-border-glow">
        <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
          <QrCode className="w-5 h-5 text-cyber-glow" />
          Verify QR / Code
        </h3>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter a certificate ID to verify its authenticity on the Polygon blockchain.
          </p>
          <div className="flex gap-3">
            <input type="text" value={code} onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              placeholder="e.g. PV-2025-00847"
              className="flex-1 bg-muted/50 border border-border rounded-md px-4 py-3 text-foreground font-mono text-sm focus:outline-none focus:border-cyber-glow transition-colors" />
            <button onClick={handleVerify} disabled={!code.trim() || state === "searching"}
              className="px-6 py-3 rounded-md bg-primary hover:bg-primary/80 text-primary-foreground font-display font-semibold tracking-wider uppercase transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_20px_hsl(195,100%,50%,0.3)]">
              {state === "searching" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground font-mono">Enter the Certificate ID from the admin panel</p>
        </div>
      </motion.div>

      {/* Result */}
      <AnimatePresence mode="wait">
        {state === "searching" && (
          <motion.div key="searching" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="glass-card p-8 flex flex-col items-center space-y-3">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-cyber-glow/30 border-t-cyber-glow animate-spin" />
            </div>
            <p className="font-display text-sm tracking-wider cyber-glow">Querying Polygon Ledger...</p>
            <p className="text-xs text-muted-foreground font-mono">Verifying on-chain data integrity</p>
          </motion.div>
        )}

        {state === "verified" && result && (
          <motion.div key="verified" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="glass-card p-6 space-y-5">
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}
              className="flex items-center gap-3 p-4 rounded-md bg-success/10 border border-success/30">
              <ShieldCheck className="w-10 h-10 text-success flex-shrink-0" />
              <div>
                <p className="font-display font-bold text-lg text-success">Blockchain Verified ✓</p>
                <p className="text-sm text-muted-foreground">This credential is authentic and recorded on Polygon</p>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="p-3 rounded-md bg-muted/20 border border-border/50">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Building className="w-3 h-3" /> Issuer</div>
                  <p className="font-medium">{result.issuer}</p>
                </div>
                <div className="p-3 rounded-md bg-muted/20 border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Recipient</p>
                  <p className="font-medium">{result.name}</p>
                </div>
                <div className="p-3 rounded-md bg-muted/20 border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Credential</p>
                  <p className="font-medium">{result.degree}</p>
                </div>
                <div className="p-3 rounded-md bg-muted/20 border border-border/50">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><CalendarDays className="w-3 h-3" /> Issue Date</div>
                  <p className="font-medium">{result.date}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-md bg-muted/20 border border-border/50">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Hash className="w-3 h-3" /> Transaction Hash</div>
                  <p className="font-mono text-xs text-cyber-glow break-all">{result.txHash}</p>
                </div>
                {result.blockNumber && (
                  <div className="p-3 rounded-md bg-muted/20 border border-border/50">
                    <p className="text-xs text-muted-foreground mb-1">Block Number</p>
                    <p className="font-mono text-sm text-cyber-glow">{result.blockNumber.toLocaleString()}</p>
                  </div>
                )}
                <div className="flex items-center justify-center p-4 rounded-md bg-muted/20 border border-border/50">
                  <QRCodeSVG value={`https://proofvault.io/verify/${result.certificateId}`}
                    size={140} bgColor="transparent" fgColor="hsl(195, 100%, 50%)" level="M" />
                </div>
              </div>
            </div>

            <button onClick={reset}
              className="w-full py-2 rounded-md border border-border hover:border-cyber-glow/50 text-foreground font-display text-sm tracking-wider uppercase transition-all duration-300">
              Verify Another
            </button>
          </motion.div>
        )}

        {state === "invalid" && (
          <motion.div key="invalid" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-md bg-destructive/10 border border-destructive/30">
              <ShieldX className="w-10 h-10 text-destructive flex-shrink-0" />
              <div>
                <p className="font-display font-bold text-lg text-destructive">Not Found on Blockchain</p>
                <p className="text-sm text-muted-foreground">No matching credential exists on the Polygon ledger for "{code}"</p>
              </div>
            </div>
            <button onClick={reset}
              className="w-full py-2 rounded-md border border-border hover:border-cyber-glow/50 text-foreground font-display text-sm tracking-wider uppercase transition-all duration-300">
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VerifierPortal;
