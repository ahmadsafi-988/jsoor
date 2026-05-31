export type CompanyVerificationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "needs_changes";

export type CompanyVerificationDetails = {
  company_id: string;
  legal_company_name: string;
  work_email: string;
  contact_person_name: string;
  contact_job_title: string;
  phone_number: string;
  country_of_registration: "Jordan";
  commercial_registration_number: string;
  verification_status: CompanyVerificationStatus;
  review_message: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  submitted_at: string;
  updated_at: string;
};

export const COMPANY_VERIFICATION_SELECT =
  "company_id, legal_company_name, work_email, contact_person_name, contact_job_title, phone_number, country_of_registration, commercial_registration_number, verification_status, review_message, reviewed_by, reviewed_at, submitted_at, updated_at";

type DbError = { message: string };
type VerificationQuery = PromiseLike<{ data: unknown; error: DbError | null }> & {
  select(columns: string): VerificationQuery;
  eq(column: string, value: string | string[]): VerificationQuery;
  in(column: string, values: string[]): VerificationQuery;
  maybeSingle(): Promise<{ data: unknown; error: DbError | null }>;
  upsert(values: Record<string, unknown>): Promise<{ error: DbError | null }>;
  update(values: Record<string, unknown>): VerificationQuery;
};

export function companyVerificationTable(supabase: unknown): VerificationQuery {
  return (supabase as { from(table: string): VerificationQuery }).from("company_verification_details");
}

export async function getCompanyVerificationDetails(
  supabase: unknown,
  companyId: string,
): Promise<CompanyVerificationDetails | null> {
  const { data } = await companyVerificationTable(supabase)
    .select(COMPANY_VERIFICATION_SELECT)
    .eq("company_id", companyId)
    .maybeSingle();

  return (data ?? null) as CompanyVerificationDetails | null;
}

export function verificationStatusLabel(
  status: CompanyVerificationStatus | null | undefined,
  isVerified?: boolean,
) {
  if (status === "approved" || isVerified) return "Approved";
  if (status === "needs_changes") return "Needs changes";
  if (status === "rejected") return "Rejected";
  return "Pending review";
}
