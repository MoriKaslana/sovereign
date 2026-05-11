import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useGame } from "@/context/GameContext";
import { Shield, Zap, Trophy, Flame } from "lucide-react";
import { TutorialOverlay } from "@/components/TutorialOverlay";

const Profile = () => {
  const { currentUser, changeAvatar, availableAvatars, quests } = useGame();
  
  // --- STATE TUTORIAL ---
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (currentUser) {
      const hasSeen = localStorage.getItem(`profile_tutorial_done_${currentUser.id}`);
      if (!hasSeen) {
        setShowTutorial(true);
      }
    }
  }, [currentUser]);

  const nextStep = () => {
    if (tutorialStep < 2) {
      setTutorialStep(s => s + 1);
    } else {
      finishTutorial();
    }
  };

  const prevStep = () => {
    setTutorialStep(s => s - 1);
  };

  const finishTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem(`profile_tutorial_done_${currentUser?.id}`, "true");
  };

  if (!currentUser) return null;

  const myQuests = quests.filter(q => q.assignedTo === currentUser.id);
  const completed = myQuests.filter(q => q.status === "completed").length;
  const active = myQuests.filter(q => q.status === "accepted").length;

  const xpProgress = (currentUser.xp % 200) / 200 * 100;

  const tutorialSteps = [
    {
      targetId: "profile-stats",
      title: "Statistik Petualang",
      text: "Di sini kamu bisa melihat pencapaianmu. XP dikumpulkan dari Quest, Level menunjukkan kekuatanmu, dan statistik tugas mencatat rekam jejak petualanganmu."
    },
    {
      targetId: "profile-status-effects",
      title: "Efek Status",
      text: "Hati-hati dengan Debuff! Jika kamu gagal mengerjakan Quest tepat waktu, kamu mungkin terkena hukuman. Sebaliknya, selesaikan Quest beruntun untuk mendapatkan Buff spesial!"
    },
    {
      targetId: "profile-avatar-picker",
      title: "Identitas Visual",
      text: "Bosan dengan tampilan lama? Pilih Avatar baru yang sesuai dengan kepribadian pahlawanmu di sini."
    }
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <TutorialOverlay 
        isOpen={showTutorial}
        targetId={tutorialSteps[tutorialStep].targetId}
        title={tutorialSteps[tutorialStep].title}
        text={tutorialSteps[tutorialStep].text}
        currentStep={tutorialStep}
        totalSteps={tutorialSteps.length}
        onNext={nextStep}
        onPrev={prevStep}
        onSkip={finishTutorial}
      />

      <h1 className="font-heading text-2xl text-gold mb-6">👤 Profile</h1>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="scroll-card rounded-lg p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <span className="text-5xl">{currentUser.avatar}</span>
          <div>
            <h2 className="font-heading text-xl text-foreground">{currentUser.username}</h2>
            <p className="text-sm text-gold font-heading capitalize">
              {currentUser.role === "guild_master" ? "👑 Guild Master" : "⚔️ Adventurer"}
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 gap-4 mb-6" id="profile-stats">
          <StatBox icon={<Zap className="h-4 w-4 text-gold" />} label="XP" value={currentUser.xp} />
          <StatBox icon={<Shield className="h-4 w-4 text-emerald-glow" />} label="Level" value={currentUser.level} />
          <StatBox icon={<Trophy className="h-4 w-4 text-gold" />} label="Completed" value={completed} />
          <StatBox icon={<Flame className="h-4 w-4 text-crimson" />} label="Active" value={active} />
        </div>

        {/* XP Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Level {currentUser.level}</span>
            <span>Level {currentUser.level + 1}</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gold rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
            />
          </div>
        </div>

        {/* Buffs & Debuffs Section */}
        <div id="profile-status-effects">
          {(currentUser.buffs.length > 0 || currentUser.debuffs.length > 0) ? (
            <>
              {currentUser.buffs.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-heading text-sm text-emerald-glow mb-2">✨ Active Buffs</h3>
                  <div className="flex flex-wrap gap-2">
                    {currentUser.buffs.map(b => (
                      <span key={b} className="text-xs px-2 py-1 rounded-full bg-emerald/20 text-emerald-glow font-heading border border-emerald-glow/20">{b}</span>
                    ))}
                  </div>
                </div>
              )}
              {currentUser.debuffs.length > 0 && (
                <div>
                  <h3 className="font-heading text-sm text-crimson mb-2">💀 Active Debuffs</h3>
                  <div className="flex flex-wrap gap-2">
                    {currentUser.debuffs.map(d => (
                      <span key={d} className="text-xs px-2 py-1 rounded-full bg-crimson/20 text-crimson font-heading border border-crimson/20">{d}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-[10px] text-muted-foreground italic text-center py-2 opacity-50">
              Tidak ada efek status aktif saat ini.
            </p>
          )}
        </div>
      </motion.div>

      {/* Avatar Selection Section */}
      <div className="scroll-card rounded-lg p-6" id="profile-avatar-picker">
        <h3 className="font-heading text-lg text-gold mb-3">Ganti Avatar</h3>
        <div className="flex flex-wrap gap-3">
          {availableAvatars.map(a => (
            <button
              key={a}
              onClick={() => changeAvatar(a)}
              className={`text-3xl p-2 rounded-lg transition-all ${
                currentUser.avatar === a ? "bg-gold/20 ring-2 ring-gold" : "hover:bg-secondary"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatBox = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => (
  <div className="parchment-bg rounded-lg p-3 flex items-center gap-3 border border-white/5">
    {icon}
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-heading text-foreground">{value}</div>
    </div>
  </div>
);

export default Profile;