import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client. The dashboard is a client app, so this is the
// one we use for auth + reading/writing the user's own rows (guarded by RLS).
// Safe to expose: the anon key only works through Row Level Security.
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase env vars: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  return createBrowserClient(url, anonKey);
}
