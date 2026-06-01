"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export function LoginForm({ initialError }: { initialError?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      const metadataRole = user.user_metadata?.role;
      const role =
        profile?.role === "admin"
          ? "admin"
          : metadataRole === "company"
            ? "company"
            : profile?.role ?? metadataRole;

      if (metadataRole === "company" && profile?.role !== "company" && profile?.role !== "admin") {
        await supabase
          .from("profiles")
          .update({ role: "company" })
          .eq("id", user.id);
      }

      if (role === "company") {
        const { data: company } = await supabase
          .from("companies")
          .select("is_verified")
          .eq("id", user.id)
          .maybeSingle();

        router.replace(company?.is_verified ? "/company/home" : "/company/onboarding");
        return;
      }

      if (role === "admin") {
        router.replace("/admin");
        return;
      }

      if (role === "job_seeker") {
        router.replace("/job-seeker/home");
        return;
      }

      setError("We could not find a role for this account.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-semibold text-[#1c1b1b]">Email</label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-[#f6f3f2] border border-[#e5e2e1] rounded-xl px-4 py-2.5 text-sm text-[#1c1b1b] placeholder-[#5f5e5e] focus:outline-none focus:ring-2 focus:ring-[#006d43]/20 focus:border-[#006d43]/40 transition"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-semibold text-[#1c1b1b]">Password</label>
          <Link href="/auth/forgot-password" className="text-xs text-[#006d43] hover:text-[#00a86b] transition-colors">
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          type="password"
          placeholder="••••••••"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-[#f6f3f2] border border-[#e5e2e1] rounded-xl px-4 py-2.5 text-sm text-[#1c1b1b] placeholder-[#5f5e5e] focus:outline-none focus:ring-2 focus:ring-[#006d43]/20 focus:border-[#006d43]/40 transition"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{error}</p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white font-semibold py-2.5 rounded-xl text-sm hover:brightness-110 transition-all disabled:opacity-60 shadow-sm"
      >
        {isLoading ? "Signing in…" : "Sign In"}
      </button>

      <p className="text-center text-sm text-[#5f5e5e]">
        Don&apos;t have an account?{" "}
        <Link href="/auth/sign-up" className="font-semibold text-[#006d43] hover:text-[#00a86b] transition-colors">
          Create a job seeker account
        </Link>
      </p>
      <p className="text-center text-sm text-[#5f5e5e]">
        Employer?{" "}
        <Link href="/auth/company-sign-up" className="font-semibold text-[#006d43] hover:text-[#00a86b] transition-colors">
          Request an employer account
        </Link>
      </p>
    </form>
  );
}
