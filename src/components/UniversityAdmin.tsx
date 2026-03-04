import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, CheckCircle2, Loader2, FileText, Hash, Users, Shield } from "lucide-react";

type MintState = "idle" | "minting" | "success";

const generateTxHash = () => {
  const chars = "0123456789abcdef";
  let hash = "0x";
  for (let i = 0; i < 64; i++) hash += chars[Math.floor(Math.random() * 16)];
  return hash;
};

const UniversityAdmin = () => {
  const [mintState, setMintState] = useState<MintState>("idle");
  const [txHash, setTxHash] = useState("");
  const [studentCount, setStudentCount] = useState("25");

  const handleBulkIssue = () => {
    setMintState("minting");
    setTimeout(() => {
      setTxHash(generateTxHash());
      setMintState("success");
    }, 3500);
  };

  const reset = () => {
    setMintState("idle");
    setTxHash("");
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: FileText, label: "Certificates Issued", value: "1,247" },
          { icon: Users, label: "Registered Students", value: "3,891" },
          { icon: Shield, label: "On-Chain Verified", value: "1,247" },
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
          Bulk Issue Credentials
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
                  <label className="text-sm text-muted-foreground mb-1 block">
                    Program / Degree
                  </label>
                  <input
                    type="text"
                    defaultValue="B.Tech Computer Science"
                    className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-foreground font-mono text-sm focus:outline-none focus:border-cyber-glow transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">
                    Number of Students
                  </label>
                  <input
                    type="number"
                    value={studentCount}
                    onChange={(e) => setStudentCount(e.target.value)}
                    className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-foreground font-mono text-sm focus:outline-none focus:border-cyber-glow transition-colors"
                  />
                </div>
              </div>

              <div className="p-3 rounded-md bg-muted/30 border border-border/50">
                <p className="text-xs text-muted-foreground font-mono">
                  Network: Polygon Mainnet • Gas: ~0.002 MATIC per cert • IPFS: Pinata
                </p>
              </div>

              <button
                onClick={handleBulkIssue}
                className="w-full py-3 rounded-md bg-primary hover:bg-primary/80 text-primary-foreground font-display font-semibold tracking-wider uppercase transition-all duration-300 hover:shadow-[0_0_20px_hsl(195,100%,50%,0.3)]"
              >
                <span className="flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" />
                  Bulk Issue {studentCount} Certificates
                </span>
              </button>
            </motion.div>
          )}

          {mintState === "minting" && (
            <motion.div
              key="minting"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center py-10 space-y-4"
            >
              <div className="relative">
                <Loader2 className="w-16 h-16 text-cyber-glow animate-spin" />
                <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-cyber-glow/20 animate-pulse-glow" />
              </div>
              <div className="text-center">
                <p className="font-display text-lg font-semibold cyber-glow">
                  Minting on Polygon...
                </p>
                <p className="text-sm text-muted-foreground mt-1 font-mono">
                  Broadcasting {studentCount} transactions to the blockchain
                </p>
              </div>
              <div className="w-full max-w-xs">
                <motion.div
                  className="h-1 bg-cyber-glow/80 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3.5, ease: "easeInOut" }}
                />
              </div>
            </motion.div>
          )}

          {mintState === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 p-4 rounded-md bg-success/10 border border-success/30">
                <CheckCircle2 className="w-8 h-8 text-success flex-shrink-0" />
                <div>
                  <p className="font-display font-semibold text-success">
                    Certificates Issued Successfully!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {studentCount} credentials minted on Polygon
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-md bg-muted/30 border border-border/50 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Hash className="w-4 h-4" />
                  Transaction Hash
                </div>
                <p className="font-mono text-xs text-cyber-glow break-all">{txHash}</p>
              </div>

              <button
                onClick={reset}
                className="w-full py-2 rounded-md border border-border hover:border-cyber-glow/50 text-foreground font-display text-sm tracking-wider uppercase transition-all duration-300"
              >
                Issue More Certificates
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6"
      >
        <h3 className="font-display text-lg font-semibold mb-4">Recent Issuances</h3>
        <div className="space-y-3">
          {[
            { name: "Batch #1247 — B.Tech CS 2025", count: 45, time: "2 hours ago" },
            { name: "Batch #1246 — M.Sc Data Science", count: 28, time: "1 day ago" },
            { name: "Batch #1245 — MBA Finance", count: 62, time: "3 days ago" },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-md bg-muted/20 border border-border/30"
            >
              <div>
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.time}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-cyber-glow">{item.count} certs</span>
                <CheckCircle2 className="w-4 h-4 text-success" />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default UniversityAdmin;
