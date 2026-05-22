import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

type ClaimsWithRoleMetadata = {
  user_metadata?: {
    role?: string
  }
}

export default async function ProtectedPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.claims.sub)
    .maybeSingle()

  const claimsWithMetadata = data.claims as unknown as ClaimsWithRoleMetadata
  const role = profile?.role ?? claimsWithMetadata.user_metadata?.role

  if (role === 'admin') {
    redirect('/admin')
  }

  if (role === 'company') {
    const { data: company } = await supabase
      .from('companies')
      .select('is_verified')
      .eq('id', data.claims.sub)
      .maybeSingle()

    redirect(company?.is_verified ? '/company/home' : '/company/onboarding')
  }

  redirect('/job-seeker/home')
}
