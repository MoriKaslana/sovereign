import { useGame } from "@/context/GameContext";
import { Progress } from "@/components/ui/progress";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Shield, Flame, Zap, Clock, Skull, Wrench, Target, Swords, Moon, Link2, Sparkles, ShieldOff, Ghost, Ban } from "lucide-react";

const BUFF_INFO: Record<string, { icon: React.ReactNode; color: string; desc: string; effect: string; duration: string }> = {
  "Adventurer's Haste": { icon: <Zap className="h-3.5 w-3.5" />, color: "text-gold bg-gold/15 border-gold/30", desc: "Submitted 24h+ before deadline.", effect: "+50% XP Bonus", duration: "24 hours" },
  "Scholar's Focus": { icon: <Shield className="h-3.5 w-3.5" />, color: "text-emerald-glow bg-emerald/15 border-emerald/30", desc: "Completed a Hard or Legendary quest.", effect: "+20% XP Bonus", duration: "24 hours" },
  "Weekend Warrior": { icon: <Flame className="h-3.5 w-3.5" />, color: "text-royal-purple bg-royal-purple/15 border-royal-purple/30", desc: "Submitted on a weekend.", effect: "+10% XP Bonus", duration: "24 hours" },
  "Night Owl": { icon: <Moon className="h-3.5 w-3.5" />, color: "text-royal-purple bg-royal-purple/15 border-royal-purple/30", desc: "Submitted between midnight and 5 AM.", effect: "Recognition buff", duration: "24 hours" },
  "Clutch Player": { icon: <Target className="h-3.5 w-3.5" />, color: "text-gold bg-gold/15 border-gold/30", desc: "Submitted within last 10% of time.", effect: "Recognition buff", duration: "24 hours" },
  "First Strike": { icon: <Swords className="h-3.5 w-3.5" />, color: "text-emerald-glow bg-emerald/15 border-emerald/30", desc: "Completed within 1 hour of accepting.", effect: "Recognition buff", duration: "24 hours" },
  "Chain Quest": { icon: <Link2 className="h-3.5 w-3.5" />, color: "text-gold bg-gold/15 border-gold/30", desc: "Submitted 3 quests within 24 hours.", effect: "+15% XP Bonus", duration: "24 hours" },
  "Aura of Purity": { icon: <Sparkles className="h-3.5 w-3.5" />, color: "text-gold bg-gold/15 border-gold/30", desc: "Completed a Legendary quest.", effect: "Clears all debuffs + immunity to next debuff", duration: "24 hours" },
};

const DEBUFF_INFO: Record<string, { icon: React.ReactNode; color: string; desc: string; effect: string; duration: string }> = {
  "Cursed Procrastination": { icon: <Clock className="h-3.5 w-3.5" />, color: "text-crimson bg-crimson/15 border-crimson/30", desc: "Submitted after the deadline.", effect: "-10 XP Penalty", duration: "48 hours" },
  "Slacker's Fatigue": { icon: <Skull className="h-3.5 w-3.5" />, color: "text-crimson bg-crimson/15 border-crimson/30", desc: "More than 5 active quests.", effect: "-5% XP on next quest", duration: "24 hours" },
  "Rusty Equipment": { icon: <Wrench className="h-3.5 w-3.5" />, color: "text-crimson bg-crimson/15 border-crimson/30", desc: "No activity for 3 days.", effect: "Avatar greyscale, all buffs disabled until 1 quest completed", duration: "Until quest completed" },
  "Broken Shield": { icon: <ShieldOff className="h-3.5 w-3.5" />, color: "text-crimson bg-crimson/15 border-crimson/30", desc: "Guild Master rejected your quest.", effect: "-25% XP when that quest is finally approved", duration: "48 hours" },
  "Stagnant Soul": { icon: <Ban className="h-3.5 w-3.5" />, color: "text-crimson bg-crimson/15 border-crimson/30", desc: "3 consecutive late submissions.", effect: "ALL buff/multipliers blocked for 3 quests", duration: "3 completed quests" },
};

