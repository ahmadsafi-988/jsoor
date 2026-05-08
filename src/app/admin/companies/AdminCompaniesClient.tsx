"use client";

import { useState } from "react";
import { verifyCompany, unverifyCompany } from "@/lib/admin/actions";
import type { AdminCompany } from "@/lib/admin/data";
import { BadgeCheck, AlertTriangle } from "lucide-react";

export function AdminCompaniesClient({ companies }: { companies: AdminCompany[] }) {
  const [pending, setPending] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; error?: string } | null>(null);

  async function handleVerify(company: AdminCompany) {
    setPending(company.id);
    const result = await verifyCompany(company.id, company.name);
    if (result?.error) setFeedback({ id: company.id, error: result.error });
    setPending(null);
  }

  async function handleUnverify(company: AdminCompany) {
    setPending(company.id);
    const result = await unverifyCompany(company.id, company.name);
    if (result?.error) setFeedback({ id: company.id, error: result.error });
    setPending(null);
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-100 bg-neutral-50">
            <th className="text-left px-5 py-3 font-semibold text-neutral-600">Company</th>
            <th className="text-left px-5 py-3 font-semibold text-neutral-600">Industry</th>
            <th className="text-left px-5 py-3 font-semibold text-neutral-600">Location</th>
            <th className="text-left px-5 py-3 font-semibold text-neutral-600">Verified</th>
            <th className="text-right px-5 py-3 font-semibold text-neutral-600">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {companies.map((company) => (
            <tr key={company.id}>
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  {company.logo_url ? (
                    <img src={company.logo_url} alt={company.name} className="w-8 h-8 rounded-lg object-contain shrink-0 bg-white p-0.5 border border-[#e5e2e1]" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 shrink-0" />
                  )}
                  <span className="font-medium text-neutral-900">{company.name}</span>
                  {company.is_verified && <BadgeCheck className="w-4 h-4 text-[#00a86b] shrink-0" />}
                </div>
              </td>
              <td className="px-5 py-3.5 text-neutral-500">{company.industry ?? "—"}</td>
              <td className="px-5 py-3.5 text-neutral-500">{company.location ?? "—"}</td>
              <td className="px-5 py-3.5">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  company.is_verified ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500"
                }`}>
                  {company.is_verified ? "Verified" : "Unverified"}
                </span>
              </td>
              <td className="px-5 py-3.5 text-right">
                {feedback?.id === company.id && feedback.error && (
                  <span className="text-xs text-red-600 mr-2"><AlertTriangle className="inline w-3 h-3" /> {feedback.error}</span>
                )}
                {company.is_verified ? (
                  <button
                    onClick={() => handleUnverify(company)}
                    disabled={pending === company.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    {pending === company.id ? "Saving…" : "Unverify"}
                  </button>
                ) : (
                  <button
                    onClick={() => handleVerify(company)}
                    disabled={pending === company.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    <BadgeCheck className="w-3.5 h-3.5" />
                    {pending === company.id ? "Saving…" : "Verify"}
                  </button>
                )}
              </td>
            </tr>
          ))}
          {companies.length === 0 && (
            <tr><td colSpan={5} className="px-5 py-10 text-center text-neutral-400">No companies found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
