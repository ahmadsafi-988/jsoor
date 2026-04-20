import { ForgotPasswordForm } from "@/components/supabase/forgot-password-form";
import { GraduationCap } from "lucide-react";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center bg-indigo-50 p-6 md:p-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-indigo-900 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-indigo-900 tracking-tight">JSOOR</span>
          </Link>
          <p className="text-sm text-slate-500">We'll send you a reset link</p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
