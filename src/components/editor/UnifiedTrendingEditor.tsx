'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  ArrowLeft, Upload, Wand2, Loader2, X, Trash2, 
  CheckCircle, Image as ImageIcon, Info
} from 'lucide-react'
import { cn, getImageUrl } from '@/lib/utils'
import { waitForEditorContext } from '@/lib/editor-context'

interface TrendingCollection {
  id: string
  user_id: string
  name: string
  slug: string
  image_url: string | null
  display_order: number
  is_active: boolean
  aspect_ratio?: string
}

interface UnifiedTrendingEditorProps {
  userId: string
  shopDomain: string
}

// Box configuration with positions and aspect ratios
const BOX_CONFIG = [
  { position: 0, aspectRatio: '3:2', label: 'Box 1', description: 'Top Left - Landscape', heightRatio: 0.8 },
  { position: 1, aspectRatio: '5:6', label: 'Box 2', description: 'Top Right - Portrait', heightRatio: 1.2 },
  { position: 2, aspectRatio: '5:6', label: 'Box 3', description: 'Bottom Left - Portrait', heightRatio: 1.2 },
  { position: 3, aspectRatio: '3:2', label: 'Box 4', description: 'Bottom Right - Landscape', heightRatio: 0.8 },
]

export default function UnifiedTrendingEditor({ userId, shopDomain }: UnifiedTrendingEditorProps) {
  const router = useRouter()
  const [collections, setCollections] = useState<TrendingCollection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editorToken, setEditorToken] = useState<string | null>(null)
  
  // Selection and editing state
  const [selectedBox, setSelectedBox] = useState<number | null>(null)
  const [collectionName, setCollectionName] = useState('')
  const [bannerSource, setBannerSource] = useState<'generate' | 'upload'>('generate')
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    loadCollections()
    waitForEditorContext(5000).then((context) => {
      if (context?.token) {
        setEditorToken(context.token)
      }
    })
  }, [])

  const loadCollections = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/editor/collections?userId=${userId}&label=trending`)
      if (response.ok) {
        const data = await response.json()
        setCollections(data.collections || [])
      }
    } catch (error) {
      console.error('Error loading collections:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Get collection for a specific position based on display_order
  const getCollectionAtPosition = (position: number): TrendingCollection | undefined => {
    return collections.find(c => c.display_order === position && c.is_active)
  }

  // Handle box selection
  const handleBoxSelect = (position: number) => {
    if (selectedBox === position) {
      // Deselect if clicking same box
      resetForm()
      return
    }
    
    setSelectedBox(position)
    const existing = getCollectionAtPosition(position)
    if (existing) {
      setCollectionName(existing.name)
    } else {
      setCollectionName('')
    }
    setGeneratedImage(null)
    setUploadedImagePreview(null)
    setBannerSource('generate')
  }

  const resetForm = () => {
    setSelectedBox(null)
    setCollectionName('')
    setGeneratedImage(null)
    setUploadedImagePreview(null)
    setBannerSource('generate')
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setUploadedImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setBannerSource('upload')
      setGeneratedImage(null)
    }
  }

  const handleGenerateImage = async () => {
    if (!collectionName.trim() || selectedBox === null) {
      alert('Please enter a collection name')
      return
    }

    let tokenToUse = editorToken
    if (!tokenToUse) {
      const context = await waitForEditorContext(3000)
      if (context?.token) {
        tokenToUse = context.token
        setEditorToken(context.token)
      } else {
        alert('Editor session not found. Please reload from the app.')
        return
      }
    }

    setIsGenerating(true)
    try {
      const boxConfig = BOX_CONFIG[selectedBox]
      const response = await fetch('/api/editor/generate-banner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectionName: collectionName.trim(),
          aspectRatio: boxConfig.aspectRatio,
          shopId: userId,
          collectionType: 'trending',
          editorToken: tokenToUse,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedImage(data.imageUrl)
        setBannerSource('generate')
        setUploadedImagePreview(null)
      } else {
        const errorData = await response.json()
        alert(`Failed to generate: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error generating image:', error)
      alert('Error generating image')
    } finally {
      setIsGenerating(false)
    }
  }

  const uploadImageToStorage = async (imageData: string, name: string): Promise<string> => {
    if (imageData.startsWith('data:')) {
      const response = await fetch(imageData)
      const blob = await response.blob()
      const file = new File([blob], `${name}.png`, { type: 'image/png' })
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', userId)
      formData.append('collectionName', name)

      const uploadResponse = await fetch('/api/editor/upload', {
        method: 'POST',
        body: formData,
      })

      if (uploadResponse.ok) {
        const data = await uploadResponse.json()
        return data.url
      }
      throw new Error('Failed to upload image')
    }
    return imageData
  }

  const handleSaveCollection = async () => {
    if (!collectionName.trim() || selectedBox === null) {
      alert('Please enter a collection name')
      return
    }

    const imageToSave = bannerSource === 'generate' ? generatedImage : uploadedImagePreview
    if (!imageToSave) {
      alert('Please generate or upload a banner image')
      return
    }

    setIsSaving(true)
    try {
      const imageUrl = await uploadImageToStorage(imageToSave, collectionName.trim())
      const boxConfig = BOX_CONFIG[selectedBox]
      const existingCollection = getCollectionAtPosition(selectedBox)
      
      const method = existingCollection ? 'PUT' : 'POST'
      const body = existingCollection 
        ? {
            id: existingCollection.id,
            userId,
            name: collectionName.trim(),
            imageUrl,
            displayOrder: selectedBox,
            collectionLabel: 'trending',
            aspectRatio: boxConfig.aspectRatio,
          }
        : {
            userId,
            name: collectionName.trim(),
            imageUrl,
            collectionLabel: 'trending',
            displayOrder: selectedBox,
            aspectRatio: boxConfig.aspectRatio,
          }

      const response = await fetch('/api/editor/collections', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        alert('Collection saved successfully!')
        resetForm()
        loadCollections()
      } else {
        const errorData = await response.json()
        alert(`Failed to save: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error saving collection:', error)
      alert('Error saving collection')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteCollection = async () => {
    if (selectedBox === null) return
    
    const existing = getCollectionAtPosition(selectedBox)
    if (!existing) {
      alert('No collection to delete in this box')
      return
    }

    if (!confirm(`Delete "${existing.name}" from this box?`)) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/editor/collections?id=${existing.id}&userId=${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('Collection removed!')
        resetForm()
        loadCollections()
      } else {
        alert('Failed to delete collection')
      }
    } catch (error) {
      console.error('Error deleting collection:', error)
      alert('Error deleting collection')
    } finally {
      setIsDeleting(false)
    }
  }

  const selectedBoxConfig = selectedBox !== null ? BOX_CONFIG[selectedBox] : null
  const selectedExistingCollection = selectedBox !== null ? getCollectionAtPosition(selectedBox) : null
  const currentImage = bannerSource === 'generate' ? generatedImage : uploadedImagePreview

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-black">Edit Trending Collections</h1>
            <p className="text-sm text-gray-500 mt-1">
              Select a box below to add or edit a collection
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">How the Trending Section Works</p>
            <p>The trending section displays 4 boxes in a staggered grid. Boxes 1 & 4 are landscape (3:2), while Boxes 2 & 3 are portrait (5:6). Click on any box to edit it.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side: Visual Grid Preview */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Trending Grid Preview</h2>
            <div className="bg-white rounded-xl shadow-lg p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                </div>
              ) : (
                <div className="flex gap-3">
                  {/* Left Column: Box 0 (short) + Box 2 (tall) */}
                  <div className="flex-1 flex flex-col gap-3">
                    <TrendingBoxPreview
                      boxConfig={BOX_CONFIG[0]}
                      collection={getCollectionAtPosition(0)}
                      isSelected={selectedBox === 0}
                      onSelect={() => handleBoxSelect(0)}
                    />
                    <TrendingBoxPreview
                      boxConfig={BOX_CONFIG[2]}
                      collection={getCollectionAtPosition(2)}
                      isSelected={selectedBox === 2}
                      onSelect={() => handleBoxSelect(2)}
                    />
                  </div>
                  {/* Right Column: Box 1 (tall) + Box 3 (short) */}
                  <div className="flex-1 flex flex-col gap-3">
                    <TrendingBoxPreview
                      boxConfig={BOX_CONFIG[1]}
                      collection={getCollectionAtPosition(1)}
                      isSelected={selectedBox === 1}
                      onSelect={() => handleBoxSelect(1)}
                    />
                    <TrendingBoxPreview
                      boxConfig={BOX_CONFIG[3]}
                      collection={getCollectionAtPosition(3)}
                      isSelected={selectedBox === 3}
                      onSelect={() => handleBoxSelect(3)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              {BOX_CONFIG.map((box) => {
                const hasCollection = !!getCollectionAtPosition(box.position)
                return (
                  <div 
                    key={box.position}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg",
                      hasCollection ? "bg-green-50" : "bg-gray-100"
                    )}
                  >
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      hasCollection ? "bg-green-500" : "bg-gray-300"
                    )} />
                    <span className="text-gray-700">
                      {box.label} ({box.aspectRatio})
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Side: Edit Form */}
          <div>
            <h2 className="text-lg font-semibold mb-4">
              {selectedBox !== null ? `Edit ${selectedBoxConfig?.label}` : 'Select a Box'}
            </h2>
            
            {selectedBox === null ? (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 mb-2">Click on any box in the preview to edit it</p>
                <p className="text-sm text-gray-400">
                  Each box has a specific aspect ratio for optimal display
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-6">
                {/* Selected Box Info */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b">
                  <div>
                    <span className="text-sm text-gray-500">{selectedBoxConfig?.description}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2 py-1 rounded">
                        {selectedBoxConfig?.aspectRatio} ratio
                      </span>
                      {selectedExistingCollection && (
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Has Collection
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={resetForm}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Cancel"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Collection Name */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Collection Name *
                  </label>
                  <input
                    type="text"
                    value={collectionName}
                    onChange={(e) => setCollectionName(e.target.value)}
                    placeholder="e.g., Bridal Collection, Summer Sparkle"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                {/* Banner Source Tabs */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banner Image
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={handleGenerateImage}
                      disabled={isGenerating || !collectionName.trim()}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-5 h-5" />
                          Generate AI
                        </>
                      )}
                    </button>
                    <label className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <div className="w-full py-3 rounded-lg font-semibold cursor-pointer flex items-center justify-center gap-2 border-2 border-amber-500 text-amber-700 hover:bg-amber-50">
                        <Upload className="w-5 h-5" />
                        Upload
                      </div>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    AI will generate a {selectedBoxConfig?.aspectRatio} {selectedBoxConfig?.aspectRatio === '3:2' ? 'landscape' : 'portrait'} image
                  </p>
                </div>

                {/* Preview */}
                {currentImage && (
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preview
                    </label>
                    <div className={cn(
                      "relative rounded-lg overflow-hidden bg-gray-100",
                      selectedBoxConfig?.aspectRatio === '3:2' ? 'aspect-[3/2]' : 'aspect-[5/6]'
                    )}>
                      <Image 
                        src={currentImage} 
                        alt="Preview" 
                        fill 
                        className="object-cover" 
                      />
                    </div>
                  </div>
                )}

                {/* Existing Image (if editing) */}
                {!currentImage && selectedExistingCollection?.image_url && (
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Image
                    </label>
                    <div className={cn(
                      "relative rounded-lg overflow-hidden bg-gray-100",
                      selectedBoxConfig?.aspectRatio === '3:2' ? 'aspect-[3/2]' : 'aspect-[5/6]'
                    )}>
                      <Image 
                        src={getImageUrl(selectedExistingCollection.image_url)} 
                        alt={selectedExistingCollection.name} 
                        fill 
                        className="object-cover" 
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveCollection}
                    disabled={isSaving || !collectionName.trim() || (!currentImage && !selectedExistingCollection?.image_url)}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        {selectedExistingCollection ? 'Update' : 'Save'} Collection
                      </>
                    )}
                  </button>
                  
                  {selectedExistingCollection && (
                    <button
                      onClick={handleDeleteCollection}
                      disabled={isDeleting}
                      className="px-4 py-3 rounded-lg border-2 border-red-300 text-red-600 hover:bg-red-50 font-semibold disabled:opacity-50 flex items-center gap-2"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Preview box component for the visual grid
function TrendingBoxPreview({ 
  boxConfig, 
  collection, 
  isSelected, 
  onSelect 
}: { 
  boxConfig: typeof BOX_CONFIG[0]
  collection?: TrendingCollection
  isSelected: boolean
  onSelect: () => void
}) {
  const aspectClass = boxConfig.aspectRatio === '3:2' ? 'aspect-[3/2]' : 'aspect-[5/6]'
  
  return (
    <button
      onClick={onSelect}
      className={cn(
        "relative rounded-xl overflow-hidden transition-all duration-200 w-full",
        aspectClass,
        isSelected 
          ? "ring-4 ring-amber-500 ring-offset-2 scale-[0.98]" 
          : "hover:ring-2 hover:ring-amber-300"
      )}
    >
      {collection?.image_url ? (
        <>
          <Image
            src={getImageUrl(collection.image_url)}
            alt={collection.name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-2 left-2 right-2">
            <p className="text-white text-xs font-semibold truncate drop-shadow-lg">
              {collection.name}
            </p>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 bg-gray-200 flex flex-col items-center justify-center">
          <ImageIcon className="w-8 h-8 text-gray-400 mb-1" />
          <span className="text-xs text-gray-500">{boxConfig.label}</span>
          <span className="text-[10px] text-gray-400">{boxConfig.aspectRatio}</span>
        </div>
      )}
      
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 bg-amber-500 rounded-full p-1">
          <CheckCircle className="w-4 h-4 text-white" />
        </div>
      )}
    </button>
  )
}
