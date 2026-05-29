"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/lib/supabase_generated_types";

export type SearchResultItem = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  meta?: string;
};

export type SearchResultCategory = {
  id: string;
  title: string;
  results: SearchResultItem[];
};

export type SearchDashboardResult = {
  categories: SearchResultCategory[];
  error?: string;
};

type Supabase = SupabaseClient<Database>;
type ProfileRow = Pick<
  Tables<"profiles">,
  "id" | "first_name" | "last_name" | "username" | "role"
>;
type CompanyRow = Pick<
  Tables<"companies">,
  "id" | "name" | "industry" | "location" | "is_verified"
>;
type JobRow = Pick<
  Tables<"jobs">,
  "id" | "title" | "type" | "location" | "company_id" | "is_active" | "admin_locked"
>;
type BlogRow = Pick<
  Tables<"blogs">,
  "id" | "slug" | "title" | "category" | "excerpt" | "is_published"
>;
type ForumRow = Pick<
  Tables<"forums">,
  "id" | "slug" | "name" | "description" | "is_active"
>;
type ApplicationRow = Pick<
  Tables<"job_applications">,
  "id" | "applicant_id" | "job_id" | "status" | "created_at"
>;

const RESULT_LIMIT = 4;

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient<Database>(url, key);
}

function searchTerm(query: string) {
  return query.replace(/[,%()]/g, " ").replace(/\s+/g, " ").trim();
}

function fullName(profile: Pick<ProfileRow, "first_name" | "last_name" | "username">) {
  return `${profile.first_name} ${profile.last_name}`.trim() || profile.username;
}

function addCategory(
  categories: SearchResultCategory[],
  id: string,
  title: string,
  results: SearchResultItem[],
) {
  if (results.length > 0) {
    categories.push({ id, title, results: results.slice(0, RESULT_LIMIT) });
  }
}

function textIncludes(value: string | null | undefined, query: string) {
  return (value ?? "").toLowerCase().includes(query.toLowerCase());
}

function isSearchResult(
  result: SearchResultItem | null,
): result is SearchResultItem {
  return Boolean(result);
}

async function searchProfiles(
  supabase: Supabase,
  pattern: string,
  role: "job_seeker" | "company" | "any",
) {
  let query = supabase
    .from("profiles")
    .select("id, first_name, last_name, username, role")
    .or(`first_name.ilike.${pattern},last_name.ilike.${pattern},username.ilike.${pattern}`)
    .limit(RESULT_LIMIT);

  if (role !== "any") {
    query = query.eq("role", role);
  } else {
    query = query.neq("role", "admin");
  }

  const { data } = await query;
  return (data ?? []) as ProfileRow[];
}

async function searchCompanies(
  supabase: Supabase,
  pattern: string,
  options?: { unverifiedOnly?: boolean; excludeId?: string },
) {
  let query = supabase
    .from("companies")
    .select("id, name, industry, location, is_verified")
    .or(`name.ilike.${pattern},industry.ilike.${pattern},location.ilike.${pattern}`)
    .order("created_at", { ascending: false })
    .limit(RESULT_LIMIT);

  if (options?.unverifiedOnly) query = query.eq("is_verified", false);
  if (options?.excludeId) query = query.neq("id", options.excludeId);

  const { data } = await query;
  return (data ?? []) as CompanyRow[];
}

async function searchJobs(
  supabase: Supabase,
  pattern: string,
  options?: { publicOnly?: boolean; companyId?: string },
) {
  let query = supabase
    .from("jobs")
    .select("id, title, type, location, company_id, is_active, admin_locked")
    .or(`title.ilike.${pattern},type.ilike.${pattern},location.ilike.${pattern},description.ilike.${pattern}`)
    .order("created_at", { ascending: false })
    .limit(RESULT_LIMIT);

  if (options?.publicOnly) {
    query = query.eq("is_active", true).eq("admin_locked", false);
  }
  if (options?.companyId) {
    query = query.eq("company_id", options.companyId);
  }

  const { data } = await query;
  return (data ?? []) as JobRow[];
}

async function searchBlogs(
  supabase: Supabase,
  pattern: string,
  options?: { publishedOnly?: boolean },
) {
  let query = supabase
    .from("blogs")
    .select("id, slug, title, category, excerpt, is_published")
    .or(`title.ilike.${pattern},category.ilike.${pattern},excerpt.ilike.${pattern}`)
    .order("updated_at", { ascending: false })
    .limit(RESULT_LIMIT);

  if (options?.publishedOnly) {
    query = query.eq("is_published", true);
  }

  const { data } = await query;
  return (data ?? []) as BlogRow[];
}

async function searchForums(supabase: Supabase, pattern: string) {
  const { data } = await supabase
    .from("forums")
    .select("id, slug, name, description, is_active")
    .or(`name.ilike.${pattern},description.ilike.${pattern}`)
    .eq("is_active", true)
    .order("name", { ascending: true })
    .limit(RESULT_LIMIT);

  return (data ?? []) as ForumRow[];
}

