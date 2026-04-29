export type Role = "guild_master" | "adventurer";
export type QuestDifficulty = "easy" | "medium" | "hard" | "legendary";
export type QuestStatus = "open" | "accepted" | "submitted" | "completed" | "rejected";

export interface BuffEntry {
  name: string;
  appliedAt: number;
  expiresAt: number | null; 
  questId?: string;
}

export interface DebuffEntry {
  name: string;
  appliedAt: number;
  expiresAt: number | null;
  questId?: string;
  remainingQuests?: number; 
}

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
  unlockedBy: string[]; 
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
  isDuel?: boolean;
  duelStatus?: 'pending' | 'accepted' | 'rejected' | null;
  duelOpponentId?: string | null;
  challengerId?: string | null;
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

export interface GameState {
  currentUser: User | null;
  users: User[];
  quests: Quest[];
  chatMessages: ChatMessage[];
  achievements: Achievement[];
  masterBuffs: MasterBuff[];     
  masterDebuffs: MasterDebuff[]; 
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
  sendDuelChallenge: (myQuestId: string, targetUserId: string) => Promise<void>;
  respondToDuel: (myQuestId: string, action: 'accept' | 'reject') => Promise<void>;
}

export interface Credentials {
  email: string;
  password: string;
  userId: string;
}