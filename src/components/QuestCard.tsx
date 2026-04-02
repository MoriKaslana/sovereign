import { motion } from "framer-motion";
import { useGame, Quest } from "@/context/GameContext";
import { Button } from "@/components/ui/button";
import { Clock, Zap, CheckCircle, Send, Swords } from "lucide-react";

const diffBadge: Record<string, string> = {
  easy: "bg-emerald/20 text-emerald-glow",
  medium: "bg-gold/20 text-gold",
  hard: "bg-crimson/20 text-crimson",
  legendary: "bg-royal-purple/20 text-royal-purple",
};

const QuestCard = ({ quest }: { quest: Quest }) => {
  // respondToDuel tetep di-destructure biar gak break, meski aksinya pindah ke Board
  const { currentUser, acceptQuest, submitQuest, users } = useGame();

  const timeLeft = quest.status === "submitted" ? 0 : Math.max(0, quest.deadline - Date.now());
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
  const minsLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  // --- LOGIKA VISUAL DUEL ---
  // Quest jadi merah kalau statusnya duel dan sudah diterima (accepted)
  const isDuelActive = quest.isDuel && quest.duelStatus === 'accepted';
  
  const glowClass = quest.status === "submitted" ? "gold-glow" : quest.status === "completed" ? "green-glow" : "";
  
  // Gabungkan class: kalau duel aktif, kasih border crimson dan bg merah tipis
  const cardStyle = isDuelActive 
    ? "border-crimson bg-crimson/5 shadow-[0_0_15px_rgba(220,38,38,0.2)]" 
    : `border-white/5 bg-card/50 ${glowClass}`;

  // Cari nama lawan (siapa yang ditantang atau siapa penantangnya)
  const opponentId = quest.challengerId === currentUser?.id ? quest.duelOpponentId : quest.challengerId;
  const opponentName = users.find(u => u.id === opponentId)?.username || "Lawan";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`scroll-card rounded-lg p-5 border transition-all relative ${cardStyle}`}
    >
      {/* IKON PEDANG MELAYANG (Hanya muncul kalau lagi duel & status accepted) */}
      {isDuelActive && (
        <div className="absolute -top-3 -right-3 bg-crimson p-2 rounded-full shadow-lg z-10 animate-pulse border border-white/20">
          <Swords className="h-4 w-4 text-white" />
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex flex-col gap-1">
          <h3 className="font-heading text-base text-foreground line-clamp-1">{quest.title}</h3>
          
          {/* Label Info Duel di bawah judul */}
          {isDuelActive && (
            <span className="text-[10px] text-crimson font-bold uppercase tracking-tighter flex items-center gap-1">
              ⚔️ Duel vs @{opponentName}
            </span>
          )}
          
          {/* Status Pending (Hanya teks info, tombol sudah di hapus untuk pindah ke Scroll) */}
          {quest.isDuel && quest.duelStatus === 'pending' && (
            <span className="text-[10px] text-gold/60 italic font-body">
              {quest.challengerId === currentUser?.id ? "⌛ Menunggu Lawan..." : "📩 Tantangan Duel Masuk!"}
            </span>
          )}
        </div>
        
        <span className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-widest font-bold ${diffBadge[quest.difficulty]}`}>
          {quest.difficulty}
        </span>
      </div>

      <p className="text-sm text-muted-foreground font-body mb-4 line-clamp-2">{quest.description}</p>

      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4 font-body">
        <span className="flex items-center gap-1">
          <Zap className="h-3 w-3 text-gold" /> {quest.xpReward} XP
        </span>
        {quest.status !== "completed" && quest.status !== "submitted" && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeLeft > 0 ? `${hoursLeft}h ${minsLeft}m` : "Overdue!"}
          </span>
        )}
        {quest.status === "submitted" && (
          <span className="flex items-center gap-1 text-gold">
            <Send className="h-3 w-3" /> Timer Frozen
          </span>
        )}
        {quest.status === "completed" && (
          <span className="flex items-center gap-1 text-emerald-glow">
            <CheckCircle className="h-3 w-3" /> Completed
          </span>
        )}
      </div>

      {/* FOOTER BUTTONS */}
      {quest.status === "open" && !quest.isDuel && (
        <Button onClick={() => acceptQuest(quest.id)} className="w-full font-heading" size="sm">
          Terima Tugas
        </Button>
      )}

      {quest.status === "accepted" && quest.assignedTo === currentUser?.id && (
        <Button 
          onClick={() => submitQuest(quest.id)} 
          variant={isDuelActive ? "destructive" : "secondary"} 
          className={`w-full font-heading border ${isDuelActive ? 'bg-crimson hover:bg-red-700 border-white/20' : 'border-gold/30'}`} 
          size="sm"
        >
          {isDuelActive ? "Finish Duel!" : "Kumpulkan Tugas"}
        </Button>
      )}
    </motion.div>
  );
};

export default QuestCard;