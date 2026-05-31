// app/auth/sign-up-success/page.tsx
// Shown immediately after sign-up — tells the user to check their email.
// This is a static server component; no data needed.

import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Mail className="h-8 w-8 text-primary" />
      </div>
      <div className="space-y-2 max-w-sm">
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          We&apos;ve sent a confirmation link to your email address. Click the link
          to verify your account, then you&apos;ll be taken to complete the next step.
        </p>
        <p className="text-xs text-muted-foreground pt-2">
          Didn&apos;t receive it? Check your spam folder or{" "}
          <Link href="/auth/sign-up" className="underline hover:text-foreground">
            try again
          </Link>
          .
        </p>
      </div>
      <Button variant="outline" asChild>
        <Link href="/auth/login">Back to sign in</Link>
      </Button>
    </div>
  );
}
