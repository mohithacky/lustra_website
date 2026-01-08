'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  ArrowLeft, Upload, Wand2, Loader2, MoreVertical, 
  Image as ImageIcon, Eye, EyeOff, X, Plus, Trash2, GripVertical 
} from 'lucide-react'
import { cn, getImageUrl } from '@/lib/utils'
import { getEditorContext } from '@/lib/editor-context'

interface Collection {
  id: string
  user_id: string
  name: string
  slug: string
  collection_label: string
  image_url: string | null
  display_order: number
  is_active: boolean
}

interface CollectionsEditorProps {
  userId: string
  shopDomain: string
  collectionLabel: 'hero' | 'trending' | 'best' | 'category' | 'occasion'
  title: string
  description: string
  aspectRatio?: string
  maxItems?: number
}

export default function CollectionsEditor({ 
  userId, 
  shopDomain,
  collectionLabel,
  title,
  description,
  aspectRatio = '16:9',
  maxItems,
}: CollectionsEditorProps) {
  const router = useRouter()
  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editorToken, setEditorToken] = useState<string | null>(null)
  
  // Form state
  const [collectionName, setCollectionName] = useState('')
  const [bannerSource, setBannerSource] = useState<'generate' | 'upload'>('generate')
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Edit mode state
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  useEffect(() => {
    loadCollections()
    // Get editor token from injected context
    const context = getEditorContext()
    if (context?.token) {
      setEditorToken(context.token)
    }
  }, [])

  const loadCollections = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/editor/collections?userId=${userId}&label=${collectionLabel}`)
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    const nameToUse = editingCollection?.name || collectionName.trim()
    if (!nameToUse) {
      alert('Please enter a collection name first')
      return
    }

    if (!editorToken) {
      alert('Editor session not found. Please reload the page.')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/editor/generate-banner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectionName: nameToUse,
          aspectRatio,
          shopId: userId,
          collectionType: collectionLabel,
          editorToken,
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

  const uploadImageToStorage = async (imageData: string, name: string): Promise<string> => {
    // If it's a base64 image, convert to blob and upload
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
    const nameToSave = editingCollection?.name || collectionName.trim()
    if (!nameToSave) {
      alert('Please enter a collection name')
      return
    }

    const imageToSave = bannerSource === 'generate' ? generatedImage : uploadedImagePreview
    if (!imageToSave && !editingCollection) {
      alert('Please generate or upload a banner image')
      return
    }

    setIsSaving(true)
    try {
      let imageUrl = editingCollection?.image_url || null
      
      if (imageToSave) {
        imageUrl = await uploadImageToStorage(imageToSave, nameToSave)
      }

      const method = editingCollection ? 'PUT' : 'POST'
      const body = editingCollection 
        ? {
            id: editingCollection.id,
            userId,
            name: nameToSave,
            imageUrl,
          }
        : {
            userId,
            name: nameToSave,
            imageUrl,
            collectionLabel,
            displayOrder: collections.length,
          }

      const response = await fetch('/api/editor/collections', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        alert(editingCollection ? 'Collection updated!' : 'Collection added!')
        resetForm()
        loadCollections()
      } else {
        const errorData = await response.json()
        alert(`Failed to save: ${errorData.error || 'Unknown error'}`)
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
      const response = await fetch('/api/editor/collections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: collection.id,
          userId,
          isActive: !collection.is_active,
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
    }
  }

  const handleDeleteCollection = async (collection: Collection) => {
    if (!confirm(`Delete "${collection.name}"? This cannot be undone.`)) return

    try {
      const response = await fetch(`/api/editor/collections?id=${collection.id}&userId=${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        loadCollections()
        setOpenMenuId(null)
      } else {
        alert('Failed to delete collection')
      }
    } catch (error) {
      console.error('Error deleting collection:', error)
    }
  }

  const handleEditImage = (collection: Collection) => {
    setEditingCollection(collection)
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

  const canAddMore = !maxItems || collections.length < maxItems

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
              <h1 className="text-2xl font-bold text-black">{title}</h1>
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            </div>
          </div>
          {!showAddForm && canAddMore && (
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Collection
            </button>
          )}
        </div>

        {/* Info Banner */}
        {maxItems && (
          <div className={cn(
            'mb-6 p-4 rounded-lg border',
            collections.length >= maxItems 
              ? 'bg-orange-50 border-orange-200' 
              : 'bg-blue-50 border-blue-200'
          )}>
            <p className={cn(
              'text-sm',
              collections.length >= maxItems ? 'text-orange-800' : 'text-blue-800'
            )}>
              {collections.length} of {maxItems} slots used. Aspect ratio: {aspectRatio}
            </p>
          </div>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-lg border-2 border-amber-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {editingCollection ? `Edit: ${editingCollection.name}` : 'Add New Collection'}
              </h2>
              <button onClick={resetForm} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Collection Name */}
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
              <p className="text-xs text-gray-500">Required aspect ratio: {aspectRatio}</p>
            </div>

            {/* Banner Source Tabs */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={handleGenerateImage}
                disabled={isGenerating || (!editingCollection && !collectionName.trim())}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 mr-2" />
                    Generate with AI
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
                <div className="w-full py-3 rounded-lg font-semibold border-2 border-amber-500 text-amber-700 hover:bg-amber-50 cursor-pointer flex items-center justify-center">
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Image
                </div>
              </label>
            </div>

            {/* Preview */}
            {(generatedImage || uploadedImagePreview) && (
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
                <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                  <Image 
                    src={generatedImage || uploadedImagePreview || ''} 
                    alt="Preview" 
                    fill 
                    className="object-cover" 
                  />
                </div>
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSaveCollection}
              disabled={isSaving || (!editingCollection && !collectionName.trim())}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 inline mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                editingCollection ? 'Update Collection' : 'Save Collection'
              )}
            </button>
          </div>
        )}

        {/* Collections List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-16 bg-gray-100 rounded-xl">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 mb-4">No collections yet</p>
            {canAddMore && (
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold"
              >
                Add Your First Collection
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {collections.map((collection) => (
              <div 
                key={collection.id} 
                className="bg-white rounded-xl border border-gray-200 shadow-sm flex items-center overflow-hidden"
              >
                {/* Image thumbnail */}
                <div className="relative w-28 h-20 flex-shrink-0 bg-gray-100">
                  {collection.image_url ? (
                    <Image
                      src={getImageUrl(collection.image_url)}
                      alt={collection.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 px-4 py-2">
                  <h3 className="font-semibold text-gray-900">{collection.name}</h3>
                  <span className={cn(
                    'inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded',
                    collection.is_active
                      ? 'bg-green-50 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  )}>
                    {collection.is_active ? 'Active' : 'Hidden'}
                  </span>
                </div>
                
                {/* Menu */}
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
                        {collection.is_active ? (
                          <><EyeOff className="w-4 h-4" /> Hide</>
                        ) : (
                          <><Eye className="w-4 h-4" /> Show</>
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteCollection(collection)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
