import { supabase } from "@/lib/supabaseClient";

export const questActionService = {
  // GM menolak hasil kerja
  async rejectQuestDb(questId: string) {
    const { error } = await supabase
      .from('quests')
      .update({ status: "accepted", submitted_at: null, was_rejected: true })
      .eq('id', questId);
    if (error) throw error;
  },

  // GM menyetujui quest (Update status quest pemenang)
  async approveQuestDb(questId: string, completedAtIso: string) {
    const { error } = await supabase
      .from('quests')
      .update({ status: "completed", completed_at: completedAtIso })
      .eq('id', questId);
    if (error) throw error;
  },

  // Reset quest si kalah duel (Kembali jadi open)
  async resetLoserQuest(questId: string) {
    const { error } = await supabase
      .from('quests')
      .update({ 
        status: 'open', assigned_to: null, accepted_at: null, submitted_at: null,
        is_duel: false, duel_status: null, duel_opponent_id: null, challenger_id: null 
      })
      .eq('id', questId);
    if (error) throw error;
  },

  // Bersihkan status duel quest pemenang
  async clearWinnerDuelStatus(questId: string) {
    const { error } = await supabase
      .from('quests')
      .update({ is_duel: false, duel_status: 'completed' })
      .eq('id', questId);
    if (error) throw error;
  }
};