import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { authService } from "./services/authService";
import { questService } from "./services/questService";
import { duelService } from "./services/duelService";
import { questActionService } from "./services/questActionService";
import { chatService } from "./services/chatService";
import { inviteService } from "./services/inviteService";
import { 
  User, Quest, ChatMessage, Role, QuestDifficulty, QuestStatus, 
  Achievement, MasterBuff, MasterDebuff, GameState 
} from "@/types/game";
import { masterService } from "./services/masterService";
import { 
  gamificationService, 
  AVATARS, 
  BUFF_DURATION, 
  CHAIN_WINDOW, 
  XP_MAP, 
  DUEL_PENALTY 
} from "./services/gamificationService";
import { userService } from "./services/userService";
import { achievementService } from "./services/achievementsService";

const GameContext = createContext<GameState | null>(null);

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be inside GameProvider");
  return ctx;
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- STATE ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [masterBuffs, setMasterBuffs] = useState<MasterBuff[]>([]);
  const [masterDebuffs, setMasterDebuffs] = useState<MasterDebuff[]>([]);
  
  // --- FETCHING DATA ---
  const fetchMasterData = useCallback(async () => {
    try {
      const data = await masterService.fetchAllMasterData();
      setAchievements(data.achievements.map((a: any) => ({
        ...a,
        title: a.title || a.name || "Untitled", 
        unlockedBy: []
      })));
      setMasterBuffs(data.buffs.map((b: any) => ({
        id: b.id, title: b.title || b.name || b.id, description: b.description || "", icon: b.icon || "✨"
      })));
      setMasterDebuffs(data.debuffs.map((d: any) => ({
        id: d.id, title: d.title || d.name || d.id, description: d.description || "", icon: d.icon || "💀"
      })));
    } catch (error) {
      console.error("Master Data Fetch Error:", error);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const mapped = await userService.fetchAllUsers();
      setUsers(mapped);
      const storedUser = localStorage.getItem('game_user');
      if (storedUser) {
        const currentLocal = JSON.parse(storedUser);
        const myUpdatedData = mapped.find(u => u.id === currentLocal.id);
        if (myUpdatedData) {
          setCurrentUser(prev => {
            const hasChanged = !prev || prev.xp !== myUpdatedData.xp || prev.level !== myUpdatedData.level || prev.achievements?.length !== myUpdatedData.achievements?.length;
            if (hasChanged) {
              localStorage.setItem('game_user', JSON.stringify(myUpdatedData));
              return myUpdatedData;
            }
            return prev;
          });
        }
      }
    } catch (error) {
      console.error("Fetch Users Error:", error);
    }
  }, []);

  const fetchQuests = useCallback(async () => {
    if (!currentUser) return;
    try {
      const mappedQuests = await questService.fetchQuestsDb(currentUser.guildId);
      setQuests(mappedQuests);
    } catch (error) {
      console.error("Error fetching quests:", error);
    }
  }, [currentUser?.id, currentUser?.guildId]);

  const fetchGuildMessages = useCallback(async () => {
    if (!currentUser?.guildId) return; 
    try {
      const data = await chatService.getMessages(currentUser.guildId);
      setChatMessages(data as ChatMessage[]);
    } catch (err) {
      console.error("Fetch Chat Error:", err);
    }
  }, [currentUser?.guildId]);

  // --- SYNC & POLLING ---
  useEffect(() => {
    if (users.length > 0 && achievements.length > 0) {
      setAchievements(prev => {
        let isChanged = false;
        const next = prev.map(ach => {
          const unlocked = users.filter(u => u.achievements?.includes(ach.id)).map(u => u.id);
          if (unlocked.length !== (ach.unlockedBy?.length || 0)) isChanged = true;
          return { ...ach, unlockedBy: unlocked };
        });
        return isChanged ? next : prev;
      });
    }
  }, [users]);

  useEffect(() => {
    if (!currentUser?.id) return;
    fetchQuests();
    fetchUsers();
    fetchGuildMessages();
    const interval = setInterval(() => {
      fetchQuests();
      fetchUsers();
      fetchGuildMessages();
    }, 5000);
    return () => clearInterval(interval);
  }, [currentUser?.id, fetchQuests, fetchUsers, fetchGuildMessages]);

  useEffect(() => {
    const savedUser = localStorage.getItem('game_user');
    if (savedUser) {
      try { setCurrentUser(JSON.parse(savedUser)); } 
      catch (e) { localStorage.removeItem('game_user'); }
    }
    fetchMasterData(); 
    fetchUsers();
    cleanOldChats();
  }, [fetchMasterData, fetchUsers]);

  useEffect(() => {
    if (currentUser) localStorage.setItem('game_user', JSON.stringify(currentUser));
    else localStorage.removeItem('game_user');
  }, [currentUser]);

  // --- DB WRAPPERS ---
  const updateUserInDb = async (user: User) => {
    try {
      await userService.updateUserDb(user);
      setUsers(prev => prev.map(u => u.id === user.id ? user : u));
      if (currentUser?.id === user.id) setCurrentUser(user);
      return true;
    } catch (err) {
      console.error("Update User Error:", err);
      return false;
    }
  };

  // --- LOGIKA UTAMA (SINKRON DENGAN SERVICE) ---
  const applyBuffsDebuffs = useCallback((user: User, quest: Quest, submittedAt: number, allQuests: Quest[]): User => {
    let u = gamificationService.cleanExpiredEffects(user);
    const timeLeft = quest.deadline - submittedAt;
    const totalTime = quest.deadline - (quest.acceptedAt || quest.createdAt);

    if (timeLeft >= 24 * 60 * 60 * 1000) {
      u = gamificationService.addBuff(u, "Adventurer's Haste", BUFF_DURATION, quest.id);
      toast("⚡ Buff: Adventurer's Haste", { description: "+50% XP! Submitted 24h+ early." });
    }
    if (quest.difficulty === "hard") {
      u = gamificationService.addBuff(u, "Scholar's Focus", BUFF_DURATION, quest.id);
      toast("📚 Buff: Scholar's Focus", { description: "+20% XP! Completed a Hard quest." });
    }
    const day = new Date(submittedAt).getDay();
    if (day === 0 || day === 6) {
      u = gamificationService.addBuff(u, "Weekend Warrior", BUFF_DURATION, quest.id);
      toast("🗡️ Buff: Weekend Warrior", { description: "+10% XP! Weekend dedication." });
    }
    const hour = new Date(submittedAt).getHours();
    if (hour >= 0 && hour < 5) {
      u = gamificationService.addBuff(u, "Night Owl", BUFF_DURATION, quest.id);
      toast("🦉 Buff: Night Owl", { description: "Burning the midnight oil!" });
    }
    if (timeLeft > 0 && timeLeft < totalTime * 0.1) {
      u = gamificationService.addBuff(u, "Clutch Player", BUFF_DURATION, quest.id);
      toast("🎯 Buff: Clutch Player", { description: "Submitted just in time!" });
    }
    const timeSinceAccept = submittedAt - (quest.acceptedAt || quest.createdAt);
    if (timeSinceAccept < 60 * 60 * 1000) {
      u = gamificationService.addBuff(u, "First Strike", BUFF_DURATION, quest.id);
      toast("⚔️ Buff: First Strike", { description: "Completed within an hour!" });
    }
    const recentSubmissions = allQuests.filter(q => q.assignedTo === u.id && q.submittedAt && (submittedAt - q.submittedAt) < CHAIN_WINDOW && q.id !== quest.id);
    if (recentSubmissions.length >= 2) {
      u = gamificationService.addBuff(u, "Chain Quest", BUFF_DURATION, quest.id);
      toast("🔗 Buff: Chain Quest (Combo)!", { description: "+15% XP! 3 quests in 24 hours." });
    }
    if (quest.difficulty === "legendary") {
      u = gamificationService.addBuff(u, "Aura of Purity", BUFF_DURATION, quest.id);
      u = { ...u, debuffs: [], activeDebuffs: [], debuffImmunity: true, rustyEquipment: false, stagnantSoulCounter: 0, consecutiveLateCount: 0 };
      toast("✨ Ultimate Buff: Aura of Purity!", { description: "All debuffs cleared! Immunity to next debuff granted." });
      u = gamificationService.addBuff(u, "Scholar's Focus", BUFF_DURATION, quest.id);
    }
    if (submittedAt > quest.deadline) {
      u = gamificationService.addDebuff(u, "Cursed Procrastination", 48 * 60 * 60 * 1000, quest.id);
      if (u.debuffs.includes("Cursed Procrastination")) toast("🐌 Debuff: Cursed Procrastination", { description: "-10 XP penalty for late submission." });
      u = { ...u, consecutiveLateCount: u.consecutiveLateCount + 1 };
    } else {
      u = { ...u, consecutiveLateCount: 0 };
    }
    if (u.consecutiveLateCount >= 3) {
      u = gamificationService.addDebuff(u, "Stagnant Soul", null, quest.id, 3);
      if (u.debuffs.includes("Stagnant Soul")) toast("⛓️ Ultimate Debuff: Stagnant Soul!", { description: "ALL buffs blocked for next 3 quests." });
    }
    const activeQuests = allQuests.filter(q => q.assignedTo === u.id && q.status === "accepted");
    if (activeQuests.length > 5) {
      u = gamificationService.addDebuff(u, "Slacker's Fatigue", 24 * 60 * 60 * 1000, quest.id);
      if (u.debuffs.includes("Slacker's Fatigue")) toast("😴 Debuff: Slacker's Fatigue", { description: "-5% XP on next quest." });
    }
    return u;
  }, []);

  const checkInactivityDebuff = useCallback((user: User, allQuests: Quest[]): User => {
    let u = gamificationService.cleanExpiredEffects(user);
    const lastCompleted = allQuests.filter(q => q.assignedTo === user.id && q.status === "completed").sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))[0];
    if (lastCompleted && Date.now() - (lastCompleted.completedAt || 0) > 3 * 24 * 60 * 60 * 1000) {
      if (!u.activeDebuffs.find(d => d.name === "Rusty Equipment")) {
        u = gamificationService.addDebuff(u, "Rusty Equipment", null);
        u = { ...u, rustyEquipment: true };
        if (u.debuffs.includes("Rusty Equipment")) toast("🪓 Debuff: Rusty Equipment", { description: "3 days inactive!" });
      }
    }
    return u;
  }, []);

  // --- AUTH ACTIONS ---
  const register = async (email: string, username: string, password: string, role: Role): Promise<boolean> => {
    try {
      const existingUser = await authService.getUserByEmail(email);
      if (existingUser) {
        if (role === "guild_master" && existingUser.is_guild_master) { toast.error("Role Guild Master sudah ada!"); return false; }
        if (role === "adventurer" && existingUser.is_adventurer) { toast.error("Role Adventurer sudah ada!"); return false; }
        const newGuildId = (role === "guild_master" && !existingUser.guild_id) ? crypto.randomUUID() : existingUser.guild_id;
        await authService.updateUser(existingUser.id, { 
          role: role, guild_id: newGuildId, is_guild_master: role === "guild_master" ? true : existingUser.is_guild_master, is_adventurer: role === "adventurer" ? true : existingUser.is_adventurer
        });
        await fetchUsers();
        toast.success(`Role ${role} ditambahkan!`);
        return true;
      }
      const userWithUsername = await authService.getUserByUsername(username);
      if (userWithUsername) { toast.error("Username sudah diambil!"); return false; }
      const id = crypto.randomUUID();
      const assignedGuildId = role === "guild_master" ? crypto.randomUUID() : "";
      const newUser: User = {
        id, email, username, role, avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)], xp: 0, level: 1, buffs: [], debuffs: [], activeBuffs: [], activeDebuffs: [], achievements: [], guildId: assignedGuildId, questsCompleted: 0, joinedAt: Date.now(), lastQuestCompletedAt: null, consecutiveLateCount: 0, debuffImmunity: false, stagnantSoulCounter: 0, rustyEquipment: false, brokenShieldQuests: [], isGuildMaster: role === "guild_master", isAdventurer: role === "adventurer", availableRoles: [role]
      };
      await authService.insertUser({ 
        id: newUser.id, email: newUser.email, username: newUser.username, role: newUser.role, password_hash: password, avatar: newUser.avatar, xp: newUser.xp, level: newUser.level, buffs: newUser.buffs, debuffs: newUser.debuffs, active_buffs: newUser.activeBuffs, active_debuffs: newUser.activeDebuffs, guild_id: assignedGuildId, quests_completed: newUser.questsCompleted, joined_at: newUser.joinedAt, last_quest_completed_at: newUser.lastQuestCompletedAt, consecutive_late_count: newUser.consecutiveLateCount, debuff_immunity: newUser.debuffImmunity, stagnant_soul_counter: newUser.stagnantSoulCounter, rusty_equipment: newUser.rustyEquipment, broken_shield_quests: newUser.brokenShieldQuests, is_guild_master: newUser.isGuildMaster, is_adventurer: newUser.isAdventurer 
      });
      setUsers(prev => [...prev, newUser]);
      setCurrentUser(newUser);
      toast.success(`Selamat Datang, ${username}!`);
      return true;
    } catch (error: any) { toast.error("Gagal mendaftar: " + error.message); return false; }
  };

  const login = async (identifier: string, password_hash: string): Promise<boolean> => {
    try {
      const data = await authService.verifyLogin(identifier, password_hash);
      if (!data) { toast.error("Identifier atau Password salah!"); return false; }
      const loggedInUser: User = {
        id: data.id, email: data.email, username: data.username, role: data.role as Role, avatar: data.avatar, xp: data.xp || 0, level: data.level || 1, buffs: data.buffs || [], debuffs: data.debuffs || [], achievements: data.achievements || [], activeBuffs: data.active_buffs || [], activeDebuffs: data.active_debuffs || [], guildId: data.guild_id || "", questsCompleted: data.quests_completed || 0, joinedAt: data.joined_at || Date.now(), lastQuestCompletedAt: data.last_quest_completed_at, consecutiveLateCount: data.consecutive_late_count || 0, debuffImmunity: data.debuff_immunity || false, stagnantSoulCounter: data.stagnant_soul_counter || 0, rustyEquipment: data.rusty_equipment || false, brokenShieldQuests: data.broken_shield_quests || [], isGuildMaster: data.is_guild_master || false, isAdventurer: data.is_adventurer || false, availableRoles: [...(data.is_guild_master ? ['guild_master'] : []), ...(data.is_adventurer ? ['adventurer'] : [])] as Role[]
      };
      setCurrentUser(loggedInUser);
      toast.success(`Welcome back, ${loggedInUser.username}!`);
      return true;
    } catch (err: any) { toast.error("Gagal Login."); return false; }
  };

  const logout = () => { setCurrentUser(null); localStorage.removeItem('game_user'); toast.success("Logged out!"); };

  const switchRole = async (newRole: Role): Promise<void> => {
    if (!currentUser) return;
    const hasAccess = newRole === "guild_master" ? currentUser.isGuildMaster : currentUser.isAdventurer;
    if (!hasAccess) { toast.error("Role tidak diizinkan."); return; }
    const { error } = await supabase.from('users').update({ role: newRole }).eq('id', currentUser.id);
    if (error) { toast.error("Gagal switch role."); return; }
    const updatedUser = { ...currentUser, role: newRole };
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    toast.success(`Berhasil menjadi ${newRole}!`);
  };

  // --- QUEST ACTIONS ---
  const createQuest = async (title: string, description: string, difficulty: QuestDifficulty, deadlineTimestamp: number) => {
    if (!currentUser) return;
    try {
      await questService.createQuest({ title, description, difficulty, xp_reward: XP_MAP[difficulty], deadline: deadlineTimestamp, created_by: currentUser.id, guild_id: currentUser.guildId || null, status: "open" });
      fetchQuests(); 
      toast.success("Quest Dibuat!"); 
    } catch (error: any) { toast.error("Gagal membuat quest."); }
  };

  const acceptQuest = async (questId: string): Promise<void> => {
    if (!currentUser) return;
    try {
      await questService.acceptQuest(questId, currentUser.id);
      const updatedUser = checkInactivityDebuff(currentUser, quests);
      await updateUserInDb(updatedUser);
      fetchQuests();
      toast.success("Quest Diterima!");
    } catch (error) { toast.error("Gagal ambil quest."); }
  };

  const submitQuest = async (questId: string): Promise<void> => {
    if (!currentUser) return;
    const now = Date.now();
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;
    try {
      // PERBAIKAN: Hanya kirim argumen yang sesuai dengan signature service
      await questService.submitQuest(questId, new Date(now).toISOString());
      const tempQuest = { ...quest, status: "submitted" as QuestStatus, submittedAt: now };
      const updatedUser = applyBuffsDebuffs(currentUser, tempQuest, now, quests);
      await updateUserInDb(updatedUser);
      await fetchQuests(); 
      toast.success("Quest Terkirim!");
    } catch (error) { toast.error("Gagal submit."); }
  };

