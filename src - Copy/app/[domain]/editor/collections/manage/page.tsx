import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWebsiteByDomain } from '@/lib/supabase'
import AddCollectionContent from '@/components/editor/AddCollectionContent'

interface PageProps {
  params: { domain: string }
}

export const metadata: Metadata = {
  title: 'Manage Hero Collections',
  description: 'Manage hero carousel collections on your website',
}

export default async function ManageCollectionsPage({ params }: PageProps) {
  const user = await getWebsiteByDomain(params.domain)
  if (!user) notFound()

  return <AddCollectionContent shopId={user.id} shopDomain={params.domain} collectionType="hero" />
}
