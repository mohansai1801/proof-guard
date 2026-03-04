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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-panel-elevated rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-lg bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/15">
            <QrCode className="w-5 h-5 text-cyber-glow" />
          </div>
          <div>
            <h3 className="font-display text-base sm:text-lg font-semibold tracking-wider">
              Verify QR / Code
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Authenticate credentials on-chain</p>
          </div>
        </div>

        <div className="section-divider mb-5" />

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter a certificate ID to verify its authenticity on the Polygon blockchain.
          </p>
          <div className="flex gap-3">
            <input type="text" value={code} onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              placeholder="e.g. PV-2025-00847"
              className="flex-1 glass-input px-4 py-3 text-foreground font-mono text-sm" />
            <button onClick={handleVerify} disabled={!code.trim() || state === "searching"}
              className="px-6 py-3 glow-btn text-sm">
              <span className="relative z-10">
                {state === "searching" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              </span>
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground font-mono tracking-wider">Enter the Certificate ID from the admin panel</p>
        </div>
      </motion.div>

      {/* Result */}
      <AnimatePresence mode="wait">
        {state === "searching" && (
          <motion.div key="searching" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="glass-panel-elevated rounded-2xl p-10 flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full border-2 border-cyber-glow/20 border-t-cyber-glow animate-spin" />
            </div>
            <p className="font-display text-sm tracking-wider cyber-glow">Querying Polygon Ledger...</p>
            <p className="text-[10px] text-muted-foreground font-mono tracking-wider">Verifying on-chain data integrity</p>
          </motion.div>
        )}

        {state === "verified" && result && (
          <motion.div key="verified" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="glass-panel-elevated rounded-2xl p-6 sm:p-8 space-y-6">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="flex items-center gap-3 p-5 rounded-xl bg-success/8 border border-success/20">
              <ShieldCheck className="w-10 h-10 text-success flex-shrink-0" />
              <div>
                <p className="font-display font-bold text-lg text-success tracking-wider">Blockchain Verified ✓</p>
                <p className="text-sm text-muted-foreground mt-0.5">This credential is authentic and recorded on Polygon</p>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                {[
                  { icon: Building, label: "Issuer", value: result.issuer },
                  { label: "Recipient", value: result.name },
                  { label: "Credential", value: result.degree },
                  { icon: CalendarDays, label: "Issue Date", value: result.date },
                ].map((item) => (
                  <div key={item.label} className="info-block">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono tracking-wider uppercase mb-1">
                      {item.icon && <item.icon className="w-3 h-3" />}
                      {item.label}
                    </div>
                    <p className="font-medium text-sm">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="info-block">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono tracking-wider uppercase mb-1">
                    <Hash className="w-3 h-3" /> Transaction Hash
                  </div>
                  <p className="font-mono text-xs text-cyber-glow/80 break-all">{result.txHash}</p>
                </div>
                {result.blockNumber && (
                  <div className="info-block">
                    <p className="text-[10px] text-muted-foreground font-mono tracking-wider uppercase mb-1">Block Number</p>
                    <p className="font-mono text-sm text-cyber-glow">{result.blockNumber.toLocaleString()}</p>
                  </div>
                )}
                <div className="info-block flex items-center justify-center p-6">
                  <div className="p-3 rounded-xl bg-background/30">
                    <QRCodeSVG value={`https://proofvault.io/verify/${result.certificateId}`}
                      size={130} bgColor="transparent" fgColor="hsl(195, 100%, 60%)" level="M" />
                  </div>
                </div>
              </div>
            </div>

            <button onClick={reset}
              className="w-full py-3 rounded-xl border border-border/60 hover:border-cyber-glow/30 text-foreground font-display text-sm tracking-wider uppercase transition-all duration-300 hover:bg-muted/20">
              Verify Another
            </button>
          </motion.div>
        )}

        {state === "invalid" && (
          <motion.div key="invalid" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="glass-panel-elevated rounded-2xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-3 p-5 rounded-xl bg-destructive/8 border border-destructive/20">
              <ShieldX className="w-10 h-10 text-destructive flex-shrink-0" />
              <div>
                <p className="font-display font-bold text-lg text-destructive tracking-wider">Not Found on Blockchain</p>
                <p className="text-sm text-muted-foreground mt-0.5">No matching credential exists on the Polygon ledger for "{code}"</p>
              </div>
            </div>
            <button onClick={reset}
              className="w-full py-3 rounded-xl border border-border/60 hover:border-cyber-glow/30 text-foreground font-display text-sm tracking-wider uppercase transition-all duration-300 hover:bg-muted/20">
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VerifierPortal;
