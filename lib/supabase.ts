import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Sanity checks to make developer errors clearer during local development.
if (!supabaseUrl || !supabaseAnonKey) {
  // Keep messages actionable but avoid printing full secrets.
  console.error('[supabase] Configuration missing: NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY are not set.');
  console.error('[supabase] Add a .env.local file with values from your Supabase project settings, for example:');
  console.error("NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co");
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>');
}

// 1. Standard Client (Browser aur Common operations ke liye)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'tgs-auth-token',
  },
});

// 2. Admin Client (Sirf Server-side actions ke liye, bina crash kiye)
export const supabaseAdmin = typeof window === 'undefined'
  ? createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )
  : null;

/**
 * Helper to test whether the Supabase URL is reachable from this environment.
 * Returns true on success, false on failure.
 */
export async function testSupabaseConnection(timeout = 5000): Promise<boolean> {
  if (!supabaseUrl) {
    console.error('[supabase] testSupabaseConnection: NEXT_PUBLIC_SUPABASE_URL is empty');
    return false;
  }
  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    if (controller) setTimeout(() => controller.abort(), timeout);
    const res = await fetch(supabaseUrl, { method: 'HEAD', signal: controller?.signal });
    console.log(`[supabase] connectivity check status: ${res.status}`);
    return res.ok;
  } catch (err: any) {
    console.error('[supabase] connectivity check failed:', err?.message || err);
    return false;
  }
}