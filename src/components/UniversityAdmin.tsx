import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, CheckCircle2, Loader2, FileText, Users, Shield, ExternalLink, Layers } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface IssuedCert {
  id: string;
  name: string;
  degree: string;
  institution: string;
  date: string;
  status: "Pending" | "Anchoring..." | "Anchored";
  txHash: string;
  blockNumber: number;
}

// Mock data for demo
const MOCK_CERTS: IssuedCert[] = [
  { id: "PV-2026-48050", name: "Alex Johnson", degree: "B.Tech Computer Science", institution: "MIT University", date: "Mar 4, 2026", status: "Anchored", txHash: "0x7a3b8c9d2e1f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8b9c", blockNumber: 52847291 },
  { id: "PV-2026-31207", name: "Sarah Williams", degree: "M.Sc Data Science", institution: "Stanford University", date: "Mar 4, 2026", status: "Anchored", txHash: "0x1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a", blockNumber: 52847305 },
  { id: "PV-2026-67834", name: "James Chen", degree: "B.A Economics", institution: "Harvard University", date: "Mar 3, 2026", status: "Anchored", txHash: "0x9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e", blockNumber: 52846199 },
];

const UniversityAdmin = () => {
  const [certs, setCerts] = useState<IssuedCert[]>(MOCK_CERTS);
  const [bulkIssuing, setBulkIssuing] = useState(false);
  const [progress, setProgress] = useState(0);

  const totalIssued = certs.filter(c => c.status === "Anchored").length;
  const totalStudents = certs.length;

  const handleBulkIssue = () => {
    setBulkIssuing(true);
    setProgress(0);

    // New mock cert to add
    const newCert: IssuedCert = {
      id: `PV-2026-${String(Math.floor(Math.random() * 99999)).padStart(5, "0")}`,
      name: "Emily Davis",
      degree: "M.A International Relations",
      institution: "MIT University",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      status: "Anchoring...",
      txHash: "0x" + Array.from({ length: 64 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join(""),
      blockNumber: 52847291 + Math.floor(Math.random() * 1000),
    };

    setCerts(prev => [newCert, ...prev]);

    // 5-second animation
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / 5000) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(interval);
        setCerts(prev => prev.map(c => c.id === newCert.id ? { ...c, status: "Anchored" as const } : c));
        setBulkIssuing(false);
        toast({ title: "Certificate Anchored!", description: `${newCert.name} — ${newCert.id}` });
      }
    }, 50);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: FileText, label: "Certificates Issued", value: String(totalIssued), iconColor: "text-highlight" },
          { icon: Users, label: "Total Students", value: String(totalStudents), iconColor: "text-highlight-secondary" },
          { icon: Shield, label: "On-Chain Verified", value: String(totalIssued), iconColor: "text-success" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-surface p-5 flex items-center gap-4 group hover:border-highlight/15 transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-highlight/10 to-highlight-secondary/5 flex items-center justify-center border border-highlight/10">
              <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
            </div>
            <div>
              <p className="data-label !mb-0">{stat.label}</p>
              <p className="text-2xl font-heading font-bold mt-1">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bulk Issue Button + Loading */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="glass-surface-elevated p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-highlight to-highlight-secondary flex items-center justify-center shadow-lg shadow-highlight/15">
              <Upload className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold">Issuer Dashboard</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Issue & anchor credentials to Polygon blockchain</p>
            </div>
          </div>
          <button onClick={handleBulkIssue} disabled={bulkIssuing}
            className="px-5 py-2.5 btn-primary flex items-center gap-2 text-sm">
            {bulkIssuing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {bulkIssuing ? "Anchoring..." : "Bulk Issue"}
          </button>
        </div>

        {/* Anchoring Animation */}
        <AnimatePresence>
          {bulkIssuing && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
              <div className="p-5 rounded-xl bg-gradient-to-r from-highlight/5 to-highlight-secondary/5 border border-highlight/15 space-y-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-highlight animate-spin" />
                  <div>
                    <p className="text-sm font-semibold">Anchoring to Polygon Blockchain...</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Pinning metadata to IPFS → Writing to Polygon PoS</p>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-highlight to-highlight-secondary"
                    animate={{ width: `${progress}%` }} transition={{ duration: 0.1 }} />
                </div>
                <p className="text-xs font-mono text-muted-foreground text-right">{Math.round(progress)}%</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="divider-gradient mb-4" />

        {/* Certificates Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-mono uppercase tracking-wider text-muted-foreground border-b border-border/40">
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4 hidden md:table-cell">Certificate ID</th>
                <th className="pb-3 pr-4 hidden sm:table-cell">Date</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {certs.map((cert, i) => (
                <motion.tr key={cert.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                  <td className="py-3.5 pr-4">
                    <p className="font-medium">{cert.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{cert.degree}</p>
                  </td>
                  <td className="py-3.5 pr-4 hidden md:table-cell">
                    <span className="font-mono text-xs text-highlight">{cert.id}</span>
                  </td>
                  <td className="py-3.5 pr-4 hidden sm:table-cell text-xs text-muted-foreground">{cert.date}</td>
                  <td className="py-3.5 pr-4">
                    {cert.status === "Anchored" ? (
                      <span className="badge-success"><CheckCircle2 className="w-3 h-3" /> Anchored</span>
                    ) : cert.status === "Anchoring..." ? (
                      <span className="badge-warning"><Loader2 className="w-3 h-3 animate-spin" /> Anchoring...</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Pending</span>
                    )}
                  </td>
                  <td className="py-3.5">
                    {cert.status === "Anchored" && (
                      <a href={`https://amoy.polygonscan.com/tx/${cert.txHash}`} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-highlight/70 hover:text-highlight transition-colors">
                        <ExternalLink className="w-3 h-3" />
                        <span className="hidden sm:inline">PolygonScan</span>
                      </a>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default UniversityAdmin;
