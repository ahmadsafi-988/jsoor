import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "../supabase_generated_types";
/**
 * If using Fluid compute: Don't put this client in a global variable. Always create a new client within each
 * function when using it.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    "https://hmisspubbdfjrofycmgc.supabase.co",
    "sb_publishable_3n1j_ly36hE5MqeqYwAlWw_9XVWQBI-",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
}
