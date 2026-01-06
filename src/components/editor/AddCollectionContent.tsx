'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Upload, Wand2, Loader2, Trash2 } from 'lucide-react'
import { cn, getImageUrl } from '@/lib/utils'
import { getEditorToken } from '@/lib/editor-context'

interface Collection {
  id: string
  name: string
  banner_url: string
  display_order: number
}

interface AddCollectionContentProps {
  shopId: string
  shopDomain: string
  collectionType?: 'hero' | 'trending'
}

export default function AddCollectionContent({ 
  shopId, 
  shopDomain,
  collectionType = 'hero'
}: AddCollectionContentProps) {
  const router = useRouter()
  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  
  // Form state
  const [collectionName, setCollectionName] = useState('')
  const [bannerSource, setBannerSource] = useState<'generate' | 'upload'>('generate')
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

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

      const endpoint = collectionType === 'hero' 
        ? `/api/editor/collections/hero?shopId=${shopId}`
        : `/api/editor/collections/trending?shopId=${shopId}`

      const response = await fetch(endpoint, {
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
    if (!collectionName.trim()) {
      alert('Please enter a collection name first')
      return
    }

    setIsGenerating(true)
    try {
      const token = getEditorToken()
      if (!token) {
        alert('Editor session expired')
        return
      }

      const response = await fetch('/api/editor/generate-banner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          collectionName,
          aspectRatio: collectionType === 'hero' ? '16:9' : '5:6',
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
    if (!collectionName.trim()) {
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

      const response = await fetch('/api/editor/collections/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          shopId,
          collectionName,
          bannerImage: imageToSave,
          collectionType,
        }),
      })

      if (response.ok) {
        alert('Collection saved successfully!')
        setShowAddForm(false)
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

  const handleDeleteCollection = async (collectionId: string) => {
    if (!confirm('Are you sure you want to delete this collection?')) return

    try {
      const token = getEditorToken()
      if (!token) {
        alert('Editor session expired')
        return
      }

      const response = await fetch(`/api/editor/collections/${collectionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        loadCollections()
      } else {
        alert('Failed to delete collection')
      }
    } catch (error) {
      console.error('Error deleting collection:', error)
      alert('Error deleting collection')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-black">
                {collectionType === 'hero' ? 'Hero Carousel Collections' : 'Trending Collections'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {collectionType === 'hero' 
                  ? 'Manage collections shown in the hero carousel (16:9 aspect ratio)'
                  : 'Manage trending collections (max 4 items, mixed aspect ratios)'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gold-500 hover:bg-gold-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            {showAddForm ? 'Cancel' : 'Add New Collection'}
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Create New Collection</h2>
            
            {/* Collection Name */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collection Name
              </label>
              <input
                type="text"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                placeholder="e.g., Wedding Collection"
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
                      Generate Banner
                    </>
                  )}
                </button>
                {generatedImage && (
                  <div className="mt-4 relative aspect-video rounded-lg overflow-hidden">
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
                  <p className="text-sm text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                </label>
                {uploadedImagePreview && (
                  <div className="mt-4 relative aspect-video rounded-lg overflow-hidden">
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

        {/* Collections List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <div key={collection.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="relative aspect-video">
                  <Image
                    src={getImageUrl(collection.banner_url)}
                    alt={collection.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{collection.name}</h3>
                  <button
                    onClick={() => handleDeleteCollection(collection.id)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && collections.length === 0 && !showAddForm && (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">No collections yet</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gold-500 hover:bg-gold-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Add Your First Collection
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
