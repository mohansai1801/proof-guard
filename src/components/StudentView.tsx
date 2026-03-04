import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock, Clock, FileText, ExternalLink, ShieldCheck, Loader2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const TIMER_DURATION = 30 * 60;

interface CertificateData {
  certificateId: string;
  recipientName: string;
  degree: string;
  institution: string;
  gpa: string | null;
  issueDate: string;
  ipfsHash: string | null;
  ipfsUrl: string | null;
  txHash: string | null;
  blockNumber: number | null;
}

const StudentView = () => {
  const [code, setCode] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [error, setError] = useState(false);
  const [certificate, setCertificate] = useState<CertificateData | null>(null);

  const handleSubmit = async () => {
    if (code.length !== 6) return;
    setLoading(true);
    setError(false);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('unlock-certificate', {
        body: { authCode: code },
      });
      if (fnError) throw fnError;
      if (data.success) {
        setCertificate(data.certificate);
        setUnlocked(true);
        setTimeLeft(TIMER_DURATION);
        toast({ title: "Access Granted", description: "Certificate unlocked successfully" });
      } else {
        setError(true);
        setTimeout(() => setError(false), 2000);
      }
    } catch (e) {
      console.error('Unlock failed:', e);
      setError(true);
      setTimeout(() => setError(false), 2000);
    } finally {
      setLoading(false);
    }
  };

  const lockCertificate = useCallback(() => {
    setUnlocked(false);
    setCode("");
    setCertificate(null);
    setTimeLeft(TIMER_DURATION);
  }, []);

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

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const timerPercent = (timeLeft / TIMER_DURATION) * 100;

  return (
    <div className="space-y-6">
      {/* Auth Card */}
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
              {unlocked ? "Access Granted" : "Authenticate"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {unlocked ? "Your certificate is unlocked for a limited time" : "Enter your 6-digit code to view your certificate"}
            </p>
          </div>
        </div>

        <div className="divider-gradient mb-5" />

        {!unlocked ? (
          <div className="space-y-4">
            <div className="flex gap-3">
              <input type="text" maxLength={6} value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="● ● ● ● ● ●"
                className={`flex-1 input-mono text-center text-xl tracking-[0.5em] py-4 ${
                  error ? "!border-destructive !shadow-destructive/10" : ""
                }`}
              />
              <button onClick={handleSubmit} disabled={code.length !== 6 || loading}
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
              Use the auth code provided by your university admin. Access expires after 30 minutes.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-xl bg-success/5 border border-success/15">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-success" />
                <span className="text-sm font-semibold text-success">Authenticated</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm font-mono">
                  <Clock className="w-4 h-4 text-warning" />
                  <span className={`${timerPercent < 20 ? 'text-destructive' : 'text-warning'} font-semibold`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
                <button onClick={lockCertificate}
                  className="text-xs px-3 py-1.5 btn-ghost !rounded-lg">
                  Lock
                </button>
              </div>
            </div>
            {/* Timer bar */}
            <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-success to-success/50"
                initial={{ width: "100%" }}
                animate={{ width: `${timerPercent}%` }}
                transition={{ duration: 1 }}
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Certificate Card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="glass-surface-elevated overflow-hidden relative">
        {!unlocked && <div className="absolute inset-0 z-10 scan-line" />}

        <div className={`p-6 sm:p-8 transition-all duration-700 ${!unlocked ? "blur-lg select-none pointer-events-none" : ""}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-highlight/15 to-highlight-secondary/10 border border-highlight/15 flex items-center justify-center">
                <FileText className="w-5 h-5 text-highlight" />
              </div>
              <h3 className="font-heading text-lg font-semibold">Certificate Details</h3>
            </div>
            <div className="badge-success">
              <ShieldCheck className="w-3 h-3" />
              Verified
            </div>
          </div>

          <div className="divider-gradient mb-6" />

          <div className="space-y-4">
            {/* Credential header */}
            <div className="text-center py-3">
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-mono">Polygon Blockchain Credential</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[
                { label: "Recipient", value: certificate?.recipientName },
                { label: "Degree", value: certificate?.degree },
                { label: "Institution", value: certificate?.institution },
                { label: "Issue Date", value: certificate?.issueDate },
                { label: "Certificate ID", value: certificate?.certificateId, highlight: true },
                { label: "GPA", value: certificate?.gpa },
              ].map((item) => (
                <div key={item.label} className="data-cell">
                  <p className="data-label">{item.label}</p>
                  <p className={item.highlight ? "data-value-highlight text-xs" : "data-value"}>
                    {item.value || "—"}
                  </p>
                </div>
              ))}
            </div>

            {certificate?.ipfsUrl && (
              <div className="data-cell">
                <p className="data-label">IPFS Document</p>
                <a href={certificate.ipfsUrl} target="_blank" rel="noopener noreferrer"
                  className="data-value-highlight text-xs hover:underline underline-offset-2 flex items-center gap-1.5">
                  ipfs://{certificate.ipfsHash?.substring(0, 12)}...{certificate.ipfsHash?.slice(-8)}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {certificate?.txHash && (
              <div className="data-cell">
                <p className="data-label">Transaction Hash</p>
                <p className="font-mono text-xs text-highlight/60 break-all leading-relaxed">{certificate.txHash}</p>
              </div>
            )}
          </div>
        </div>

        {!unlocked && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/30 backdrop-blur-sm">
            <motion.div animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-muted/30 border border-border/40 backdrop-blur flex items-center justify-center">
                <Eye className="w-7 h-7 text-muted-foreground/50" />
              </div>
              <div className="text-center">
                <p className="text-sm font-heading font-semibold text-muted-foreground">Certificate Locked</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Enter your auth code above to view</p>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default StudentView;
