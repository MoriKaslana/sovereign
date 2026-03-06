import React, { createContext, useContext, useState, useCallback } from "react";
import { toast } from "sonner";

export type Role = "guild_master" | "adventurer";
export type QuestDifficulty = "easy" | "medium" | "hard" | "legendary";
export type QuestStatus = "open" | "accepted" | "submitted" | "completed";

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
  guildId: string;
  questsCompleted: number;
  joinedAt: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  difficulty: QuestDifficulty;
  xpReward: number;
  deadline: number; // timestamp
  createdBy: string;
  assignedTo: string | null;
  status: QuestStatus;
  createdAt: number;
  acceptedAt: number | null;
  submittedAt: number | null;
  completedAt: number | null;
  guildId: string;
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
  { id: "speed_demon", title: "Speed Demon", description: "Submit a quest within 1 hour", icon: "⚡", unlockedBy: [] },
  { id: "legendary", title: "Legend", description: "Complete a legendary quest", icon: "👑", unlockedBy: [] },
  { id: "social", title: "Tavern Regular", description: "Send 10 messages in the tavern", icon: "🍻", unlockedBy: [] },
];

interface GameState {
  currentUser: User | null;
  users: User[];
  quests: Quest[];
  chatMessages: ChatMessage[];
  achievements: Achievement[];
  login: (email: string, password: string) => boolean;
  register: (email: string, username: string, password: string, role: Role) => boolean;
  logout: () => void;
  createQuest: (title: string, description: string, difficulty: QuestDifficulty, deadlineTimestamp: number) => void;
  acceptQuest: (questId: string) => void;
  submitQuest: (questId: string) => void;
  approveQuest: (questId: string) => void;
  sendMessage: (message: string) => void;
  inviteAdventurer: (email: string) => string;
  changeAvatar: (avatar: string) => void;
  availableAvatars: string[];
}

const GameContext = createContext<GameState | null>(null);

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be inside GameProvider");
  return ctx;
};

// Simple credential store
interface Credentials {
  email: string;
  password: string;
  userId: string;
}

