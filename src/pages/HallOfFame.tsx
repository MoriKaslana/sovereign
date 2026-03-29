import { motion } from "framer-motion";
import { useGame } from "@/context/GameContext";
import { Trophy, Star } from "lucide-react";

const HallOfFame = () => {
  const { users, achievements, currentUser } = useGame();

  // FILTER LOGIC: 
  // 1. Jika user punya Guild, tampilkan semua member yang Guild ID-nya sama.
  // 2. Jika user TIDAK punya Guild (Jomblo), tampilkan hanya dirinya sendiri.
  const leaderboard = [...users]
    .filter((u) => {
      if (!currentUser?.guildId) {
        return u.id === currentUser?.id; // Cuma liat diri sendiri
      }
      return u.guildId === currentUser.guildId; // Liat temen se-guild
    })
    .sort((a, b) => b.xp - a.xp);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="font-heading text-2xl text-gold mb-6">🏆 Hall of Fame</h1>

      {/* Leaderboard */}
      <div className="mb-8">
        <h2 className="font-heading text-lg text-foreground mb-3">
          {currentUser?.guildId ? "Guild Leaderboard" : "Adventurer Stats"}
        </h2>
        
        {leaderboard.length === 0 && (
          <p className="text-muted-foreground font-body text-center py-8">No adventurers in this guild yet.</p>
        )}

        <div className="space-y-2">
          {leaderboard.map((u, i) => (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`scroll-card rounded-lg p-4 flex items-center gap-4 ${
                u.id === currentUser?.id ? "border-gold/60 bg-gold/5 shadow-[0_0_15px_rgba(212,175,55,0.1)]" : "border-white/5"
              }`}
            >
              <span className="font-heading text-lg text-gold w-8 text-center">
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
              </span>
              <span className="text-2xl">{u.avatar}</span>
              <div className="flex-1">
                <div className="font-heading text-sm text-foreground flex items-center gap-2">
                  {u.username}
                  {u.id === currentUser?.id && (
                    <span className="text-[10px] bg-gold/20 text-gold px-1.5 py-0.5 rounded uppercase">You</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground font-body">
                  Level {u.level} • {u.questsCompleted} quests
                </div>
              </div>
              <div className="text-right">
                <div className="font-heading text-gold text-sm">{u.xp} XP</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Achievements Section tetap sama */}
      <h2 className="font-heading text-lg text-foreground mb-3">Your Achievements</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {achievements.map((a) => {
          const unlocked = currentUser ? a.unlockedBy.includes(currentUser.id) : false;
          return (
            <div
              key={a.id}
              className={`scroll-card rounded-lg p-4 flex items-center gap-3 transition-all ${
                unlocked ? "border-green-500/30 bg-green-500/5" : "opacity-40 grayscale"
              }`}
            >
              <span className="text-2xl">{a.icon}</span>
              <div>
                <div className={`font-heading text-sm ${unlocked ? "text-foreground" : "text-muted-foreground"}`}>
                  {a.title}
                </div>
                <div className="text-xs text-muted-foreground font-body">{a.description}</div>
              </div>
              {unlocked && <Star className="h-4 w-4 text-gold ml-auto fill-gold" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HallOfFame;