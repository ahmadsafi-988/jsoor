import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type ClaimsWithRoleMetadata = {
  user_metadata?: {
    role?: string
  }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims


  const { pathname } = request.nextUrl

  const redirectTo = (pathname: string) => {
    const url = request.nextUrl.clone()
    url.pathname = pathname
    url.search = ''
    const response = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie))
    return response
  }

  const redirectWithParam = (pathname: string, key: string, value: string) => {
    const url = request.nextUrl.clone()
    url.pathname = pathname
    url.search = ''
    url.searchParams.set(key, value)
    const response = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie))
    return response
  }

  const isPublicJobSeekerProfile = (() => {
    const segments = pathname.split('/').filter(Boolean)
    return segments.length === 3 && segments[0] === 'job-seeker' && segments[1] === 'profile'
  })()

  const isPublicRoute =
    pathname === '/' ||
    pathname.startsWith('/auth') ||
    isPublicJobSeekerProfile
 
  if (!user && !isPublicRoute) {
    return redirectTo('/auth/login')
  }

  // Guard dashboard routes against wrong roles, blocked, or suspended users.
  // Only runs when an authenticated user hits role-specific app areas.
  if (user && (
    (pathname.startsWith('/job-seeker') && !isPublicJobSeekerProfile) ||
    pathname.startsWith('/company') ||
    pathname.startsWith('/admin')
  )) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_blocked, is_suspended')
      .eq('id', user.sub)
      .maybeSingle()

    if (profile?.is_blocked) {
      await supabase.auth.signOut()
      return redirectWithParam('/auth/login', 'error', 'account_blocked')
    }

    if (profile?.is_suspended) {
      return redirectTo('/auth/suspended')
    }

    const claimsWithMetadata = user as unknown as ClaimsWithRoleMetadata
    const role = profile?.role ?? claimsWithMetadata.user_metadata?.role

    if (role === 'admin' && !pathname.startsWith('/admin')) {
      return redirectTo('/admin')
    }

    if (pathname.startsWith('/admin') && role !== 'admin') {
      return redirectTo(role === 'company' ? '/company/home' : '/job-seeker/home')
    }

    if (pathname.startsWith('/job-seeker') && role === 'company') {
      const { data: company } = await supabase
        .from('companies')
        .select('is_verified')
        .eq('id', user.sub)
        .maybeSingle()

      return redirectTo(company?.is_verified ? '/company/home' : '/company/onboarding')
    }

    if (pathname.startsWith('/company')) {
      const isCompanyOnboarding = pathname === '/company/onboarding'

      if (role === 'job_seeker') {
        return redirectTo('/job-seeker/home')
      }

      const { data: company } = await supabase
        .from('companies')
        .select('is_verified')
        .eq('id', user.sub)
        .maybeSingle()

      if (company?.is_verified && isCompanyOnboarding) {
        return redirectTo('/company/home')
      }

      if (!isCompanyOnboarding && !company?.is_verified) {
        return redirectTo('/company/onboarding')
      }
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
