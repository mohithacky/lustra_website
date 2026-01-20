import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWebsiteByDomain, getWebsiteTemplate } from '@/lib/supabase'
import CollectionsEditor from '@/components/editor/CollectionsEditor'

interface PageProps {
  params: { domain: string }
}

export const metadata: Metadata = {
  title: 'Edit Hero Collections',
  description: 'Manage hero carousel collections on your website',
}

export default async function EditHeroCollectionsPage({ params }: PageProps) {
  const user = await getWebsiteByDomain(params.domain)
  if (!user) notFound()

  const template = await getWebsiteTemplate(user.id)
  const isDark = template?.theme === 'dark'

  return (
    <CollectionsEditor 
      userId={user.id} 
      shopDomain={params.domain} 
      collectionLabel="hero"
      title="Hero Carousel Collections"
      description="Manage collections shown in the hero carousel (16:9 landscape)"
      aspectRatio="16:9"
      isDark={isDark}
    />
  )
}
