import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

export default async function SuspendedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("suspension_reason")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="max-w-md w-full bg-neutral-900 rounded-2xl border border-neutral-800 p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto">
          <svg className="w-7 h-7 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white">Account Suspended</h1>
        <p className="text-neutral-400 text-sm">
          Your account has been temporarily suspended by an administrator.
        </p>
        {profile?.suspension_reason && (
          <p className="text-sm text-yellow-300/80 bg-yellow-500/10 rounded-lg px-4 py-3">
            Reason: {profile.suspension_reason}
          </p>
        )}
        <p className="text-xs text-neutral-500">
          If you believe this is a mistake, please contact support.
        </p>
        <form action={signOut}>
          <button
            type="submit"
            className="mt-2 w-full rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-sm font-medium py-2.5 transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
