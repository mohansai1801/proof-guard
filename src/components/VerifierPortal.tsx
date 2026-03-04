import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShieldCheck, ShieldX, QrCode, Hash, Building, CalendarDays, Loader2, ArrowRight, RotateCcw } from "lucide-react";
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

  const reset = () => { setCode(""); setState("idle"); setResult(null); };

  return (
    <div className="space-y-6">
      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="glass-surface-elevated p-6 sm:p-8">

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-highlight to-highlight-secondary flex items-center justify-center shadow-lg shadow-highlight/15">
            <Search className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-semibold">Verify Credential</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Check authenticity against the Polygon blockchain</p>
          </div>
        </div>

        <div className="divider-gradient mb-5" />

        <div className="space-y-4">
          <div className="flex gap-3">
            <input type="text" value={code} onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              placeholder="Enter Certificate ID (e.g. PV-2026-48050)"
              className="flex-1 input-mono" />
            <button onClick={handleVerify} disabled={!code.trim() || state === "searching"}
              className="px-6 btn-primary flex items-center gap-2">
              {state === "searching"
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : <><Search className="w-4 h-4" /><span className="hidden sm:inline">Verify</span></>}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Enter the Certificate ID to verify its authenticity and view on-chain details.
          </p>
        </div>
      </motion.div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {state === "searching" && (
          <motion.div key="searching" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="glass-surface-elevated p-12 flex flex-col items-center space-y-5">
            <div className="w-12 h-12 rounded-full border-2 border-highlight/20 border-t-highlight animate-spin" />
            <div className="text-center">
              <h4 className="font-heading text-base font-semibold">Querying Blockchain...</h4>
              <p className="text-xs text-muted-foreground mt-1.5 font-mono">Verifying on-chain data integrity</p>
            </div>
          </motion.div>
        )}

        {state === "verified" && result && (
          <motion.div key="verified" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="glass-surface-elevated p-6 sm:p-8 space-y-6">

            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              className="flex items-center gap-4 p-5 rounded-xl bg-success/6 border border-success/15">
              <div className="w-12 h-12 rounded-xl bg-success/15 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-6 h-6 text-success" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-lg text-success">Blockchain Verified</h4>
                <p className="text-sm text-muted-foreground mt-0.5">This credential is authentic and recorded on Polygon</p>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-3">
                {[
                  { icon: Building, label: "Issuing Institution", value: result.issuer },
                  { label: "Recipient Name", value: result.name },
                  { label: "Credential Type", value: result.degree },
                  { icon: CalendarDays, label: "Date Issued", value: result.date },
                ].map((item) => (
                  <div key={item.label} className="data-cell">
                    <div className="flex items-center gap-1.5">
                      {item.icon && <item.icon className="w-3 h-3 text-muted-foreground" />}
                      <p className="data-label !mb-0">{item.label}</p>
                    </div>
                    <p className="data-value mt-1.5">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="data-cell">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Hash className="w-3 h-3 text-muted-foreground" />
                    <p className="data-label !mb-0">Transaction Hash</p>
                  </div>
                  <p className="font-mono text-xs text-highlight/70 break-all leading-relaxed">{result.txHash}</p>
                </div>
                {result.blockNumber && (
                  <div className="data-cell">
                    <p className="data-label">Block Number</p>
                    <p className="data-value-highlight">{result.blockNumber.toLocaleString()}</p>
                  </div>
                )}
                <div className="data-cell flex items-center justify-center py-6">
                  <div className="p-4 rounded-xl bg-background/50 border border-border/30">
                    <QRCodeSVG value={`https://proofvault.io/verify/${result.certificateId}`}
                      size={120} bgColor="transparent" fgColor="hsl(210, 100%, 56%)" level="M" />
                  </div>
                </div>
              </div>
            </div>

            <button onClick={reset} className="w-full py-3 btn-ghost flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Verify Another Credential
            </button>
          </motion.div>
        )}

        {state === "invalid" && (
          <motion.div key="invalid" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="glass-surface-elevated p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-4 p-5 rounded-xl bg-destructive/6 border border-destructive/15">
              <div className="w-12 h-12 rounded-xl bg-destructive/15 flex items-center justify-center flex-shrink-0">
                <ShieldX className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-lg text-destructive">Not Found</h4>
                <p className="text-sm text-muted-foreground mt-0.5">
                  No matching credential exists on the Polygon blockchain for <span className="font-mono text-foreground/70">"{code}"</span>
                </p>
              </div>
            </div>
            <button onClick={reset} className="w-full py-3 btn-ghost flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VerifierPortal;
