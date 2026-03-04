import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock, Clock, FileText, ExternalLink, ShieldCheck } from "lucide-react";

const VALID_CODE = "123456";
const TIMER_DURATION = 30 * 60; // 30 minutes in seconds

const StudentView = () => {
  const [code, setCode] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [error, setError] = useState(false);

  const handleSubmit = () => {
    if (code === VALID_CODE) {
      setUnlocked(true);
      setError(false);
      setTimeLeft(TIMER_DURATION);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  const lockCertificate = useCallback(() => {
    setUnlocked(false);
    setCode("");
    setTimeLeft(TIMER_DURATION);
  }, []);

  useEffect(() => {
    if (!unlocked) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          lockCertificate();
          return TIMER_DURATION;
        }
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 cyber-border-glow"
      >
        <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
          {unlocked ? (
            <Unlock className="w-5 h-5 text-success" />
          ) : (
            <Lock className="w-5 h-5 text-cyber-glow" />
          )}
          Timed Authentication
        </h3>

        {!unlocked ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter your 6-digit authentication code to access your certificate.
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="● ● ● ● ● ●"
                className={`flex-1 bg-muted/50 border rounded-md px-4 py-3 text-center text-foreground font-mono text-xl tracking-[0.5em] focus:outline-none transition-colors ${
                  error
                    ? "border-destructive shake"
                    : "border-border focus:border-cyber-glow"
                }`}
              />
              <button
                onClick={handleSubmit}
                disabled={code.length !== 6}
                className="px-6 py-3 rounded-md bg-primary hover:bg-primary/80 text-primary-foreground font-display font-semibold tracking-wider uppercase transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_20px_hsl(195,100%,50%,0.3)]"
              >
                Verify
              </button>
            </div>
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-destructive font-mono"
                >
                  ✗ Invalid authentication code
                </motion.p>
              )}
            </AnimatePresence>
            <p className="text-xs text-muted-foreground font-mono">
              Demo code: 123456
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 rounded-md bg-success/10 border border-success/30">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-success" />
              <span className="text-sm font-medium text-success">Access Granted</span>
            </div>
            <div className="flex items-center gap-2 text-warning">
              <Clock className="w-4 h-4" />
              <span className="font-mono text-sm">{formatTime(timeLeft)}</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Certificate Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card overflow-hidden relative"
      >
        {/* Scan line overlay when locked */}
        {!unlocked && (
          <div className="absolute inset-0 z-10 scan-line" />
        )}

        <div className={`p-6 transition-all duration-700 ${!unlocked ? "blur-lg select-none pointer-events-none" : ""}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyber-glow" />
              My Certificate
            </h3>
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-success/10 text-success border border-success/30">
              VERIFIED
            </span>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-md bg-muted/20 border border-border/50 space-y-3">
              <div className="text-center mb-4">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-display">
                  Polygon Blockchain Credential
                </p>
                <div className="h-px bg-gradient-to-r from-transparent via-cyber-glow/30 to-transparent my-3" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Recipient</p>
                  <p className="font-medium">Alex Johnson</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Degree</p>
                  <p className="font-medium">B.Tech Computer Science</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Institution</p>
                  <p className="font-medium">MIT University</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Issue Date</p>
                  <p className="font-medium">2025-06-15</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Certificate ID</p>
                  <p className="font-mono text-xs text-cyber-glow">PV-2025-00847</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">GPA</p>
                  <p className="font-medium">3.87 / 4.00</p>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-md bg-muted/20 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">IPFS Document Link</p>
              <a
                href="#"
                className="text-sm font-mono text-cyber-glow hover:underline flex items-center gap-1"
              >
                ipfs://QmX7b3e...kL9pR2wF4
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="p-3 rounded-md bg-muted/20 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Polygon Transaction</p>
              <p className="text-xs font-mono text-cyber-glow break-all">
                0x7a3f8c...e2b1d904f6
              </p>
            </div>
          </div>
        </div>

        {/* Lock overlay */}
        {!unlocked && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/30 backdrop-blur-sm">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex flex-col items-center gap-3"
            >
              <Lock className="w-12 h-12 text-cyber-glow/60" />
              <p className="font-display text-sm text-muted-foreground tracking-wider uppercase">
                Enter Auth Code to Unlock
              </p>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default StudentView;
