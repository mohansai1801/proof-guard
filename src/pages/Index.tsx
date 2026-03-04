import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, GraduationCap, Search, Layers, Activity, FileDown, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logoImg from "@/assets/Proof_Vault.png";
import { useAuth } from "@/contexts/AuthContext";
import UniversityAdmin from "@/components/UniversityAdmin";
import StudentView from "@/components/StudentView";
import VerifierPortal from "@/components/VerifierPortal";
import CertificateGenerator from "@/components/CertificateGenerator";

type Tab = "admin" | "student" | "verifier" | "generate";

const universityTabs: { id: Tab; label: string; shortLabel: string; icon: React.ElementType; desc: string }[] = [
  { id: "admin", label: "Issuer Dashboard", shortLabel: "Admin", icon: Shield, desc: "Issue & manage blockchain credentials" },
  { id: "generate", label: "Generate Certs", shortLabel: "Generate", icon: FileDown, desc: "Bulk generate PDF certificates" },
];

const publicTabs: { id: Tab; label: string; shortLabel: string; icon: React.ElementType; desc: string }[] = [
  { id: "student", label: "Student Portal", shortLabel: "Student", icon: GraduationCap, desc: "Access & view your certificates" },
  { id: "verifier", label: "Verification", shortLabel: "Verify", icon: Search, desc: "Verify credential authenticity" },
];

const Index = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>(user ? "admin" : "student");

  const tabs = user ? [...universityTabs, ...publicTabs] : publicTabs;

  // If tab is admin-only and user not logged in, switch
  if (!user && (activeTab === "admin" || activeTab === "generate")) {
    setActiveTab("student");
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Ambient gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[300px] -right-[200px] w-[700px] h-[700px] rounded-full opacity-[0.04] animate-float-subtle"
          style={{ background: 'radial-gradient(circle, hsl(210 100% 56%), transparent 70%)' }} />
        <div className="absolute -bottom-[200px] -left-[300px] w-[600px] h-[600px] rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, hsl(250 80% 62%), transparent 70%)', animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="py-6 sm:py-8 flex items-center justify-between"
        >
          <div className="flex items-center">
            <img src={logoImg} alt="Proof Vault" className="h-12 sm:h-14 object-contain" />
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl glass-surface text-xs text-muted-foreground">
                <Activity className="w-3.5 h-3.5 text-success" />
                <span className="font-mono">Polygon Network</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl glass-surface">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
                <span className="text-xs text-muted-foreground font-mono">Connected</span>
              </div>
            </div>

            {user ? (
              <button onClick={signOut}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl glass-surface text-xs text-muted-foreground hover:text-foreground transition-colors">
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            ) : (
              <button onClick={() => navigate("/auth")}
                className="flex items-center gap-2 px-4 py-2 btn-primary text-xs">
                <User className="w-3.5 h-3.5" />
                <span>University Login</span>
              </button>
            )}
          </div>
        </motion.header>

        {/* Navigation Tabs */}
        <motion.nav
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.45 }}
          className="mb-8"
        >
          <div className="glass-surface p-1.5 flex gap-1.5">
            {tabs.map((tab, i) => {
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 + i * 0.06 }}
                  className={`relative flex-1 flex items-center justify-center sm:justify-start gap-2.5 px-4 py-3 sm:py-3.5 rounded-xl text-left transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-r from-highlight/10 to-highlight-secondary/5 text-foreground"
                      : "text-muted-foreground hover:text-foreground/70 hover:bg-muted/20"
                  }`}
                >
                  <tab.icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? "text-highlight" : ""}`} />
                  <div className="hidden sm:block min-w-0">
                    <p className="text-sm font-semibold truncate">{tab.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 hidden md:block">{tab.desc}</p>
                  </div>
                  <span className="sm:hidden text-xs font-semibold">{tab.shortLabel}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-gradient-to-r from-highlight to-highlight-secondary"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.nav>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.main
            key={activeTab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28 }}
            className="pb-12"
          >
            {activeTab === "admin" && <UniversityAdmin />}
            {activeTab === "generate" && <CertificateGenerator />}
            {activeTab === "student" && <StudentView />}
            {activeTab === "verifier" && <VerifierPortal />}
          </motion.main>
        </AnimatePresence>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="pb-8"
        >
          <div className="divider-line mb-6" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-highlight/20 to-highlight-secondary/10 flex items-center justify-center">
                <Layers className="w-3 h-3 text-highlight" />
              </div>
              <span className="font-medium">ProofVault v1.0</span>
            </div>
            <div className="flex items-center gap-4 font-mono">
              <span>Polygon PoS</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
              <span>IPFS via Pinata</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
              <span>Blockchain Secured</span>
            </div>
          </div>
        </motion.footer>
      </div>
    </div>
  );
};

export default Index;
