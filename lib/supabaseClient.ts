

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fguzohocopnmmhqpleuh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZndXpvaG9jb3BubW1ocXBsZXVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NDcwODEsImV4cCI6MjA3ODAyMzA4MX0.6_pvR4j648NIIUxtJ0qvpUzAPMN5cZAaKF91eYveHjM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // More secure auth flow
  },
});