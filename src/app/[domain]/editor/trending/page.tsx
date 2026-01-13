import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWebsiteByDomain } from '@/lib/supabase'
import UnifiedTrendingEditor from '@/components/editor/UnifiedTrendingEditor'

interface PageProps {
  params: { domain: string }
}

export const metadata: Metadata = {
  title: 'Edit Trending Collections',
  description: 'Edit all 4 trending collection boxes',
}

export default async function EditTrendingPage({ params }: PageProps) {
  const user = await getWebsiteByDomain(params.domain)
  if (!user) notFound()

  return (
    <UnifiedTrendingEditor 
      userId={user.id} 
      shopDomain={params.domain} 
    />
  )
}
