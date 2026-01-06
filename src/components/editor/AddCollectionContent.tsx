'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Upload, Wand2, Loader2, MoreVertical, Image as ImageIcon, Eye, EyeOff, X, Plus } from 'lucide-react'
import { cn, getImageUrl } from '@/lib/utils'

interface Collection {
  id: string
  name: string
  banner_url: string
  image_url?: string
  display_order: number
  is_visible?: boolean
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
  
  // Edit mode state
  const [editingCollection, setEditingCollection] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  useEffect(() => {
    loadCollections()
  }, [])

  const loadCollections = async () => {
    setIsLoading(true)
    try {
      const endpoint = collectionType === 'hero' 
        ? `/api/editor/collections/hero?shopId=${shopId}`
        : `/api/editor/collections/trending?shopId=${shopId}`

      const response = await fetch(endpoint)

      if (response.ok) {
        const data = await response.json()
        setCollections(data.collections || [])
      } else {
        console.error('Failed to load collections:', response.status)
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
    const nameToUse = editingCollection || collectionName.trim()
    if (!nameToUse) {
      alert('Please enter a collection name first')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/editor/generate-banner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collectionName: nameToUse,
          aspectRatio: collectionType === 'hero' ? '16:9' : '5:6',
          shopId,
          collectionType,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedImage(data.imageUrl)
        setBannerSource('generate')
        setUploadedImage(null)
        setUploadedImagePreview(null)
      } else {
        const errorData = await response.json()
        alert(`Failed to generate image: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error generating image:', error)
      alert('Error generating image. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveCollection = async () => {
    const nameToSave = editingCollection || collectionName.trim()
    if (!nameToSave) {
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
      const response = await fetch('/api/editor/collections/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopId,
          collectionName: nameToSave,
          bannerImage: imageToSave,
          collectionType,
        }),
      })

      if (response.ok) {
        alert('Collection saved successfully!')
        resetForm()
        loadCollections()
      } else {
        const errorData = await response.json()
        alert(`Failed to save collection: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error saving collection:', error)
      alert('Error saving collection. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleVisibility = async (collection: Collection) => {
    try {
      const response = await fetch('/api/editor/collections/visibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopId,
          collectionName: collection.name,
          isVisible: collection.is_visible === false ? true : false,
          collectionType,
        }),
      })

      if (response.ok) {
        loadCollections()
        setOpenMenuId(null)
      } else {
        alert('Failed to toggle visibility')
      }
    } catch (error) {
      console.error('Error toggling visibility:', error)
      alert('Error toggling visibility')
    }
  }

  const handleEditImage = (collection: Collection) => {
    setEditingCollection(collection.name)
    setCollectionName(collection.name)
    setShowAddForm(true)
    setOpenMenuId(null)
  }

  const resetForm = () => {
    setShowAddForm(false)
    setEditingCollection(null)
    setCollectionName('')
    setGeneratedImage(null)
    setUploadedImage(null)
    setUploadedImagePreview(null)
    setBannerSource('generate')
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
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Add {collectionType === 'hero' ? 'Hero' : 'Trending'} Collection
            </button>
          )}
        </div>

        {/* Add/Edit Form - matches Flutter _buildCollectionForm */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-lg border-2 border-amber-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {editingCollection ? `Change Image: ${editingCollection}` : 'Add New Hero Collection'}
              </h2>
              <button onClick={resetForm} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Collection Name - only show for new collections */}
            {!editingCollection && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Collection Name *
                </label>
                <input
                  type="text"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  placeholder="e.g., Summer Collection, Wedding Specials"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            )}
            
            {/* Image Section */}
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900">Collection Banner</h3>
              <p className="text-xs text-gray-500">Required aspect ratio: {collectionType === 'hero' ? '16:9' : '5:6 or 3:2'}</p>
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
                  disabled={isGenerating || (!editingCollection && !collectionName.trim())}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
              disabled={isSaving || (!editingCollection && !collectionName.trim()) || (!generatedImage && !uploadedImagePreview)}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 inline mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                editingCollection ? 'Update Image' : 'Save Collection'
              )}
            </button>
          </div>
        )}

        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-black">
              {collectionType === 'hero' ? 'Hero Carousel Collections' : 'Trending Collections'}
            </h2>
            <p className="text-sm text-gray-500">
              {collectionType === 'hero' 
                ? 'Main banner images shown on the homepage carousel'
                : 'Featured collections shown in the trending section (4 positions)'}
            </p>
          </div>
          <span className="px-3 py-1 bg-amber-50 text-amber-800 text-xs font-medium rounded-lg">
            {collectionType === 'hero' ? '16:9 (landscape)' : 'Mixed ratios'}
          </span>
        </div>

        {/* Collections List - matches Flutter ListView */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
          </div>
        ) : (
          <div className="space-y-3">
            {collections.map((collection) => (
              <div 
                key={collection.id} 
                className="bg-white rounded-xl border border-gray-200 shadow-sm flex items-center overflow-hidden"
              >
                {/* Image thumbnail */}
                <div className="relative w-24 h-20 flex-shrink-0">
                  <Image
                    src={getImageUrl(collection.banner_url || collection.image_url || '')}
                    alt={collection.name}
                    fill
                    className="object-cover"
                  />
                </div>
                
                {/* Content */}
                <div className="flex-1 px-4 py-2">
                  <h3 className="font-semibold text-gray-900">{collection.name}</h3>
                  <span className={cn(
                    'inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded',
                    collection.is_visible !== false
                      ? 'bg-green-50 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  )}>
                    {collection.is_visible !== false ? 'On Website' : 'Hidden'}
                  </span>
                </div>
                
                {/* Popup Menu - matches Flutter PopupMenuButton */}
                <div className="relative px-2">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === collection.id ? null : collection.id)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-500" />
                  </button>
                  
                  {openMenuId === collection.id && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                      <button
                        onClick={() => handleEditImage(collection)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                      >
                        <ImageIcon className="w-4 h-4" />
                        Change Image
                      </button>
                      <button
                        onClick={() => handleToggleVisibility(collection)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                      >
                        {collection.is_visible !== false ? (
                          <><EyeOff className="w-4 h-4" /> Remove from Website</>
                        ) : (
                          <><Eye className="w-4 h-4" /> Add to Website</>
                        )}
                      </button>
                    </div>
                  )}
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
