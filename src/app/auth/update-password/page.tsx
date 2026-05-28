import { UpdatePasswordForm } from "@/components/supabase/update-password-form";
import Link from "next/link";
import { JsoorLogo } from "@/components/JsoorLogo";

export default function Page() {
  return (
    <div className="min-h-screen bg-[#f6f3f2] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex justify-center">
            <JsoorLogo className="h-12 w-auto" priority />
          </Link>
          <p className="text-sm text-[#5f5e5e] mt-1">Smart Career Matching</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#e5e2e1] shadow-sm p-8">
          <div className="mb-6">
            <h2 className="font-headline text-2xl font-bold text-[#1c1b1b] tracking-tight">Set new password</h2>
            <p className="text-sm text-[#5f5e5e] mt-1">Choose a strong password for your account</p>
          </div>
          <UpdatePasswordForm />
        </div>
      </div>
    </div>
  );
}
