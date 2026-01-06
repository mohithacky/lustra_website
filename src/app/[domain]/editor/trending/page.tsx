import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWebsiteByDomain } from '@/lib/supabase'
import EditTrendingContent from '@/components/editor/EditTrendingContent'

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

  return <EditTrendingContent shopId={user.id} shopDomain={params.domain} />
}
