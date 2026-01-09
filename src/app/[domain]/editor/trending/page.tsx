import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWebsiteByDomain } from '@/lib/supabase'
import CollectionsEditor from '@/components/editor/CollectionsEditor'

interface PageProps {
  params: { domain: string }
}

export const metadata: Metadata = {
  title: 'Edit Trending Collections',
  description: 'Edit trending collections on your website',
}

export default async function EditTrendingPage({ params }: PageProps) {
  const user = await getWebsiteByDomain(params.domain)
  if (!user) notFound()

  return (
    <CollectionsEditor 
      userId={user.id} 
      shopDomain={params.domain} 
      collectionLabel="trending"
      title="Trending Collections"
      description="Featured collections shown in the trending section (max 4 items, positions 0 & 3 use 3:2 ratio, positions 1 & 2 use 5:6 ratio)"
      aspectRatio="Mixed (3:2 / 5:6)"
      maxItems={4}
      showAIGeneration={true}
    />
  )
}
