"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="w-14 h-14 rounded-full bg-[#006d43]/10 flex items-center justify-center">
          <CheckCircle className="w-7 h-7 text-[#006d43]" />
        </div>
        <div>
          <p className="font-semibold text-[#1c1b1b] mb-1">Check your inbox</p>
          <p className="text-sm text-[#5f5e5e]">
            If that email is registered, you'll receive a password reset link shortly.
          </p>
        </div>
        <Link
          href="/auth/login"
          className="text-sm font-semibold text-[#006d43] hover:text-[#00a86b] transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{error}</p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white font-semibold py-2.5 rounded-xl text-sm hover:brightness-110 transition-all disabled:opacity-60 shadow-sm"
      >
        {isLoading ? "Sending…" : "Send Reset Link"}
      </button>

      <p className="text-center text-sm text-[#5f5e5e]">
        Remembered it?{" "}
        <Link href="/auth/login" className="font-semibold text-[#006d43] hover:text-[#00a86b] transition-colors">
          Sign in
        </Link>
      </p>
    </form>
  );
}
