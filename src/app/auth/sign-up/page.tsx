"use client";

import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { SignUpForm } from "@/components/supabase/sign-up-form";

export default function SignUpPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-indigo-50 gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand header */}
        <div className="flex flex-col items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-900 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-indigo-900 tracking-tight">
              JSOOR
            </span>
          </Link>
          <p className="text-sm text-slate-500">
            Create your account and start your journey
          </p>
        </div>
        <SignUpForm />
        <p className="text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-indigo-900 underline underline-offset-4 hover:text-cyan-600 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
