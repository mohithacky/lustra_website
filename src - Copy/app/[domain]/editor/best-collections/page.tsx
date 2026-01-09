import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWebsiteByDomain } from '@/lib/supabase'
import CollectionsEditor from '@/components/editor/CollectionsEditor'

interface PageProps {
  params: { domain: string }
}

export const metadata: Metadata = {
  title: 'Edit Best Collections',
  description: 'Manage featured/best collections on your website',
}

export default async function EditBestCollectionsPage({ params }: PageProps) {
  const user = await getWebsiteByDomain(params.domain)
  if (!user) notFound()

  return (
    <CollectionsEditor 
      userId={user.id} 
      shopDomain={params.domain} 
      collectionLabel="best"
      title="Best Collections"
      description="Featured collections showcased in the Best Collections section (recommended: 2 items)"
      aspectRatio="1:1"
      maxItems={2}
    />
  )
}
