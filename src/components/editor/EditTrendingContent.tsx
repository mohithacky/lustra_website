'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Upload, Wand2, Loader2, Edit, Plus } from 'lucide-react'
import { cn, getImageUrl } from '@/lib/utils'
import { getEditorToken } from '@/lib/editor-context'

interface TrendingCollection {
  id: string
  name: string
  banner_url: string
  position: number
  aspect_ratio: string
}

interface EditTrendingContentProps {
  shopId: string
  shopDomain: string
}

export default function EditTrendingContent({ shopId, shopDomain }: EditTrendingContentProps) {
  const router = useRouter()
  const [collections, setCollections] = useState<TrendingCollection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingPosition, setEditingPosition] = useState<number | null>(null)
  
  // Form state
  const [collectionName, setCollectionName] = useState('')
  const [bannerSource, setBannerSource] = useState<'generate' | 'upload'>('generate')
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Trending collections have 4 positions with specific aspect ratios
  const positions = [
    { position: 0, aspectRatio: '5:6', label: 'Position 1 (Portrait)' },
    { position: 1, aspectRatio: '3:2', label: 'Position 2 (Landscape)' },
    { position: 2, aspectRatio: '3:2', label: 'Position 3 (Landscape)' },
    { position: 3, aspectRatio: '5:6', label: 'Position 4 (Portrait)' },
  ]

  useEffect(() => {
    loadCollections()
  }, [])

  const loadCollections = async () => {
    setIsLoading(true)
    try {
      const token = getEditorToken()
      if (!token) {
        alert('Editor session expired. Please reopen from the app.')
        router.back()
        return
      }

      const response = await fetch(`/api/editor/collections/trending?shopId=${shopId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

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

  const getCollectionAtPosition = (position: number) => {
    return collections.find(c => c.position === position)
  }

  const handleEditPosition = (position: number) => {
    const existing = getCollectionAtPosition(position)
    if (existing) {
      setCollectionName(existing.name)
    } else {
      setCollectionName('')
    }
    setEditingPosition(position)
    setGeneratedImage(null)
    setUploadedImage(null)
    setUploadedImagePreview(null)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedImage(file)
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
    if (!collectionName.trim() || editingPosition === null) {
      alert('Please enter a collection name')
      return
    }

    setIsGenerating(true)
    try {
      const token = getEditorToken()
      if (!token) {
        alert('Editor session expired')
        return
      }

      const positionData = positions[editingPosition]
      const response = await fetch('/api/editor/generate-banner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          collectionName,
          aspectRatio: positionData.aspectRatio,
          shopId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedImage(data.imageUrl)
        setBannerSource('generate')
        setUploadedImage(null)
        setUploadedImagePreview(null)
      } else {
        alert('Failed to generate image')
      }
    } catch (error) {
      console.error('Error generating image:', error)
      alert('Error generating image')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveCollection = async () => {
    if (!collectionName.trim() || editingPosition === null) {
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
      const token = getEditorToken()
      if (!token) {
        alert('Editor session expired')
        return
      }

      const positionData = positions[editingPosition]
      const response = await fetch('/api/editor/collections/trending/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          shopId,
          collectionName,
          bannerImage: imageToSave,
          position: editingPosition,
          aspectRatio: positionData.aspectRatio,
        }),
      })

      if (response.ok) {
        alert('Collection saved successfully!')
        setEditingPosition(null)
        setCollectionName('')
        setGeneratedImage(null)
        setUploadedImage(null)
        setUploadedImagePreview(null)
        loadCollections()
      } else {
        alert('Failed to save collection')
      }
    } catch (error) {
      console.error('Error saving collection:', error)
      alert('Error saving collection')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-black">Edit Trending Collections</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage up to 4 trending collections with specific aspect ratios
            </p>
          </div>
        </div>

        {/* Edit Form */}
        {editingPosition !== null && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {positions[editingPosition].label}
              </h2>
              <button
                onClick={() => setEditingPosition(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
            
            {/* Collection Name */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collection Name
              </label>
              <input
                type="text"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                placeholder="e.g., Bridal Collection"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              />
            </div>

            {/* Banner Source Tabs */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setBannerSource('generate')}
                className={cn(
                  'flex-1 py-3 rounded-lg font-semibold transition-colors',
                  bannerSource === 'generate'
                    ? 'bg-gold-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                <Wand2 className="w-5 h-5 inline mr-2" />
                Generate with AI
              </button>
              <button
                onClick={() => setBannerSource('upload')}
                className={cn(
                  'flex-1 py-3 rounded-lg font-semibold transition-colors',
                  bannerSource === 'upload'
                    ? 'bg-gold-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                <Upload className="w-5 h-5 inline mr-2" />
                Upload Image
              </button>
            </div>

            {/* Generate Section */}
            {bannerSource === 'generate' && (
              <div className="mb-6">
                <button
                  onClick={handleGenerateImage}
                  disabled={isGenerating || !collectionName.trim()}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 inline mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5 inline mr-2" />
                      Generate Banner ({positions[editingPosition].aspectRatio})
                    </>
                  )}
                </button>
                {generatedImage && (
                  <div className={cn(
                    "mt-4 relative rounded-lg overflow-hidden",
                    positions[editingPosition].aspectRatio === '5:6' ? 'aspect-[5/6]' : 'aspect-[3/2]'
                  )}>
                    <Image src={generatedImage} alt="Generated banner" fill className="object-cover" />
                  </div>
                )}
              </div>
            )}

            {/* Upload Section */}
            {bannerSource === 'upload' && (
              <div className="mb-6">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="banner-upload"
                />
                <label
                  htmlFor="banner-upload"
                  className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gold-500 transition-colors"
                >
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Click to upload an image</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Recommended: {positions[editingPosition].aspectRatio} aspect ratio
                  </p>
                </label>
                {uploadedImagePreview && (
                  <div className={cn(
                    "mt-4 relative rounded-lg overflow-hidden",
                    positions[editingPosition].aspectRatio === '5:6' ? 'aspect-[5/6]' : 'aspect-[3/2]'
                  )}>
                    <Image src={uploadedImagePreview} alt="Uploaded banner" fill className="object-cover" />
                  </div>
                )}
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSaveCollection}
              disabled={isSaving || !collectionName.trim() || (!generatedImage && !uploadedImagePreview)}
              className="w-full bg-gold-500 hover:bg-gold-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 inline mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Collection'
              )}
            </button>
          </div>
        )}

        {/* Collections Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {positions.map((pos) => {
              const collection = getCollectionAtPosition(pos.position)
              const isPortrait = pos.aspectRatio === '5:6'
              
              return (
                <div
                  key={pos.position}
                  className={cn(
                    'bg-white rounded-xl shadow-md overflow-hidden',
                    isPortrait && 'row-span-2'
                  )}
                >
                  {collection ? (
                    <>
                      <div className={cn(
                        'relative',
                        isPortrait ? 'aspect-[5/6]' : 'aspect-[3/2]'
                      )}>
                        <Image
                          src={getImageUrl(collection.banner_url)}
                          alt={collection.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-2">{collection.name}</h3>
                        <p className="text-sm text-gray-500 mb-3">{pos.label}</p>
                        <button
                          onClick={() => handleEditPosition(pos.position)}
                          className="text-gold-600 hover:text-gold-700 text-sm font-medium flex items-center gap-1"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={() => handleEditPosition(pos.position)}
                      className={cn(
                        'w-full h-full flex flex-col items-center justify-center p-8 hover:bg-gray-50 transition-colors',
                        isPortrait ? 'aspect-[5/6]' : 'aspect-[3/2]'
                      )}
                    >
                      <Plus className="w-12 h-12 text-gray-400 mb-4" />
                      <p className="font-semibold text-gray-700">{pos.label}</p>
                      <p className="text-sm text-gray-500 mt-1">{pos.aspectRatio} ratio</p>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
