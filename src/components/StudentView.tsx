import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock, Clock, FileText, ExternalLink, ShieldCheck, Loader2 } from "lucide-react";
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

  return (
    <div className="space-y-6">
      {/* Auth Code Input */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-panel-elevated rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className={`p-2.5 rounded-lg border transition-all duration-300 ${
            unlocked
              ? "bg-success/10 border-success/20"
              : "bg-gradient-to-br from-primary/20 to-accent/10 border-primary/15"
          }`}>
            {unlocked ? <Unlock className="w-5 h-5 text-success" /> : <Lock className="w-5 h-5 text-cyber-glow" />}
          </div>
          <div>
            <h3 className="font-display text-base sm:text-lg font-semibold tracking-wider">
              Timed Authentication
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Secure access to your credential</p>
          </div>
        </div>

        <div className="section-divider mb-5" />

        {!unlocked ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Enter your 6-digit authentication code to access your certificate.</p>
            <div className="flex gap-3">
              <input type="text" maxLength={6} value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="● ● ● ● ● ●"
                className={`flex-1 glass-input px-4 py-3 text-center text-foreground font-mono text-xl tracking-[0.5em] ${
                  error ? "!border-destructive" : ""
                }`} />
              <button onClick={handleSubmit} disabled={code.length !== 6 || loading}
                className="px-6 py-3 glow-btn text-sm">
                <span className="relative z-10">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify"}
                </span>
              </button>
            </div>
            <AnimatePresence>
              {error && (
                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-sm text-destructive font-mono">✗ Invalid authentication code</motion.p>
              )}
            </AnimatePresence>
            <p className="text-[10px] text-muted-foreground font-mono tracking-wider">Use the auth code provided by your university admin</p>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 rounded-xl bg-success/8 border border-success/20">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-success" />
              <span className="text-sm font-semibold text-success">Access Granted</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-warning font-mono text-sm">
                <Clock className="w-4 h-4" />
                {formatTime(timeLeft)}
              </div>
              <button onClick={lockCertificate}
                className="text-xs text-muted-foreground hover:text-foreground px-3 py-1 rounded-lg hover:bg-muted/30 transition-all">
                Lock
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Certificate Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass-panel-elevated rounded-2xl overflow-hidden relative">
        {!unlocked && <div className="absolute inset-0 z-10 scan-line" />}

        <div className={`p-6 sm:p-8 transition-all duration-700 ${!unlocked ? "blur-lg select-none pointer-events-none" : ""}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/15">
                <FileText className="w-5 h-5 text-cyber-glow" />
              </div>
              <h3 className="font-display text-base sm:text-lg font-semibold tracking-wider">
                My Certificate
              </h3>
            </div>
            <span className="px-3 py-1.5 rounded-full text-[10px] font-mono bg-success/8 text-success border border-success/20 tracking-wider">
              VERIFIED
            </span>
          </div>

          <div className="section-divider mb-6" />

          <div className="space-y-4">
            <div className="info-block space-y-4">
              <div className="text-center mb-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-display">Polygon Blockchain Credential</p>
                <div className="section-divider my-3" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Recipient", value: certificate?.recipientName },
                  { label: "Degree", value: certificate?.degree },
                  { label: "Institution", value: certificate?.institution },
                  { label: "Issue Date", value: certificate?.issueDate },
                  { label: "Certificate ID", value: certificate?.certificateId, mono: true, glow: true },
                  { label: "GPA", value: certificate?.gpa },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-[10px] text-muted-foreground font-mono tracking-wider uppercase mb-1">{item.label}</p>
                    <p className={`text-sm font-medium ${item.mono ? 'font-mono text-xs' : ''} ${item.glow ? 'text-cyber-glow' : ''}`}>
                      {item.value || "—"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {certificate?.ipfsUrl && (
              <div className="info-block">
                <p className="text-[10px] text-muted-foreground font-mono tracking-wider uppercase mb-1.5">IPFS Document Link</p>
                <a href={certificate.ipfsUrl} target="_blank" rel="noopener noreferrer"
                  className="text-sm font-mono text-cyber-glow hover:text-cyber-glow/80 flex items-center gap-1.5 transition-colors">
                  ipfs://{certificate.ipfsHash?.substring(0, 12)}...{certificate.ipfsHash?.slice(-8)}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {certificate?.txHash && (
              <div className="info-block">
                <p className="text-[10px] text-muted-foreground font-mono tracking-wider uppercase mb-1.5">Polygon Transaction</p>
                <p className="text-xs font-mono text-cyber-glow/80 break-all">{certificate.txHash}</p>
              </div>
            )}
          </div>
        </div>

        {!unlocked && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/20 backdrop-blur-sm">
            <motion.div animate={{ scale: [1, 1.03, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="flex flex-col items-center gap-4">
              <div className="p-5 rounded-2xl bg-muted/20 border border-border/30 backdrop-blur-md">
                <Lock className="w-10 h-10 text-cyber-glow/50" />
              </div>
              <p className="font-display text-xs text-muted-foreground tracking-[0.2em] uppercase">Enter Auth Code to Unlock</p>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default StudentView;
