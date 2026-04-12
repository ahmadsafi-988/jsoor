"use client";

// app/auth/sign-up/page.tsx
// Thin wrapper — the heavy form logic lives in sign-up-form.tsx (from the
// Supabase UI block). We keep this page consistent with that structure.

import Link from "next/link";
import { SignUpForm } from "@/components/supabase/sign-up-form";

export default function SignUpPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="underline underline-offset-4 hover:text-primary">
              Sign in
            </Link>
          </p>
        </div>
        <SignUpForm />
      </div>
    </div>
  );
}