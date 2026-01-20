'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Loader2, CheckCircle, Info, Save } from 'lucide-react'
import { cn, getImageUrl } from '@/lib/utils'

interface HeroCollection {
  id: string
  user_id: string
  name: string
  slug: string
  image_url: string | null
  display_order: number
  is_active: boolean
}

interface BestCollection {
  id: string
  user_id: string
  name: string
  slug: string
  image_url: string | null
  display_order: number
  is_active: boolean
  source_collection_id?: string
}

interface BestCollectionsEditorProps {
  userId: string
  shopDomain: string
  isDark?: boolean
}

export default function BestCollectionsEditor({ userId, shopDomain, isDark }: BestCollectionsEditorProps) {
  const router = useRouter()
  const [heroCollections, setHeroCollections] = useState<HeroCollection[]>([])
  const [bestCollections, setBestCollections] = useState<BestCollection[]>([])
  const [selectedHeroIds, setSelectedHeroIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadCollections()
  }, [])

  const loadCollections = async () => {
    setIsLoading(true)
    try {
      // Load hero collections
      const heroResponse = await fetch(`/api/editor/collections?userId=${userId}&label=hero`)
      let loadedHeroCollections: HeroCollection[] = []
      
      if (heroResponse.ok) {
        const heroData = await heroResponse.json()
        const activeHero = (heroData.collections || []).filter((c: HeroCollection) => c.is_active)
        setHeroCollections(activeHero)
        loadedHeroCollections = activeHero
      }

      // Load existing best collections
      const bestResponse = await fetch(`/api/editor/collections?userId=${userId}&label=best`)
      if (bestResponse.ok) {
        const bestData = await bestResponse.json()
        const activeBest = (bestData.collections || []).filter((c: BestCollection) => c.is_active)
        setBestCollections(activeBest)
        
        // Pre-select the hero collections that are already in best
        const preSelected = activeBest
          .map((bc: BestCollection) => {
            // Find matching hero collection by name
            const matchingHero = loadedHeroCollections.find((hc: HeroCollection) => 
              hc.name === bc.name && hc.is_active
            )
            return matchingHero?.id
          })
          .filter(Boolean) as string[]
        
        setSelectedHeroIds(preSelected)
      }
    } catch (error) {
      console.error('Error loading collections:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleSelection = (heroId: string) => {
    setSelectedHeroIds(prev => {
      if (prev.includes(heroId)) {
        // Deselect
        return prev.filter(id => id !== heroId)
      } else {
        // Select (max 2)
        if (prev.length >= 2) {
          alert('You can only select up to 2 collections for Best Collections')
          return prev
        }
        return [...prev, heroId]
      }
    })
  }

  const handleSave = async () => {
    if (selectedHeroIds.length === 0) {
      alert('Please select at least 1 collection')
      return
    }

    if (selectedHeroIds.length > 2) {
      alert('Please select maximum 2 collections')
      return
    }

    setIsSaving(true)
    try {
      // First, deactivate all existing best collections
      for (const bestColl of bestCollections) {
        await fetch('/api/editor/collections', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: bestColl.id,
            userId,
            isActive: false,
          }),
        })
      }

      // Then create/activate the selected hero collections as best collections
      for (let i = 0; i < selectedHeroIds.length; i++) {
        const heroId = selectedHeroIds[i]
        const heroCollection = heroCollections.find(hc => hc.id === heroId)
        
        if (!heroCollection) continue

        // Check if this best collection already exists (by name)
        const existingBest = bestCollections.find(bc => bc.name === heroCollection.name)
        
        if (existingBest) {
          // Reactivate existing
          await fetch('/api/editor/collections', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: existingBest.id,
              userId,
              isActive: true,
              displayOrder: i,
            }),
          })
        } else {
          // Create new best collection
          await fetch('/api/editor/collections', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              name: heroCollection.name,
              slug: heroCollection.slug,
              imageUrl: heroCollection.image_url,
              collectionLabel: 'best',
              displayOrder: i,
            }),
          })
        }
      }

      alert('Best Collections saved successfully!')
      loadCollections()
    } catch (error) {
      console.error('Error saving best collections:', error)
      alert('Error saving collections')
    } finally {
      setIsSaving(false)
    }
  }

  const selectedCount = selectedHeroIds.length

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-black">Best Collections</h1>
            <p className="text-sm text-gray-500 mt-1">
              Select 2 collections from your Hero Carousel to feature
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">How Best Collections Works</p>
            <p>Select any 2 collections from your Hero Carousel. These will be displayed in the Best Collections section with their images and descriptions.</p>
          </div>
        </div>

        {/* Selection Counter */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg",
              selectedCount === 2 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
            )}>
              {selectedCount}
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {selectedCount} of 2 collections selected
              </p>
              <p className="text-xs text-gray-500">
                {selectedCount === 0 && "Select collections to feature"}
                {selectedCount === 1 && "Select 1 more collection"}
                {selectedCount === 2 && "Ready to save!"}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleSave}
            disabled={isSaving || selectedCount === 0}
            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Best Collections
              </>
            )}
          </button>
        </div>

        {/* Hero Collections Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : heroCollections.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Info className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Hero Collections Found</h3>
            <p className="text-gray-500 mb-6">
              You need to create Hero Carousel collections first before you can select them for Best Collections.
            </p>
            <button
              onClick={() => router.push(`/${shopDomain}/editor/hero`)}
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Create Hero Collections
            </button>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-900">
              Select from Hero Carousel Collections
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {heroCollections.map((collection) => {
                const isSelected = selectedHeroIds.includes(collection.id)
                const selectionOrder = selectedHeroIds.indexOf(collection.id) + 1
                
                return (
                  <button
                    key={collection.id}
                    onClick={() => handleToggleSelection(collection.id)}
                    className={cn(
                      "relative bg-white rounded-xl shadow-md overflow-hidden transition-all duration-200 text-left",
                      isSelected 
                        ? "ring-4 ring-amber-500 ring-offset-2 scale-[0.98]" 
                        : "hover:shadow-lg hover:scale-[1.02]"
                    )}
                  >
                    {/* Image */}
                    <div className="relative aspect-video bg-gray-100">
                      {collection.image_url ? (
                        <Image
                          src={getImageUrl(collection.image_url)}
                          alt={collection.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Info className="w-12 h-12 text-gray-300" />
                        </div>
                      )}
                      
                      {/* Selection Badge */}
                      {isSelected && (
                        <div className="absolute top-3 right-3 bg-amber-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold shadow-lg">
                          {selectionOrder}
                        </div>
                      )}
                      
                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </div>
                    
                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">
                        {collection.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded">
                            <CheckCircle className="w-3 h-3" />
                            Selected ({selectionOrder} of 2)
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">
                            Click to select
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Preview Section */}
        {selectedCount > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Preview</h2>
            <p className="text-sm text-gray-500 mb-4">
              These collections will appear in the Best Collections section in this order:
            </p>
            <div className="space-y-3">
              {selectedHeroIds.map((heroId, index) => {
                const collection = heroCollections.find(hc => hc.id === heroId)
                if (!collection) return null
                
                return (
                  <div key={heroId} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="relative w-20 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                      {collection.image_url && (
                        <Image
                          src={getImageUrl(collection.image_url)}
                          alt={collection.name}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{collection.name}</p>
                      <p className="text-xs text-gray-500">From Hero Carousel</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
 