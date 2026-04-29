// src/context/services/inviteService.ts
import { supabase } from "@/lib/supabaseClient";

export const inviteService = {
  // Mencari user berdasarkan email (buat mastiin targetnya ada)
  async findUserByEmail(email: string) {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, guild_id')
      .eq('email', email)
      .single();
    
    if (error) return null;
    return data;
  },

  // Kirim data undangan baru
  async createInvite(guildId: string, inviterId: string, inviteeEmail: string) {
    const { error } = await supabase
      .from('invitations')
      .insert([{
        guild_id: guildId,
        inviter_id: inviterId,
        invitee_email: inviteeEmail,
        status: 'pending'
      }]);
    
    if (error) throw error;
  },

  // Update user jadi masuk guild & update status undangan
  async processAcceptInvite(userId: string, inviteId: string, guildId: string) {
    // 1. Update user guild_id
    const userUpdate = supabase
      .from('users')
      .update({ guild_id: guildId })
      .eq('id', userId);

    // 2. Update status undangan
    const inviteUpdate = supabase
      .from('invitations')
      .update({ status: 'accepted' })
      .eq('id', inviteId);

    const [res1, res2] = await Promise.all([userUpdate, inviteUpdate]);
    if (res1.error || res2.error) throw res1.error || res2.error;
  }
};