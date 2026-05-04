import { User, Quest } from "@/types/game";

export const achievementService = {
  checkAchievements: (
    user: User, 
    allQuests: Quest[], 
    currentQuest?: Quest, 
    chatCount?: number // Kita tambahin param opsional buat jumlah chat
  ): string[] => {
    const newlyEarned: string[] = [];
    const currentAch = user.achievements || [];

    const addIfNew = (id: string) => {
      if (!currentAch.includes(id)) newlyEarned.push(id);
    };

    // --- LOGIC QUEST & LEVEL ---
    if (user.questsCompleted >= 1) addIfNew("First Quest");
    if (user.level >= 5) addIfNew("Rising Star");
    if (user.level >= 10) addIfNew("Level 10");
    if (user.questsCompleted >= 5) addIfNew("Elite Contributor");
    if (user.questsCompleted >= 10) addIfNew("Veteran");

    // --- LOGIC SPESIFIK QUEST ---
    if (currentQuest) {
      if (currentQuest.difficulty === 'legendary') addIfNew("Legendary Slayer");
      
      if (currentQuest.submittedAt) {
        const hour = new Date(currentQuest.submittedAt).getHours();
        if (hour >= 0 && hour < 5) addIfNew("Night Owl");
      }

      if (currentQuest.acceptedAt && currentQuest.submittedAt) {
        const duration = currentQuest.submittedAt - currentQuest.acceptedAt;
        if (duration <= 60 * 60 * 1000) addIfNew("Speed Demon");
      }
    }

    // --- LOGIC KOMPLEKS ---
    const completed = allQuests.filter(q => q.assignedTo === user.id && q.status === 'completed');
    const diffs = new Set(completed.map(q => q.difficulty));
    if (diffs.has('easy') && diffs.has('medium') && diffs.has('hard') && diffs.has('legendary')) {
      addIfNew("Jack of All Trades");
    }

    const lastThree = completed.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0)).slice(0, 3);
    if (lastThree.length === 3 && user.activeDebuffs.length === 0) {
      addIfNew("Hat Trick");
      addIfNew("streak_master");
    }

    // --- LOGIC CHAT (DARI KODINGAN LAMA LU) ---
    if (chatCount !== undefined && chatCount >= 10) {
      addIfNew("Tavern Regular");
    }

    return newlyEarned;
  }
};