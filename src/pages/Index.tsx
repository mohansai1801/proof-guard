import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, GraduationCap, Search, Hexagon } from "lucide-react";
import UniversityAdmin from "@/components/UniversityAdmin";
import StudentView from "@/components/StudentView";
import VerifierPortal from "@/components/VerifierPortal";

type Tab = "admin" | "student" | "verifier";

const tabs: { id: Tab; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "admin", label: "University Admin", icon: Shield, desc: "Issue & manage credentials" },
  { id: "student", label: "Student View", icon: GraduationCap, desc: "Access your certificates" },
  { id: "verifier", label: "Verifier Portal", icon: Search, desc: "Verify authenticity" },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>("admin");

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyber-glow/3 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <Hexagon className="w-10 h-10 text-cyber-glow" strokeWidth={1.5} />
              <Shield className="w-5 h-5 text-cyber-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" strokeWidth={2} />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold tracking-wider cyber-glow">
                PROOF VAULT
              </h1>
              <p className="text-xs text-muted-foreground font-mono tracking-wider">
                DECENTRALIZED CREDENTIALS • POLYGON
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full glass-card">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
            <span className="text-xs font-mono text-muted-foreground">Polygon Mainnet</span>
          </div>
        </motion.header>

        {/* Tab Navigation */}
        <motion.nav
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-2 mb-8"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative p-3 md:p-4 rounded-lg border transition-all duration-300 text-left ${
                activeTab === tab.id
                  ? "glass-card border-cyber-glow/40 cyber-border-glow"
                  : "bg-muted/10 border-border/30 hover:border-border/60"
              }`}
            >
              <div className="flex items-center gap-2 md:gap-3">
                <tab.icon
                  className={`w-5 h-5 flex-shrink-0 ${
                    activeTab === tab.id ? "text-cyber-glow" : "text-muted-foreground"
                  }`}
                />
                <div className="min-w-0">
                  <p className={`font-display text-xs md:text-sm font-semibold tracking-wide truncate ${
                    activeTab === tab.id ? "" : "text-muted-foreground"
                  }`}>
                    {tab.label}
                  </p>
                  <p className="text-xs text-muted-foreground hidden md:block">{tab.desc}</p>
                </div>
              </div>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-4 right-4 h-0.5 bg-cyber-glow rounded-full"
                />
              )}
            </button>
          ))}
        </motion.nav>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === "admin" && <UniversityAdmin />}
            {activeTab === "student" && <StudentView />}
            {activeTab === "verifier" && <VerifierPortal />}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 py-4 border-t border-border/30 text-center"
        >
          <p className="text-xs text-muted-foreground font-mono">
            PROOF VAULT v1.0 • Powered by Polygon PoS • IPFS Storage via Pinata
          </p>
        </motion.footer>
      </div>
    </div>
  );
};


export default Index;
