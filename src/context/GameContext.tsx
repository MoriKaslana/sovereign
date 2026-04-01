import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

export type Role = "guild_master" | "adventurer";
export type QuestDifficulty = "easy" | "medium" | "hard" | "legendary";
export type QuestStatus = "open" | "accepted" | "submitted" | "completed" | "rejected";

export interface BuffEntry {
  name: string;
  appliedAt: number;
  expiresAt: number | null; // null = permanent until cleared
  questId?: string;
}

export interface DebuffEntry {
  name: string;
  appliedAt: number;
  expiresAt: number | null;
  questId?: string;
  remainingQuests?: number; // for quest-count-based debuffs like Stagnant Soul
}

// Tambahan Interface untuk Master Data dari DB
export interface MasterBuff {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface MasterDebuff {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xp_reward?: number;
  unlockedBy: string[]; // Tetap ada untuk UI state
}

export interface User {
  id: string;
  email: string;
  username: string;
  role: Role;
  avatar: string;
  xp: number;
  level: number;
  buffs: string[];
  debuffs: string[];
  activeBuffs: BuffEntry[];
  activeDebuffs: DebuffEntry[];
  achievements: string[];
  guildId: string;
  questsCompleted: number;
  joinedAt: number;
  lastQuestCompletedAt: number | null;
  consecutiveLateCount: number;
  debuffImmunity: boolean; 
  stagnantSoulCounter: number; 
  rustyEquipment: boolean; 
  brokenShieldQuests: string[]; 
  isGuildMaster: boolean; 
  isAdventurer: boolean;   
  availableRoles: Role[]; 
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  difficulty: QuestDifficulty;
  xpReward: number;
  deadline: number;
  createdBy: string;
  assignedTo: string | null;
  status: QuestStatus;
  createdAt: number;
  acceptedAt: number | null;
  submittedAt: number | null;
  completedAt: number | null;
  guildId: string;
  wasRejected?: boolean;
}

export interface ChatMessage {
  id: string;
  created_at: string;
  content: string;
  user_id: string;
  username: string;
  avatar: string;
  role: string;
  guild_id: string;
}

interface GameState {
  currentUser: User | null;
  users: User[];
  quests: Quest[];
  chatMessages: ChatMessage[];
  achievements: Achievement[];
  masterBuffs: MasterBuff[];     // 👈 Master Data Diexpose
  masterDebuffs: MasterDebuff[]; // 👈 Master Data Diexpose
  login: (identifier: string, password: string) => Promise<boolean>;
  register: (email: string, username: string, password: string, role: Role) => Promise<boolean>;
  logout: () => void;
  createQuest: (title: string, description: string, difficulty: QuestDifficulty, deadlineTimestamp: number) => Promise<void>;
  acceptQuest: (questId: string) => Promise<void>;
  submitQuest: (questId: string) => Promise<void>;
  approveQuest: (questId: string) => Promise<void>;
  rejectQuest: (questId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  sendInvite: (email: string) => Promise<void>; 
  acceptInvite: (inviteId: string, guildId: string) => Promise<void>; 
  changeAvatar: (avatar: string) => void;
  switchRole: (newRole: Role) => Promise<void>; 
  kickMember: (memberId: string) => Promise<void>;
  availableAvatars: string[];
}

const GameContext = createContext<GameState | null>(null);

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be inside GameProvider");
  return ctx;
};

interface Credentials {
  email: string;
  password: string;
  userId: string;
}

const XP_MAP: Record<QuestDifficulty, number> = { 
  easy: 50, 
  medium: 100, 
  hard: 200, 
  legendary: 500 
};

const BUFF_DURATION = 24 * 60 * 60 * 1000; // 24 hours default
const CHAIN_WINDOW = 24 * 60 * 60 * 1000; // 24 hours

const AVATARS = ["⚔️", "🛡️", "🧙", "🏹", "🗡️", "🔮", "🐉", "🦅", "🐺", "🦁"];

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [credentials, setCredentials] = useState<Credentials[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  
  // State Dinamis untuk Kamus Data dari Database
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [masterBuffs, setMasterBuffs] = useState<MasterBuff[]>([]);
  const [masterDebuffs, setMasterDebuffs] = useState<MasterDebuff[]>([]);
  
  const [messageCount, setMessageCount] = useState<Record<string, number>>({});
  const guildId = "sovereign-guild";

  // --- FETCH MASTER DATA DICTIONARY (NO MORE HARDCODE) ---
  const fetchMasterData = useCallback(async () => {
    try {
      const [achRes, buffRes, debuffRes] = await Promise.all([
        supabase.from('achievements').select('*'),
        supabase.from('buffs').select('*'),
        supabase.from('debuffs').select('*')
      ]);

      if (achRes.data) {
        setAchievements(achRes.data.map(a => ({
          id: a.id,
          title: a.title,
          description: a.description,
          icon: a.icon,
          xp_reward: a.xp_reward,
          unlockedBy: [] // Akan diisi dinamis oleh listener realtime / sinkronisasi users
        })));
      }
      if (buffRes.data) {
        setMasterBuffs(buffRes.data.map(b => ({
          id: b.id, title: b.title, description: b.description, icon: b.icon
        })));
      }
      if (debuffRes.data) {
        setMasterDebuffs(debuffRes.data.map(d => ({
          id: d.id, title: d.title, description: d.description, icon: d.icon
        })));
      }
    } catch (error) {
      console.error("Gagal menarik master data:", error);
    }
  }, []);

  // --- DATA FETCHERS (SUPABASE SYNC) ---
  const fetchUsers = useCallback(async () => {
    const { data, error } = await supabase.from('users').select('*');
    if (!error && data) {
      const mapped: User[] = data.map(u => ({
        id: u.id, 
        email: u.email, 
        username: u.username, 
        role: u.role as Role, 
        avatar: u.avatar,
        achievements: u.achievements || [],
        xp: u.xp || 0, 
        level: u.level || 1, 
        buffs: u.buffs || [], 
        debuffs: u.debuffs || [],
        activeBuffs: u.active_buffs || [], 
        activeDebuffs: u.active_debuffs || [],
        guildId: u.guild_id, 
        questsCompleted: u.quests_completed || 0,
        joinedAt: u.joined_at || Date.now(), 
        lastQuestCompletedAt: u.last_quest_completed_at ? Number(u.last_quest_completed_at) : null,
        consecutiveLateCount: u.consecutive_late_count || 0, 
        debuffImmunity: u.debuff_immunity || false,
        stagnantSoulCounter: u.stagnant_soul_counter || 0, 
        rustyEquipment: u.rusty_equipment || false,
        brokenShieldQuests: u.broken_shield_quests || [],
        isGuildMaster: u.is_guild_master || false, 
        isAdventurer: u.is_adventurer || false,     
        availableRoles: [ 
          ...(u.is_guild_master ? ['guild_master'] : []),
          ...(u.is_adventurer ? ['adventurer'] : []),
        ] as Role[]
      }));
      
      setUsers(mapped);

      // SINKRONISASI DATA USER YG SEDANG LOGIN
      const storedUser = localStorage.getItem('game_user');
      if (storedUser) {
        const currentLocal = JSON.parse(storedUser);
        const myUpdatedData = mapped.find(u => u.id === currentLocal.id);

        if (myUpdatedData) {
          setCurrentUser(prev => {
            const hasChanged = !prev || 
              prev.xp !== myUpdatedData.xp || 
              prev.level !== myUpdatedData.level ||
              prev.achievements?.length !== myUpdatedData.achievements?.length;

            if (hasChanged) {
              localStorage.setItem('game_user', JSON.stringify(myUpdatedData));
              return myUpdatedData;
            }
            return prev;
          });
        }
      }
    }
  }, []);

  const fetchQuests = useCallback(async () => {
    if (!currentUser) return;

    let query = supabase.from('quests').select('*');

    if (currentUser.guildId && currentUser.guildId !== "") {
      query = query.eq('guild_id', currentUser.guildId);
    } else {
      query = query.or('guild_id.is.null,guild_id.eq.""');
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching quests:", error);
      return;
    }
    
    const mappedQuests: Quest[] = data.map(q => ({
      id: q.id,
      title: q.title,
      description: q.description,
      difficulty: q.difficulty as QuestDifficulty,
      xpReward: q.xp_reward || 0,
      deadline: q.deadline,
      createdBy: q.created_by,
      assignedTo: q.assigned_to,
      status: q.status as QuestStatus,
      createdAt: new Date(q.created_at).getTime(),
      acceptedAt: q.accepted_at ? new Date(q.accepted_at).getTime() : null,
      submittedAt: q.submitted_at ? new Date(q.submitted_at).getTime() : null,
      completedAt: q.completed_at ? new Date(q.completed_at).getTime() : null,
      guildId: q.guild_id || "", 
    }));
    
    setQuests(mappedQuests);
  }, [currentUser?.id, currentUser?.guildId]);

  // --- SINKRONISASI OTOMATIS ACHIEVEMENT UI ---
  // Menjamin array 'unlockedBy' di UI selalu up to date tiap ada perubahan di list users
  useEffect(() => {
    if (users.length > 0 && achievements.length > 0) {
      setAchievements(prev => {
        let isChanged = false;
        const next = prev.map(ach => {
          const unlocked = users.filter(u => u.achievements?.includes(ach.id)).map(u => u.id);
          if (unlocked.length !== ach.unlockedBy?.length) isChanged = true;
          return { ...ach, unlockedBy: unlocked };
        });
        return isChanged ? next : prev;
      });
    }
  }, [users]); // 👈 Trigger tiap users direfresh


  // --- REALTIME SYNC (SATPAM GLOBAL) ---
  useEffect(() => {
    if (!currentUser?.id) return;

    fetchQuests();
    fetchUsers();

    const userChannel = supabase
      .channel(`user-changes-${currentUser.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${currentUser.id}` },
        (payload) => {
          const updated = payload.new as any;
          setCurrentUser(prev => {
            if (!prev) return null;
            const newUser = {
              ...prev,
              xp: updated.xp,
              level: updated.level,
              buffs: updated.buffs || [],
              debuffs: updated.debuffs || [],
              activeBuffs: updated.active_buffs || [],
              activeDebuffs: updated.active_debuffs || [],
              achievements: updated.achievements || [], // Sinkronkan achievements juga
              questsCompleted: updated.quests_completed,
              guildId: updated.guild_id || "",
              lastQuestCompletedAt: updated.last_quest_completed_at ? Number(updated.last_quest_completed_at) : null
            };
            localStorage.setItem('game_user', JSON.stringify(newUser));
            return newUser;
          });
        }
      )
      .subscribe();

    const questChannel = supabase
      .channel('quest-global-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quests' },
        (payload) => fetchQuests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(userChannel);
      supabase.removeChannel(questChannel);
    };
  }, [currentUser?.id]);

  // --- DATABASE HELPER ---
  const updateUserInDb = async (user: User) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          xp: user.xp,
          level: user.level,
          buffs: user.buffs,
          debuffs: user.debuffs,
          active_buffs: user.activeBuffs,
          active_debuffs: user.activeDebuffs,
          quests_completed: user.questsCompleted,
          last_quest_completed_at: user.lastQuestCompletedAt,
          consecutive_late_count: user.consecutiveLateCount,
          stagnant_soul_counter: user.stagnantSoulCounter,
          rusty_equipment: user.rustyEquipment,
          broken_shield_quests: user.brokenShieldQuests,
          achievements: user.achievements 
        })
        .eq('id', user.id);

      if (error) throw error;
      
      setUsers(prev => prev.map(u => u.id === user.id ? user : u));

      if (currentUser?.id === user.id) {
        setCurrentUser(user);
        localStorage.setItem('game_user', JSON.stringify(user));
      }
      
      return true;
    } catch (err) {
      console.error("Update User Error:", err);
      return false;
    }
  };

  // --- PERSISTENCE LOGIC ---
  useEffect(() => {
    const savedUser = localStorage.getItem('game_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('game_user');
      }
    }
    
    fetchMasterData(); // 👈 Initial Fetch Data Kamus dari DB
    fetchUsers();
    fetchQuests();
  }, [fetchMasterData]); 

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('game_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('game_user');
    }
  }, [currentUser]);

  // --- GAME LOGIC ---
  const calcLevel = (xp: number) => Math.floor(xp / 200) + 1;

  const addBuff = (user: User, name: string, durationMs: number | null, questId?: string): User => {
    if (user.activeBuffs.find(b => b.name === name)) return user;
    const now = Date.now();
    const entry: BuffEntry = { name, appliedAt: now, expiresAt: durationMs ? now + durationMs : null, questId };
    const newBuffs = [...user.buffs];
    if (!newBuffs.includes(name)) newBuffs.push(name);
    return { ...user, buffs: newBuffs, activeBuffs: [...user.activeBuffs, entry] };
  };

  const addDebuff = (user: User, name: string, durationMs: number | null, questId?: string, remainingQuests?: number): User => {
    if (user.debuffImmunity) {
      toast("🛡️ Aura of Purity blocked a debuff!", { description: `${name} was prevented by your golden shield.` });
      return { ...user, debuffImmunity: false };
    }
    if (user.activeDebuffs.find(d => d.name === name)) return user;
    const now = Date.now();
    const entry: DebuffEntry = { name, appliedAt: now, expiresAt: durationMs ? now + durationMs : null, questId, remainingQuests };
    const newDebuffs = [...user.debuffs];
    if (!newDebuffs.includes(name)) newDebuffs.push(name);
    return { ...user, debuffs: newDebuffs, activeDebuffs: [...user.activeDebuffs, entry] };
  };

  const cleanExpiredEffects = (user: User): User => {
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
  };

  const applyBuffsDebuffs = useCallback((user: User, quest: Quest, submittedAt: number, allQuests: Quest[]): User => {
    let u = cleanExpiredEffects(user);
    const timeLeft = quest.deadline - submittedAt;
    const totalTime = quest.deadline - (quest.acceptedAt || quest.createdAt);

    if (timeLeft >= 24 * 60 * 60 * 1000) {
      u = addBuff(u, "Adventurer's Haste", BUFF_DURATION, quest.id);
      toast("⚡ Buff: Adventurer's Haste", { description: "+50% XP! Submitted 24h+ early." });
    }
    if (quest.difficulty === "hard") {
      u = addBuff(u, "Scholar's Focus", BUFF_DURATION, quest.id);
      toast("📚 Buff: Scholar's Focus", { description: "+20% XP! Completed a Hard quest." });
    }
    const day = new Date(submittedAt).getDay();
    if (day === 0 || day === 6) {
      u = addBuff(u, "Weekend Warrior", BUFF_DURATION, quest.id);
      toast("🗡️ Buff: Weekend Warrior", { description: "+10% XP! Weekend dedication." });
    }
    const hour = new Date(submittedAt).getHours();
    if (hour >= 0 && hour < 5) {
      u = addBuff(u, "Night Owl", BUFF_DURATION, quest.id);
      toast("🦉 Buff: Night Owl", { description: "Burning the midnight oil!" });
    }
    if (timeLeft > 0 && timeLeft < totalTime * 0.1) {
      u = addBuff(u, "Clutch Player", BUFF_DURATION, quest.id);
      toast("🎯 Buff: Clutch Player", { description: "Submitted just in time!" });
    }
    const timeSinceAccept = submittedAt - (quest.acceptedAt || quest.createdAt);
    if (timeSinceAccept < 60 * 60 * 1000) {
      u = addBuff(u, "First Strike", BUFF_DURATION, quest.id);
      toast("⚔️ Buff: First Strike", { description: "Completed within an hour!" });
    }
    const recentSubmissions = allQuests.filter(q => q.assignedTo === u.id && q.submittedAt && (submittedAt - q.submittedAt) < CHAIN_WINDOW && q.id !== quest.id);
    if (recentSubmissions.length >= 2) {
      u = addBuff(u, "Chain Quest", BUFF_DURATION, quest.id);
      toast("🔗 Buff: Chain Quest (Combo)!", { description: "+15% XP! 3 quests in 24 hours." });
    }
    if (quest.difficulty === "legendary") {
      u = addBuff(u, "Aura of Purity", BUFF_DURATION, quest.id);
      u = {
        ...u, debuffs: [], activeDebuffs: [], debuffImmunity: true,
        rustyEquipment: false, stagnantSoulCounter: 0, consecutiveLateCount: 0,
      };
      toast("✨ Ultimate Buff: Aura of Purity!", { description: "All debuffs cleared! Immunity to next debuff granted." });
      u = addBuff(u, "Scholar's Focus", BUFF_DURATION, quest.id);
    }
    if (submittedAt > quest.deadline) {
      u = addDebuff(u, "Cursed Procrastination", 48 * 60 * 60 * 1000, quest.id);
      if (u.debuffs.includes("Cursed Procrastination")) toast("🐌 Debuff: Cursed Procrastination", { description: "-10 XP penalty for late submission." });
      u = { ...u, consecutiveLateCount: u.consecutiveLateCount + 1 };
    } else {
      u = { ...u, consecutiveLateCount: 0 };
    }
    if (u.consecutiveLateCount >= 3) {
      u = addDebuff(u, "Stagnant Soul", null, quest.id, 3);
      if (u.debuffs.includes("Stagnant Soul")) toast("⛓️ Ultimate Debuff: Stagnant Soul!", { description: "ALL buffs blocked for next 3 quests." });
    }
    const activeQuests = allQuests.filter(q => q.assignedTo === u.id && q.status === "accepted");
    if (activeQuests.length > 5) {
      u = addDebuff(u, "Slacker's Fatigue", 24 * 60 * 60 * 1000, quest.id);
      if (u.debuffs.includes("Slacker's Fatigue")) toast("😴 Debuff: Slacker's Fatigue", { description: "-5% XP on next quest." });
    }
    return u;
  }, []);

  const checkInactivityDebuff = useCallback((user: User, allQuests: Quest[]): User => {
    let u = cleanExpiredEffects(user);
    const lastCompleted = allQuests
      .filter(q => q.assignedTo === user.id && q.status === "completed")
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))[0];
    
    if (lastCompleted && Date.now() - (lastCompleted.completedAt || 0) > 3 * 24 * 60 * 60 * 1000) {
      if (!u.activeDebuffs.find(d => d.name === "Rusty Equipment")) {
        u = addDebuff(u, "Rusty Equipment", null);
        u = { ...u, rustyEquipment: true };
        if (u.debuffs.includes("Rusty Equipment")) {
          toast("🪓 Debuff: Rusty Equipment", { description: "3 days inactive! Avatar greyed out, buffs disabled until 1 quest completed." });
        }
      }
    }
    return u;
  }, []);

  const calcXpWithModifiers = (user: User, quest: Quest) => {
    const baseXp = quest.xpReward;
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
  };

  // --- AUTH METHODS ---
  const register = async (email: string, username: string, password: string, role: Role): Promise<boolean> => {
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        const isGM = existingUser.is_guild_master || false;
        const isAdv = existingUser.is_adventurer || false;

        if (role === "guild_master" && isGM) {
          toast.error("Lo udah punya role Guild Master di akun ini!");
          return false;
        }
        if (role === "adventurer" && isAdv) {
          toast.error("Lo udah punya role Adventurer di akun ini!");
          return false;
        }

        const newGuildId = (role === "guild_master" && !existingUser.guild_id) 
          ? crypto.randomUUID() 
          : existingUser.guild_id;

        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            role: role, 
            guild_id: newGuildId,
            is_guild_master: role === "guild_master" ? true : isGM,
            is_adventurer: role === "adventurer" ? true : isAdv
          })
          .eq('id', existingUser.id);

        if (updateError) throw updateError;
        
        await fetchUsers();
        toast.success(`Role ${role} berhasil ditambahkan! Silakan login untuk ganti role.`);
        return true;
      }

      const { data: userWithUsername } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (userWithUsername) {
        toast.error("Username ini sudah diambil Adventurer lain!");
        return false;
      }

      const id = crypto.randomUUID();
      const assignedGuildId = role === "guild_master" ? crypto.randomUUID() : "";

      const newUser: User = {
        id, email, username, role, avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
        xp: 0, level: 1, buffs: [], debuffs: [], activeBuffs: [], activeDebuffs: [], achievements: [],
        guildId: assignedGuildId, 
        questsCompleted: 0, joinedAt: Date.now(), lastQuestCompletedAt: null, 
        consecutiveLateCount: 0, debuffImmunity: false, stagnantSoulCounter: 0, rustyEquipment: false, brokenShieldQuests: [],
        isGuildMaster: role === "guild_master",
        isAdventurer: role === "adventurer",
        availableRoles: [role]
      };

      const { error } = await supabase.from('users').insert([{ 
        id: newUser.id, email: newUser.email, username: newUser.username, role: newUser.role, password_hash: password, 
        avatar: newUser.avatar, xp: newUser.xp, level: newUser.level, buffs: newUser.buffs, debuffs: newUser.debuffs,
        active_buffs: newUser.activeBuffs, active_debuffs: newUser.activeDebuffs, 
        guild_id: assignedGuildId, 
        quests_completed: newUser.questsCompleted, joined_at: newUser.joinedAt, last_quest_completed_at: newUser.lastQuestCompletedAt,
        consecutive_late_count: newUser.consecutiveLateCount, debuff_immunity: newUser.debuffImmunity,
        stagnant_soul_counter: newUser.stagnantSoulCounter, rusty_equipment: newUser.rustyEquipment, broken_shield_quests: newUser.brokenShieldQuests,
        is_guild_master: newUser.isGuildMaster, is_adventurer: newUser.isAdventurer 
      }]);

      if (error) throw error;
      setUsers(prev => [...prev, newUser]);
      setCurrentUser(newUser);
      toast.success(role === "guild_master" ? `Guild created! Welcome, Master ${username}!` : `Welcome to the Guild, ${username}!`);
      return true;
    } catch (error: any) {
      toast.error("Gagal mendaftar: " + error.message);
      return false;
    }
  };

  const login = async (identifier: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.from('users').select('*').or(`username.eq."${identifier}",email.eq."${identifier}"`).eq('password_hash', password).maybeSingle();
      if (error) throw error;
      if (!data) { toast.error("Email/Username or Password Incorrect, Please Make Sure You are Sober!"); return false; }

      const loggedInUser: User = {
        id: data.id, email: data.email, username: data.username, role: data.role as Role, avatar: data.avatar,
        xp: data.xp || 0, level: data.level || 1, buffs: data.buffs || [], debuffs: data.debuffs || [],  achievements: data.achievements || [],
        activeBuffs: data.active_buffs || [], activeDebuffs: data.active_debuffs || [], guildId: data.guild_id || "",
        questsCompleted: data.quests_completed || 0, joinedAt: data.joined_at || Date.now(), lastQuestCompletedAt: data.last_quest_completed_at,
        consecutiveLateCount: data.consecutive_late_count || 0, debuffImmunity: data.debuff_immunity || false,
        stagnantSoulCounter: data.stagnant_soul_counter || 0, rustyEquipment: data.rusty_equipment || false, brokenShieldQuests: data.broken_shield_quests || [],
        isGuildMaster: data.is_guild_master || false, 
        isAdventurer: data.is_adventurer || false,     
        availableRoles: [ 
          ...(data.is_guild_master ? ['guild_master'] : []),
          ...(data.is_adventurer ? ['adventurer'] : []),
        ] as Role[]
      };
      setCurrentUser(loggedInUser);
      toast.success(`Welcome back, ${loggedInUser.username}!`);
      return true;
    } catch (err: any) {
      toast.error("Gagal Login.");
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('game_user');
    toast.success("Logged out safely, Adventurer!");
  };

  const switchRole = async (newRole: Role): Promise<void> => {
    if (!currentUser) return;

    const hasAccess = newRole === "guild_master" ? currentUser.isGuildMaster : currentUser.isAdventurer;
    if (!hasAccess) {
      toast.error("Lo belum punya role ini, Adventurer!");
      return;
    }

    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', currentUser.id);

    if (error) {
      toast.error("Gagal berpindah role.");
      return;
    }

    const updatedUser = { ...currentUser, role: newRole };
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));

    const icon = newRole === "guild_master" ? "👑" : "⚔️";
    toast.success(`Berhasil menjadi ${newRole === 'guild_master' ? 'Guild Master' : 'Adventurer'}!`, { icon });
  };

  // --- QUEST METHODS ---
  const createQuest = async (title: string, description: string, difficulty: QuestDifficulty, deadlineTimestamp: number) => {
    if (!currentUser) return;

    const questData = {
      title, 
      description, 
      difficulty, 
      xp_reward: XP_MAP[difficulty], 
      deadline: deadlineTimestamp, 
      created_by: currentUser.id, 
      guild_id: currentUser.guildId || null, 
      status: "open"
    };

    const { error } = await supabase.from('quests').insert([questData]);
    
    if (error) {
      toast.error("Gagal membuat quest: " + error.message);
      console.error(error);
    } else { 
      fetchQuests(); 
      toast.success("Quest has been manifested into the world!"); 
    }
  };

  const acceptQuest = async (questId: string): Promise<void> => {
    if (!currentUser) return;
    const { error } = await supabase
      .from('quests')
      .update({ 
        status: "accepted", 
        assigned_to: currentUser.id, 
        accepted_at: new Date().toISOString() 
      })
      .eq('id', questId);

    if (error) {
      toast.error("Gagal mengambil quest");
      return;
    }
    
    const updatedUser = checkInactivityDebuff(currentUser, quests);
    await updateUserInDb(updatedUser);
    fetchQuests();
    toast.success("Quest has been accepted! Time to embark on your adventure!");
  };

  const submitQuest = async (questId: string): Promise<void> => {
    if (!currentUser) return;
    const now = Date.now();
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;

    const { error } = await supabase
      .from('quests')
      .update({ 
        status: "submitted", 
        submitted_at: new Date(now).toISOString() 
      })
      .eq('id', questId);

    if (error) {
      toast.error("Gagal submit");
      return;
    }

    const tempQuest = { ...quest, status: "submitted" as QuestStatus, submittedAt: now };
    const updatedUser = applyBuffsDebuffs(currentUser, tempQuest, now, quests);
    await updateUserInDb(updatedUser);
    fetchQuests();
    toast.success("Quest has been submitted! Awaiting Guild Master's approval. May the odds be ever in your favor!");
  };

  const rejectQuest = async (questId: string): Promise<void> => {
    if (!currentUser) return;
    const quest = quests.find(q => q.id === questId);
    if (!quest || !quest.assignedTo) return;

    const { error } = await supabase.from('quests').update({ status: "accepted", submitted_at: null, was_rejected: true }).eq('id', questId);
    if (error) return;

    const adventurer = users.find(u => u.id === quest.assignedTo);
    if (adventurer) {
      let updated = addDebuff(adventurer, "Broken Shield", 48 * 60 * 60 * 1000, questId);
      updated = { ...updated, brokenShieldQuests: [...updated.brokenShieldQuests, questId] };
      if (updated.debuffs.includes("Broken Shield")) toast("🛡️💔 Debuff: Broken Shield", { description: `-25% XP when quest "${quest.title}" is finally approved.` });
      await updateUserInDb(updated);
    }
    fetchQuests();
  };

  const approveQuest = async (questId: string): Promise<void> => {
    if (!currentUser || currentUser.role !== "guild_master") {
      toast.error("Hanya Guild Master yang bisa memberikan restu!");
      return;
    }

    const quest = quests.find(q => q.id === questId);
    if (!quest || !quest.assignedTo) return;

    const adventurer = users.find(u => u.id === quest.assignedTo);
    if (!adventurer) return;

    const now = Date.now();

    try {
      const { error: questError } = await supabase
        .from('quests')
        .update({ 
          status: "completed", 
          completed_at: new Date(now).toISOString() 
        })
        .eq('id', questId);

      if (questError) throw questError;

      const xpBreakdown = calcXpWithModifiers(adventurer, quest);
      const newXp = adventurer.xp + xpBreakdown.totalXp;
      const oldLevel = adventurer.level;
      const newLevel = calcLevel(newXp);
      const totalCompleted = (adventurer.questsCompleted || 0) + 1;
      
      let updated: User = { 
        ...adventurer, 
        xp: newXp, 
        level: newLevel, 
        questsCompleted: totalCompleted, 
        lastQuestCompletedAt: now 
      };

      const currentAchievements = adventurer.achievements || [];
      const newlyUnlocked: string[] = [];

      if (totalCompleted >= 1 && !currentAchievements.includes("First Quest")) newlyUnlocked.push("First Quest");
      if (totalCompleted >= 5 && !currentAchievements.includes("Elite Contributor")) newlyUnlocked.push("Elite Contributor");
      if (totalCompleted >= 10 && !currentAchievements.includes("Veteran")) newlyUnlocked.push("Veteran");
      if (newLevel >= 5 && !currentAchievements.includes("Rising Star")) newlyUnlocked.push("Rising Star");
      if (newLevel >= 10 && !currentAchievements.includes("Level 10")) newlyUnlocked.push("Level 10");

      if (quest.difficulty === "legendary" && !currentAchievements.includes("Legendary Slayer")) newlyUnlocked.push("Legendary Slayer");

      const history = quests.filter(q => q.assignedTo === adventurer.id && (q.status === 'completed' || q.id === questId));
      const uniqueDiffs = new Set(history.map(q => q.difficulty));
      if (uniqueDiffs.has('easy') && uniqueDiffs.has('medium') && uniqueDiffs.has('hard') && uniqueDiffs.has('legendary')) {
        if (!currentAchievements.includes("Jack of All Trades")) newlyUnlocked.push("Jack of All Trades");
      }

      if (quest.acceptedAt) {
        const acceptedTime = new Date(quest.acceptedAt).getTime();
        const durationHours = (now - acceptedTime) / (1000 * 60 * 60);
        if (durationHours <= 1 && !currentAchievements.includes("Speed Demon")) newlyUnlocked.push("Speed Demon");
      }

      const hour = new Date().getHours();
      if (hour >= 0 && hour < 5 && !currentAchievements.includes("Night Owl")) newlyUnlocked.push("Night Owl");

      const activeDebuffs = adventurer.debuffs || [];
      if (activeDebuffs.length === 0 && totalCompleted >= 3 && !currentAchievements.includes("Hat Trick")) newlyUnlocked.push("Hat Trick");

      updated.achievements = [...currentAchievements, ...newlyUnlocked];

      if (newlyUnlocked.length > 0) {
         newlyUnlocked.forEach(title => toast.success(`🏆 ACHIEVEMENT UNLOCKED: ${title}!`));
      }

      updated = applyBuffsDebuffs(updated, quest, now, quests);
      if (updated.brokenShieldQuests) {
        updated.brokenShieldQuests = updated.brokenShieldQuests.filter(id => id !== quest.id);
      }
      updated = cleanExpiredEffects(updated);

      const isSaveSuccess = await updateUserInDb(updated);
      if (!isSaveSuccess) return; 

      if (newLevel > oldLevel) {
        toast.success(`🎊 LEVEL UP! ${adventurer.username} naik ke Level ${newLevel}!`);
      }

      toast.success(`⚔️ Quest "${quest.title}" Approved!`);
      
      await Promise.all([fetchQuests(), fetchUsers()]);
      
    } catch (error: any) {
      console.error("⛔ ApproveQuest Error:", error);
      toast.error("Gagal menyetujui quest");
    }
  };

  const fetchGuildMessages = useCallback(async () => {
    if (!currentUser?.guildId) return; 

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('guild_id', currentUser.guildId) 
      .order('created_at', { ascending: true })
      .limit(50);

    if (!error && data) {
      setChatMessages(data as ChatMessage[]);
    }
  }, [currentUser?.guildId]);

  useEffect(() => {
    if (!currentUser?.guildId) return;

    fetchGuildMessages();

    const channel = supabase
      .channel(`guild-room-${currentUser.guildId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `guild_id=eq.${currentUser.guildId}`
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setChatMessages((prev) => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.guildId, fetchGuildMessages]);

  const sendMessage = async (content: string) => {
    if (!currentUser?.guildId) {
      toast.error("Kamu harus masuk Guild dulu untuk ngobrol di Tavern!");
      return;
    }

    const { error } = await supabase.from('chat_messages').insert([{
      content: content,
      user_id: currentUser.id,
      username: currentUser.username,
      avatar: currentUser.avatar || "👤",
      role: currentUser.role,
      guild_id: currentUser.guildId
    }]);

    if (error) {
      console.error("Gagal kirim chat:", error);
      toast.error("Failed to send message");
    }
  };

  const sendInvite = async (email: string) => {
    if (!currentUser) return;
    try {
      const { data: targetUser, error: userError } = await supabase
        .from('users')
        .select('id, username, guild_id')
        .eq('email', email)
        .single();

      if (userError || !targetUser) {
        toast.error("Adventurer tidak ditemukan di database!");
        return;
      }

      const { error: inviteError } = await supabase
        .from('invitations')
        .insert([{
          guild_id: currentUser.guildId,
          inviter_id: currentUser.id,
          invitee_email: email,
          status: 'pending'
        }]);

      if (inviteError) throw inviteError;
      toast.success(`Raven has Been Sent to ${email}!`);
    } catch (error: any) {
      console.error("Invite Error:", error);
      toast.error("Gagal mengirim undangan.");
    }
  };

  const acceptInvite = async (inviteID: string, guildId: string) => {
    if (!currentUser) return;
    try {
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({ guild_id: guildId })
        .eq('id', currentUser.id);

      if (userUpdateError) throw userUpdateError;

      const { error: inviteUpdateError } = await supabase
        .from('invitations')
        .update({ status: 'accepted' })
        .eq('id', inviteID);

      if (inviteUpdateError) throw inviteUpdateError;

      const updatedUser = { ...currentUser, guildId: guildId };
      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
      localStorage.setItem('game_user', JSON.stringify(updatedUser));

      toast.success("Welcome to the Guild, Keeps your sword sharp and your wits sharper!");
      
      await fetchUsers(); 
      fetchQuests(); 
    } catch (error: any) {
      console.error("Accept Invite Error:", error);
      toast.error("Gagal bergabung ke Guild.");
    }
  };

  const changeAvatar = (avatar: string) => { if (currentUser) updateUserInDb({ ...currentUser, avatar }); };

  const kickMember = async (memberId: string) => {
    if (currentUser?.role !== 'guild_master') {
      toast.error("Only the Guild Master has the authority to banish members!");
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ guild_id: "" }) 
        .eq('id', memberId);

      if (error) throw error;

      setUsers(prev => prev.map(u => 
        u.id === memberId ? { ...u, guildId: "" } : u
      ));
      
      toast.success("Adventurer has been Banished from the Guild!");
      await fetchUsers(); 
    } catch (err) {
      console.error("Kick Error:", err);
      toast.error("Failed to Banish Adventurer.");
    }
  };

  return (
    <GameContext.Provider value={{
      currentUser, 
      users, 
      quests, 
      chatMessages, 
      achievements,
      masterBuffs,   // 👈 Ter-export ke seluruh UI
      masterDebuffs, // 👈 Ter-export ke seluruh UI
      login, 
      register, 
      logout, 
      createQuest, 
      acceptQuest, 
      submitQuest,
      approveQuest, 
      rejectQuest, 
      sendMessage,
      sendInvite,      
      acceptInvite,
      kickMember,    
      changeAvatar,
      switchRole,      
      availableAvatars: AVATARS
    }}>
      {children}
    </GameContext.Provider>
  );
};