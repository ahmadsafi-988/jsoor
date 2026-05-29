import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    "https://hmisspubbdfjrofycmgc.supabase.co",
    "sb_publishable_3n1j_ly36hE5MqeqYwAlWw_9XVWQBI-",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Keep this immediately after createServerClient so SSR auth cookies stay in sync.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;
  const { pathname } = request.nextUrl;

  const redirectTo = (targetPathname: string) => {
    const url = request.nextUrl.clone();
    url.pathname = targetPathname;
    url.search = "";
    const response = NextResponse.redirect(url);
    supabaseResponse.cookies
      .getAll()
      .forEach((cookie) => response.cookies.set(cookie));
    return response;
  };

  const redirectWithParam = (
    targetPathname: string,
    key: string,
    value: string,
  ) => {
    const url = request.nextUrl.clone();
    url.pathname = targetPathname;
    url.search = "";
    url.searchParams.set(key, value);
    const response = NextResponse.redirect(url);
    supabaseResponse.cookies
      .getAll()
      .forEach((cookie) => response.cookies.set(cookie));
    return response;
  };

  const isPublicJobSeekerProfile = (() => {
    const segments = pathname.split("/").filter(Boolean);
    return (
      segments.length === 3 &&
      segments[0] === "job-seeker" &&
      segments[1] === "profile"
    );
  })();

  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/blog") ||
    pathname === "/company/onboarding" ||
    isPublicJobSeekerProfile;

  if (!user && !isPublicRoute) {
    return redirectTo("/auth/login");
  }

  const isRoleArea =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/company") ||
    (pathname.startsWith("/job-seeker") && !isPublicJobSeekerProfile);

  if (user && (isRoleArea || isPublicJobSeekerProfile)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_blocked, is_suspended")
      .eq("id", user.sub)
      .maybeSingle();

    if (profile?.is_blocked) {
      await supabase.auth.signOut();
      return redirectWithParam("/auth/login", "error", "account_blocked");
    }

    if (profile?.is_suspended) {
      return redirectTo("/auth/suspended");
    }

    const role = profile?.role;

    if (isPublicJobSeekerProfile && role === "admin") {
      return redirectTo(pathname.replace("/job-seeker/profile/", "/admin/users/"));
    }

    if (isPublicJobSeekerProfile && role === "company") {
      return redirectTo(pathname.replace("/job-seeker/profile/", "/company/profiles/"));
    }

    if (role === "admin" && !pathname.startsWith("/admin")) {
      return redirectTo("/admin");
    }

    if (pathname.startsWith("/admin") && role !== "admin") {
      return redirectTo(role === "company" ? "/company/home" : "/job-seeker/home");
    }

    if (pathname.startsWith("/job-seeker") && role === "company") {
      const { data: company } = await supabase
        .from("companies")
        .select("is_verified")
        .eq("id", user.sub)
        .maybeSingle();

      return redirectTo(company?.is_verified ? "/company/home" : "/company/onboarding");
    }

    if (pathname.startsWith("/company")) {
      const isCompanyOnboarding = pathname === "/company/onboarding";

      if (role === "job_seeker") {
        return redirectTo("/job-seeker/home");
      }

      const { data: company } = await supabase
        .from("companies")
        .select("is_verified")
        .eq("id", user.sub)
        .maybeSingle();

      if (company?.is_verified && isCompanyOnboarding) {
        return redirectTo("/company/home");
      }

      if (!isCompanyOnboarding && !company?.is_verified) {
        return redirectTo("/company/onboarding");
      }
    }
  }

  return supabaseResponse;
}
