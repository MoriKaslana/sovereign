import { createClient } from '@supabase/supabase-js'

export const supabase = createClient('http://localhost:3000', 'dummy-key', {
  global: {
    // THE ULTIMATE TRICK: Kita cegat dan bersihkan URL sebelum meluncur
    fetch: (url, options) => {
      // 1. Kalau Supabase maksa pakai /rest/v1/, kita hapus
      let cleanUrl = url.toString().replace('/rest/v1/', '/');
      
      // 2. Kalau ada double slash (http://localhost:3000//quests), kita potong jadi satu
      cleanUrl = cleanUrl.replace('3000//', '3000/');
      
      // 3. Lanjutkan request dengan URL yang sudah bersih dan rapi
      return fetch(cleanUrl, options);
    },
    headers: {
      'apikey': '',
      'Authorization': ''
    }
  }
})