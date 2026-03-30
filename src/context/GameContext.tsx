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
  guildId: string;
  questsCompleted: number;
  joinedAt: number;
  lastQuestCompletedAt: number | null;
  consecutiveLateCount: number;
  debuffImmunity: boolean; // from Aura of Purity
  stagnantSoulCounter: number; // quests remaining under Stagnant Soul
  rustyEquipment: boolean; // grayscale + buffs disabled
  brokenShieldQuests: string[]; // quest IDs with -25% penalty
  isGuildMaster: boolean; // 👈 Tambahan untuk sinkronisasi DB
  isAdventurer: boolean;   // 👈 Tambahan untuk sinkronisasi DB
  availableRoles: Role[]; // 👈 Tambahan untuk sinkronisasi DB
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
  userId: string;
  username: string;
  avatar: string;
  message: string;
  timestamp: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedBy: string[];
}

const AVATARS = ["⚔️", "🛡️", "🧙", "🏹", "🗡️", "🔮", "🐉", "🦅", "🐺", "🦁"];

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: "first_quest", title: "First Blood", description: "Complete your first quest", icon: "⚔️", unlockedBy: [] },
  { id: "five_quests", title: "Seasoned Warrior", description: "Complete 5 quests", icon: "🛡️", unlockedBy: [] },
  { id: "ten_quests", title: "Veteran", description: "Complete 10 quests", icon: "🏅", unlockedBy: [] },
  { id: "speed_demon", title: "Speed Demon", description: "Submit a quest within 1 hour", icon: "⚡", unlockedBy: [] },
  { id: "legendary", title: "Legend", description: "Complete a legendary quest", icon: "👑", unlockedBy: [] },
  { id: "social", title: "Tavern Regular", description: "Send 10 messages in the tavern", icon: "🍻", unlockedBy: [] },
  { id: "level5", title: "Rising Star", description: "Reach level 5", icon: "⭐", unlockedBy: [] },
  { id: "level10", title: "Elite Warrior", description: "Reach level 10", icon: "💎", unlockedBy: [] },
  { id: "streak3", title: "Hat Trick", description: "Complete 3 quests in a row without a debuff", icon: "🎯", unlockedBy: [] },
  { id: "all_difficulties", title: "Jack of All Trades", description: "Complete one quest of each difficulty", icon: "🃏", unlockedBy: [] },
  { id: "night_owl", title: "Night Owl", description: "Submit a quest between midnight and 5 AM", icon: "🦉", unlockedBy: [] },
];

