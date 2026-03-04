import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, CheckCircle2, Loader2, FileText, Hash, Users, Shield, Copy, Key } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type MintState = "idle" | "minting" | "success";

interface MintResult {
  certificateId: string;
  authCode: string;
  txHash: string;
  blockNumber: number;
  ipfsHash: string;
  ipfsUrl: string;
}

const UniversityAdmin = () => {
  const [mintState, setMintState] = useState<MintState>("idle");
  const [mintResult, setMintResult] = useState<MintResult | null>(null);
  const [studentCount, setStudentCount] = useState("1");
  const [recipientName, setRecipientName] = useState("Alex Johnson");
  const [degree, setDegree] = useState("B.Tech Computer Science");
  const [institution, setInstitution] = useState("MIT University");
  const [gpa, setGpa] = useState("3.87");

  const handleBulkIssue = async () => {
    setMintState("minting");
    try {
      const { data, error } = await supabase.functions.invoke('mint-certificate', {
        body: {
          recipientName,
          degree,
          institution,
          gpa,
          studentCount: parseInt(studentCount),
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setMintResult(data.certificate);
      setMintState("success");
      toast({ title: "Certificate Minted!", description: `ID: ${data.certificate.certificateId}` });
    } catch (e: unknown) {
      console.error('Mint failed:', e);
      setMintState("idle");
      toast({ title: "Minting Failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    }
  };

  const reset = () => {
    setMintState("idle");
    setMintResult(null);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied!` });
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: FileText, label: "Certificates Issued", value: "—", color: "text-cyber-glow" },
          { icon: Users, label: "Registered Students", value: "—", color: "text-primary" },
          { icon: Shield, label: "On-Chain Verified", value: "—", color: "text-success" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="stat-card"
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-primary/15 to-accent/5 border border-primary/10">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-mono tracking-wider uppercase">{stat.label}</p>
                <p className="text-2xl font-display font-bold mt-0.5">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Issue Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-panel-elevated rounded-2xl p-6 sm:p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-lg bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/15">
            <Upload className="w-5 h-5 text-cyber-glow" />
          </div>
          <div>
            <h3 className="font-display text-base sm:text-lg font-semibold tracking-wider">
              Issue Credential
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Mint a new certificate on Polygon</p>
          </div>
        </div>

        <div className="section-divider mb-6" />

        <AnimatePresence mode="wait">
          {mintState === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "Recipient Name", value: recipientName, setter: setRecipientName },
                  { label: "Degree / Program", value: degree, setter: setDegree },
                  { label: "Institution", value: institution, setter: setInstitution },
                  { label: "GPA (optional)", value: gpa, setter: setGpa },
                ].map((field) => (
                  <div key={field.label} className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-mono tracking-wider uppercase">{field.label}</label>
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => field.setter(e.target.value)}
                      className="w-full glass-input px-4 py-2.5 text-foreground font-mono text-sm"
                    />
                  </div>
                ))}
              </div>

              <div className="info-block">
                <p className="text-xs text-muted-foreground font-mono flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyber-glow/60" />
                  Network: Polygon Amoy Testnet • IPFS: Pinata • Auth code auto-generated
                </p>
              </div>

              <button
                onClick={handleBulkIssue}
                disabled={!recipientName || !degree || !institution}
                className="w-full py-3.5 glow-btn text-sm"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" />
                  Mint Certificate on Polygon
                </span>
              </button>
            </motion.div>
          )}

          {mintState === "minting" && (
            <motion.div key="minting" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center py-12 space-y-5">
              <div className="relative">
                <Loader2 className="w-14 h-14 text-cyber-glow animate-spin" />
                <div className="absolute inset-0 w-14 h-14 rounded-full border border-cyber-glow/15 animate-pulse-glow" />
              </div>
              <div className="text-center">
                <p className="font-display text-lg font-semibold cyber-glow">Minting on Polygon...</p>
                <p className="text-sm text-muted-foreground mt-2 font-mono">Pinning to IPFS → Broadcasting to blockchain</p>
              </div>
              <div className="w-full max-w-xs h-1 rounded-full bg-muted/50 overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-primary to-cyber-glow rounded-full" initial={{ width: "0%" }} animate={{ width: "100%" }}
                  transition={{ duration: 5, ease: "easeInOut" }} />
              </div>
            </motion.div>
          )}

          {mintState === "success" && mintResult && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="space-y-5">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-success/8 border border-success/20">
                <CheckCircle2 className="w-8 h-8 text-success flex-shrink-0" />
                <div>
                  <p className="font-display font-semibold text-success">Certificate Minted Successfully!</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Recorded on Polygon & pinned to IPFS</p>
                </div>
              </div>

              {/* Auth Code */}
              <div className="p-5 rounded-xl bg-warning/5 border border-warning/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-warning font-mono tracking-wider uppercase">
                    <Key className="w-4 h-4" />
                    Student Auth Code
                  </div>
                  <button onClick={() => copyToClipboard(mintResult.authCode, "Auth Code")}
                    className="p-1.5 hover:bg-muted/30 rounded-lg transition-colors">
                    <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                  </button>
                </div>
                <p className="font-mono text-2xl tracking-[0.5em] text-center text-warning font-bold">{mintResult.authCode}</p>
                <p className="text-[10px] text-muted-foreground text-center font-mono">Share this code securely with the student</p>
              </div>

              <div className="info-block space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                    <Hash className="w-3 h-3" /> Certificate ID
                  </div>
                  <button onClick={() => copyToClipboard(mintResult.certificateId, "Certificate ID")}
                    className="p-1 hover:bg-muted/30 rounded transition-colors">
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
                <p className="font-mono text-sm text-cyber-glow">{mintResult.certificateId}</p>
              </div>

              <div className="info-block space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                  <Hash className="w-3 h-3" /> Transaction Hash
                </div>
                <p className="font-mono text-xs text-cyber-glow/80 break-all">{mintResult.txHash}</p>
              </div>

              <button onClick={reset}
                className="w-full py-3 rounded-xl border border-border/60 hover:border-cyber-glow/30 text-foreground font-display text-sm tracking-wider uppercase transition-all duration-300 hover:bg-muted/20">
                Issue Another Certificate
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default UniversityAdmin;
