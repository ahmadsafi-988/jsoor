"use client";

import React, { useState } from "react";
import { signUp } from "@/lib/profile/actions";
import { signUpAsCompany } from "@/lib/company/actions";
import { User, Building2 } from "lucide-react";
import Link from "next/link";

type Role = "job_seeker" | "company";

export function SignUpForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<Role>("job_seeker");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirm = formData.get("confirm_password") as string;

    if (password !== confirm) {
      setError("Passwords do not match.");
      setPending(false);
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setPending(false);
      return;
    }

    const result = role === "company"
      ? await signUpAsCompany(formData)
      : await signUp(formData);

    if (result?.error) {
      setError(result.error);
      setPending(false);
    }
  }

  const inputClass = "w-full bg-[#f6f3f2] border border-[#e5e2e1] rounded-xl px-4 py-2.5 text-sm text-[#1c1b1b] placeholder-[#5f5e5e] focus:outline-none focus:ring-2 focus:ring-[#006d43]/20 focus:border-[#006d43]/40 transition";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Role selector */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-[#1c1b1b]">I am a</span>
        <div className="grid grid-cols-2 gap-2">
          {([
            { value: "job_seeker", label: "Job Seeker", icon: User },
            { value: "company",    label: "Company",    icon: Building2 },
          ] as { value: Role; label: string; icon: React.ElementType }[]).map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setRole(value)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                role === value
                  ? "bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white border-transparent shadow-sm"
                  : "border-[#e5e2e1] text-[#3d4a41] hover:border-[#006d43]/40 hover:text-[#006d43] bg-[#f6f3f2]"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-semibold text-[#1c1b1b]">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          autoComplete="email"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-semibold text-[#1c1b1b]">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="At least 8 characters"
          required
          autoComplete="new-password"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirm_password" className="text-sm font-semibold text-[#1c1b1b]">Confirm Password</label>
        <input
          id="confirm_password"
          name="confirm_password"
          type="password"
          placeholder="Repeat your password"
          required
          autoComplete="new-password"
          className={inputClass}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white font-semibold py-2.5 rounded-xl text-sm hover:brightness-110 transition-all disabled:opacity-60 shadow-sm"
      >
        {pending ? "Creating account…" : "Create Account"}
      </button>

      <p className="text-center text-sm text-[#5f5e5e]">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-semibold text-[#006d43] hover:text-[#00a86b] transition-colors">
          Sign in
        </Link>
      </p>
    </form>
  );
}
