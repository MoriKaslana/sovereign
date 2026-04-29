// src/context/services/gamificationService.ts
import { User, Quest, BuffEntry, DebuffEntry, QuestDifficulty } from "@/types/game";
import { toast } from "sonner";

// --- KONSTANTA GAME ---
export const XP_MAP: Record<QuestDifficulty, number> = { 
  easy: 50, 
  medium: 100, 
  hard: 200, 
  legendary: 500 
};

export const DUEL_PENALTY: Record<QuestDifficulty, number> = { 
  easy: 50, 
  medium: 150, 
  hard: 300, 
  legendary: 600 
};

export const BUFF_DURATION = 24 * 60 * 60 * 1000; 
export const CHAIN_WINDOW = 24 * 60 * 60 * 1000; 
export const XP_PER_LEVEL = 200;
export const AVATARS = ["⚔️", "🛡️", "🧙", "🏹", "🗡️", "🔮", "🐉", "🦅", "🐺", "🦁"];

// --- LOGIKA UTAMA ---
export const gamificationService = {
  
  // 1. Kalkulasi Level berdasarkan total XP
  calcLevel: (xp: number): number => Math.floor(xp / XP_PER_LEVEL) + 1,

  // 2. Membersihkan efek Buff/Debuff yang sudah expired
  cleanExpiredEffects: (user: User): User => {
    const now = Date.now();
    const activeBuffs = user.activeBuffs.filter(b => !b.expiresAt || b.expiresAt > now);
    const activeDebuffs = user.activeDebuffs.filter(d => {
      if (d.expiresAt && d.expiresAt <= now) return false;
      if (d.remainingQuests !== undefined && d.remainingQuests <= 0) return false;
      return true;
    });

    return {
      ...user,
      buffs: activeBuffs.map(b => b.name),
      debuffs: activeDebuffs.map(d => d.name),
      activeBuffs,
      activeDebuffs,
      rustyEquipment: activeDebuffs.some(d => d.name === "Rusty Equipment"),
      stagnantSoulCounter: activeDebuffs.find(d => d.name === "Stagnant Soul")?.remainingQuests || 0,
    };
  },

  // 3. Menambahkan Buff ke User
  addBuff: (user: User, name: string, durationMs: number | null, questId?: string): User => {
    if (user.activeBuffs.find(b => b.name === name)) return user;
    const now = Date.now();
    const entry: BuffEntry = { name, appliedAt: now, expiresAt: durationMs ? now + durationMs : null, questId };
    
    const newBuffs = Array.from(new Set([...user.buffs, name]));
    return { 
      ...user, 
      buffs: newBuffs, 
      activeBuffs: [...user.activeBuffs, entry] 
    };
  },

  // 4. Menambahkan Debuff ke User (dengan cek Immunity)
  addDebuff: (user: User, name: string, durationMs: number | null, questId?: string, remainingQuests?: number): User => {
    if (user.debuffImmunity) {
      toast.info("🛡️ Aura of Purity blocked a debuff!", { 
        description: `${name} was prevented by your golden shield.` 
      });
      return { ...user, debuffImmunity: false };
    }
    
    if (user.activeDebuffs.find(d => d.name === name)) return user;
    const now = Date.now();
    const entry: DebuffEntry = { name, appliedAt: now, expiresAt: durationMs ? now + durationMs : null, questId, remainingQuests };
    
    const newDebuffs = Array.from(new Set([...user.debuffs, name]));
    return { 
      ...user, 
      debuffs: newDebuffs, 
      activeDebuffs: [...user.activeDebuffs, entry] 
    };
  },

  // 5. Menghitung XP akhir setelah modifikasi Buff & Debuff
  calcXpWithModifiers: (user: User, quest: Quest) => {
    const baseXp = quest.xpReward || XP_MAP[quest.difficulty] || 0;
    const bonuses: { name: string; amount: number }[] = [];
    const penalties: { name: string; amount: number }[] = [];
    const buffsBlocked = user.stagnantSoulCounter > 0 || user.rustyEquipment;

    if (!buffsBlocked) {
      if (user.buffs.includes("Adventurer's Haste")) bonuses.push({ name: "Adventurer's Haste (+50%)", amount: Math.floor(baseXp * 0.5) });
      if (user.buffs.includes("Scholar's Focus")) bonuses.push({ name: "Scholar's Focus (+20%)", amount: Math.floor(baseXp * 0.2) });
      if (user.buffs.includes("Weekend Warrior")) bonuses.push({ name: "Weekend Warrior (+10%)", amount: Math.floor(baseXp * 0.1) });
      if (user.buffs.includes("Chain Quest")) bonuses.push({ name: "Chain Quest (+15%)", amount: Math.floor(baseXp * 0.15) });
    }

    if (user.debuffs.includes("Cursed Procrastination")) penalties.push({ name: "Cursed Procrastination", amount: 10 });
    if (user.debuffs.includes("Slacker's Fatigue")) penalties.push({ name: "Slacker's Fatigue (-5%)", amount: Math.floor(baseXp * 0.05) });
    if (user.brokenShieldQuests.includes(quest.id)) penalties.push({ name: "Broken Shield (-25%)", amount: Math.floor(baseXp * 0.25) });

    const totalBonus = bonuses.reduce((sum, b) => sum + b.amount, 0);
    const totalPenalty = penalties.reduce((sum, p) => sum + p.amount, 0);
    const totalXp = Math.max(0, baseXp + totalBonus - totalPenalty);

    return { baseXp, bonuses, penalties, totalXp };
  }
};