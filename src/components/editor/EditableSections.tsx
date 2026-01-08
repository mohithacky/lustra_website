'use client'

import { useEffect, useState } from 'react'
import { waitForEditorContext, canEditCollections as checkCanEditCollections, canEditSections as checkCanEditSections } from '@/lib/editor-context'
import HeroCarousel from '@/components/sections/HeroCarousel'
import TrendingSection from '@/components/sections/TrendingSection'
import BestCollectionsSection from '@/components/sections/BestCollectionsSection'
import CategoriesSection from '@/components/sections/CategoriesSection'
import Footer from '@/components/sections/Footer'
import { HeroCollection } from '@/types/database'

interface TrendingCollection {
  label: string
  image: string
}

interface BestCollection {
  name: string
  image: string
  description?: string
}

interface Category {
  id: string
  name: string
  image_url: string | null
}

// Hook to get editor permissions
function useEditorPermissions() {
  const [permissions, setPermissions] = useState({
    canEditCollections: false,
    canEditSections: false,
  })

  useEffect(() => {
    waitForEditorContext(3000).then((context) => {
      if (context) {
        setPermissions({
          canEditCollections: checkCanEditCollections(),
          canEditSections: checkCanEditSections(),
        })
      }
    })
  }, [])

  return permissions
}

interface EditableHeroCarouselProps {
  collections: HeroCollection[]
  isDark: boolean
  shopDomain: string
}

export function EditableHeroCarousel({ collections, isDark, shopDomain }: EditableHeroCarouselProps) {
  const { canEditCollections } = useEditorPermissions()

  return (
    <HeroCarousel 
      collections={collections} 
      isDark={isDark}
      canEdit={canEditCollections}
      shopDomain={shopDomain}
    />
  )
}

interface EditableTrendingSectionProps {
  collections: TrendingCollection[]
  isDark: boolean
  shopDomain: string
}

export function EditableTrendingSection({ collections, isDark, shopDomain }: EditableTrendingSectionProps) {
  const { canEditCollections } = useEditorPermissions()

  return (
    <TrendingSection 
      collections={collections} 
      isDark={isDark}
      canEdit={canEditCollections}
      shopDomain={shopDomain}
    />
  )
}

interface EditableBestCollectionsProps {
  collections: BestCollection[]
  isDark: boolean
  shopDomain: string
}

export function EditableBestCollections({ collections, isDark, shopDomain }: EditableBestCollectionsProps) {
  const { canEditCollections } = useEditorPermissions()

  return (
    <BestCollectionsSection 
      collections={collections} 
      isDark={isDark}
      canEdit={canEditCollections}
      shopDomain={shopDomain}
    />
  )
}

interface EditableCategoriesProps {
  categories: Category[]
  isDark: boolean
  shopDomain: string
}

export function EditableCategories({ categories, isDark, shopDomain }: EditableCategoriesProps) {
  const { canEditCollections } = useEditorPermissions()

  return (
    <CategoriesSection 
      categories={categories} 
      isDark={isDark}
      shopDomain={shopDomain}
      canEdit={canEditCollections}
    />
  )
}

interface EditableFooterProps {
  user: {
    shop_name: string | null
    logo_url: string | null
    shop_address: string | null
    phone_number: string | null
    email: string | null
    instagram_id: string | null
  }
  template: {
    footer?: Record<string, string[]> | null
  } | null
  isDark: boolean
  shopDomain: string
}

export function EditableFooter({ user, template, isDark, shopDomain }: EditableFooterProps) {
  const { canEditSections } = useEditorPermissions()

  return (
    <Footer 
      user={user}
      template={template}
      isDark={isDark}
      canEdit={canEditSections}
      shopDomain={shopDomain}
    />
  )
}
