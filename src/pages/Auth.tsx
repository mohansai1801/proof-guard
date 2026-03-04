import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Loader2, Mail, Lock, User, Building } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import logoImg from "@/assets/Proof_Vault.png";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [institution, setInstitution] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Welcome back!", description: "Signed in successfully" });
        navigate("/");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, institution },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;

        // Create profile
        if (data.user) {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            full_name: fullName,
            institution,
          });
        }

        toast({
          title: "Account created!",
          description: "Check your email to verify your account before signing in.",
        });
      }
    } catch (error: unknown) {
      toast({
        title: "Authentication failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative">
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[300px] -right-[200px] w-[700px] h-[700px] rounded-full opacity-[0.04] animate-float-subtle"
          style={{ background: 'radial-gradient(circle, hsl(210 100% 56%), transparent 70%)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={logoImg} alt="Proof Vault" className="h-14 object-contain" />
        </div>

        <div className="glass-surface-elevated p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-highlight to-highlight-secondary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold">
                {isLogin ? "University Login" : "Register University"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isLogin ? "Access your credential dashboard" : "Create your university account"}
              </p>
            </div>
          </div>

          <div className="divider-gradient mb-6" />

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="data-label">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe" required className="input-field pl-10" />
                  </div>
                </div>
                <div>
                  <label className="data-label">Institution</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="text" value={institution} onChange={(e) => setInstitution(e.target.value)}
                      placeholder="MIT University" required className="input-field pl-10" />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="data-label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@university.edu" required className="input-field pl-10" />
              </div>
            </div>

            <div>
              <label className="data-label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required minLength={6} className="input-field pl-10" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 btn-primary flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-highlight/70 hover:text-highlight transition-colors"
            >
              {isLogin ? "Don't have an account? Register" : "Already have an account? Sign In"}
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-6">
          Blockchain-secured credential management on Polygon PoS
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
