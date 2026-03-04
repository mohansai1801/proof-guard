import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, CheckCircle2, Loader2, FileText, Hash, Users, Shield, Copy, Key, ArrowRight } from "lucide-react";
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
        body: { recipientName, degree, institution, gpa, studentCount: parseInt(studentCount) },
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

  const reset = () => { setMintState("idle"); setMintResult(null); };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied!` });
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: FileText, label: "Certificates Issued", value: "—", iconColor: "text-highlight" },
          { icon: Users, label: "Registered Students", value: "—", iconColor: "text-highlight-secondary" },
          { icon: Shield, label: "On-Chain Verified", value: "—", iconColor: "text-success" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-surface p-5 flex items-center gap-4 group hover:border-highlight/15 transition-all duration-300"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-highlight/10 to-highlight-secondary/5 flex items-center justify-center border border-highlight/10 group-hover:border-highlight/20 transition-colors">
              <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
            </div>
            <div>
              <p className="data-label !mb-0">{stat.label}</p>
              <p className="text-2xl font-heading font-bold mt-1">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Issue Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-surface-elevated p-6 sm:p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-highlight to-highlight-secondary flex items-center justify-center shadow-lg shadow-highlight/15">
              <Upload className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold">Issue New Credential</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Mint certificate to Polygon blockchain</p>
            </div>
          </div>
        </div>

        <div className="divider-gradient mb-6" />

        <AnimatePresence mode="wait">
          {mintState === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "Recipient Name", value: recipientName, setter: setRecipientName, placeholder: "Full name" },
                  { label: "Degree / Program", value: degree, setter: setDegree, placeholder: "e.g. B.Tech CS" },
                  { label: "Institution", value: institution, setter: setInstitution, placeholder: "University name" },
                  { label: "GPA (optional)", value: gpa, setter: setGpa, placeholder: "e.g. 3.87" },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="data-label">{field.label}</label>
                    <input
                      type="text" value={field.value} onChange={(e) => field.setter(e.target.value)}
                      placeholder={field.placeholder}
                      className="input-field"
                    />
                  </div>
                ))}
              </div>

              <div className="data-cell flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-highlight/50 animate-pulse-glow" />
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/70">Network:</span> Polygon Amoy Testnet &nbsp;•&nbsp;
                  <span className="font-medium text-foreground/70">Storage:</span> IPFS via Pinata &nbsp;•&nbsp;
                  Auth code auto-generated
                </p>
              </div>

              <button onClick={handleBulkIssue} disabled={!recipientName || !degree || !institution}
                className="w-full py-3.5 btn-primary flex items-center justify-center gap-2.5">
                <Upload className="w-4 h-4" />
                Mint Certificate on Polygon
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </motion.div>
          )}

          {mintState === "minting" && (
            <motion.div key="minting" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center py-14 space-y-6">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-highlight animate-spin" />
              </div>
              <div className="text-center">
                <h4 className="font-heading text-lg font-semibold">Minting Certificate...</h4>
                <p className="text-sm text-muted-foreground mt-2">Pinning to IPFS → Recording on Polygon</p>
              </div>
              <div className="w-48 h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-highlight to-highlight-secondary"
                  initial={{ width: "0%" }} animate={{ width: "100%" }}
                  transition={{ duration: 5, ease: "easeInOut" }} />
              </div>
            </motion.div>
          )}

          {mintState === "success" && mintResult && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="space-y-5">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-success/8 border border-success/15">
                <CheckCircle2 className="w-7 h-7 text-success flex-shrink-0" />
                <div>
                  <p className="font-heading font-semibold text-success">Certificate Minted Successfully</p>
                  <p className="text-sm text-muted-foreground mt-0.5">On-chain confirmation received from Polygon</p>
                </div>
              </div>

              {/* Auth Code highlight */}
              <div className="p-5 rounded-xl bg-gradient-to-br from-warning/5 to-warning/[0.02] border border-warning/15 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-warning" />
                    <span className="data-label !mb-0 !text-warning">Student Auth Code</span>
                  </div>
                  <button onClick={() => copyToClipboard(mintResult.authCode, "Auth Code")}
                    className="p-2 rounded-lg hover:bg-warning/10 transition-colors" title="Copy">
                    <Copy className="w-4 h-4 text-warning/70 hover:text-warning transition-colors" />
                  </button>
                </div>
                <p className="font-mono text-3xl tracking-[0.6em] text-center text-warning font-bold py-2">{mintResult.authCode}</p>
                <p className="text-[11px] text-muted-foreground text-center">Share this code securely with the student to grant certificate access</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="data-cell">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="data-label !mb-0">Certificate ID</span>
                    <button onClick={() => copyToClipboard(mintResult.certificateId, "Certificate ID")}
                      className="p-1 rounded hover:bg-muted/50 transition-colors">
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                  <p className="data-value-highlight text-sm">{mintResult.certificateId}</p>
                </div>
                <div className="data-cell">
                  <span className="data-label">Block Number</span>
                  <p className="data-value-highlight">{mintResult.blockNumber?.toLocaleString()}</p>
                </div>
              </div>

              <div className="data-cell">
                <span className="data-label">Transaction Hash</span>
                <p className="font-mono text-xs text-highlight/70 break-all leading-relaxed">{mintResult.txHash}</p>
              </div>

              <button onClick={reset} className="w-full py-3 btn-ghost">
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