interface GameState {
  currentUser: User | null;
  users: User[];
  quests: Quest[];
  chatMessages: ChatMessage[];
  achievements: Achievement[];
  login: (identifier: string, password: string) => Promise<boolean>;
  register: (email: string, username: string, password: string, role: Role) => Promise<boolean>;
  logout: () => void;
  createQuest: (title: string, description: string, difficulty: QuestDifficulty, deadlineTimestamp: number) => Promise<void>;
  acceptQuest: (questId: string) => Promise<void>;
  submitQuest: (questId: string) => Promise<void>;
  approveQuest: (questId: string) => Promise<void>;
  rejectQuest: (questId: string) => Promise<void>;
  sendMessage: (message: string) => void;
  sendInvite: (email: string) => Promise<void>; // Ganti ini
  acceptInvite: (inviteId: string, guildId: string) => Promise<void>; // Tambah ini
  changeAvatar: (avatar: string) => void;
  switchRole: (newRole: Role) => Promise<void>; // 👈 Tambahan fungsi pindah role
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

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [credentials, setCredentials] = useState<Credentials[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>(DEFAULT_ACHIEVEMENTS);
  const [messageCount, setMessageCount] = useState<Record<string, number>>({});

  const guildId = "sovereign-guild";
  // --- DATA FETCHERS (SUPABASE SYNC) ---
  const fetchUsers = async () => {
    const { data, error } = await supabase.from('users').select('*');
    if (!error && data) {
      const mapped: User[] = data.map(u => ({
        id: u.id, email: u.email, username: u.username, role: u.role as Role, avatar: u.avatar,
        xp: u.xp || 0, level: u.level || 1, buffs: u.buffs || [], debuffs: u.debuffs || [],
        activeBuffs: u.active_buffs || [], activeDebuffs: u.active_debuffs || [],
        guildId: u.guild_id, questsCompleted: u.quests_completed || 0,
        joinedAt: u.joined_at || Date.now(), lastQuestCompletedAt: u.last_quest_completed_at,
        consecutiveLateCount: u.consecutive_late_count || 0, debuffImmunity: u.debuff_immunity || false,
        stagnantSoulCounter: u.stagnant_soul_counter || 0, rustyEquipment: u.rusty_equipment || false,
        brokenShieldQuests: u.broken_shield_quests || [],
        isGuildMaster: u.is_guild_master || false, // 👈 Sesuai DB
        isAdventurer: u.is_adventurer || false,     // 👈 Sesuai DB
        availableRoles: [ // 👈 Mapping boolean ke array string
          ...(u.is_guild_master ? ['guild_master'] : []),
          ...(u.is_adventurer ? ['adventurer'] : []),
        ] as Role[]
      }));
      setUsers(mapped);
    }
  };

const fetchQuests = useCallback(async () => {
  // 1. Validasi: Jangan narik data kalau user-nya belum ada sama sekali (lagi loading login)
  if (!currentUser) return;

  let query = supabase.from('quests').select('*');

  // 2. Logic Filter:
  if (currentUser.guildId && currentUser.guildId !== "") {
    // Pastikan pakai .eq kalau guildId sudah valid (UUID)
    query = query.eq('guild_id', currentUser.guildId);
  } else {
    // Filter untuk Wanderer
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
}, [currentUser?.id, currentUser?.guildId]); // Pantau perubahan ID dan GuildID

// --- AUTO-FETCH TRIGGER ---
// Efek ini memastikan quest ditarik ulang setiap kali status login/guild berubah
useEffect(() => {
  if (currentUser) {
    fetchQuests();
  }
}, [currentUser?.id, currentUser?.guildId, fetchQuests]);

const updateUserInDb = async (user: User) => {
  if (!user.id) return false;

  const { error } = await supabase
    .from('users')
    .update({
      xp: user.xp,
      level: user.level,
      last_quest_completed_at: user.lastQuestCompletedAt, 
      buffs: user.buffs,
      debuffs: user.debuffs,
      active_buffs: user.activeBuffs,
      active_debuffs: user.activeDebuffs,
      quests_completed: user.questsCompleted,
      // Penting: simpan guild_id dengan format yang konsisten (null jika kosong)
      guild_id: user.guildId || null, 
      is_guild_master: user.isGuildMaster,
      is_adventurer: user.isAdventurer
    })
    .eq('id', user.id);

  if (error) {
    console.error("⛔ Gagal update data user di database:", error.message);
    return false;
  }
  
  // Optional: Panggil fetchUsers() setelah update berat agar state global sinkron
  // await fetchUsers(); 
  
  return true;
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
    fetchUsers();
    fetchQuests();
  }, []);

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
  // --- AUTH METHODS ---
  const register = async (email: string, username: string, password: string, role: Role): Promise<boolean> => {
    try {
      // 1. Cek dulu apakah email ini sudah terdaftar
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        // --- MULTI-ROLE HANDLING ---
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

        // Logic Tambahan: Jika user lama nambah role Guild Master, dia juga harus dapet Guild ID baru
        const newGuildId = (role === "guild_master" && !existingUser.guild_id) 
          ? crypto.randomUUID() 
          : existingUser.guild_id;

        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            role: role, 
            guild_id: newGuildId, // Update guild_id jika dia baru jadi GM
            is_guild_master: role === "guild_master" ? true : isGM,
            is_adventurer: role === "adventurer" ? true : isAdv
          })
          .eq('id', existingUser.id);

        if (updateError) throw updateError;
        
        await fetchUsers();
        toast.success(`Role ${role} berhasil ditambahkan! Silakan login untuk ganti role.`);
        return true;
      }

      // 2. Cek username agar tidak ada duplikasi
      const { data: userWithUsername } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (userWithUsername) {
        toast.error("Username ini sudah diambil Adventurer lain!");
        return false;
      }

      // --- DAFTAR USER BARU TULEN ---
      const id = crypto.randomUUID();
      
      // LOGIKA BARU: Guildmaster dapet UUID, Adventurer dapet string kosong (null-like)
      const assignedGuildId = role === "guild_master" ? crypto.randomUUID() : "";

