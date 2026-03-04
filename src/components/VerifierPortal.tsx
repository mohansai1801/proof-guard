import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShieldCheck, ShieldX, Hash, Building, CalendarDays, Loader2, RotateCcw, KeyRound, Clock, ArrowRight, ExternalLink, AlertTriangle, Award } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "@/hooks/use-toast";
import { verifyOTP } from "@/lib/otp";
import { getCertByCertificateId, isSessionActive, type MockCertificate } from "@/lib/mock-store";

type VerifyState = "idle" | "enter-otp" | "searching" | "verified" | "invalid" | "expired" | "no-session";

const RESULT_DURATION = 10 * 60; // 10 minutes

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
            className="space-y-6">

            {/* Status banner */}
            <div className="glass-surface-elevated p-5">
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
                className="flex items-center gap-4 p-5 rounded-xl bg-success/6 border border-success/15">
                <div className="w-12 h-12 rounded-xl bg-success/15 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-6 h-6 text-success" />
                </div>
                <div className="flex-1">
                  <h4 className="font-heading font-bold text-lg text-success">Blockchain Verified ✓</h4>
                  <p className="text-sm text-muted-foreground mt-0.5">Issuer: University Official • Blockchain Status: Immutable/Confirmed</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-sm font-mono">
                    <Clock className="w-4 h-4 text-warning" />
                    <span className={`${viewTimer < 120 ? "text-destructive" : "text-warning"} font-semibold`}>{formatTime(viewTimer)}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Auto-expires</p>
                </div>
              </motion.div>
              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden mt-4">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-success to-success/50"
                  animate={{ width: `${(viewTimer / RESULT_DURATION) * 100}%` }} transition={{ duration: 1 }} />
              </div>
            </div>

            {/* Certificate Image Card — visual diploma style */}
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
              className="relative overflow-hidden rounded-2xl border-2 border-success/20 shadow-2xl shadow-success/5"
              style={{ userSelect: "none" }}>
              {/* Certificate visual */}
              <div className="bg-gradient-to-br from-[hsl(220,20%,12%)] via-[hsl(220,18%,14%)] to-[hsl(220,22%,10%)] p-8 sm:p-10">
                {/* Decorative border */}
                <div className="border-2 border-highlight/15 rounded-xl p-6 sm:p-8 relative">
                  {/* Corner accents */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-success/40 rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-success/40 rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-success/40 rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-success/40 rounded-br-xl" />

                  {/* Header */}
                  <div className="text-center space-y-3 mb-8">
                    <div className="flex items-center justify-center gap-2">
                      <Award className="w-6 h-6 text-success" />
                      <p className="text-[10px] uppercase tracking-[0.3em] text-success font-mono font-semibold">Blockchain Verified Certificate</p>
                      <Award className="w-6 h-6 text-success" />
                    </div>
                    <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">{verifiedCert.institution}</h2>
                    <div className="w-24 h-[2px] mx-auto bg-gradient-to-r from-transparent via-highlight to-transparent" />
                  </div>

                  {/* Body */}
                  <div className="text-center space-y-4 mb-8">
                    <p className="text-sm text-muted-foreground">This is to certify that</p>
                    <h3 className="font-heading text-xl sm:text-2xl font-bold text-highlight">{verifiedCert.recipientName}</h3>
                    <p className="text-sm text-muted-foreground">has been awarded the degree of</p>
                    <h4 className="font-heading text-lg sm:text-xl font-semibold text-foreground">{verifiedCert.degree}</h4>
                    {verifiedCert.gpa && (
                      <p className="text-sm text-muted-foreground">with a GPA of <span className="text-foreground font-semibold">{verifiedCert.gpa}</span></p>
                    )}
                  </div>

                  {/* Footer details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    {[
                      { label: "Certificate ID", value: verifiedCert.certificateId },
                      { label: "Issue Date", value: verifiedCert.issueDate },
                      { label: "Block #", value: verifiedCert.blockNumber.toLocaleString() },
                      { label: "Status", value: "Immutable" },
                    ].map((item) => (
                      <div key={item.label} className="space-y-1">
                        <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-mono">{item.label}</p>
                        <p className="text-xs font-semibold text-foreground/80 font-mono">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Tx Hash */}
                  <div className="mt-6 pt-4 border-t border-border/20 text-center">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-mono mb-1">Transaction Hash</p>
                    <p className="font-mono text-[10px] text-highlight/50 break-all leading-relaxed">{verifiedCert.txHash}</p>
                    <a href={`https://amoy.polygonscan.com/tx/${verifiedCert.txHash}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-[10px] text-highlight/60 hover:text-highlight transition-colors">
                      <ExternalLink className="w-3 h-3" /> View on PolygonScan
                    </a>
                  </div>

                  {/* QR code */}
                  <div className="flex justify-center mt-6">
                    <div className="p-3 rounded-xl bg-background/30 border border-border/20">
                      <QRCodeSVG value={`proofvault://verify/${verifiedCert.certificateId}`}
                        size={80} bgColor="transparent" fgColor="hsl(160, 72%, 42%)" level="M" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Watermark overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03]">
                <p className="font-heading text-[80px] font-bold rotate-[-30deg] text-foreground whitespace-nowrap">PROOF VAULT</p>
              </div>
            </motion.div>

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
                  The 10-minute viewing window has closed. Request a new verification from the student.
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
