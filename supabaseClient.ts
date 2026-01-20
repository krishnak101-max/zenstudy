
import { createClient } from '@supabase/supabase-js';

// Hardcoded defaults provided by the user as fallback
const DEFAULT_URL = 'https://lkhvztiavvuibvuouhfa.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxraHZ6dGlhdnZ1aWJ2dW91aGZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NzYwNzIsImV4cCI6MjA4NDQ1MjA3Mn0.RXD8pffNXOTXcg1TuDfnWqkKrlwhFb_-6mCID55tCn8';

let supabaseUrl = DEFAULT_URL;
let supabaseAnonKey = DEFAULT_KEY;

// 1. Try to get from process.env (Node/Next.js/Webpack environments)
try {
  if (typeof process !== 'undefined' && process.env) {
    supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl;
    supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseAnonKey;
  }
} catch (e) {
  // Ignore errors accessing process
}

// 2. Try to get from import.meta.env (Vite/ESM environments)
try {
  const metaEnv = (import.meta as any).env;
  if (metaEnv) {
    supabaseUrl = metaEnv.VITE_SUPABASE_URL || supabaseUrl;
    supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || supabaseAnonKey;
  }
} catch (e) {
  // Ignore errors accessing import.meta
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
