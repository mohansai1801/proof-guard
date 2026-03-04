import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShieldCheck, ShieldX, QrCode, Hash, Building, CalendarDays, Loader2, RotateCcw, KeyRound, Clock, ArrowRight } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";

interface VerifiedCert {
  certificateId: string;
  name: string;
  issuer: string;
  degree: string;
  gpa: string | null;
  date: string;
  txHash: string;
  ipfsHash: string | null;
  blockNumber: number | null;
}

type VerifyState = "idle" | "enter-otp" | "searching" | "verified" | "invalid";

const RESULT_DURATION = 10 * 60; // 10 minutes

const VerifierPortal = () => {
  const [certCode, setCertCode] = useState("");
  const [otp, setOtp] = useState("");
  const [state, setState] = useState<VerifyState>("idle");
  const [result, setResult] = useState<VerifiedCert | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [viewTimer, setViewTimer] = useState(RESULT_DURATION);

  const handleCertSubmit = () => {
    if (!certCode.trim()) return;
    setState("enter-otp");
  };

  const handleVerify = async () => {
    if (!otp.trim() || otp.length !== 6) return;
    setState("searching");
    setErrorMsg("");
    try {
      const { data, error } = await supabase.functions.invoke('verify-with-otp', {
        body: { certificateId: certCode.trim(), otp: otp.trim() },
      });
      if (error) throw error;
      if (data.verified) {
        setResult(data.certificate);
        setState("verified");
        // Start view timer
        setViewTimer(RESULT_DURATION);
        const interval = setInterval(() => {
          setViewTimer((prev) => {
            if (prev <= 1) { clearInterval(interval); reset(); return 0; }
            return prev - 1;
          });
        }, 1000);
      } else {
        setErrorMsg(data.error || "Verification failed");
        setState("invalid");
      }
    } catch (e) {
      console.error('Verify failed:', e);
      setErrorMsg("Network error");
      setState("invalid");
    }
  };

  const reset = () => { setCertCode(""); setOtp(""); setState("idle"); setResult(null); setErrorMsg(""); };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Enter Certificate ID */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="glass-surface-elevated p-6 sm:p-8">

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-highlight to-highlight-secondary flex items-center justify-center shadow-lg shadow-highlight/15">
            <Search className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-semibold">Verify Credential</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Scan QR or enter Certificate ID, then verify with student's OTP</p>
          </div>
        </div>

        <div className="divider-gradient mb-5" />

        <AnimatePresence mode="wait">
          {(state === "idle" || state === "enter-otp" || state === "searching") && (
            <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="space-y-5">
              {/* Certificate ID input */}
              <div>
                <label className="data-label">Step 1: Certificate ID</label>
                <div className="flex gap-3">
                  <input type="text" value={certCode} onChange={(e) => setCertCode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCertSubmit()}
                    placeholder="Enter Certificate ID (e.g. PV-2026-48050)"
                    disabled={state !== "idle"}
                    className="flex-1 input-mono" />
                  {state === "idle" && (
                    <button onClick={handleCertSubmit} disabled={!certCode.trim()}
                      className="px-6 btn-primary flex items-center gap-2">
                      <ArrowRight className="w-4 h-4" />
                      <span className="hidden sm:inline">Next</span>
                    </button>
                  )}
                </div>
              </div>

              {/* OTP input - shown after cert ID */}
              {(state === "enter-otp" || state === "searching") && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <label className="data-label">Step 2: Student's OTP</label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Ask the student to open their Student Portal and share their current 6-digit OTP
                  </p>
                  <div className="flex gap-3">
                    <input type="text" maxLength={6} value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                      placeholder="● ● ● ● ● ●"
                      className="flex-1 input-mono text-center text-xl tracking-[0.5em] py-4" />
                    <button onClick={handleVerify} disabled={otp.length !== 6 || state === "searching"}
                      className="px-6 btn-primary flex items-center gap-2">
                      {state === "searching"
                        ? <Loader2 className="w-5 h-5 animate-spin" />
                        : <><KeyRound className="w-4 h-4" /><span className="hidden sm:inline">Verify</span></>}
                    </button>
                  </div>
                </motion.div>
              )}

              <div className="data-cell flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-highlight/50 animate-pulse-glow" />
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/70">Verification:</span> Certificate ID from QR + Student's rotating OTP
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {state === "verified" && result && (
          <motion.div key="verified" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="glass-surface-elevated p-6 sm:p-8 space-y-6">

            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              className="flex items-center gap-4 p-5 rounded-xl bg-success/6 border border-success/15">
              <div className="w-12 h-12 rounded-xl bg-success/15 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-6 h-6 text-success" />
              </div>
              <div className="flex-1">
                <h4 className="font-heading font-bold text-lg text-success">Blockchain Verified ✓</h4>
                <p className="text-sm text-muted-foreground mt-0.5">Certificate + OTP match confirmed on Polygon</p>
              </div>
              <div className="flex items-center gap-2 text-sm font-mono">
                <Clock className="w-4 h-4 text-warning" />
                <span className="text-warning font-semibold">{formatTime(viewTimer)}</span>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-3">
                {[
                  { icon: Building, label: "Issuing Institution", value: result.issuer },
                  { label: "Recipient Name", value: result.name },
                  { label: "Credential Type", value: result.degree },
                  { icon: CalendarDays, label: "Date Issued", value: result.date },
                  ...(result.gpa ? [{ label: "GPA", value: result.gpa }] : []),
                ].map((item) => (
                  <div key={item.label} className="data-cell">
                    <div className="flex items-center gap-1.5">
                      {'icon' in item && item.icon && <item.icon className="w-3 h-3 text-muted-foreground" />}
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
                    <QRCodeSVG value={`proofvault://verify/${result.certificateId}`}
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
                <h4 className="font-heading font-bold text-lg text-destructive">Verification Failed</h4>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {errorMsg || "The certificate ID and OTP combination could not be verified"}
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
