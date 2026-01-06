'use client'

import { useEffect, useState } from 'react'
import { waitForEditorContext, canEditCollections as checkCanEditCollections } from '@/lib/editor-context'
import HeroCarousel from '@/components/sections/HeroCarousel'
import TrendingSection from '@/components/sections/TrendingSection'
import { HeroCollection } from '@/types/database'

interface TrendingCollection {
  label: string
  image: string
}

interface EditableHeroCarouselProps {
  collections: HeroCollection[]
  isDark: boolean
  shopDomain: string
}

export function EditableHeroCarousel({ collections, isDark, shopDomain }: EditableHeroCarouselProps) {
  const [canEdit, setCanEdit] = useState(false)

  useEffect(() => {
    waitForEditorContext(3000).then((context) => {
      if (context) {
        setCanEdit(checkCanEditCollections())
      }
    })
  }, [])

  return (
    <HeroCarousel 
      collections={collections} 
      isDark={isDark}
      canEdit={canEdit}
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
  const [canEdit, setCanEdit] = useState(false)

  useEffect(() => {
    waitForEditorContext(3000).then((context) => {
      if (context) {
        setCanEdit(checkCanEditCollections())
      }
    })
  }, [])

  return (
    <TrendingSection 
      collections={collections} 
      isDark={isDark}
      canEdit={canEdit}
      shopDomain={shopDomain}
    />
  )
}
