import { type EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')
  const _next = searchParams.get('next')
  const next = _next?.startsWith('/') ? _next : '/'

  const supabase = await createClient()

  // PKCE flow (newer Supabase projects) — email confirmation sends a `code`
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) redirect(next)
    redirect(`/auth/error?error=${error.message}`)
  }

  // OTP flow (token_hash + type)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) redirect(next)
    redirect(`/auth/error?error=${error.message}`)
  }

  redirect(`/auth/error?error=Invalid confirmation link`)
}
