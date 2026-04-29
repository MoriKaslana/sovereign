// src/context/services/chatService.ts
import { supabase } from "@/lib/supabaseClient";

export const chatService = {
  // Ambil pesan terbaru
  async getMessages(guildId: string) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('guild_id', guildId)
      .order('created_at', { ascending: true })
      .limit(50);
    
    if (error) throw error;
    return data;
  },

  // Kirim pesan baru
  async postMessage(payload: any) {
    const { error } = await supabase.from('chat_messages').insert([payload]);
    if (error) throw error;
  },

  // Hitung total pesan user (untuk achievement)
  async getMessageCount(userId: string, guildId: string) {
    const { count, error } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('guild_id', guildId);
    
    if (error) throw error;
    return count || 0;
  }
};