async function getCompanyApplicantResults(
  supabase: Supabase,
  companyId: string,
  query: string,
) {
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title")
    .eq("company_id", companyId);

  const jobRows = (jobs ?? []) as Pick<Tables<"jobs">, "id" | "title">[];
  const jobIds = jobRows.map((job) => job.id);
  if (jobIds.length === 0) return [];

  const { data: applications } = await supabase
    .from("job_applications")
    .select("id, applicant_id, job_id, status, created_at")
    .in("job_id", jobIds)
    .order("created_at", { ascending: false })
    .limit(50);

  const appRows = (applications ?? []) as ApplicationRow[];
  if (appRows.length === 0) return [];

  const applicantIds = [...new Set(appRows.map((app) => app.applicant_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, username, role")
    .in("id", applicantIds);

  const profileMap = new Map(
    ((profiles ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]),
  );
  const jobMap = new Map(jobRows.map((job) => [job.id, job]));

  return appRows
    .map((application) => {
      const profile = profileMap.get(application.applicant_id);
      const job = jobMap.get(application.job_id);
      if (!profile || !job) return null;

      const applicantName = fullName(profile);
      const matches =
        textIncludes(applicantName, query) ||
        textIncludes(profile.username, query) ||
        textIncludes(job.title, query) ||
        textIncludes(application.status, query);

      if (!matches) return null;

      const item: SearchResultItem = {
        id: application.id,
        title: applicantName,
        subtitle: `Applied to ${job.title}`,
        href: `/applications/${application.id}`,
        meta: application.status,
      };
      return item;
    })
    .filter(isSearchResult)
    .slice(0, RESULT_LIMIT);
}

async function getAdminApplicationResults(
  supabase: Supabase,
  query: string,
) {
  const { data: applications } = await supabase
    .from("job_applications")
    .select("id, applicant_id, job_id, status, created_at")
    .order("created_at", { ascending: false })
    .limit(75);

  const appRows = (applications ?? []) as ApplicationRow[];
  if (appRows.length === 0) return [];

  const applicantIds = [...new Set(appRows.map((app) => app.applicant_id))];
  const jobIds = [...new Set(appRows.map((app) => app.job_id))];

  const [{ data: profiles }, { data: jobs }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, first_name, last_name, username, role")
      .in("id", applicantIds),
    supabase.from("jobs").select("id, title, company_id").in("id", jobIds),
  ]);

  const profileMap = new Map(
    ((profiles ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]),
  );
  const jobMap = new Map(
    ((jobs ?? []) as Pick<Tables<"jobs">, "id" | "title" | "company_id">[]).map((job) => [
      job.id,
      job,
    ]),
  );

  return appRows
    .map((application) => {
      const profile = profileMap.get(application.applicant_id);
      const job = jobMap.get(application.job_id);
      if (!profile || !job) return null;

      const applicantName = fullName(profile);
      const matches =
        textIncludes(applicantName, query) ||
        textIncludes(profile.username, query) ||
        textIncludes(job.title, query) ||
        textIncludes(application.status, query);

      if (!matches) return null;

      const item: SearchResultItem = {
        id: application.id,
        title: applicantName,
        subtitle: `Application for ${job.title}`,
        href: `/admin/applications/${application.id}`,
        meta: application.status,
      };
      return item;
    })
    .filter(isSearchResult)
    .slice(0, RESULT_LIMIT);
}

export async function searchDashboard(query: string): Promise<SearchDashboardResult> {
  const term = searchTerm(query);
  if (term.length < 2) return { categories: [] };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { categories: [], error: "Not authenticated." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role;
  const pattern = `%${term}%`;
  const categories: SearchResultCategory[] = [];

  if (role === "job_seeker") {
    const [users, companies, jobs, blogs, forums] = await Promise.all([
      searchProfiles(supabase, pattern, "job_seeker"),
      searchCompanies(supabase, pattern),
      searchJobs(supabase, pattern, { publicOnly: true }),
      searchBlogs(supabase, pattern, { publishedOnly: true }),
      searchForums(supabase, pattern),
    ]);

    addCategory(
      categories,
      "users",
      "Job Seekers",
      users.map((result) => ({
        id: result.id,
        title: fullName(result),
        subtitle: `@${result.username}`,
        href: `/job-seeker/profile/${result.username}`,
      })),
    );
    addCategory(
      categories,
      "companies",
      "Companies",
      companies.map((result) => ({
        id: result.id,
        title: result.name,
        subtitle: [result.industry, result.location].filter(Boolean).join(" - "),
        href: `/companies/${result.id}`,
      })),
    );
    addCategory(
      categories,
      "jobs",
      "Job Opportunities",
      jobs.map((result) => ({
        id: result.id,
        title: result.title,
        subtitle: [result.type, result.location].filter(Boolean).join(" - "),
        href: `/jobs/${result.id}`,
      })),
    );
    addCategory(
      categories,
      "blogs",
      "Blogs",
      blogs.map((result) => ({
        id: result.id,
        title: result.title,
        subtitle: result.category,
        href: `/blog/${result.slug}`,
      })),
    );
    addCategory(
      categories,
      "forums",
      "Forums",
      forums.map((result) => ({
        id: result.id,
        title: result.name,
        subtitle: result.description,
        href: `/forums/${result.slug}`,
      })),
    );
  } else if (role === "company") {
    const [candidates, applicants, companies, jobs, blogs] = await Promise.all([
      searchProfiles(supabase, pattern, "job_seeker"),
      getCompanyApplicantResults(supabase, user.id, term),
      searchCompanies(supabase, pattern, { excludeId: user.id }),
      searchJobs(supabase, pattern, { companyId: user.id }),
      searchBlogs(supabase, pattern, { publishedOnly: true }),
    ]);

    addCategory(
      categories,
      "candidates",
      "Candidates",
      candidates.map((result) => ({
        id: result.id,
        title: fullName(result),
        subtitle: `@${result.username}`,
        href: `/company/profiles/${result.username}`,
      })),
    );
    addCategory(categories, "applicants", "Applicants", applicants);
    addCategory(
      categories,
      "companies",
      "Companies",
      companies.map((result) => ({
        id: result.id,
        title: result.name,
        subtitle: [result.industry, result.location].filter(Boolean).join(" - "),
        href: `/companies/${result.id}`,
      })),
    );
    addCategory(
      categories,
      "jobs",
      "Your Opportunities",
      jobs.map((result) => ({
        id: result.id,
        title: result.title,
        subtitle: [result.type, result.location].filter(Boolean).join(" - "),
        href: `/jobs/${result.id}`,
      })),
    );
    addCategory(
      categories,
      "blogs",
      "Blogs",
      blogs.map((result) => ({
        id: result.id,
        title: result.title,
        subtitle: result.category,
        href: `/blog/${result.slug}`,
      })),
    );
  } else if (role === "admin") {
    const adminClient = getServiceClient() ?? supabase;
    const [
      users,
      jobSeekers,
      companies,
      companyRequests,
      jobs,
      applications,
      blogs,
      forums,
    ] = await Promise.all([
      searchProfiles(adminClient, pattern, "any"),
      searchProfiles(adminClient, pattern, "job_seeker"),
      searchCompanies(adminClient, pattern),
      searchCompanies(adminClient, pattern, { unverifiedOnly: true }),
      searchJobs(adminClient, pattern),
      getAdminApplicationResults(adminClient, term),
      searchBlogs(adminClient, pattern),
      searchForums(adminClient, pattern),
    ]);

    addCategory(
      categories,
      "users",
      "Users",
      users.map((result) => ({
        id: result.id,
        title: fullName(result),
        subtitle: `${result.role} - @${result.username}`,
        href: `/admin/users/${result.username}`,
      })),
    );
    addCategory(
      categories,
      "job-seekers",
      "Job Seekers",
      jobSeekers.map((result) => ({
        id: result.id,
        title: fullName(result),
        subtitle: `@${result.username}`,
        href: `/admin/users/${result.username}`,
      })),
    );
    addCategory(
      categories,
      "companies",
      "Companies",
      companies.map((result) => ({
        id: result.id,
        title: result.name,
        subtitle: result.is_verified ? "Verified company" : "Unverified company",
        href: `/admin/companies/${result.id}`,
      })),
    );
    addCategory(
      categories,
      "company-requests",
      "Company Requests",
      companyRequests.map((result) => ({
        id: result.id,
        title: result.name,
        subtitle: "Awaiting verification",
        href: `/admin/companies/${result.id}`,
      })),
    );
    addCategory(
      categories,
      "jobs",
      "Jobs",
      jobs.map((result) => ({
        id: result.id,
        title: result.title,
        subtitle: [result.type, result.location].filter(Boolean).join(" - "),
        href: `/admin/jobs/${result.id}`,
        meta: result.admin_locked ? "Locked" : result.is_active ? "Active" : "Inactive",
      })),
    );
    addCategory(categories, "applications", "Applications", applications);
    addCategory(
      categories,
      "blogs",
      "Blogs",
      blogs.map((result) => ({
        id: result.id,
        title: result.title,
        subtitle: result.is_published ? result.category : `Draft - ${result.category}`,
        href: `/admin/blogs/${result.id}`,
      })),
    );
    addCategory(
      categories,
      "forums",
      "Forums",
      forums.map((result) => ({
        id: result.id,
        title: result.name,
        subtitle: result.description,
        href: `/forums/${result.slug}`,
      })),
    );
  }

  return { categories };
}
