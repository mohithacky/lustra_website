import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWebsiteByDomain } from '@/lib/supabase'
import BestCollectionsEditor from '@/components/editor/BestCollectionsEditor'

interface PageProps {
  params: { domain: string }
}

export const metadata: Metadata = {
  title: 'Edit Best Collections',
  description: 'Select 2 hero collections to feature as best collections',
}

export default async function EditBestCollectionsPage({ params }: PageProps) {
  const user = await getWebsiteByDomain(params.domain)
  if (!user) notFound()

  return (
    <BestCollectionsEditor 
      userId={user.id} 
      shopDomain={params.domain} 
    />
  )
}
