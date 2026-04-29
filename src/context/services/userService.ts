// src/context/services/userService.ts
import { supabase } from "@/lib/supabaseClient";
import { User, Role } from "@/types/game";

export const userService = {
  // 1. Ambil semua data user & mapping ke format Frontend
  async fetchAllUsers(): Promise<User[]> {
    const { data, error } = await supabase.from('users').select('*');
    
    if (error) throw error;
    if (!data) return [];

    return data.map((u: any) => ({
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
      activeBuffs: u.active_buffs || u.activebuffs || [], 
      activeDebuffs: u.active_debuffs || u.activedebuffs || [],
      guildId: u.guild_id || u.guildid || "", 
      questsCompleted: u.quests_completed || u.questscompleted || 0,
      joinedAt: u.joined_at || u.joinedat || Date.now(), 
      lastQuestCompletedAt: u.last_quest_completed_at ? Number(u.last_quest_completed_at) : null,
      consecutiveLateCount: u.consecutive_late_count || u.consecutivelatecount || 0, 
      debuffImmunity: u.debuff_immunity || u.debuffimmunity || false,
      stagnantSoulCounter: u.stagnant_soul_counter || u.stagnantsoulcounter || 0, 
      rustyEquipment: u.rusty_equipment || u.rustyequipment || false,
      brokenShieldQuests: u.broken_shield_quests || u.brokenshieldquests || [],
      isGuildMaster: u.is_guild_master || u.isguildmaster || false, 
      isAdventurer: u.is_adventurer || u.isadventurer || false,     
      availableRoles: [ 
        ...(u.is_guild_master || u.isguildmaster ? ['guild_master'] : []),
        ...(u.is_adventurer || u.isadventurer ? ['adventurer'] : []),
      ] as Role[]
    }));
  },

  // 2. Update data user ke Database (XP, Level, Buff, dll)
  async updateUserDb(user: User): Promise<void> {
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
        achievements: user.achievements,
        avatar: user.avatar, // Tambahin biar ganti avatar juga kesimpen
        role: user.role      // Tambahin biar switch role juga kesimpen
      })
      .eq('id', user.id);

    if (error) throw error;
  }
};