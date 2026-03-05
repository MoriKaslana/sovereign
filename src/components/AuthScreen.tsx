import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame, Role } from "@/context/GameContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import authBg from "@/assets/auth-bg.jpg";

const AuthScreen = () => {
  const { login, register } = useGame();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("adventurer");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (isLogin) {
      if (!login(username, password)) setError("Invalid credentials.");
    } else {
      if (!register(email, username, password, role)) setError("Email already registered.");
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
              <Label className="text-foreground">Username</Label>
              <Input
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="bg-secondary border-border"
                placeholder="Enter your username"
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
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="bg-secondary border-border"
            />
          </div>

          {error && <p className="text-crimson text-sm">{error}</p>}

          <Button type="submit" className="w-full font-heading">
            {isLogin ? "Enter the Hall" : "Forge Your Destiny"}
          </Button>
        </form>

        <button
          onClick={() => { setIsLogin(!isLogin); setError(""); }}
          className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-gold transition-colors"
        >
          {isLogin ? "New here? Join the Guild" : "Already a member? Enter"}
        </button>
      </motion.div>
    </div>
  );
};

export default AuthScreen;
