import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getWebsiteByDomain } from '@/lib/supabase'
import AddCollectionContent from '@/components/editor/AddCollectionContent'

interface PageProps {
  params: { domain: string }
}

export const metadata: Metadata = {
  title: 'Add Collection',
  description: 'Add a new collection to your website',
}

export default async function AddCollectionPage({ params }: PageProps) {
  const user = await getWebsiteByDomain(params.domain)
  if (!user) notFound()

  return <AddCollectionContent shopId={user.id} shopDomain={params.domain} />
}
