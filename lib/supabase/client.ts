import { createBrowserClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

    return createBrowserClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            db: {
                schema: 'risenwise'
            }
        }
    )
}
