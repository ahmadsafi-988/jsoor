import { createClient } from "@/lib/supabase/server";

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k+`;
  return `${n}+`;
}

export async function Stats() {
  const supabase = await createClient();

  const [{ count: jobCount }, { count: companyCount }, { count: applicationCount }] =
    await Promise.all([
      supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true)
        .eq("admin_locked", false),
      supabase
        .from("companies")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("job_applications")
        .select("*", { count: "exact", head: true }),
    ]);

  const stats = [
    { value: fmt(jobCount ?? 0),         label: "Active Opportunities" },
    { value: fmt(companyCount ?? 0),     label: "Partner Companies" },
    { value: fmt(applicationCount ?? 0), label: "Applications Submitted" },
    { value: "95%",                       label: "Success Rate" },
  ];

  return (
    <section className="bg-neutral-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-neutral-700">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center px-4">
            <p className="font-headline font-bold text-4xl text-[#78fbb6] mb-2">
              {stat.value}
            </p>
            <p className="text-sm text-neutral-400">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