const approveQuest = async (questId: string): Promise<void> => {
    if (!currentUser || currentUser.role !== "guild_master") return;
    const quest = quests.find(q => q.id === questId);
    if (!quest || !quest.assignedTo) return;
    const adventurer = users.find(u => u.id === quest.assignedTo);
    if (!adventurer) return;
    const now = Date.now();
    let penaltyXP = 0; 

    try {
      await questActionService.approveQuestDb(questId, new Date(now).toISOString());
      let xpBreakdown = gamificationService.calcXpWithModifiers(adventurer, quest);
      let totalXpGained = xpBreakdown.totalXp;
      let isDuelWin = false;

      // --- LOGIC DUEL (DIPERTAHANKAN) ---
      if (quest.isDuel && quest.duelStatus === 'accepted' && quest.duelOpponentId) {
        isDuelWin = true;
        penaltyXP = DUEL_PENALTY[quest.difficulty];
        totalXpGained += penaltyXP;
        const loserUser = users.find(u => u.id === quest.duelOpponentId);
        const loserQuest = quests.find(q => q.assignedTo === quest.duelOpponentId && q.isDuel && q.duelStatus === 'accepted');
        if (loserUser && loserQuest) {
          const loserNewXp = Math.max(0, loserUser.xp - penaltyXP);
          await updateUserInDb({ ...loserUser, xp: loserNewXp, level: gamificationService.calcLevel(loserNewXp) });
          await questActionService.resetLoserQuest(loserQuest.id);
          sendMessage(`💀 [DEFEATED] @${loserUser.username} kalah duel!`);
        }
        await questActionService.clearWinnerDuelStatus(quest.id);
      }

      // --- HITUNG PROGRES (DIPERTAHANKAN) ---
      const newXp = adventurer.xp + totalXpGained;
      const oldLevel = adventurer.level;
      const newLevel = gamificationService.calcLevel(newXp);
      
      let updated: User = { 
        ...adventurer, 
        xp: newXp, 
        level: newLevel, 
        questsCompleted: (adventurer.questsCompleted || 0) + 1, 
        lastQuestCompletedAt: now 
      };

      // --- UPDATE ACHIEVEMENTS (DIPERBAIKI) ---
      // Manggil service baru buat ngecek 12+ achievement sekaligus
      const currentQuestWithCompleteTime = { ...quest, status: 'completed' as const, completedAt: now };
      const newAwards = achievementService.checkAchievements(updated, quests, currentQuestWithCompleteTime);

      if (newAwards.length > 0) {
        // Gabungin achievement lama + baru tanpa duplikat
        updated.achievements = Array.from(new Set([...(adventurer.achievements || []), ...newAwards]));
        
        // Notif tiap achievement baru
        newAwards.forEach(id => {
          toast.success(`🏆 Achievement Unlocked: ${id}`);
        });
      }

      // --- LOGIC BUFF & CLEANUP (DIPERTAHANKAN) ---
      updated = applyBuffsDebuffs(updated, quest, now, quests);
      if (updated.brokenShieldQuests) {
        updated.brokenShieldQuests = updated.brokenShieldQuests.filter(id => id !== quest.id);
      }
      updated = gamificationService.cleanExpiredEffects(updated);

      // --- SAVE KE DB ---
      await updateUserInDb(updated);

      if (newLevel > oldLevel) toast.success(`🎊 LEVEL UP!`);
      toast.success(isDuelWin ? "⚔️ DUEL WON!" : "⚔️ Quest Approved!");
      
      await Promise.all([fetchQuests(), fetchUsers()]);
    } catch (error) { 
      toast.error("Gagal approve."); 
    }
  };

  const rejectQuest = async (questId: string): Promise<void> => {
    if (!currentUser) return;
    const quest = quests.find(q => q.id === questId);
    if (!quest || !quest.assignedTo) return;
    try {
      await questActionService.rejectQuestDb(questId);
      const adventurer = users.find(u => u.id === quest.assignedTo);
      if (adventurer) {
        let updated = gamificationService.addDebuff(adventurer, "Broken Shield", 48 * 60 * 60 * 1000, questId);
        updated = { ...updated, brokenShieldQuests: [...updated.brokenShieldQuests, questId] };
        await updateUserInDb(updated);
        toast.error("Quest Ditolak & Debuff diberikan.");
      }
      fetchQuests();
    } catch (err) { toast.error("Gagal menolak."); }
  };

  // --- DUEL ACTIONS ---
  const sendDuelChallenge = async (myQuestId: string, targetUserId: string) => {
    if (!currentUser) return;
    const myQuest = quests.find(q => q.id === myQuestId && q.assignedTo === currentUser.id);
    const targetQuest = quests.find(q => q.assignedTo === targetUserId && q.status === "accepted" && q.difficulty === myQuest?.difficulty && !q.isDuel);
    if (!myQuest || !targetQuest) { toast.error("Syarat duel tidak terpenuhi."); return; }
    try {
      await duelService.sendChallenge(myQuest.id, targetQuest.id, currentUser.id, targetUserId);
      await fetchQuests();
      sendMessage(`⚔️ [CHALLENGE] @${currentUser.username} menantang duel!`);
      toast.success("Duel terkirim!");
    } catch (err) { toast.error("Gagal duel."); }
  };

  const respondToDuel = async (myQuestId: string, action: 'accept' | 'reject') => {
    if (!currentUser) return;
    const myQuest = quests.find(q => q.id === myQuestId);
    const challengerQuest = quests.find(q => q.assignedTo === myQuest?.duelOpponentId && q.isDuel && q.duelStatus === 'pending');
    try {
      await duelService.respond(myQuestId, challengerQuest?.id, action);
      if (action === 'accept') {
        sendMessage(`⚔️🔥 [DUEL DIMULAI] @${currentUser.username} menerima tantangan!`);
        toast.success("Duel dimulai!");
      }
      await fetchQuests();
    } catch (err) { toast.error("Gagal respon duel."); }
  };

  // --- TAVERN (CHAT) ---
