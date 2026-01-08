import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWebsiteByDomain } from '@/lib/supabase'
import CollectionsEditor from '@/components/editor/CollectionsEditor'

interface PageProps {
  params: { domain: string }
}

export const metadata: Metadata = {
  title: 'Edit Categories',
  description: 'Manage product categories on your website',
}

export default async function EditCategoriesPage({ params }: PageProps) {
  const user = await getWebsiteByDomain(params.domain)
  if (!user) notFound()

  return (
    <CollectionsEditor 
      userId={user.id} 
      shopDomain={params.domain} 
      collectionLabel="category"
      title="Categories"
      description="Product categories shown in the Shop by Category section"
      aspectRatio="1:1"
      showAIGeneration={false}
      addButtonText="Add Category"
    />
  )
}
