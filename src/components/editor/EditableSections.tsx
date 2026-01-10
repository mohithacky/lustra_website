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
  config?: Record<string, any>
}

export function EditableHeroCarousel({ collections, isDark, shopDomain, config = {} }: EditableHeroCarouselProps) {
  const { canEditCollections } = useEditorPermissions()

  return (
    <HeroCarousel 
      collections={collections} 
      isDark={isDark}
      canEdit={canEditCollections}
      shopDomain={shopDomain}
      autoplay={config.autoplay}
      interval={config.interval}
      showIndicators={config.showIndicators}
      showArrows={config.showArrows}
      height={config.height}
      overlayOpacity={config.overlayOpacity}
      textColor={config.textColor}
      ctaText={config.ctaText}
      ctaLink={config.ctaLink}
    />
  )
}

interface EditableTrendingSectionProps {
  collections: TrendingCollection[]
  isDark: boolean
  shopDomain: string
  config?: Record<string, any>
}

export function EditableTrendingSection({ collections, isDark, shopDomain, config = {} }: EditableTrendingSectionProps) {
  const { canEditCollections } = useEditorPermissions()

  return (
    <TrendingSection 
      collections={collections} 
      isDark={isDark}
      canEdit={canEditCollections}
      shopDomain={shopDomain}
      title={config.title}
      subtitle={config.subtitle}
      columns={config.columns}
      showLabels={config.showLabels}
      maxItems={config.maxItems}
      layout={config.layout}
    />
  )
}

interface EditableBestCollectionsProps {
  collections: BestCollection[]
  isDark: boolean
  shopDomain: string
  config?: Record<string, any>
}

export function EditableBestCollections({ collections, isDark, shopDomain, config = {} }: EditableBestCollectionsProps) {
  const { canEditCollections } = useEditorPermissions()

  return (
    <BestCollectionsSection 
      collections={collections} 
      isDark={isDark}
      canEdit={canEditCollections}
      shopDomain={shopDomain}
      title={config.title}
      subtitle={config.subtitle}
      columns={config.columns}
      showDescription={config.showDescription}
      layout={config.layout}
    />
  )
}

interface EditableCategoriesProps {
  categories: Category[]
  isDark: boolean
  shopDomain: string
  config?: Record<string, any>
}

export function EditableCategories({ categories, isDark, shopDomain, config = {} }: EditableCategoriesProps) {
  const { canEditCollections } = useEditorPermissions()

  return (
    <CategoriesSection 
      categories={categories} 
      isDark={isDark}
      shopDomain={shopDomain}
      canEdit={canEditCollections}
      title={config.title}
      layout={config.layout}
      columns={config.columns}
      showTitle={config.showTitle}
      imageStyle={config.imageStyle}
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
