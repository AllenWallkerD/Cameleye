import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client. The dashboard is a client app, so this is the
// one we use for auth + reading/writing the user's own rows (guarded by RLS).
// Safe to expose: the anon key only works through Row Level Security.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
