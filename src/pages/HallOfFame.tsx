import { useState } from "react";
import { motion } from "framer-motion";
import { useGame } from "@/context/GameContext";
import { Trophy, Star, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import ExileDialog from "@/components/ExiledDialog"; 
import { User } from "@/context/GameContext";

const HallOfFame = () => {
  const { users, achievements, currentUser, kickMember } = useGame();
  
  // --- STATE FOR RPG EXILE DIALOG ---
  const [isExileDialogOpen, setIsExileDialogOpen] = useState(false);
  const [memberToExile, setMemberToExile] = useState<User | null>(null);

  // FILTER LOGIC: 
  // 1. Jika user punya Guild, tampilkan semua member yang Guild ID-nya sama.
  // 2. Jika user TIDAK punya Guild, tampilkan hanya dirinya sendiri.
  const leaderboard = [...users]
    .filter((u) => {
      if (!currentUser?.guildId) {
        return u.id === currentUser?.id; 
      }
      return u.guildId === currentUser.guildId; 
    })
    .sort((a, b) => b.xp - a.xp);

  // --- HANDLERS ---
  const openExileConfirmation = (user: User) => {
    setMemberToExile(user);
    setIsExileDialogOpen(true);
  };

  const closeExileDialog = () => {
    setIsExileDialogOpen(false);
    setTimeout(() => setMemberToExile(null), 300);
  };

  const confirmExile = () => {
    if (memberToExile) {
      kickMember(memberToExile.id);
      closeExileDialog();
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="font-heading text-2xl text-gold mb-6 flex items-center gap-2">
        <Trophy className="h-6 w-6" />
        Hall of Fame
      </h1>

      {/* Leaderboard Section */}
      <div className="mb-8">
        <h2 className="font-heading text-lg text-foreground mb-3 flex justify-between items-center">
          <span>{currentUser?.guildId ? "Guild Leaderboard" : "Adventurer Stats"}</span>
          {currentUser?.role === "guild_master" && (
            <span className="text-[10px] text-gold border border-gold/30 px-2 py-1 rounded tracking-widest font-bold bg-gold/5">
              GM MODE
            </span>
          )}
        </h2>
        
        {leaderboard.length === 0 && (
          <p className="text-muted-foreground font-body text-center py-8 border border-dashed border-white/10 rounded-lg">
            No adventurers in this guild yet.
          </p>
        )}

        <div className="space-y-2">
          {leaderboard.map((u, i) => (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`scroll-card rounded-lg p-4 flex items-center gap-4 border transition-all ${
                u.id === currentUser?.id 
                  ? "border-gold/60 bg-gold/5 shadow-[0_0_15px_rgba(212,175,55,0.1)]" 
                  : "border-white/5 bg-card/50"
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
                    <span className="text-[10px] bg-gold/20 text-gold px-1.5 py-0.5 rounded uppercase font-bold">You</span>
                  )}
                  {u.role === "guild_master" && (
                    <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded uppercase font-bold">GM</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground font-body">
                  Level {u.level} • {u.questsCompleted} quests
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-heading text-gold text-sm">{u.xp} XP</div>
                </div>

                {/* Tombol Kick (Hanya untuk GM dan bukan untuk diri sendiri) */}
                {currentUser?.role === "guild_master" && u.id !== currentUser.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    onClick={() => openExileConfirmation(u)}
                  >
                    <ShieldAlert className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Achievements Section */}
      <div className="mt-12">
        <h2 className="font-heading text-lg text-foreground mb-4 flex items-center gap-2">
          <Star className="h-5 w-5 text-gold" />
          Your Achievements
        </h2>
        
        <div className="grid gap-3 md:grid-cols-2">
          {achievements.map((a, i) => {
            const unlocked = currentUser ? a.unlockedBy.includes(currentUser.id) : false;
            
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + (i * 0.05) }}
                className={`scroll-card rounded-lg p-4 flex items-center gap-3 transition-all border ${
                  unlocked 
                    ? "border-green-500/30 bg-green-500/5 shadow-[0_0_10px_rgba(34,197,94,0.05)]" 
                    : "opacity-40 grayscale border-white/5 bg-white/[0.02]"
                }`}
              >
                <div className={`text-3xl p-2 rounded-full ${unlocked ? "bg-green-500/10" : "bg-white/5"}`}>
                  {a.icon}
                </div>
                <div className="flex-1">
                  <div className={`font-heading text-sm ${unlocked ? "text-foreground" : "text-muted-foreground"}`}>
                    {a.title}
                  </div>
                  <div className="text-xs text-muted-foreground font-body leading-tight">
                    {a.description}
                  </div>
                </div>
                {unlocked && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto"
                  >
                    <Star className="h-4 w-4 text-gold fill-gold" />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {achievements.length === 0 && (
          <p className="text-muted-foreground text-center py-10 font-body border border-dashed border-white/10 rounded-lg">
            The scrolls of achievement are currently empty.
          </p>
        )}
      </div>

      {/* RPG EXILE DIALOG COMPONENT */}
      <ExileDialog
        isOpen={isExileDialogOpen}
        onClose={closeExileDialog}
        onConfirm={confirmExile}
        member={memberToExile}
      />
    </div>
  );
};

export default HallOfFame;