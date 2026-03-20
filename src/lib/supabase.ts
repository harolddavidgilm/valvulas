import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log('Supabase config loaded:', { 
  url: supabaseUrl ? 'OK' : 'MISSING', 
  key: supabaseAnonKey ? 'OK' : 'MISSING' 
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