      const newUser: User = {
        id, email, username, role, avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
        xp: 0, level: 1, buffs: [], debuffs: [], activeBuffs: [], activeDebuffs: [],
        guildId: assignedGuildId, // 👈 Pakai ID yang sudah ditentukan
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
        guild_id: assignedGuildId, // 👈 Masukkan ke Database
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
      if (!data) { toast.error("Email/Username atau Password salah!"); return false; }

      const loggedInUser: User = {
        id: data.id, email: data.email, username: data.username, role: data.role as Role, avatar: data.avatar,
        xp: data.xp || 0, level: data.level || 1, buffs: data.buffs || [], debuffs: data.debuffs || [],
        activeBuffs: data.active_buffs || [], activeDebuffs: data.active_debuffs || [], guildId: data.guild_id || "",
        questsCompleted: data.quests_completed || 0, joinedAt: data.joined_at || Date.now(), lastQuestCompletedAt: data.last_quest_completed_at,
        consecutiveLateCount: data.consecutive_late_count || 0, debuffImmunity: data.debuff_immunity || false,
        stagnantSoulCounter: data.stagnant_soul_counter || 0, rustyEquipment: data.rusty_equipment || false, brokenShieldQuests: data.broken_shield_quests || [],
        isGuildMaster: data.is_guild_master || false, // 👈 Sesuai DB
        isAdventurer: data.is_adventurer || false,     // 👈 Sesuai DB
        availableRoles: [ // 👈 Mapping boolean ke array string
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

    // Cek apakah user punya hak akses ke role tersebut
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

 // --- QUEST METHODS (ASYNC SYNC) ---
const createQuest = async (title: string, description: string, difficulty: QuestDifficulty, deadlineTimestamp: number) => {
  if (!currentUser) return;

  const questData = {
    title, 
    description, 
    difficulty, 
    xp_reward: XP_MAP[difficulty], 
    // Balikin ke angka (number) karena database lo tipenya BigInt
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
    toast.success("Quest dipublish!"); 
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
    toast.success("Quest diterima!");
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
    toast.success("Quest dikirim!");
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
  // 1. Validasi awal
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
    // 2. Update status Quest di Supabase
    const { error: questError } = await supabase
      .from('quests')
      .update({ 
        status: "completed", 
        completed_at: new Date(now).toISOString() 
      })
      .eq('id', questId);

    if (questError) throw questError;

    // 3. Kalkulasi XP
    const xpBreakdown = calcXpWithModifiers(adventurer, quest);
    const newXp = adventurer.xp + xpBreakdown.totalXp;
    const oldLevel = adventurer.level;
    const newLevel = calcLevel(newXp);
    
    // 4. Buat objek user terupdate dengan basic stats
    let updated: User = { 
      ...adventurer, 
      xp: newXp, 
      level: newLevel, 
      questsCompleted: adventurer.questsCompleted + 1, 
      lastQuestCompletedAt: now 
    };

    // 5. --- POP-UP LOGIKA ACHIEVEMENT ---
    // Gue pakai 'buffs' sebagai array string medali user
    setAchievements(prevAchievements => prevAchievements.map(ach => {
      // Jika user sudah punya, skip
      if (ach.unlockedBy.includes(adventurer.id)) return ach;

      let unlocked = false;
      if (ach.id === "first_quest" && updated.questsCompleted >= 1) unlocked = true;
      if (ach.id === "five_quests" && updated.questsCompleted >= 5) unlocked = true;
      if (ach.id === "level_10" && updated.level >= 10) unlocked = true;
      if (ach.id === "legendary_slayer" && quest.difficulty === "legendary") unlocked = true;

      if (unlocked) {
        // Pop-up notifikasi achievement!
        toast.success(`🏆 ACHIEVEMENT UNLOCKED: ${ach.title}!`);
        // Tambahkan gelar ke profil user
        updated.buffs = [...(updated.buffs || []), ach.title];
        return { ...ach, unlockedBy: [...ach.unlockedBy, adventurer.id] };
      }
      return ach;
    }));

    // 6. --- POP-UP LOGIKA BUFF/DEBUFF SYNC ---
    // Pastikan applyBuffsDebuffs return user objek yang lengkap
    updated = applyBuffsDebuffs(updated, quest, now, quests);
    
    // Cleanup debuff broken shield
    updated.brokenShieldQuests = (updated.brokenShieldQuests || []).filter(id => id !== quest.id);
    // Bersihkan efek expired
    updated = cleanExpiredEffects(updated);

    // 7. Simpan ke Database & Cek Berhasil/Tidak
    const isSaveSuccess = await updateUserInDb(updated);
    if (!isSaveSuccess) return; // Stop kalau gagal simpan ke DB

    // 8. PENTING: Update State Local React agar UI Dashboard Berubah
    // Update data di list besar users
    setUsers(prev => prev.map(u => u.id === adventurer.id ? updated : u));
    
    // Jika adventurer yang di-approve adalah user lo sendiri, update currentUser
    if (currentUser.id === adventurer.id) {
      setCurrentUser(updated);
    }

    // 9. Feedback Visual (Level Up Toast)
    if (newLevel > oldLevel) {
      toast.success(`🎊 LEVEL UP! ${adventurer.username} reached Level ${newLevel}!`);
    }

    const details = [
      `Base: ${xpBreakdown.baseXp}`,
      ...xpBreakdown.bonuses.map(b => `+${b.amount} (${b.name})`),
      ...xpBreakdown.penalties.map(p => `-${p.amount} (${p.name})`)
    ].join(" | ");

    toast(`⚔️ Quest Approved!`, { 
      description: `${details} => Total: ${xpBreakdown.totalXp} XP`,
      duration: 7000 
    });
    
    // 10. Refresh list quest
    fetchQuests();

  } catch (error: any) {
    console.error("⛔ ApproveQuest Error:", error);
    toast.error("Gagal menyetujui quest: " + error.message);
  }
};

// --- UTILS ---
  const sendMessage = (message: string) => {
    if (!currentUser) return;
    setChatMessages(prev => [...prev, { id: crypto.randomUUID(), userId: currentUser.id, username: currentUser.username, avatar: currentUser.avatar, message, timestamp: Date.now() }]);
    const count = (messageCount[currentUser.id] || 0) + 1;
    setMessageCount(prev => ({ ...prev, [currentUser.id]: count }));
    if (count >= 10) setAchievements(prev => prev.map(a => a.id === "social" && !a.unlockedBy.includes(currentUser.id) ? (toast("🏆 Unlocked: Tavern Regular!"), { ...a, unlockedBy: [...a.unlockedBy, currentUser.id] }) : a));
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
      // 1. Update USER di Database
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({ guild_id: guildId })
        .eq('id', currentUser.id);

      if (userUpdateError) throw userUpdateError;

      // 2. Update Status Undangan di Database
      const { error: inviteUpdateError } = await supabase
        .from('invitations')
        .update({ status: 'accepted' })
        .eq('id', inviteID);

      if (inviteUpdateError) throw inviteUpdateError;

      // 3. UPDATE STATE LOKAL & SYNC (PENTING!)
      const updatedUser = { ...currentUser, guildId: guildId };
      setCurrentUser(updatedUser);
      
      // Update juga di list users agar Hall of Fame langsung berubah
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
      
      // Simpan ke localStorage biar pas refresh gak balik null
      localStorage.setItem('game_user', JSON.stringify(updatedUser));

      toast.success("Welcome to the Guild, Keeps your sword sharp and your wits sharper!");
      
      // Refresh data agar semua komponen dapet data terbaru
      await fetchUsers(); 
      fetchQuests(); 
    } catch (error: any) {
      console.error("Accept Invite Error:", error);
      toast.error("Gagal bergabung ke Guild.");
    }
  };

  const changeAvatar = (avatar: string) => { if (currentUser) updateUserInDb({ ...currentUser, avatar }); };

  // Kick Member Logic (Hanya untuk Guild Master)
const kickMember = async (memberId: string) => {
  // 1. Proteksi: Hanya Guild Master yang bisa nge-kick
  if (currentUser?.role !== 'guild_master') {
    toast.error("Only the Guild Master has the authority to banish members!");
    return;
  }

  try {
    // 2. Update di Database
    const { error } = await supabase
      .from('users')
      .update({ guild_id: "" }) 
      .eq('id', memberId);

    if (error) throw error;

    // 3. Update State Lokal
    setUsers(prev => prev.map(u => 
      u.id === memberId ? { ...u, guildId: "" } : u
    ));
    
    toast.success("Adventurer has been Banished from the Guild!");
    
    // 4. Refresh data agar Hall of Fame & list member bersih
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
      login, 
      register, 
      logout, 
      createQuest, 
      acceptQuest, 
      submitQuest,
      approveQuest, 
      rejectQuest, 
      sendMessage,
      sendInvite,      // 👈 Pastikan ini ada
      acceptInvite,
      kickMember,    // 👈 Pastikan ini ada
      changeAvatar,
      switchRole,      // 👈 Pastikan ini ada
      availableAvatars: AVATARS
    }}>
      {children}
    </GameContext.Provider>
  );
};