import { CompanySignUpForm } from "@/components/supabase/sign-up-form";
import Link from "next/link";
import { JsoorLogo } from "@/components/JsoorLogo";

export default function CompanySignUpPage() {
  return (
    <div className="min-h-screen bg-[#f6f3f2] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex justify-center">
            <JsoorLogo className="h-12 w-auto" priority />
          </Link>
          <p className="text-sm text-[#5f5e5e] mt-1">Employer Accounts</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e2e1] shadow-sm p-8">
          <div className="mb-6">
            <h2 className="font-headline text-2xl font-bold text-[#1c1b1b] tracking-tight">Request an employer account</h2>
            <p className="text-sm text-[#5f5e5e] mt-1">
              Create a secure login, then submit your company details for review.
            </p>
          </div>
          <CompanySignUpForm />
        </div>
      </div>
    </div>
  );
}
