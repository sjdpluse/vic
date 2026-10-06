import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://jemyrlzpsmtpveulrhgi.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_la4Zwo6DUHwtY1aQ3HijHA_WkgWOHik";

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL;
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  DEFAULT_SUPABASE_PUBLISHABLE_KEY;

export function createPublicSupabaseClient() {
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function createBrowserSupabaseClient() {
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}
