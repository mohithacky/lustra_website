import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWebsiteByDomain } from '@/lib/supabase'
import FooterEditor from '@/components/editor/FooterEditor'

interface PageProps {
  params: { domain: string }
}

export const metadata: Metadata = {
  title: 'Edit Footer',
  description: 'Manage footer links and columns on your website',
}

export default async function EditFooterPage({ params }: PageProps) {
  const user = await getWebsiteByDomain(params.domain)
  if (!user) notFound()

  return <FooterEditor userId={user.id} shopDomain={params.domain} />
}
