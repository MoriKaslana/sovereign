// src/context/services/duelService.ts
import { supabase } from "@/lib/supabaseClient";

export const duelService = {
  // Fungsi untuk kirim tantangan (Update 2 quest sekaligus)
  async sendChallenge(myQuestId: string, targetQuestId: string, myUserId: string, targetUserId: string) {
    const updateChallenger = supabase
      .from('quests')
      .update({ 
        is_duel: true, 
        duel_status: 'pending', 
        duel_opponent_id: targetUserId, 
        challenger_id: myUserId 
      })
      .eq('id', myQuestId);

    const updateTarget = supabase
      .from('quests')
      .update({ 
        is_duel: true, 
        duel_status: 'pending', 
        duel_opponent_id: myUserId, 
        challenger_id: myUserId 
      })
      .eq('id', targetQuestId);

    const [res1, res2] = await Promise.all([updateChallenger, updateTarget]);
    if (res1.error || res2.error) throw res1.error || res2.error;
  },

  // Fungsi untuk terima/tolak duel
  async respond(myQuestId: string, challengerQuestId: string | undefined, action: 'accept' | 'reject') {
    const updates = action === 'reject' 
      ? { is_duel: false, duel_status: null, duel_opponent_id: null, challenger_id: null }
      : { duel_status: 'accepted' };

    const updateMyQuest = supabase.from('quests').update(updates).eq('id', myQuestId);

    if (challengerQuestId) {
      const updateChallenger = supabase.from('quests').update(updates).eq('id', challengerQuestId);
      const [res1, res2] = await Promise.all([updateMyQuest, updateChallenger]);
      if (res1.error || res2.error) throw res1.error || res2.error;
    } else {
      const { error } = await updateMyQuest;
      if (error) throw error;
    }
  }
};