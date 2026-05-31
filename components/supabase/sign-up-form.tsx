"use client";

import React, { useState } from "react";
import { signUp } from "@/lib/profile/actions";
import { signUpAsCompany } from "@/lib/company/actions";
import Link from "next/link";

export function SignUpForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    const result = await signUp(formData);

    if (result?.error) {
      setError(result.error);
      setPending(false);
    }
  }

  const inputClass = "w-full bg-[#f6f3f2] border border-[#e5e2e1] rounded-xl px-4 py-2.5 text-sm text-[#1c1b1b] placeholder-[#5f5e5e] focus:outline-none focus:ring-2 focus:ring-[#006d43]/20 focus:border-[#006d43]/40 transition";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
      <p className="text-center text-sm text-[#5f5e5e]">
        Are you an employer?{" "}
        <Link href="/auth/company-sign-up" className="font-semibold text-[#006d43] hover:text-[#00a86b] transition-colors">
          Request an employer account
        </Link>
      </p>
    </form>
  );
}

export function CompanySignUpForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    const result = await signUpAsCompany(formData);

    if (result?.error) {
      setError(result.error);
      setPending(false);
    }
  }

  const inputClass = "w-full bg-[#f6f3f2] border border-[#e5e2e1] rounded-xl px-4 py-2.5 text-sm text-[#1c1b1b] placeholder-[#5f5e5e] focus:outline-none focus:ring-2 focus:ring-[#006d43]/20 focus:border-[#006d43]/40 transition";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-semibold text-[#1c1b1b]">Work Email</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="hr@company.com"
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
        {pending ? "Creating request..." : "Request employer account"}
      </button>

      <p className="text-center text-sm text-[#5f5e5e]">
        Looking for jobs?{" "}
        <Link href="/auth/sign-up" className="font-semibold text-[#006d43] hover:text-[#00a86b] transition-colors">
          Create a job seeker account
        </Link>
      </p>
    </form>
  );
}
