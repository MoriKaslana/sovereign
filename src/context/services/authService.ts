import { supabase } from "@/lib/supabaseClient";

export const authService = {
  // Ambil user berdasarkan email
  async getUserByEmail(email: string) {
    const { data } = await supabase.from('users').select('*').eq('email', email);
    return data && data.length > 0 ? data[0] : null;
  },

  // Ambil user berdasarkan username
  async getUserByUsername(username: string) {
    const { data } = await supabase.from('users').select('*').eq('username', username);
    return data && data.length > 0 ? data[0] : null;
  },

  // Update data user (untuk tambah role)
  async updateUser(id: string, updates: any) {
    const { error } = await supabase.from('users').update(updates).eq('id', id);
    if (error) throw error;
  },

  // Insert user baru
  async insertUser(payload: any) {
    const { error } = await supabase.from('users').insert([payload]);
    if (error) throw error;
  },

  // Login check
  async verifyLogin(identifier: string, password_hash: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`username.eq.${identifier},email.eq.${identifier}`)
      .eq('password_hash', password_hash);
    
    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  }
};