"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveCompany, rejectCompany, requestCompanyChanges } from "@/lib/admin/actions";
import type { CompanyVerificationDetails } from "@/lib/company/verification";
import { verificationStatusLabel } from "@/lib/company/verification";
import { AlertTriangle, BadgeCheck } from "lucide-react";

type Props = {
  companyId: string;
  companyName: string;
  isVerified: boolean;
  verification: CompanyVerificationDetails | null;
};

export function CompanyReviewPanel({ companyId, companyName, isVerified, verification }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState(verification?.review_message ?? "");
  const [error, setError] = useState<string | null>(null);

  async function run(action: "approve" | "changes" | "reject") {
    setPending(action);
    setError(null);
    const result =
      action === "approve"
        ? await approveCompany(companyId, companyName)
        : action === "changes"
          ? await requestCompanyChanges(companyId, companyName, message.trim())
          : await rejectCompany(companyId, companyName, message.trim());

    if (result?.error) {
      setError(result.error);
      setPending(null);
      return;
    }

    router.refresh();
    setPending(null);
  }

  const detailRows = verification
    ? [
        ["Legal company name", verification.legal_company_name],
        ["Work email", verification.work_email],
        ["Contact person", verification.contact_person_name],
        ["Contact job title", verification.contact_job_title],
        ["Phone number", verification.phone_number],
        ["Country of registration", verification.country_of_registration],
        ["Commercial registration number", verification.commercial_registration_number],
        ["Submitted", new Date(verification.submitted_at).toLocaleString()],
      ]
    : [];

  return (
    <section className="mb-6 rounded-2xl border border-[#e5e2e1] bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-headline text-xl font-semibold text-[#1c1b1b]">Employer Review</h2>
          <p className="mt-1 text-sm text-[#5f5e5e]">
            Admin-only verification details submitted by the company.
          </p>
        </div>
        <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
          isVerified
            ? "bg-green-100 text-green-700"
            : verification?.verification_status === "rejected"
              ? "bg-red-100 text-red-700"
              : verification?.verification_status === "needs_changes"
                ? "bg-amber-100 text-amber-700"
                : "bg-neutral-100 text-neutral-600"
        }`}>
          {isVerified && <BadgeCheck className="h-3.5 w-3.5" />}
          {verificationStatusLabel(verification?.verification_status, isVerified)}
        </span>
      </div>

      {verification ? (
        <div className="grid gap-3 md:grid-cols-2">
          {detailRows.map(([label, value]) => (
            <div key={label} className="rounded-xl border border-[#e5e2e1] bg-[#f6f3f2] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#5f5e5e]">{label}</p>
              <p className="mt-1 text-sm font-medium text-[#1c1b1b]">{value}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No formal verification details have been submitted yet.
        </div>
      )}

      {verification && (
        <div className="mt-5 flex flex-col gap-3 border-t border-[#e5e2e1] pt-5">
          <label className="text-sm font-semibold text-[#1c1b1b]">Review Message</label>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={3}
            placeholder="Required when requesting changes or rejecting."
            className="w-full resize-none rounded-xl border border-[#e5e2e1] bg-[#f6f3f2] px-4 py-3 text-sm text-[#1c1b1b] focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
          />

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertTriangle className="mr-1 inline h-4 w-4" />
              {error}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => run("changes")}
              disabled={pending !== null || !message.trim()}
              className="rounded-lg bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50"
            >
              {pending === "changes" ? "Saving..." : "Request changes"}
            </button>
            <button
              type="button"
              onClick={() => run("reject")}
              disabled={pending !== null || !message.trim()}
              className="rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
            >
              {pending === "reject" ? "Saving..." : "Reject"}
            </button>
            <button
              type="button"
              onClick={() => run("approve")}
              disabled={pending !== null}
              className="rounded-lg bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-100 disabled:opacity-50"
            >
              {pending === "approve" ? "Saving..." : "Approve employer"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
