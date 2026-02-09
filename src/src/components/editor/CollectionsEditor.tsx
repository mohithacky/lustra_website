'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { 
  ArrowLeft, Upload, Wand2, Loader2, MoreVertical, 
  Image as ImageIcon, Eye, EyeOff, X, Plus, Trash2, GripVertical, RefreshCw 
} from 'lucide-react'
import { cn, getImageUrl } from '@/lib/utils'
import { waitForEditorContext } from '@/lib/editor-context'

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
  showAIGeneration?: boolean
  aspectRatioFilter?: 'small' | 'large'  // For trending: small=3:2, large=5:6
  isDark?: boolean
}

export default function CollectionsEditor({ 
  userId, 
  shopDomain,
  collectionLabel,
  title,
  description,
  aspectRatio = '16:9',
  showAIGeneration = true,
  maxItems,
  aspectRatioFilter,
  isDark = false,
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
  const [menuPosition, setMenuPosition] = useState<{top: number, left: number} | null>(null)
  const menuButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  
  // Replace collection state (for when slots are full)
  const [showReplaceModal, setShowReplaceModal] = useState(false)
  const [pendingNewCollection, setPendingNewCollection] = useState<{name: string, imageUrl: string} | null>(null)

  useEffect(() => {
    loadCollections()
    // Wait for editor token from injected context (Flutter re-injects on page load)
    waitForEditorContext(5000).then((context) => {
      if (context?.token) {
        console.log('[CollectionsEditor] Got editor token')
        setEditorToken(context.token)
      } else {
        console.warn('[CollectionsEditor] No editor token available')
      }
    })
  }, [])

  const loadCollections = async () => {
    setIsLoading(true)
    try {
      // Build URL with optional aspect ratio filter for trending
      let url = `/api/editor/collections?userId=${userId}&label=${collectionLabel}`
      if (aspectRatioFilter) {
        url += `&aspectRatio=${aspectRatioFilter === 'small' ? '3:2' : '5:6'}`
      }
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        console.log('[CollectionsEditor] Loaded collections:', data.collections?.length, 'aspectRatioFilter:', aspectRatioFilter)
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

    let tokenToUse = editorToken
    if (!tokenToUse) {
      // Try one more time to get the token
      const context = await waitForEditorContext(3000)
      if (context?.token) {
        tokenToUse = context.token
        setEditorToken(context.token)
      } else {
        alert('Editor session not found. Please reload the page from the app.')
        return
      }
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
          editorToken: tokenToUse,
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
      
      // If ACTIVE slots are full and this is a new collection, show replace modal
      // Only show replace modal for ACTIVE collections
      const currentActiveCount = collections.filter(c => c.is_active).length
      if (!editingCollection && effectiveMaxItems && currentActiveCount >= effectiveMaxItems) {
        setPendingNewCollection({ name: nameToSave, imageUrl: imageUrl || '' })
        setShowReplaceModal(true)
        setIsSaving(false)
        return
      }

      const method = editingCollection ? 'PUT' : 'POST'
      
      // Determine aspect ratio for trending collections
      let aspectRatioValue: string | undefined
      if (collectionLabel === 'trending' && aspectRatioFilter) {
        aspectRatioValue = aspectRatioFilter === 'small' ? '3:2' : '5:6'
      }
      
      const body = editingCollection 
        ? {
            id: editingCollection.id,
            userId,
            name: nameToSave,
            imageUrl,
            collectionLabel,
            ...(aspectRatioValue && { aspectRatio: aspectRatioValue }),
          }
        : {
            userId,
            name: nameToSave,
            imageUrl,
            collectionLabel,
            displayOrder: collections.length,
            ...(aspectRatioValue && { aspectRatio: aspectRatioValue }),
          }

      console.log('[CollectionsEditor] Saving collection:', { method, body: { ...body, imageUrl: body.imageUrl?.substring(0, 50) } })

      const response = await fetch('/api/editor/collections', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      console.log('[CollectionsEditor] Save response status:', response.status)

      if (response.ok) {
        const result = await response.json()
        console.log('[CollectionsEditor] Save successful:', result)
        alert(editingCollection ? 'Collection updated!' : 'Collection added!')
        resetForm()
        setShowReplaceModal(false)
        setPendingNewCollection(null)
        loadCollections()
      } else {
        const errorData = await response.json()
        console.error('[CollectionsEditor] Save failed:', errorData)
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
    setMenuPosition(null)
  }

  const handleMenuToggle = (collectionId: string) => {
    if (openMenuId === collectionId) {
      setOpenMenuId(null)
      setMenuPosition(null)
    } else {
      const button = menuButtonRefs.current.get(collectionId)
      if (button) {
        const rect = button.getBoundingClientRect()
        setMenuPosition({
          top: rect.top,
          left: rect.left - 192 + rect.width // 192px = w-48 menu width
        })
      }
      setOpenMenuId(collectionId)
    }
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openMenuId && !(e.target as Element).closest('.dropdown-menu')) {
        setOpenMenuId(null)
        setMenuPosition(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openMenuId])

  const resetForm = () => {
    setShowAddForm(false)
    setEditingCollection(null)
    setCollectionName('')
    setGeneratedImage(null)
    setUploadedImage(null)
    setUploadedImagePreview(null)
    setBannerSource('generate')
    setShowReplaceModal(false)
    setPendingNewCollection(null)
  }

  // Handle replacing an existing collection when slots are full
  // This deactivates the old collection instead of deleting it
  const handleReplaceCollection = async (collectionToReplace: Collection) => {
    if (!pendingNewCollection) return
    
    try {
      // Deactivate the old collection (don't delete it)
      await fetch('/api/editor/collections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: collectionToReplace.id,
          userId,
          isActive: false,
        }),
      })
      
      // Now save the new collection
      let aspectRatioValue: string | undefined
      if (collectionLabel === 'trending' && aspectRatioFilter) {
        aspectRatioValue = aspectRatioFilter === 'small' ? '3:2' : '5:6'
      }
      
      const response = await fetch('/api/editor/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name: pendingNewCollection.name,
          imageUrl: pendingNewCollection.imageUrl,
          collectionLabel,
          displayOrder: collectionToReplace.display_order,
          ...(aspectRatioValue && { aspectRatio: aspectRatioValue }),
        }),
      })
      
      if (response.ok) {
        alert('Collection replaced successfully!')
        resetForm()
        loadCollections()
      } else {
        alert('Failed to replace collection')
      }
    } catch (error) {
      console.error('Error replacing collection:', error)
      alert('Error replacing collection')
    }
  }

  // Handle activating an inactive collection by replacing an active one
  const handleActivateAndReplace = async (inactiveCollection: Collection, activeToReplace: Collection) => {
    try {
      // Deactivate the currently active one
      await fetch('/api/editor/collections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeToReplace.id,
          userId,
          isActive: false,
        }),
      })
      
      // Activate the previously inactive one
      const response = await fetch('/api/editor/collections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: inactiveCollection.id,
          userId,
          isActive: true,
          displayOrder: activeToReplace.display_order,
        }),
      })
      
      if (response.ok) {
        alert('Collection activated!')
        setOpenMenuId(null)
        setMenuPosition(null)
        setShowReplaceActiveModal(false)
        setCollectionToActivate(null)
        loadCollections()
      } else {
        alert('Failed to activate collection')
      }
    } catch (error) {
      console.error('Error activating collection:', error)
      alert('Error activating collection')
    }
  }

  // For trending with aspectRatioFilter, max is 2 slots per size
  const effectiveMaxItems = aspectRatioFilter ? 2 : maxItems
  
  // Count only ACTIVE collections for slot calculation
  const activeCollections = collections.filter(c => c.is_active)
  const inactiveCollections = collections.filter(c => !c.is_active)
  const activeSlotsFull = effectiveMaxItems ? activeCollections.length >= effectiveMaxItems : false
  const canAddMore = true // Always allow adding, will show replace modal if slots full
  
  // State for replace active modal (when activating an inactive collection)
  const [showReplaceActiveModal, setShowReplaceActiveModal] = useState(false)
  const [collectionToActivate, setCollectionToActivate] = useState<Collection | null>(null)

  return (
    <div className={cn("min-h-screen py-8", isDark ? "bg-[#080808]" : "bg-gray-50")}>
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className={cn("p-2 rounded-full", isDark ? "hover:bg-white/10 text-white" : "hover:bg-gray-100")}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-black")}>{title}</h1>
              <p className={cn("text-sm mt-1", isDark ? "text-gray-400" : "text-gray-500")}>{description}</p>
            </div>
          </div>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {collectionLabel === 'category' ? 'Add Category' : 'Add Collection'}
            </button>
          )}
        </div>

        {/* Info Banner */}
        {effectiveMaxItems && (
          <div className={cn(
            'mb-6 p-4 rounded-lg border',
            collections.length >= effectiveMaxItems 
              ? 'bg-orange-50 border-orange-200' 
              : 'bg-blue-50 border-blue-200'
          )}>
            <p className={cn(
              'text-sm',
              collections.length >= effectiveMaxItems ? 'text-orange-800' : 'text-blue-800'
            )}>
              {collections.length} of {effectiveMaxItems} slots used. Aspect ratio: {aspectRatio}
              {collections.length >= effectiveMaxItems && ' - Add new to replace existing'}
            </p>
          </div>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className={cn("rounded-xl shadow-lg border-2 p-6 mb-8", isDark ? "bg-zinc-900 border-amber-500/50" : "bg-white border-amber-200")}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={cn("text-xl font-bold", isDark ? "text-white" : "text-black")}>
                {editingCollection 
                  ? `Edit: ${editingCollection.name}` 
                  : collectionLabel === 'category' ? 'Add New Category' : 'Add New Collection'}
              </h2>
              <button onClick={resetForm} className={cn("p-1 rounded", isDark ? "hover:bg-white/10 text-white" : "hover:bg-gray-100")}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Collection Name */}
            {!editingCollection && (
              <div className="mb-6">
                <label className={cn("block text-sm font-medium mb-2", isDark ? "text-gray-300" : "text-gray-700")}>
                  Collection Name *
                </label>
                <input
                  type="text"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  placeholder="e.g., Summer Collection, Wedding Specials"
                  className={cn("w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent", isDark ? "bg-zinc-800 border-zinc-700 text-white placeholder-gray-500" : "border-gray-300")}
                />
              </div>
            )}
            
            {/* Image Section */}
            <div className="mb-4">
              <h3 className={cn("font-semibold", isDark ? "text-white" : "text-gray-900")}>Collection Banner</h3>
              <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>Required aspect ratio: {aspectRatio}</p>
            </div>

            {/* Banner Source Tabs */}
            <div className="flex gap-4 mb-6">
              {showAIGeneration && (
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
              )}
              <label className={showAIGeneration ? "flex-1" : "w-full"}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className={cn(
                  "w-full py-3 rounded-lg font-semibold cursor-pointer flex items-center justify-center",
                  showAIGeneration 
                    ? "border-2 border-amber-500 text-amber-700 hover:bg-amber-50"
                    : "bg-amber-500 hover:bg-amber-600 text-white"
                )}>
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
          <div className={cn("text-center py-16 rounded-xl", isDark ? "bg-zinc-900" : "bg-gray-100")}>
            <ImageIcon className={cn("w-12 h-12 mx-auto mb-4", isDark ? "text-gray-600" : "text-gray-400")} />
            <p className={cn("mb-4", isDark ? "text-gray-400" : "text-gray-500")}>
              {collectionLabel === 'category' ? 'No categories yet' : 'No collections yet'}
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              {collectionLabel === 'category' ? 'Add Your First Category' : 'Add Your First Collection'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Active collections first, then inactive */}
            {[...activeCollections, ...inactiveCollections].map((collection) => (
              <div 
                key={collection.id} 
                className={cn(
                  "rounded-xl border shadow-sm flex items-center overflow-hidden transition-all",
                  collection.is_active
                    ? isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-gray-200"
                    : isDark ? "bg-zinc-900/50 border-dashed border-zinc-700 opacity-70" : "bg-gray-50 border-dashed border-gray-300 opacity-70"
                )}
              >
                {/* Image thumbnail */}
                <div className={cn(
                  "relative w-28 h-20 flex-shrink-0",
                  collection.is_active ? isDark ? "bg-zinc-800" : "bg-gray-100" : isDark ? "bg-zinc-800" : "bg-gray-200"
                )}>
                  {collection.image_url ? (
                    <Image
                      src={getImageUrl(collection.image_url)}
                      alt={collection.name}
                      fill
                      className={cn("object-cover", !collection.is_active && "grayscale")}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className={cn("w-8 h-8", isDark ? "text-gray-600" : "text-gray-300")} />
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 px-4 py-2">
                  <h3 className={cn(
                    "font-semibold",
                    collection.is_active ? isDark ? "text-white" : "text-gray-900" : isDark ? "text-gray-400" : "text-gray-500"
                  )}>{collection.name}</h3>
                  <span className={cn(
                    'inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded',
                    collection.is_active
                      ? isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-50 text-green-700'
                      : isDark ? 'bg-amber-900/50 text-amber-400' : 'bg-amber-50 text-amber-700'
                  )}>
                    {collection.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                {/* Menu */}
                <div className="px-4">
                  <button
                    ref={(el) => {
                      if (el) menuButtonRefs.current.set(collection.id, el)
                      else menuButtonRefs.current.delete(collection.id)
                    }}
                    onClick={() => handleMenuToggle(collection.id)}
                    className={cn("p-2 rounded-full", isDark ? "hover:bg-white/10" : "hover:bg-gray-100")}
                  >
                    <MoreVertical className={cn("w-5 h-5", isDark ? "text-gray-400" : "text-gray-500")} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Replace Collection Modal - for new collection replacing an active one */}
        {showReplaceModal && pendingNewCollection && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
              <h3 className="text-xl font-bold mb-2">Replace Existing Collection</h3>
              <p className="text-gray-600 mb-4">
                All {effectiveMaxItems} active slots are filled. Choose which active collection to replace with "{pendingNewCollection.name}":
              </p>
              <p className="text-sm text-amber-600 mb-4">
                The replaced collection will be deactivated but kept in your list.
              </p>
              
              <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                {activeCollections.map((collection) => (
                  <button
                    key={collection.id}
                    onClick={() => handleReplaceCollection(collection)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-amber-500 hover:bg-amber-50 transition-colors"
                  >
                    <div className="relative w-16 h-12 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                      {collection.image_url ? (
                        <Image
                          src={getImageUrl(collection.image_url)}
                          alt={collection.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <span className="font-medium text-gray-900">{collection.name}</span>
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => {
                  setShowReplaceModal(false)
                  setPendingNewCollection(null)
                }}
                className="w-full py-2 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Replace Active Modal - for activating an inactive collection */}
        {showReplaceActiveModal && collectionToActivate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
              <h3 className="text-xl font-bold mb-2">Activate Collection</h3>
              <p className="text-gray-600 mb-4">
                Choose which active collection to replace with "{collectionToActivate.name}":
              </p>
              <p className="text-sm text-amber-600 mb-4">
                The replaced collection will be deactivated but kept in your list.
              </p>
              
              <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                {activeCollections.map((collection) => (
                  <button
                    key={collection.id}
                    onClick={() => handleActivateAndReplace(collectionToActivate, collection)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-amber-500 hover:bg-amber-50 transition-colors"
                  >
                    <div className="relative w-16 h-12 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                      {collection.image_url ? (
                        <Image
                          src={getImageUrl(collection.image_url)}
                          alt={collection.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <span className="font-medium text-gray-900">{collection.name}</span>
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => {
                  setShowReplaceActiveModal(false)
                  setCollectionToActivate(null)
                }}
                className="w-full py-2 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Dropdown Menu Portal - renders outside overflow container */}
        {openMenuId && menuPosition && typeof window !== 'undefined' && createPortal(
          <div 
            className="dropdown-menu fixed w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50"
            style={{
              top: `${menuPosition.top - (collections.find(c => c.id === openMenuId)?.is_active === false && activeSlotsFull ? 160 : 120)}px`,
              left: `${menuPosition.left}px`,
            }}
          >
            <button
              onClick={() => {
                const collection = collections.find(c => c.id === openMenuId)
                if (collection) handleEditImage(collection)
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
            >
              <ImageIcon className="w-4 h-4" />
              Change Image
            </button>
            
            {/* For inactive collections when slots are full, show Replace button */}
            {(() => {
              const collection = collections.find(c => c.id === openMenuId)
              if (collection && !collection.is_active && activeSlotsFull) {
                return (
                  <button
                    onClick={() => {
                      setCollectionToActivate(collection)
                      setShowReplaceActiveModal(true)
                      setOpenMenuId(null)
                      setMenuPosition(null)
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-amber-600"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Replace Active
                  </button>
                )
              }
              return null
            })()}
            
            <button
              onClick={() => {
                const collection = collections.find(c => c.id === openMenuId)
                if (collection) {
                  // If inactive and slots are full, show replace modal instead of just activating
                  if (!collection.is_active && activeSlotsFull) {
                    setCollectionToActivate(collection)
                    setShowReplaceActiveModal(true)
                    setOpenMenuId(null)
                    setMenuPosition(null)
                  } else {
                    handleToggleVisibility(collection)
                  }
                }
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
            >
              {collections.find(c => c.id === openMenuId)?.is_active ? (
                <><EyeOff className="w-4 h-4" /> Hide</>
              ) : (
                <><Eye className="w-4 h-4" /> {activeSlotsFull ? 'Activate (Replace)' : 'Show'}</>
              )}
            </button>
            <button
              onClick={() => {
                const collection = collections.find(c => c.id === openMenuId)
                if (collection) handleDeleteCollection(collection)
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-red-600"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>,
          document.body
        )}
      </div>
    </div>
  )
}
 