const PlayerStatusBar = () => {
  const { currentUser } = useGame();
  if (!currentUser) return null;

  const xpForCurrentLevel = (currentUser.level - 1) * 200;
  const xpForNextLevel = currentUser.level * 200;
  const xpProgress = currentUser.xp - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const progressPercent = Math.min(100, (xpProgress / xpNeeded) * 100);

  const allBuffs = currentUser.buffs || [];
  const allDebuffs = currentUser.debuffs || [];
  const hasStagnantSoul = allDebuffs.includes("Stagnant Soul");

  const getTimeRemaining = (name: string, isDebuff: boolean) => {
    if (isDebuff) {
      const entry = currentUser.activeDebuffs?.find(e => e.name === name);
      if (!entry) return null;
      if (entry.remainingQuests) return `${entry.remainingQuests} quest(s) remaining`;
      if (!entry.expiresAt) return "Until condition cleared";
      const remaining = entry.expiresAt - Date.now();
      if (remaining <= 0) return "Expiring...";
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${mins}m remaining`;
    }
    const entry = currentUser.activeBuffs?.find(e => e.name === name);
    // PENGAMAN: Jika entry tidak ditemukan (misal pencapaian permanen), return teks default agar tidak crash
    if (!entry) return "Until condition cleared"; 
    if (!entry.expiresAt) return "Until condition cleared";
    const remaining = entry.expiresAt - Date.now();
    if (remaining <= 0) return "Expiring...";
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m remaining`;
  };

  return (
    <div className="flex items-center gap-3">
      {(allBuffs.length > 0 || allDebuffs.length > 0) && (
        <div className="flex items-center gap-1">
          {allBuffs.map((buff) => {
            const info = BUFF_INFO[buff] || { icon: <Zap className="h-3.5 w-3.5" />, color: "text-gold bg-gold/15 border-gold/30", desc: buff, effect: "Buff", duration: "Unknown" };
            const timeLeft = getTimeRemaining(buff, false);
            return (
              <HoverCard key={buff} openDelay={200} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-heading cursor-default ${info.color}`}>
                    {info.icon}
                    <span className="hidden lg:inline">{buff}</span>
                  </span>
                </HoverCardTrigger>
                <HoverCardContent side="bottom" className="w-64 bg-card border-border p-3">
                  <div className="space-y-1.5">
                    <p className="font-heading text-sm text-gold flex items-center gap-1.5">{info.icon} {buff}</p>
                    <p className="text-xs text-muted-foreground font-body">{info.desc}</p>
                    <div className="flex items-center gap-1.5 bg-emerald/10 rounded px-2 py-1 border border-emerald/20">
                      <span className="text-[10px] font-heading text-emerald-glow">EFFECT:</span>
                      <span className="text-xs text-foreground font-body">{info.effect}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-gold/10 rounded px-2 py-1 border border-gold/20">
                      <span className="text-[10px] font-heading text-gold">⏱️</span>
                      <span className="text-xs text-foreground font-body">{timeLeft || info.duration}</span>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            );
          })}
          {allDebuffs.map((debuff) => {
            const info = DEBUFF_INFO[debuff] || { icon: <Ghost className="h-3.5 w-3.5" />, color: "text-crimson bg-crimson/15 border-crimson/30", desc: debuff, effect: "Debuff", duration: "Unknown" };
            const timeLeft = getTimeRemaining(debuff, true);
            return (
              <HoverCard key={debuff} openDelay={200} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-heading cursor-default ${info.color}`}>
                    {info.icon}
                    <span className="hidden lg:inline">{debuff}</span>
                  </span>
                </HoverCardTrigger>
                <HoverCardContent side="bottom" className="w-64 bg-card border-border p-3">
                  <div className="space-y-1.5">
                    <p className="font-heading text-sm text-crimson flex items-center gap-1.5">{info.icon} {debuff}</p>
                    <p className="text-xs text-muted-foreground font-body">{info.desc}</p>
                    <div className="flex items-center gap-1.5 bg-crimson/10 rounded px-2 py-1 border border-crimson/20">
                      <span className="text-[10px] font-heading text-crimson">EFFECT:</span>
                      <span className="text-xs text-foreground font-body">{info.effect}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-crimson/10 rounded px-2 py-1 border border-crimson/20">
                      <span className="text-[10px] font-heading text-crimson">⏱️</span>
                      <span className="text-xs text-foreground font-body">{timeLeft || info.duration}</span>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            );
          })}
        </div>
      )}

      {/* XP Bar */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-default relative">
            <span className="font-heading text-xs text-gold whitespace-nowrap">
              Lv.{currentUser.level}
            </span>
            <div className="w-24 sm:w-32 relative">
              {hasStagnantSoul && (
                <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                  <span className="text-[8px] font-heading text-crimson opacity-80">⛓️</span>
                </div>
              )}
              <Progress value={progressPercent} className={`h-2 bg-secondary [&>div]:bg-gradient-to-r [&>div]:from-gold [&>div]:to-gold-glow ${hasStagnantSoul ? "opacity-60" : ""}`} />
            </div>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap font-body">
              {xpProgress}/{xpNeeded}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-card border-border">
          <p className="text-xs">Total XP: {currentUser.xp} · Next level at {xpForNextLevel} XP</p>
          {hasStagnantSoul && <p className="text-xs text-crimson">⛓️ Stagnant Soul: Buffs blocked for {currentUser.stagnantSoulCounter} more quest(s)</p>}
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default PlayerStatusBar;