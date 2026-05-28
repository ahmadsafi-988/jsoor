import { createBrowserClient } from "@supabase/ssr";
import { Database } from "../supabase_generated_types";
export function createClient() {
  return createBrowserClient<Database>(
    "https://hmisspubbdfjrofycmgc.supabase.co",
    "sb_publishable_3n1j_ly36hE5MqeqYwAlWw_9XVWQBI-",
  );
}
