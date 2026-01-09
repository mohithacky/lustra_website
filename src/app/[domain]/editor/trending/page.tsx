import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWebsiteByDomain } from '@/lib/supabase'
import CollectionsEditor from '@/components/editor/CollectionsEditor'

interface PageProps {
  params: { domain: string }
  searchParams: { size?: string }
}

export const metadata: Metadata = {
  title: 'Edit Trending Collections',
  description: 'Edit trending collections on your website',
}

export default async function EditTrendingPage({ params, searchParams }: PageProps) {
  const user = await getWebsiteByDomain(params.domain)
  if (!user) notFound()

  // Determine aspect ratio filter based on size param
  // size=small -> positions 0 & 3 -> 3:2 ratio
  // size=large -> positions 1 & 2 -> 5:6 ratio
  // no param -> show all trending collections
  const sizeFilter = searchParams.size as 'small' | 'large' | undefined
  
  const getTitle = () => {
    if (sizeFilter === 'small') return 'Small Trending Collections (3:2)'
    if (sizeFilter === 'large') return 'Large Trending Collections (5:6)'
    return 'Trending Collections'
  }
  
  const getDescription = () => {
    if (sizeFilter === 'small') return 'Collections for positions 0 & 3 (landscape 3:2 aspect ratio)'
    if (sizeFilter === 'large') return 'Collections for positions 1 & 2 (portrait 5:6 aspect ratio)'
    return 'Featured collections shown in the trending section'
  }
  
  const getAspectRatio = () => {
    if (sizeFilter === 'small') return '3:2'
    if (sizeFilter === 'large') return '5:6'
    return 'Mixed (3:2 / 5:6)'
  }

  return (
    <CollectionsEditor 
      userId={user.id} 
      shopDomain={params.domain} 
      collectionLabel="trending"
      title={getTitle()}
      description={getDescription()}
      aspectRatio={getAspectRatio()}
      aspectRatioFilter={sizeFilter}
      showAIGeneration={true}
    />
  )
}
