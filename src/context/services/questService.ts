// src/context/services/questService.ts
import { supabase } from "@/lib/supabaseClient";
import { Quest, QuestDifficulty, QuestStatus } from "@/types/game";

export const questService = {
  // 1. Mengambil semua quest berdasarkan Guild
  async fetchQuestsDb(guildId: string | null): Promise<Quest[]> {
    let query = supabase.from('quests').select('*');

    if (guildId && guildId !== "") {
      query = query.eq('guild_id', guildId);
    } else {
      query = query.or('guild_id.is.null,guild_id.eq.""');
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    if (!data) return [];

    return data.map(q => ({
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
      isDuel: q.is_duel || false,
      duelStatus: q.duel_status || null,
      duelOpponentId: q.duel_opponent_id || null,
      challengerId: q.challenger_id || null,
    }));
  },

  // 2. Membuat quest baru
  async createQuest(questData: any) {
    const { error } = await supabase.from('quests').insert([questData]);
    if (error) throw error;
  },

  // 3. Mengambil quest (Accept)
  async acceptQuest(questId: string, userId: string) {
    const { error } = await supabase
      .from('quests')
      .update({ 
        status: "accepted", 
        assigned_to: userId, 
        accepted_at: new Date().toISOString() 
      })
      .eq('id', questId);
    if (error) throw error;
  },

  // 4. Mengirim quest (Submit)
  // UPDATE: Ditambah parameter submittedAt agar sinkron dengan GameContext
  async submitQuest(questId: string, submittedAt?: string) {
    const now = submittedAt || new Date().toISOString();
    const { error } = await supabase
      .from('quests')
      .update({ 
        status: "submitted", 
        submitted_at: now 
      })
      .eq('id', questId);
    if (error) throw error;
  }
};