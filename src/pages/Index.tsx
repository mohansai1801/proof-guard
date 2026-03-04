import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, GraduationCap, Search, Hexagon, Zap, Globe } from "lucide-react";
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
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,hsl(195_100%_60%/0.06),transparent_70%)] animate-float" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,hsl(195_80%_42%/0.05),transparent_70%)]" style={{ animationDelay: "3s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle,hsl(220_20%_14%/0.5),transparent_70%)]" />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `linear-gradient(hsl(195 100% 60%) 1px, transparent 1px), linear-gradient(90deg, hsl(195 100% 60%) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="glass-panel-elevated rounded-2xl px-5 sm:px-8 py-5 mb-8 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center border border-primary/20">
                <Hexagon className="w-6 h-6 text-cyber-glow" strokeWidth={1.5} />
                <Shield className="w-3 h-3 text-cyber-glow absolute" strokeWidth={2.5} />
              </div>
            </div>
            <div>
              <h1 className="font-display text-lg sm:text-xl font-bold tracking-[0.2em] cyber-glow">
                PROOF VAULT
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-mono tracking-[0.15em] mt-0.5 flex items-center gap-1.5">
                <Globe className="w-3 h-3" />
                DECENTRALIZED CREDENTIALS • POLYGON
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full glass-card">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
              <span className="text-xs font-mono text-muted-foreground">Polygon Mainnet</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full glass-card">
              <Zap className="w-3 h-3 text-cyber-glow" />
              <span className="text-xs font-mono text-muted-foreground">Live</span>
            </div>
          </div>
        </motion.header>

        {/* Tab Navigation */}
        <motion.nav
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="grid grid-cols-3 gap-3 mb-8"
        >
          {tabs.map((tab, i) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              className={`relative p-4 md:p-5 rounded-xl border transition-all duration-500 text-left group ${
                activeTab === tab.id
                  ? "glass-panel-elevated border-cyber-glow/30 cyber-border-glow"
                  : "glass-card border-transparent hover:border-border/60"
              }`}
            >
              <div className="flex items-center gap-2.5 md:gap-3">
                <div className={`p-2 rounded-lg transition-all duration-300 ${
                  activeTab === tab.id
                    ? "bg-primary/20 shadow-[0_0_12px_hsl(195_100%_60%/0.15)]"
                    : "bg-muted/30 group-hover:bg-muted/50"
                }`}>
                  <tab.icon
                    className={`w-4 h-4 md:w-5 md:h-5 transition-colors duration-300 ${
                      activeTab === tab.id ? "text-cyber-glow" : "text-muted-foreground group-hover:text-foreground/70"
                    }`}
                  />
                </div>
                <div className="min-w-0">
                  <p className={`font-display text-[10px] md:text-xs font-semibold tracking-wider truncate transition-colors duration-300 ${
                    activeTab === tab.id ? "text-foreground" : "text-muted-foreground group-hover:text-foreground/80"
                  }`}>
                    {tab.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground hidden md:block mt-0.5">{tab.desc}</p>
                </div>
              </div>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, transparent, hsl(195 100% 60%), transparent)',
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </motion.nav>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.99 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
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
          transition={{ delay: 0.6 }}
          className="mt-16 mb-4"
        >
          <div className="section-divider mb-6" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[10px] text-muted-foreground font-mono tracking-wider">
              PROOF VAULT v1.0 • Powered by Polygon PoS
            </p>
            <p className="text-[10px] text-muted-foreground font-mono tracking-wider">
              IPFS Storage via Pinata • Secured by Blockchain
            </p>
          </div>
        </motion.footer>
      </div>
    </div>
  );
};

export default Index;
