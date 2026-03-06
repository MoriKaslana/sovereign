import { motion } from "framer-motion";
import { useGame, Quest } from "@/context/GameContext";
import { Button } from "@/components/ui/button";
import { Clock, Zap, CheckCircle, Send } from "lucide-react";

const diffBadge: Record<string, string> = {
  easy: "bg-emerald/20 text-emerald-glow",
  medium: "bg-gold/20 text-gold",
  hard: "bg-crimson/20 text-crimson",
  legendary: "bg-royal-purple/20 text-royal-purple",
};

const QuestCard = ({ quest }: { quest: Quest }) => {
  const { currentUser, acceptQuest, submitQuest } = useGame();

  const timeLeft = quest.status === "submitted" ? 0 : Math.max(0, quest.deadline - Date.now());
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
  const minsLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  const glowClass = quest.status === "submitted" ? "gold-glow" : quest.status === "completed" ? "green-glow" : "";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`scroll-card rounded-lg p-5 ${glowClass} transition-shadow`}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-heading text-base text-foreground">{quest.title}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-heading capitalize ${diffBadge[quest.difficulty]}`}>
          {quest.difficulty}
        </span>
      </div>

      <p className="text-sm text-muted-foreground font-body mb-4 line-clamp-2">{quest.description}</p>

      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
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

      {quest.status === "open" && (
        <Button onClick={() => acceptQuest(quest.id)} className="w-full font-heading" size="sm">
          Accept Mission
        </Button>
      )}
      {quest.status === "accepted" && quest.assignedTo === currentUser?.id && (
        <Button onClick={() => submitQuest(quest.id)} variant="secondary" className="w-full font-heading border border-gold/30" size="sm">
          Submit for Review
        </Button>
      )}
    </motion.div>
  );
};

export default QuestCard;
