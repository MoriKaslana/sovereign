import { useState, useEffect } from "react"; // Tambah useState & useEffect
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/context/GameContext";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Zap } from "lucide-react";
import { TutorialOverlay } from "@/components/TutorialOverlay"; // Import overlay

const ReviewBoard = () => {
  const { quests, users, approveQuest, rejectQuest, currentUser } = useGame();

  // --- LOGIKA TUTORIAL ---
  const [showTutorial, setShowTutorial] = useState(false);
  
  useEffect(() => {
    if (currentUser?.role === "guild_master") {
      const hasSeen = localStorage.getItem(`gm_review_tutorial_done_${currentUser.id}`);
      if (!hasSeen) {
        setShowTutorial(true);
      }
    }
  }, [currentUser]);

  const finishTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem(`gm_review_tutorial_done_${currentUser?.id}`, "true");
  };

  if (currentUser?.role !== "guild_master") {
    return <div className="p-6 text-muted-foreground">Access denied.</div>;
  }

  const submitted = quests.filter(q => q.status === "submitted");

  return (
    <div className="p-6 max-w-4xl mx-auto relative">
      {/* Tutorial Overlay - Cuma 1 Step */}
      <TutorialOverlay 
        isOpen={showTutorial}
        targetId="review-list"
        title="Singgasana Keadilan"
        text="Di sinilah Anda menentukan nasib para adventurer. Tinjau laporan mereka: Terima jika layak mendapat XP, atau Tolak jika laporannya kurang memuaskan. Keputusan ada di tangan Anda, Guild Master!"
        currentStep={0}
        totalSteps={1}
        onNext={finishTutorial}
        onPrev={() => {}}
        onSkip={finishTutorial}
      />

      <h1 className="font-heading text-2xl text-gold mb-6">⚖️ Papan Ulasan</h1>

      {submitted.length === 0 && (
        <p className="text-muted-foreground font-body text-center py-12">
          Tidak ada tugas yang sedang menunggu ulasan.
        </p>
      )}

      {/* ID review-list dipasang di sini sebagai target spotlight */}
      <div className="space-y-4" id="review-list">
        <AnimatePresence>
          {submitted.map(q => {
            const adventurer = users.find(u => u.id === q.assignedTo);
            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="scroll-card gold-glow rounded-lg p-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-heading text-foreground">{q.title}</h3>
                    <p className="text-sm text-muted-foreground font-body mt-1">{q.description}</p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                      <span>Submitted by: <strong className="text-gold">@{adventurer?.username || "Unknown"}</strong></span>
                      <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-gold" /> {q.xpReward} XP</span>
                      {q.wasRejected && (
                        <span className="text-crimson font-heading">🛡️💔 Previously Rejected</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button onClick={() => rejectQuest(q.id)} variant="outline" className="font-heading border-crimson/30 text-crimson hover:bg-crimson/10" size="sm">
                      <XCircle className="h-4 w-4 mr-1" /> Tolak
                    </Button>
                    <Button onClick={() => approveQuest(q.id)} className="font-heading" size="sm">
                      <CheckCircle className="h-4 w-4 mr-1" /> Terima
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ReviewBoard;