const XP_MAP: Record<QuestDifficulty, number> = { easy: 50, medium: 100, hard: 200, legendary: 500 };

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [credentials, setCredentials] = useState<Credentials[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>(DEFAULT_ACHIEVEMENTS);
  const [messageCount, setMessageCount] = useState<Record<string, number>>({});

  const guildId = "sovereign-guild";

  const calcLevel = (xp: number) => Math.floor(xp / 200) + 1;

  const applyBuffsDebuffs = useCallback((user: User, quest: Quest, submittedAt: number): User => {
    const newBuffs = [...user.buffs];
    const newDebuffs = [...user.debuffs];

    // Early submission buff
    const timeLeft = quest.deadline - submittedAt;
    const totalTime = quest.deadline - (quest.acceptedAt || quest.createdAt);
    if (timeLeft > totalTime * 0.5 && !newBuffs.includes("Adventurer's Haste")) {
      newBuffs.push("Adventurer's Haste");
      toast("⚡ Buff Gained: Adventurer's Haste", { description: "Submitted early — impressive speed!" });
    }

    // Hard task buff
    if ((quest.difficulty === "hard" || quest.difficulty === "legendary") && !newBuffs.includes("Scholar's Focus")) {
      newBuffs.push("Scholar's Focus");
      toast("🛡️ Buff Gained: Scholar's Focus", { description: "Conquered a challenging quest!" });
    }

    // Weekend warrior
    const day = new Date(submittedAt).getDay();
    if ((day === 0 || day === 6) && !newBuffs.includes("Weekend Warrior")) {
      newBuffs.push("Weekend Warrior");
      toast("🔥 Buff Gained: Weekend Warrior", { description: "Working on weekends — true dedication!" });
    }

    // Late submission debuff
    if (submittedAt > quest.deadline && !newDebuffs.includes("Cursed Procrastination")) {
      newDebuffs.push("Cursed Procrastination");
      toast("💀 Debuff: Cursed Procrastination", { description: "Submitted after the deadline..." });
    }

    return { ...user, buffs: newBuffs, debuffs: newDebuffs };
  }, []);

  const checkActiveDebuffs = useCallback((user: User, allQuests: Quest[]): User => {
    const activeQuests = allQuests.filter(q => q.assignedTo === user.id && q.status === "accepted");
    const newDebuffs = [...user.debuffs];

    if (activeQuests.length > 5 && !newDebuffs.includes("Slacker's Fatigue")) {
      newDebuffs.push("Slacker's Fatigue");
      toast("💀 Debuff: Slacker's Fatigue", { description: "Too many active quests! Focus up." });
    }

    // Inactivity: no quest completed in 7 days
    const lastCompleted = allQuests
      .filter(q => q.assignedTo === user.id && q.status === "completed")
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))[0];
    if (lastCompleted && Date.now() - (lastCompleted.completedAt || 0) > 7 * 24 * 60 * 60 * 1000) {
      if (!newDebuffs.includes("Rusty Equipment")) {
        newDebuffs.push("Rusty Equipment");
        toast("🔧 Debuff: Rusty Equipment", { description: "No quest completed in 7 days — get moving!" });
      }
    }

    return { ...user, debuffs: newDebuffs };
  }, []);

  const register = (email: string, username: string, password: string, role: Role): boolean => {
    if (credentials.find(c => c.email === email)) return false;
    const id = crypto.randomUUID();
    const newUser: User = {
      id, email, username, role,
      avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
      xp: 0, level: 1, buffs: [], debuffs: [],
      guildId, questsCompleted: 0, joinedAt: Date.now(),
    };
    setUsers(prev => [...prev, newUser]);
    setCredentials(prev => [...prev, { email, password, userId: id }]);
    setCurrentUser(newUser);
    return true;
  };

  const login = (username: string, password: string): boolean => {
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) return false;
    const cred = credentials.find(c => c.userId === user.id && c.password === password);
    if (!cred) return false;
    setCurrentUser(user);
    return true;
  };

  const logout = () => setCurrentUser(null);

  const createQuest = (title: string, description: string, difficulty: QuestDifficulty, deadlineTimestamp: number) => {
    if (!currentUser) return;
    const quest: Quest = {
      id: crypto.randomUUID(),
      title, description, difficulty,
      xpReward: XP_MAP[difficulty],
      deadline: deadlineTimestamp,
      createdBy: currentUser.id,
      assignedTo: null,
      status: "open",
      createdAt: Date.now(),
      acceptedAt: null, submittedAt: null, completedAt: null,
      guildId,
    };
    setQuests(prev => [...prev, quest]);
  };

  const acceptQuest = (questId: string) => {
    if (!currentUser) return;
    setQuests(prev => prev.map(q =>
      q.id === questId ? { ...q, status: "accepted" as QuestStatus, assignedTo: currentUser.id, acceptedAt: Date.now() } : q
    ));
    // Check active debuffs
    const updated = checkActiveDebuffs(currentUser, quests);
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
  };

  const submitQuest = (questId: string) => {
    if (!currentUser) return;
    const now = Date.now();
    setQuests(prev => prev.map(q =>
      q.id === questId ? { ...q, status: "submitted" as QuestStatus, submittedAt: now } : q
    ));
    const quest = quests.find(q => q.id === questId);
    if (quest) {
      const updated = applyBuffsDebuffs(currentUser, quest, now);
      setCurrentUser(updated);
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    }
  };

  const approveQuest = (questId: string) => {
    if (!currentUser) return;
    const quest = quests.find(q => q.id === questId);
    if (!quest || !quest.assignedTo) return;

    setQuests(prev => prev.map(q =>
      q.id === questId ? { ...q, status: "completed" as QuestStatus, completedAt: Date.now() } : q
    ));

    setUsers(prev => prev.map(u => {
      if (u.id === quest.assignedTo) {
        const newXp = u.xp + quest.xpReward;
        const updated = {
          ...u,
          xp: newXp,
          level: calcLevel(newXp),
          questsCompleted: u.questsCompleted + 1,
        };
        // Update currentUser if it's the same
        if (currentUser?.id === u.id) setCurrentUser(updated);
        return updated;
      }
      return u;
    }));

    // Check achievements
    const adventurer = users.find(u => u.id === quest.assignedTo);
    if (adventurer) {
      setAchievements(prev => prev.map(a => {
        if (a.id === "first_quest" && adventurer.questsCompleted === 0 && !a.unlockedBy.includes(adventurer.id)) {
          toast("🏆 Achievement Unlocked: First Blood!", { description: "Completed your first quest!" });
          return { ...a, unlockedBy: [...a.unlockedBy, adventurer.id] };
        }
        if (a.id === "five_quests" && adventurer.questsCompleted === 4 && !a.unlockedBy.includes(adventurer.id)) {
          toast("🏆 Achievement Unlocked: Seasoned Warrior!", { description: "Completed 5 quests!" });
          return { ...a, unlockedBy: [...a.unlockedBy, adventurer.id] };
        }
        if (a.id === "legendary" && quest.difficulty === "legendary" && !a.unlockedBy.includes(adventurer.id)) {
          toast("🏆 Achievement Unlocked: Legend!", { description: "Completed a legendary quest!" });
          return { ...a, unlockedBy: [...a.unlockedBy, adventurer.id] };
        }
        return a;
      }));
    }
  };

  const sendMessage = (message: string) => {
    if (!currentUser) return;
    setChatMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      username: currentUser.username,
      avatar: currentUser.avatar,
      message,
      timestamp: Date.now(),
    }]);
    const count = (messageCount[currentUser.id] || 0) + 1;
    setMessageCount(prev => ({ ...prev, [currentUser.id]: count }));
    if (count >= 10) {
      setAchievements(prev => prev.map(a =>
        a.id === "social" && !a.unlockedBy.includes(currentUser.id)
          ? (toast("🏆 Achievement Unlocked: Tavern Regular!", { description: "Sent 10 messages in the tavern!" }), { ...a, unlockedBy: [...a.unlockedBy, currentUser.id] })
          : a
      ));
    }
  };

  const inviteAdventurer = (email: string): string => {
    const user = users.find(u => u.email === email && u.role === "adventurer");
    if (user) return `${user.username} has joined the guild!`;
    return "No adventurer found with that email.";
  };

  const changeAvatar = (avatar: string) => {
    if (!currentUser) return;
    const updated = { ...currentUser, avatar };
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
  };

  return (
    <GameContext.Provider value={{
      currentUser, users, quests, chatMessages, achievements,
      login, register, logout, createQuest, acceptQuest, submitQuest,
      approveQuest, sendMessage, inviteAdventurer, changeAvatar,
      availableAvatars: AVATARS,
    }}>
      {children}
    </GameContext.Provider>
  );
};