const sendMessage = async (content: string) => {
    if (!currentUser?.guildId) { toast.error("Masuk Guild dulu!"); return; }
    try {
      // 1. Kirim pesan (Tetap sama seperti aslinya)
      await chatService.postMessage({ 
        content, 
        user_id: currentUser.id, 
        username: currentUser.username, 
        avatar: currentUser.avatar || "👤", 
        role: currentUser.role, 
        guild_id: currentUser.guildId 
      });

      // 2. Ambil jumlah pesan terbaru
      const count = await chatService.getMessageCount(currentUser.id, currentUser.guildId);
      
      // 3. Cek Achievement via Service (Gabungin logic 'Talkative' & 'Tavern Regular')
      // Kita kirim 'count' sebagai argumen terakhir sesuai struktur service baru kita
      const newAwards = achievementService.checkAchievements(currentUser, quests, undefined, count);

      if (newAwards.length > 0) {
        // Gabungkan achievement tanpa duplikat
        const updatedUser = { 
          ...currentUser, 
          achievements: Array.from(new Set([...(currentUser.achievements || []), ...newAwards])) 
        };
        
        // Update database
        await updateUserInDb(updatedUser);
        
        // Notifikasi Toast sesuai ID yang didapat
        newAwards.forEach(id => {
          if (id === "Talkative") {
            toast.success("🏆 Achievement: Talkative!");
          } else if (id === "Tavern Regular") {
            toast.success("🏆 ACHIEVEMENT UNLOCKED: Tavern Regular!", {
              description: "10 pesan terkirim. Kamu sudah jadi pelanggan tetap!"
            });
          } else {
            toast.success(`🏆 Achievement Unlocked: ${id}`);
          }
        });
      }
    } catch (error) { 
      toast.error("Gagal kirim pesan."); 
    }
  };

  // --- GUILD ACTIONS ---
  const sendInvite = async (email: string) => {
    if (!currentUser) return;
    try {
      const targetUser = await inviteService.findUserByEmail(email);
      if (!targetUser) { toast.error("User tidak ditemukan."); return; }
      await inviteService.createInvite(currentUser.guildId || '', currentUser.id, email);
      toast.success("Undangan terkirim!");
    } catch (error) { toast.error("Gagal invite."); }
  };

  const acceptInvite = async (inviteID: string, guildId: string) => {
    if (!currentUser) return;
    try {
      await inviteService.processAcceptInvite(currentUser.id, inviteID, guildId);
      const updatedUser = { ...currentUser, guildId: guildId };
      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
      toast.success("Berhasil masuk Guild!");
      await fetchUsers(); fetchQuests(); 
    } catch (error) { toast.error("Gagal join Guild."); }
  };

  const kickMember = async (memberId: string) => {
    if (currentUser?.role !== 'guild_master') return;
    try {
      const { error } = await supabase.from('users').update({ guild_id: "" }).eq('id', memberId);
      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === memberId ? { ...u, guildId: "" } : u));
      toast.success("Member dikeluarkan!");
      await fetchUsers(); 
    } catch (err) { toast.error("Gagal kick."); }
  };

  const changeAvatar = (avatar: string) => { if (currentUser) updateUserInDb({ ...currentUser, avatar }); };

  const cleanOldChats = async () => {
    try {
      const expiryTime = new Date();
      expiryTime.setHours(expiryTime.getHours() - 24);
      await supabase.from('chat_messages').delete().lt('created_at', expiryTime.toISOString());
    } catch (err) { console.error("Auto-clean failed"); }
  };

  return (
    <GameContext.Provider value={{
      currentUser, users, quests, chatMessages, achievements, masterBuffs, masterDebuffs, login, register, logout, createQuest, acceptQuest, submitQuest, approveQuest, rejectQuest, sendMessage, sendInvite, acceptInvite, kickMember, changeAvatar, switchRole, sendDuelChallenge, respondToDuel, availableAvatars: AVATARS
    }}>
      {children}
    </GameContext.Provider>
  );
};