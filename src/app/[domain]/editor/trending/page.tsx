import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWebsiteByDomain } from '@/lib/supabase'
import EditTrendingContent from '@/components/editor/EditTrendingContent'

interface PageProps {
  params: { domain: string }
  searchParams: { position?: string }
}

export const metadata: Metadata = {
  title: 'Edit Trending Collections',
  description: 'Edit trending collections on your website',
}

export default async function EditTrendingPage({ params, searchParams }: PageProps) {
  const user = await getWebsiteByDomain(params.domain)
  if (!user) notFound()

  const initialPosition = searchParams.position ? parseInt(searchParams.position, 10) : undefined

  return <EditTrendingContent shopId={user.id} shopDomain={params.domain} initialPosition={initialPosition} />
}
