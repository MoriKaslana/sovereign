import { createClient } from '@supabase/supabase-js'

// 1. URL Project (Tanpa /rest/v1/ di ujungnya)
const supabaseUrl = 'https://nyqpsgwxtddikxmznvip.supabase.co' 

// 2. Anon Key yang baru aja lu kirim
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55cXBzZ3d4dGRkaWt4bXpudmlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NzUxNTAsImV4cCI6MjA5MzQ1MTE1MH0.lm-1vXKVStFNu84vduO9c_M9f5sZzucXiRReLUXGukk'

// 3. Inisialisasi Client standar (Trik fetch lama sudah tidak butuh lagi)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)