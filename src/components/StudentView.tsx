import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock, Clock, FileText, ExternalLink, ShieldCheck, Loader2, Eye, Key, Copy, LogIn } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "@/hooks/use-toast";
import { generateOTP, getOTPTimeRemaining } from "@/lib/otp";
import logoImg from "@/assets/Proof_Vault.png";

const TIMER_DURATION = 30 * 60; // 30 minutes
const MOCK_AUTH_CODE = "123456";

// Mock certificate for instant demo
const MOCK_CERTIFICATE = {
  certificateId: "PV-2026-48050",
  recipientName: "Alex Johnson",
  degree: "B.Tech Computer Science",
  institution: "MIT University",
  gpa: "3.87",
  issueDate: "2026-03-04",
  txHash: "0x7a3b8c9d2e1f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8b9c",
  blockNumber: 52847291,
  ipfsHash: "QmX7bVbzU4rYjKnLp5e3hDiPmC4kWjqYbFnDqK9aVdW8Xc",
  authCode: MOCK_AUTH_CODE,
};

const StudentView = () => {
  const [studentId, setStudentId] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [code, setCode] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [error, setError] = useState(false);
  const [currentOTP, setCurrentOTP] = useState("");
  const [otpTimeLeft, setOtpTimeLeft] = useState(0);

  const certificate = MOCK_CERTIFICATE;

  // Student ID login (mock)
  const handleLogin = () => {
    if (!studentId.trim()) return;
    setLoggedIn(true);
    toast({ title: "Welcome!", description: `Logged in as ${studentId}` });
  };

  // Auth code unlock (mock: 123456)
  const handleUnlock = () => {
    if (code.length !== 6) return;
    setLoading(true);
    setError(false);

    // Simulate 1s network delay for realism
    setTimeout(() => {
      if (code === MOCK_AUTH_CODE) {
        setUnlocked(true);
        setTimeLeft(TIMER_DURATION);
        toast({ title: "Access Granted", description: "Certificate unlocked — 30 min session active" });
      } else {
        setError(true);
        setTimeout(() => setError(false), 2000);
      }
      setLoading(false);
    }, 800);
  };

  const lockCertificate = useCallback(() => {
    setUnlocked(false);
    setCode("");
    setTimeLeft(TIMER_DURATION);
    setCurrentOTP("");
  }, []);

  // 30-minute countdown
  useEffect(() => {
    if (!unlocked) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { lockCertificate(); return TIMER_DURATION; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [unlocked, lockCertificate]);

  // OTP rotation
  useEffect(() => {
    if (!unlocked) return;
    const updateOTP = () => {
      const otp = generateOTP(certificate.certificateId, certificate.authCode);
      setCurrentOTP(otp);
      setOtpTimeLeft(getOTPTimeRemaining());
    };
    updateOTP();
    const interval = setInterval(updateOTP, 1000);
    return () => clearInterval(interval);
  }, [unlocked]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const timerPercent = (timeLeft / TIMER_DURATION) * 100;
  const otpPercent = (otpTimeLeft / 300) * 100;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied!` });
  };

  // Student ID Login Screen
  if (!loggedIn) {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto glass-surface-elevated p-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-highlight/15 to-highlight-secondary/10 border border-highlight/15 flex items-center justify-center mx-auto">
            <LogIn className="w-7 h-7 text-highlight" />
          </div>
          <h3 className="font-heading text-xl font-semibold">Student Personal Vault</h3>
          <p className="text-sm text-muted-foreground">Enter your Student ID to access your certificates</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="data-label">Student ID</label>
            <input type="text" value={studentId} onChange={(e) => setStudentId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="e.g. STU-2026-001"
              className="input-field" />
          </div>
          <button onClick={handleLogin} disabled={!studentId.trim()}
            className="w-full py-3.5 btn-primary flex items-center justify-center gap-2">
            <LogIn className="w-4 h-4" /> Access Vault
          </button>
          <p className="text-[11px] text-muted-foreground text-center">Enter any Student ID for demo purposes</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Auth Code Card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="glass-surface-elevated p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
            unlocked
              ? "bg-success/15 border border-success/20"
              : "bg-gradient-to-br from-highlight/15 to-highlight-secondary/10 border border-highlight/15"
          }`}>
            {unlocked ? <Unlock className="w-5 h-5 text-success" /> : <Lock className="w-5 h-5 text-highlight" />}
          </div>
          <div>
            <h3 className="font-heading text-lg font-semibold">
              {unlocked ? "Temporary Access Active" : "Certificate Locked"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {unlocked ? "Your certificate is visible to verifiers" : "Enter your 6-digit auth code to reveal certificate"}
            </p>
          </div>
        </div>

        <div className="divider-gradient mb-5" />

        {!unlocked ? (
          <div className="space-y-4">
            <div className="flex gap-3">
              <input type="text" maxLength={6} value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                placeholder="● ● ● ● ● ●"
                className={`flex-1 input-mono text-center text-xl tracking-[0.5em] py-4 ${
                  error ? "!border-destructive !shadow-destructive/10" : ""
                }`}
              />
              <button onClick={handleUnlock} disabled={code.length !== 6 || loading}
                className="px-8 btn-primary">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Unlock"}
              </button>
            </div>
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="badge-error w-fit">
                  ✕ Invalid authentication code
                </motion.div>
              )}
            </AnimatePresence>
            <p className="text-[11px] text-muted-foreground">
              💡 For demo: enter <span className="font-mono text-highlight">123456</span> — Access expires after 30 minutes.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-xl bg-success/5 border border-success/15">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-success" />
                <span className="text-sm font-semibold text-success">Temporary Access Active</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm font-mono">
                  <Clock className="w-4 h-4 text-warning" />
                  <span className={`${timerPercent < 20 ? "text-destructive" : "text-warning"} font-semibold`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
                <button onClick={lockCertificate} className="text-xs px-3 py-1.5 btn-ghost !rounded-lg">
                  Re-lock
                </button>
              </div>
            </div>
            <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-success to-success/50"
                initial={{ width: "100%" }} animate={{ width: `${timerPercent}%` }} transition={{ duration: 1 }} />
            </div>
          </div>
        )}
      </motion.div>

      {/* OTP Card */}
      {unlocked && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-surface-elevated p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warning/15 to-warning/5 border border-warning/20 flex items-center justify-center">
              <Key className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold">Verification OTP</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Share this code with the verifier when asked</p>
            </div>
          </div>
          <div className="divider-gradient mb-5" />
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <p className="font-mono text-4xl tracking-[0.6em] text-warning font-bold">{currentOTP}</p>
              <button onClick={() => copyToClipboard(currentOTP, "OTP")}
                className="p-2 rounded-lg hover:bg-warning/10 transition-colors">
                <Copy className="w-4 h-4 text-warning/70" />
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-mono text-muted-foreground">Refreshes in {formatTime(otpTimeLeft)}</span>
              </div>
              <div className="w-48 mx-auto h-1 rounded-full bg-muted overflow-hidden">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-warning to-warning/50"
                  animate={{ width: `${otpPercent}%` }} transition={{ duration: 1 }} />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              This OTP changes every 5 minutes. The verifier needs this + your certificate QR.
            </p>
          </div>
        </motion.div>
      )}

      {/* Certificate Card with Blur */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="glass-surface-elevated overflow-hidden relative">
        {!unlocked && <div className="absolute inset-0 z-10 scan-line" />}

        <div className={`p-6 sm:p-8 transition-all duration-700 ${!unlocked ? "blur-lg select-none pointer-events-none" : ""}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img src={logoImg} alt="Proof Vault" className="h-8 object-contain" />
              <h3 className="font-heading text-lg font-semibold">Digital Certificate</h3>
            </div>
            <div className="badge-success">
              <ShieldCheck className="w-3 h-3" /> Blockchain Verified
            </div>
          </div>

          <div className="divider-gradient mb-6" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Certificate details */}
            <div className="md:col-span-2 space-y-4">
              <div className="text-center py-3">
                <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-mono">Polygon Blockchain Credential</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Recipient", value: certificate.recipientName },
                  { label: "Degree", value: certificate.degree },
                  { label: "Institution", value: certificate.institution },
                  { label: "Issue Date", value: certificate.issueDate },
                  { label: "Certificate ID", value: certificate.certificateId, highlight: true },
                  { label: "GPA", value: certificate.gpa },
                ].map((item) => (
                  <div key={item.label} className="data-cell">
                    <p className="data-label">{item.label}</p>
                    <p className={item.highlight ? "data-value-highlight text-xs" : "data-value"}>
                      {item.value || "—"}
                    </p>
                  </div>
                ))}
              </div>

              <div className="data-cell">
                <p className="data-label">Transaction Hash</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-xs text-highlight/60 break-all leading-relaxed flex-1">{certificate.txHash}</p>
                  <a href={`https://amoy.polygonscan.com/tx/${certificate.txHash}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-highlight/70 hover:text-highlight transition-colors flex-shrink-0">
                    <ExternalLink className="w-3 h-3" />
                    <span>PolygonScan</span>
                  </a>
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="p-5 rounded-2xl bg-background/50 border border-border/30">
                <QRCodeSVG value={`proofvault://verify/${certificate.certificateId}`}
                  size={140} bgColor="transparent" fgColor="hsl(210, 100%, 56%)" level="M" />
              </div>
              <p className="text-[10px] text-muted-foreground text-center font-mono">
                Scan to Verify
              </p>
            </div>
          </div>
        </div>

        {/* Locked overlay */}
        {!unlocked && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/30 backdrop-blur-sm">
            <motion.div animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-muted/30 border border-border/40 backdrop-blur flex items-center justify-center">
                <Eye className="w-7 h-7 text-muted-foreground/50" />
              </div>
              <div className="text-center">
                <p className="text-sm font-heading font-semibold text-muted-foreground">Certificate Locked</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Enter auth code above to reveal</p>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default StudentView;
