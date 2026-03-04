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
          { icon: FileText, label: "Certificates Issued", value: "—" },
          { icon: Users, label: "Registered Students", value: "—" },
          { icon: Shield, label: "On-Chain Verified", value: "—" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-5"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/20">
                <stat.icon className="w-5 h-5 text-cyber-glow" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-display font-bold">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bulk Issue Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6 cyber-border-glow"
      >
        <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-cyber-glow" />
          Issue Credential
        </h3>

        <AnimatePresence mode="wait">
          {mintState === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Recipient Name</label>
                  <input type="text" value={recipientName} onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-foreground font-mono text-sm focus:outline-none focus:border-cyber-glow transition-colors" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Degree / Program</label>
                  <input type="text" value={degree} onChange={(e) => setDegree(e.target.value)}
                    className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-foreground font-mono text-sm focus:outline-none focus:border-cyber-glow transition-colors" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Institution</label>
                  <input type="text" value={institution} onChange={(e) => setInstitution(e.target.value)}
                    className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-foreground font-mono text-sm focus:outline-none focus:border-cyber-glow transition-colors" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">GPA (optional)</label>
                  <input type="text" value={gpa} onChange={(e) => setGpa(e.target.value)}
                    className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-foreground font-mono text-sm focus:outline-none focus:border-cyber-glow transition-colors" />
                </div>
              </div>

              <div className="p-3 rounded-md bg-muted/30 border border-border/50">
                <p className="text-xs text-muted-foreground font-mono">
                  Network: Polygon Amoy Testnet • IPFS: Pinata • Auth code auto-generated
                </p>
              </div>

              <button onClick={handleBulkIssue} disabled={!recipientName || !degree || !institution}
                className="w-full py-3 rounded-md bg-primary hover:bg-primary/80 text-primary-foreground font-display font-semibold tracking-wider uppercase transition-all duration-300 hover:shadow-[0_0_20px_hsl(195,100%,50%,0.3)] disabled:opacity-30 disabled:cursor-not-allowed">
                <span className="flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" />
                  Mint Certificate on Polygon
                </span>
              </button>
            </motion.div>
          )}

          {mintState === "minting" && (
            <motion.div key="minting" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center py-10 space-y-4">
              <div className="relative">
                <Loader2 className="w-16 h-16 text-cyber-glow animate-spin" />
                <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-cyber-glow/20 animate-pulse-glow" />
              </div>
              <div className="text-center">
                <p className="font-display text-lg font-semibold cyber-glow">Minting on Polygon...</p>
                <p className="text-sm text-muted-foreground mt-1 font-mono">Pinning to IPFS → Broadcasting to blockchain</p>
              </div>
              <div className="w-full max-w-xs">
                <motion.div className="h-1 bg-cyber-glow/80 rounded-full" initial={{ width: "0%" }} animate={{ width: "100%" }}
                  transition={{ duration: 5, ease: "easeInOut" }} />
              </div>
            </motion.div>
          )}

          {mintState === "success" && mintResult && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-md bg-success/10 border border-success/30">
                <CheckCircle2 className="w-8 h-8 text-success flex-shrink-0" />
                <div>
                  <p className="font-display font-semibold text-success">Certificate Minted Successfully!</p>
                  <p className="text-sm text-muted-foreground">Recorded on Polygon & pinned to IPFS</p>
                </div>
              </div>

              {/* Auth Code - Important for student */}
              <div className="p-4 rounded-md bg-warning/10 border border-warning/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-warning">
                    <Key className="w-4 h-4" />
                    Student Auth Code (share with student)
                  </div>
                  <button onClick={() => copyToClipboard(mintResult.authCode, "Auth Code")}
                    className="p-1 hover:bg-muted/30 rounded">
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <p className="font-mono text-2xl tracking-[0.5em] text-center text-warning font-bold">{mintResult.authCode}</p>
              </div>

              <div className="p-4 rounded-md bg-muted/30 border border-border/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Hash className="w-4 h-4" /> Certificate ID
                  </div>
                  <button onClick={() => copyToClipboard(mintResult.certificateId, "Certificate ID")}
                    className="p-1 hover:bg-muted/30 rounded">
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <p className="font-mono text-sm text-cyber-glow">{mintResult.certificateId}</p>
              </div>

              <div className="p-4 rounded-md bg-muted/30 border border-border/50 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Hash className="w-4 h-4" /> Transaction Hash
                </div>
                <p className="font-mono text-xs text-cyber-glow break-all">{mintResult.txHash}</p>
              </div>

              <button onClick={reset}
                className="w-full py-2 rounded-md border border-border hover:border-cyber-glow/50 text-foreground font-display text-sm tracking-wider uppercase transition-all duration-300">
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
