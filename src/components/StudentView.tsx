import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ExternalLink, ShieldCheck, Key, Copy, LogIn, LogOut, FileText, ArrowLeft } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "@/hooks/use-toast";
import { generateOTP, getOTPTimeRemaining } from "@/lib/otp";
import {
  getCertsByStudentId,
  validateStudentLogin,
  startSession,
  endSession,
  subscribe,
  type MockCertificate,
} from "@/lib/mock-store";
import logoImg from "@/assets/Proof_Vault.png";

const TIMER_DURATION = 30 * 60; // 30 minutes

const StudentView = () => {
  const [studentId, setStudentId] = useState("");
  const [passcode, setPasscode] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [myCerts, setMyCerts] = useState<MockCertificate[]>([]);
  const [selectedCert, setSelectedCert] = useState<MockCertificate | null>(null);
  const [currentOTP, setCurrentOTP] = useState("");
  const [otpTimeLeft, setOtpTimeLeft] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);

  // Re-sync certs from store
  useEffect(() => {
    if (!loggedIn) return;
    const update = () => setMyCerts(getCertsByStudentId(studentId));
    update();
    return subscribe(update);
  }, [loggedIn, studentId]);

  // When a certificate is selected, immediately start session + OTP
  useEffect(() => {
    if (!selectedCert) return;
    startSession(selectedCert.certificateId);
    setTimeLeft(TIMER_DURATION);
    return () => {
      endSession(selectedCert.certificateId);
    };
  }, [selectedCert]);

  // 30-minute countdown
  useEffect(() => {
    if (!selectedCert) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          goBack();
          toast({ title: "Session Expired", description: "Your 30-minute access window has closed." });
          return TIMER_DURATION;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedCert]);

  // OTP rotation
  useEffect(() => {
    if (!selectedCert) return;
    const updateOTP = () => {
      setCurrentOTP(generateOTP(selectedCert.certificateId, selectedCert.authCode));
      setOtpTimeLeft(getOTPTimeRemaining());
    };
    updateOTP();
    const interval = setInterval(updateOTP, 1000);
    return () => clearInterval(interval);
  }, [selectedCert]);

  const handleLogin = () => {
    if (!studentId.trim() || !passcode.trim()) return;
    if (validateStudentLogin(studentId, passcode)) {
      setLoggedIn(true);
      setLoginError("");
      toast({ title: "Welcome!", description: `Logged in as ${studentId}` });
    } else {
      setLoginError("Invalid Student ID or passcode");
    }
  };

  const handleLogout = () => {
    if (selectedCert) endSession(selectedCert.certificateId);
    setLoggedIn(false);
    setStudentId("");
    setPasscode("");
    setSelectedCert(null);
  };

  const goBack = () => {
    if (selectedCert) endSession(selectedCert.certificateId);
    setSelectedCert(null);
  };

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

  // --- LOGIN SCREEN ---
  if (!loggedIn) {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto glass-surface-elevated p-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-highlight/15 to-highlight-secondary/10 border border-highlight/15 flex items-center justify-center mx-auto">
            <LogIn className="w-7 h-7 text-highlight" />
          </div>
          <h3 className="font-heading text-xl font-semibold">Student Personal Vault</h3>
          <p className="text-sm text-muted-foreground">Enter your Student ID and passcode to access your certificates</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="data-label">Student ID</label>
            <input type="text" value={studentId} onChange={(e) => setStudentId(e.target.value)}
              placeholder="e.g. STU-2026-001" className="input-field" />
          </div>
          <div>
            <label className="data-label">Passcode</label>
            <input type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Enter passcode" className="input-field" />
          </div>
          {loginError && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="badge-error w-fit">
              ✕ {loginError}
            </motion.div>
          )}
          <button onClick={handleLogin} disabled={!studentId.trim() || !passcode.trim()}
            className="w-full py-3.5 btn-primary flex items-center justify-center gap-2">
            <LogIn className="w-4 h-4" /> Access Vault
          </button>
          <p className="text-[11px] text-muted-foreground text-center">
            Demo: <span className="font-mono text-highlight">STU-2026-001</span> / <span className="font-mono text-highlight">pass123</span>
          </p>
        </div>
      </motion.div>
    );
  }

  // --- CERTIFICATE LIST ---
  if (!selectedCert) {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="glass-surface-elevated p-6 sm:p-8">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-highlight/15 to-highlight-secondary/10 border border-highlight/15 flex items-center justify-center">
                <FileText className="w-5 h-5 text-highlight" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold">My Certificates</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Issued to {studentId}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 btn-ghost text-xs">
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
          <div className="divider-gradient mb-5" />

          {myCerts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No certificates issued to this Student ID yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myCerts.filter(c => c.status === "Anchored").map((cert, i) => (
                <motion.button key={cert.certificateId}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  onClick={() => setSelectedCert(cert)}
                  className="w-full text-left p-4 rounded-xl bg-muted/10 border border-border/30 hover:border-highlight/20 hover:bg-muted/20 transition-all duration-200 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{cert.degree}</p>
                      <p className="text-xs text-muted-foreground mt-1">{cert.institution} • {cert.issueDate}</p>
                    </div>
                    <span className="badge-success text-[10px]"><ShieldCheck className="w-3 h-3" /> Anchored</span>
                  </div>
                  <p className="text-[10px] font-mono text-muted-foreground mt-2">{cert.certificateId}</p>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // --- SELECTED CERTIFICATE (immediately visible + OTP shown) ---
  const certificate = selectedCert;

  return (
    <div className="space-y-6">
      <button onClick={goBack} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
        <ArrowLeft className="w-3 h-3" /> Back to certificates
      </button>

      {/* Session timer bar */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="glass-surface-elevated p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-success" />
            <span className="text-sm font-semibold text-success">Temporary Access Active</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-mono">
            <Clock className="w-4 h-4 text-warning" />
            <span className={`${timerPercent < 20 ? "text-destructive" : "text-warning"} font-semibold`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
        <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-success to-success/50"
            initial={{ width: "100%" }} animate={{ width: `${timerPercent}%` }} transition={{ duration: 1 }} />
        </div>
      </motion.div>

      {/* OTP Card — shown immediately */}
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
            This OTP changes every 5 minutes. The verifier needs this + your certificate ID.
          </p>
        </div>
      </motion.div>

      {/* Certificate Card — fully visible, no blur */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="glass-surface-elevated overflow-hidden">
        <div className="p-6 sm:p-8">
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
                    <ExternalLink className="w-3 h-3" /> PolygonScan
                  </a>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-4">
              <div className="p-5 rounded-2xl bg-background/50 border border-border/30">
                <QRCodeSVG value={`proofvault://verify/${certificate.certificateId}`}
                  size={140} bgColor="transparent" fgColor="hsl(210, 100%, 56%)" level="M" />
              </div>
              <p className="text-[10px] text-muted-foreground text-center font-mono">Scan to Verify</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default StudentView;
