import { motion } from "framer-motion";
import { useGame } from "@/context/GameContext";
import { Trophy, Star } from "lucide-react";

const HallOfFame = () => {
  const { users, achievements, currentUser } = useGame();

  const leaderboard = [...users]
    .sort((a, b) => b.xp - a.xp);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="font-heading text-2xl text-gold mb-6">🏆 Hall of Fame</h1>

      {/* Leaderboard */}
      <div className="mb-8">
        <h2 className="font-heading text-lg text-foreground mb-3">Leaderboard</h2>
        {leaderboard.length === 0 && (
          <p className="text-muted-foreground font-body text-center py-8">No adventurers yet.</p>
        )}
        <div className="space-y-2">
          {leaderboard.map((u, i) => (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`scroll-card rounded-lg p-4 flex items-center gap-4 ${u.id === currentUser?.id ? "border-gold/40" : ""}`}
            >
              <span className="font-heading text-lg text-gold w-8 text-center">
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
              </span>
              <span className="text-2xl">{u.avatar}</span>
              <div className="flex-1">
                <div className="font-heading text-sm text-foreground">{u.username}</div>
                <div className="text-xs text-muted-foreground">Level {u.level} • {u.questsCompleted} quests</div>
              </div>
              <div className="text-right">
                <div className="font-heading text-gold text-sm">{u.xp} XP</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <h2 className="font-heading text-lg text-foreground mb-3">Achievements</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {achievements.map(a => {
          const unlocked = currentUser ? a.unlockedBy.includes(currentUser.id) : false;
          return (
            <div
              key={a.id}
              className={`scroll-card rounded-lg p-4 flex items-center gap-3 ${unlocked ? "green-glow" : "opacity-50"}`}
            >
              <span className="text-2xl">{a.icon}</span>
              <div>
                <div className="font-heading text-sm text-foreground">{a.title}</div>
                <div className="text-xs text-muted-foreground font-body">{a.description}</div>
              </div>
              {unlocked && <Star className="h-4 w-4 text-gold ml-auto" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HallOfFame;
