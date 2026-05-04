import { useState } from "react";
import { motion } from "framer-motion";
import { useGame } from "@/context/GameContext";
import { Trophy, Star, ShieldAlert, Swords } from "lucide-react"; // <- TAMBAH SWORDS
import { Button } from "@/components/ui/button";
import ExileDialog from "@/components/ExiledDialog"; 
import { User } from "@/types/game";
import { toast } from "sonner";

const HallOfFame = () => {
  const { users, achievements, currentUser, kickMember, quests, sendDuelChallenge } = useGame();
  
  // --- STATE FOR RPG EXILE DIALOG ---
  const [isExileDialogOpen, setIsExileDialogOpen] = useState(false);
  const [memberToExile, setMemberToExile] = useState<User | null>(null);

  // FILTER LOGIC: 
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
        Aula
      </h1>

      {/* Leaderboard Section */}
      <div className="mb-8">
        <h2 className="font-heading text-lg text-foreground mb-3 flex justify-between items-center">
          <span>{currentUser?.guildId ? "Ranking Guild" : "Adventurer Stats"}</span>
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
                
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="text-xs text-muted-foreground font-body">
                    Level {u.level} • {u.questsCompleted} Tugas
                  </div>
                  
                  {u.achievements && u.achievements.length > 0 && (
                    <div className="flex gap-1 ml-2 border-l border-white/10 pl-2">
                      {u.achievements.map((title, idx) => {
                        const achData = achievements.find(a => a.title === title || a.id === title);
                        return achData ? (
                          <span key={idx} title={achData.title} className="text-[10px] grayscale hover:grayscale-0 cursor-help transition-all">
                            {achData.icon}
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              </div>
              
              {/* KOLOM AKSI (EXILE & DUEL) */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-heading text-gold text-sm">{u.xp} XP</div>
                  <div className="text-[10px] text-muted-foreground">🏆 {u.achievements?.length || 0} Prestasi</div>
                </div>

                <div className="flex items-center gap-1">
                  {/* TOMBOL EXILE (GM ONLY) */}
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

                  {/* TOMBOL DUEL (MUNCUL UNTUK USER LAIN) */}
                  {u.id !== currentUser?.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gold/60 hover:text-gold hover:bg-gold/10 transition-colors"
                      onClick={() => {
                        // Cari apakah lo punya quest yang berstatus 'accepted'
                        const myQuest = quests.find(q => q.assignedTo === currentUser?.id && q.status === "accepted");
                        if (!myQuest) {
                          toast.error("Kamu harus mengambil (Accept) minimal 1 quest dulu untuk menantang!");
                          return;
                        }
                        sendDuelChallenge(myQuest.id, u.id);
                      }}
                      title="Tantang Duel"
                    >
                      <Swords className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-12">
        <h2 className="font-heading text-lg text-foreground mb-4 flex items-center gap-2">
          <Star className="h-5 w-5 text-gold" />
          Prestasi
        </h2>
        
        <div className="grid gap-3 md:grid-cols-2">
          {achievements.map((a, i) => {
            const isUnlockedInProfile = currentUser?.achievements?.some((userAch) => {
              const normalizedDb = userAch.toLowerCase().replace(/_/g, " ").trim();
              const normalizedTitle = a.title.toLowerCase().replace(/_/g, " ").trim();
              const normalizedId = a.id.toLowerCase().replace(/_/g, " ").trim();

              return normalizedDb === normalizedTitle || normalizedDb === normalizedId;
            });
            const isUnlockedByState = a.unlockedBy?.includes(currentUser?.id || "");
            const unlocked = isUnlockedInProfile || isUnlockedByState;
            
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
      </div>

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