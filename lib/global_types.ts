import { Tables } from "./supabase_generated_types";
export type user = Tables<"profiles">;
export type project  = Tables<"projects">;
export type badge  = Tables<"badges">;
export type profile = { profile_base: user,
                        projects: project[],
                        badges: badge[],
                        skills: string[],
                        };