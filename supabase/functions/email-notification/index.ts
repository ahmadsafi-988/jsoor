import { createClient } from "jsr:@supabase/supabase-js@2";

const STATUS_COPY: Record<string, { subject: string; headline: string; body: string }> = {
  reviewed: {
    subject: "Your application is being reviewed",
    headline: "Under Review",
    body: "Good news — a recruiter is actively reviewing your application.",
  },
  shortlisted: {
    subject: "You've been shortlisted! 🎉",
    headline: "Shortlisted",
    body: "Great news — you've been shortlisted for this role. The company may reach out soon.",
  },
  accepted: {
    subject: "Congratulations — you got the job! 🎊",
    headline: "Accepted",
    body: "Congratulations! Your application has been accepted. Check your Jsoor dashboard for next steps.",
  },
  rejected: {
    subject: "Update on your application",
    headline: "Application Closed",
    body: "Thank you for your interest. Unfortunately, your application was not selected this time. Keep applying — the right opportunity is out there.",
  },
};

// Statuses that should not trigger an email
const SKIP_STATUSES = new Set(["pending"]);

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const { record, old_record } = payload;

    // No change or skipped status
    if (record.status === old_record?.status) return ok();
    if (SKIP_STATUSES.has(record.status)) return ok();

    const copy = STATUS_COPY[record.status];
    if (!copy) return ok(); // unknown status — skip silently

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch applicant's name and email
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", record.applicant_id)
      .single();

    const { data: authUser } = await supabase.auth.admin.getUserById(record.applicant_id);
    const email = authUser?.user?.email;

    if (!email) return ok(); // can't send without an email

    // Fetch job title and company name
    const { data: job } = await supabase
      .from("jobs")
      .select("title, company_id")
      .eq("id", record.job_id)
      .single();

    const { data: company } = await supabase
      .from("companies")
      .select("name")
      .eq("id", job?.company_id)
      .single();

    const firstName = profile?.first_name ?? "there";
    const jobTitle = job?.title ?? "the position";
    const companyName = company?.name ?? "the company";

    // Send via Resend
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Jsoor <no-reply@jsoor.com>",
        to: [email],
        subject: `${copy.subject} — ${jobTitle} at ${companyName}`,
        html: buildEmail(firstName, jobTitle, companyName, copy.headline, copy.body),
      }),
    });

    if (!resendRes.ok) {
      const err = await resendRes.text();
      console.error("Resend error:", err);
    }

    return ok();
  } catch (err) {
    console.error("email-notification error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});

function ok() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function buildEmail(
  firstName: string,
  jobTitle: string,
  companyName: string,
  headline: string,
  body: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f6f3f2;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f3f2;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e2e1;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#006d43,#00a86b);padding:32px 40px;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Jsoor</h1>
              <p style="margin:4px 0 0;color:#78fbb6;font-size:13px;">Smart Career Matching</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 8px;color:#5f5e5e;font-size:14px;">Hi ${firstName},</p>
              <h2 style="margin:0 0 16px;color:#1c1b1b;font-size:20px;font-weight:700;">${headline}</h2>
              <p style="margin:0 0 24px;color:#3d4a41;font-size:15px;line-height:1.6;">${body}</p>

              <!-- Job pill -->
              <div style="background:#f6f3f2;border:1px solid #e5e2e1;border-radius:12px;padding:16px 20px;margin-bottom:28px;">
                <p style="margin:0 0 2px;font-size:12px;color:#5f5e5e;text-transform:uppercase;letter-spacing:0.5px;">Application</p>
                <p style="margin:0;font-size:15px;font-weight:600;color:#1c1b1b;">${jobTitle}</p>
                <p style="margin:2px 0 0;font-size:13px;color:#3d4a41;">${companyName}</p>
              </div>

              <!-- CTA -->
              <a href="${Deno.env.get("NEXT_PUBLIC_SITE_URL") ?? "https://jsoor.com"}/job-seeker/job-applications"
                style="display:inline-block;background:linear-gradient(135deg,#006d43,#00a86b);color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;">
                View My Applications
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #f0edec;">
              <p style="margin:0;font-size:12px;color:#5f5e5e;">
                You're receiving this because you have an account on Jsoor.<br/>
                If you didn't apply for this job, you can safely ignore this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
