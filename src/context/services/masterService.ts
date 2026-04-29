import { supabase } from "@/lib/supabaseClient";

export const masterService = {
  async fetchAllMasterData() {
    const [achRes, buffRes, debuffRes] = await Promise.all([
      supabase.from('achievements').select('*'),
      supabase.from('buffs').select('*'),
      supabase.from('debuffs').select('*')
    ]);

    return {
      achievements: achRes.data || [],
      buffs: buffRes.data || [],
      debuffs: debuffRes.data || []
    };
  }
};