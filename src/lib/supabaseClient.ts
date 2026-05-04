import { createClient } from '@supabase/supabase-js'

// 1. URL Project (Tanpa /rest/v1/ di ujungnya)
const supabaseUrl = 'https://ldlodwlyshvohcajifnm.supabase.co' 

// 2. Anon Key yang baru aja lu kirim
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkbG9kd2x5c2h2b2hjYWppZm5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MzY5NDMsImV4cCI6MjA5MDMxMjk0M30.r43HjHzk5HSwk5tSSQ2lhjmhGl9nRE-6RTYlWW6fh7I'

// 3. Inisialisasi Client standar (Trik fetch lama sudah tidak butuh lagi)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)