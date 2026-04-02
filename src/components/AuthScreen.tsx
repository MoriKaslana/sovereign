import { useState } from "react";
import { motion } from "framer-motion";
import { useGame, Role } from "@/context/GameContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import authBg from "@/assets/auth-bg.jpg";

const AuthScreen = () => {
  const { login, register } = useGame();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("adventurer");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Fungsi handleSubmit sekarang pakai async
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (isLogin) {
      // Ditambah await karena login sekarang nembak ke Supabase
      const success = await login(username, password);
      if (!success) setError("Invalid credentials.");
    } else {
      // Ditambah await karena register sekarang nembak ke Supabase
      const success = await register(email, username, password, role);
      if (!success) setError("Registration failed or email/username already taken.");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${authBg})` }}
    >
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md scroll-card rounded-lg p-8 relative z-10"
      >
        <h1 className="font-heading text-3xl text-gold text-center mb-2">
          The Sovereign Guild
        </h1>
        <p className="text-center text-muted-foreground mb-6 font-body text-lg">
          {isLogin ? "Enter the Hall" : "Join the Guild"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isLogin ? (
            <div>
              <Label className="text-foreground">Username atau Email</Label>
              <Input
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="bg-secondary border-border"
                placeholder="Masukkan username atau email"
              />
            </div>
          ) : (
            <>
              <div>
                <Label className="text-foreground">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="bg-secondary border-border"
                />
              </div>
              <div>
                <Label className="text-foreground">Username</Label>
                <Input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  className="bg-secondary border-border"
                />
              </div>
              <div>
                <Label className="text-foreground">Role</Label>
                <div className="flex gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => setRole("guild_master")}
                    className={`flex-1 py-3 rounded-md border font-heading text-sm transition-all ${
                      role === "guild_master"
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-border text-muted-foreground hover:border-muted-foreground"
                    }`}
                  >
                    👑 Guild Master
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("adventurer")}
                    className={`flex-1 py-3 rounded-md border font-heading text-sm transition-all ${
                      role === "adventurer"
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-border text-muted-foreground hover:border-muted-foreground"
                    }`}
                  >
                    ⚔️ Adventurer
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <Label className="text-foreground">Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="bg-secondary border-border pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <p className="text-crimson text-sm">{error}</p>}

          <Button type="submit" className="w-full font-heading">
            {isLogin ? "Masuk Guild" : "Forge Your Destiny"}
          </Button>
        </form>

        <button
          onClick={() => { setIsLogin(!isLogin); setError(""); }}
          className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-gold transition-colors"
        >
          {isLogin ? "Orang Baru ? Silahkan Daftar Dulu" : "Already a member? Enter"}
        </button>
      </motion.div>
    </div>
  );
};

export default AuthScreen;