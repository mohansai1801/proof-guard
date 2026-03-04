import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShieldCheck, ShieldX, Hash, Building, CalendarDays, Loader2, RotateCcw, KeyRound, Clock, ArrowRight, ExternalLink, AlertTriangle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "@/hooks/use-toast";
import { verifyOTP } from "@/lib/otp";
import { getCertByCertificateId, isSessionActive, type MockCertificate } from "@/lib/mock-store";

type VerifyState = "idle" | "enter-otp" | "searching" | "verified" | "invalid" | "expired" | "no-session";

const RESULT_DURATION = 30 * 60;

const normalizeCertificateId = (input: string) => {
  const raw = input.trim();
  const extracted = raw.match(/PV-\d{4}-\d{5}/i)?.[0] ?? raw;
  return extracted.replace(/\s+/g, "").toUpperCase();
};

const VerifierPortal = () => {
  const [certCode, setCertCode] = useState("");
  const [otp, setOtp] = useState("");
  const [state, setState] = useState<VerifyState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [viewTimer, setViewTimer] = useState(RESULT_DURATION);
  const [verifiedCert, setVerifiedCert] = useState<MockCertificate | null>(null);

  const handleCertSubmit = () => {
    const normalizedCertId = normalizeCertificateId(certCode);
    if (!normalizedCertId) return;

    setCertCode(normalizedCertId);
    const cert = getCertByCertificateId(normalizedCertId);
    if (!cert) {
      setErrorMsg("No matching credential found on the Polygon ledger");
      setState("invalid");
      return;
    }

    // Check if student has an active session
    if (!isSessionActive(cert.certificateId)) {
      setState("no-session");
      return;
    }

    setState("enter-otp");
  };

  const handleVerify = () => {
    if (!otp.trim() || otp.length !== 6) return;
    setState("searching");
    setErrorMsg("");

    setTimeout(() => {
      const normalizedCertId = normalizeCertificateId(certCode);
      const cert = getCertByCertificateId(normalizedCertId);
      if (!cert) {
        setErrorMsg("No matching credential found");
        setState("invalid");
        return;
      }

      if (!isSessionActive(cert.certificateId)) {
        setState("expired");
        return;
      }

      const otpValid = verifyOTP(cert.certificateId, cert.authCode, otp.trim());

      if (otpValid) {
        setVerifiedCert(cert);
        setState("verified");
        setViewTimer(RESULT_DURATION);
        toast({ title: "✓ Credential Verified", description: "Certificate + OTP match confirmed on Polygon" });
      } else {
        setErrorMsg("OTP verification failed. The student's code may have expired or is invalid.");
        setState("invalid");
      }
    }, 2000);
  };

  // View timer countdown
  useEffect(() => {
    if (state !== "verified") return;
    const interval = setInterval(() => {
      setViewTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setState("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [state]);

  const reset = () => {
    setCertCode("");
    setOtp("");
    setState("idle");
    setErrorMsg("");
    setViewTimer(RESULT_DURATION);
    setVerifiedCert(null);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="glass-surface-elevated p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-highlight to-highlight-secondary flex items-center justify-center shadow-lg shadow-highlight/15">
            <Search className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-semibold">Verify Credential</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Scan QR code or enter Certificate ID, then verify with student's OTP</p>
          </div>
        </div>

        <div className="divider-gradient mb-5" />

        <AnimatePresence mode="wait">
          {(state === "idle" || state === "enter-otp" || state === "searching") && (
            <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="space-y-5">
              <div>
                <label className="data-label">Step 1: Scan or Enter Certificate ID</label>
                <div className="flex gap-3">
                  <input type="text" value={certCode} onChange={(e) => setCertCode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCertSubmit()}
                    placeholder="e.g. PV-2026-48050"
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

              {(state === "enter-otp" || state === "searching") && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <label className="data-label">Step 2: Enter Student's OTP</label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Ask the student to open their vault and share their current 6-digit OTP
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
                  <span className="font-medium text-foreground/70">Security:</span> Certificate ID + student's live OTP + active session required
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Verified Result Card */}
      <AnimatePresence mode="wait">
        {state === "verified" && verifiedCert && (
          <motion.div key="verified" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="glass-surface-elevated p-6 sm:p-8 space-y-6">

            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              className="flex items-center gap-4 p-5 rounded-xl bg-success/6 border border-success/15">
              <div className="w-12 h-12 rounded-xl bg-success/15 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-6 h-6 text-success" />
              </div>
              <div className="flex-1">
                <h4 className="font-heading font-bold text-lg text-success">Blockchain Verified ✓</h4>
                <p className="text-sm text-muted-foreground mt-0.5">Issuer: University Official • Blockchain Status: Immutable/Confirmed</p>
              </div>
              <div className="flex items-center gap-2 text-sm font-mono">
                <Clock className="w-4 h-4 text-warning" />
                <span className="text-warning font-semibold">{formatTime(viewTimer)}</span>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-3">
                {[
                  { icon: Building, label: "Issuing Institution", value: verifiedCert.institution },
                  { label: "Recipient Name", value: verifiedCert.recipientName },
                  { label: "Credential Type", value: verifiedCert.degree },
                  { icon: CalendarDays, label: "Date Issued", value: verifiedCert.issueDate },
                  { label: "GPA", value: verifiedCert.gpa },
                  { label: "Blockchain Status", value: "Immutable / Confirmed", highlight: true },
                ].map((item) => (
                  <div key={item.label} className="data-cell">
                    <div className="flex items-center gap-1.5">
                      {"icon" in item && item.icon && <item.icon className="w-3 h-3 text-muted-foreground" />}
                      <p className="data-label !mb-0">{item.label}</p>
                    </div>
                    <p className={`mt-1.5 ${"highlight" in item && item.highlight ? "data-value-highlight" : "data-value"}`}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="data-cell">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Hash className="w-3 h-3 text-muted-foreground" />
                    <p className="data-label !mb-0">Transaction Hash</p>
                  </div>
                  <p className="font-mono text-xs text-highlight/70 break-all leading-relaxed">{verifiedCert.txHash}</p>
                  <a href={`https://amoy.polygonscan.com/tx/${verifiedCert.txHash}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-xs text-highlight/70 hover:text-highlight transition-colors">
                    <ExternalLink className="w-3 h-3" /> View on PolygonScan
                  </a>
                </div>
                <div className="data-cell">
                  <p className="data-label">Block Number</p>
                  <p className="data-value-highlight">{verifiedCert.blockNumber.toLocaleString()}</p>
                </div>
                <div className="data-cell flex items-center justify-center py-6">
                  <div className="p-4 rounded-xl bg-background/50 border border-border/30">
                    <QRCodeSVG value={`proofvault://verify/${verifiedCert.certificateId}`}
                      size={120} bgColor="transparent" fgColor="hsl(160, 72%, 42%)" level="M" />
                  </div>
                </div>
              </div>
            </div>

            <button onClick={reset} className="w-full py-3 btn-ghost flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" /> Verify Another Credential
            </button>
          </motion.div>
        )}

        {/* No active session */}
        {state === "no-session" && (
          <motion.div key="no-session" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="glass-surface-elevated p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-4 p-5 rounded-xl bg-destructive/6 border border-destructive/15">
              <div className="w-12 h-12 rounded-xl bg-destructive/15 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-lg text-destructive">No Active Session</h4>
                <p className="text-sm text-muted-foreground mt-0.5">
                  The student has not unlocked this certificate yet. Ask them to open their vault and enter their auth code first.
                </p>
              </div>
            </div>
            <button onClick={reset} className="w-full py-3 btn-ghost flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" /> Try Again
            </button>
          </motion.div>
        )}

        {/* Expired */}
        {state === "expired" && (
          <motion.div key="expired" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="glass-surface-elevated p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-4 p-5 rounded-xl bg-destructive/6 border border-destructive/15">
              <div className="w-12 h-12 rounded-xl bg-destructive/15 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-lg text-destructive">Access Expired</h4>
                <p className="text-sm text-muted-foreground mt-0.5">
                  The 30-minute verification window has closed. Request a new code from the student.
                </p>
              </div>
            </div>
            <button onClick={reset} className="w-full py-3 btn-ghost flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" /> Start New Verification
            </button>
          </motion.div>
        )}

        {/* Invalid */}
        {state === "invalid" && (
          <motion.div key="invalid" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="glass-surface-elevated p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-4 p-5 rounded-xl bg-destructive/6 border border-destructive/15">
              <div className="w-12 h-12 rounded-xl bg-destructive/15 flex items-center justify-center flex-shrink-0">
                <ShieldX className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-lg text-destructive">Verification Failed</h4>
                <p className="text-sm text-muted-foreground mt-0.5">{errorMsg || "Could not verify credential"}</p>
              </div>
            </div>
            <button onClick={reset} className="w-full py-3 btn-ghost flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" /> Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VerifierPortal;
