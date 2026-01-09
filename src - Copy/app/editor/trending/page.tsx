'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { cn, getImageUrl } from '@/lib/utils'
import { ArrowLeft, Pencil, Loader2, Upload, Sparkles, Trash2 } from 'lucide-react'
import { useEditor } from '@/contexts/EditorContext'

interface TrendingCollection {
  id: string
  name: string
  label: string
  image_url: string | null
  position: number
  aspect_ratio: string
}

const BACKEND_URL = 'https://api-5sqqk2n6ra-uc.a.run.app'

// Aspect ratios for trending grid positions
const POSITION_ASPECT_RATIOS: Record<number, string> = {
  0: '3:2',  // Top left - landscape
  1: '5:6',  // Top right - portrait
  2: '5:6',  // Bottom left - portrait
  3: '3:2',  // Bottom right - landscape
}

export default function EditTrendingCollectionsPage() {
  const router = useRouter()
  const { canEditCollections, editorData } = useEditor()
  
  const [collections, setCollections] = useState<TrendingCollection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingPosition, setEditingPosition] = useState<number | null>(null)
  const [formName, setFormName] = useState('')
  const [formLabel, setFormLabel] = useState('')
  const [formImage, setFormImage] = useState<File | null>(null)
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const shopId = editorData?.websiteId || ''

  useEffect(() => {
    if (!canEditCollections) {
      router.push('/')
      return
    }
    loadCollections()
  }, [canEditCollections, shopId])

  const loadCollections = async () => {
    if (!shopId) return
    setIsLoading(true)
    
    try {
      const response = await fetch(`${BACKEND_URL}/collections/trending/${shopId}`)
      if (response.ok) {
        const data = await response.json()
        setCollections(data.collections || [])
      }
    } catch (e) {
      console.error('Error loading collections:', e)
    } finally {
      setIsLoading(false)
    }
  }

  const getCollectionAtPosition = (position: number): TrendingCollection | undefined => {
    return collections.find(c => c.position === position)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGenerateImage = async () => {
    if (!formName.trim() || editingPosition === null) {
      alert('Please enter a collection name first')
      return
    }

    setIsGenerating(true)
    try {
      const aspectRatio = POSITION_ASPECT_RATIOS[editingPosition]
      const response = await fetch(`${BACKEND_URL}/generate-collection-banner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${editorData?.token}`,
        },
        body: JSON.stringify({
          collectionName: formName,
          type: 'trending',
          aspectRatio,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setFormImagePreview(data.imageUrl)
      } else {
        alert('Failed to generate image')
      }
    } catch (e) {
      console.error('Error generating image:', e)
      alert('Failed to generate image')
    } finally {
      setIsGenerating(false)
    }
  }

  const startEdit = (position: number) => {
    const existing = getCollectionAtPosition(position)
    setEditingPosition(position)
    if (existing) {
      setFormName(existing.name)
      setFormLabel(existing.label)
      setFormImagePreview(existing.image_url)
    } else {
      setFormName('')
      setFormLabel('')
      setFormImagePreview(null)
    }
    setFormImage(null)
  }

  const resetForm = () => {
    setEditingPosition(null)
    setFormName('')
    setFormLabel('')
    setFormImage(null)
    setFormImagePreview(null)
  }

  const handleSave = async () => {
    if (!formName.trim() || editingPosition === null) {
      alert('Please enter a collection name')
      return
    }

    setIsSaving(true)
    try {
      const existing = getCollectionAtPosition(editingPosition)
      const formData = new FormData()
      formData.append('name', formName)
      formData.append('label', formLabel || formName)
      formData.append('position', String(editingPosition))
      formData.append('aspectRatio', POSITION_ASPECT_RATIOS[editingPosition])
      
      if (formImage) {
        formData.append('image', formImage)
      } else if (formImagePreview) {
        formData.append('imageUrl', formImagePreview)
      }

      const url = existing
        ? `${BACKEND_URL}/collections/trending/${shopId}/${existing.id}`
        : `${BACKEND_URL}/collections/trending/${shopId}`

      const response = await fetch(url, {
        method: existing ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${editorData?.token}`,
        },
        body: formData,
      })

      if (response.ok) {
        resetForm()
        loadCollections()
      } else {
        alert('Failed to save collection')
      }
    } catch (e) {
      console.error('Error saving collection:', e)
      alert('Failed to save collection')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (position: number) => {
    const collection = getCollectionAtPosition(position)
    if (!collection) return
    
    if (!confirm(`Are you sure you want to delete "${collection.name}"?`)) return

    try {
      const response = await fetch(
        `${BACKEND_URL}/collections/trending/${shopId}/${collection.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${editorData?.token}`,
          },
        }
      )

      if (response.ok) {
        loadCollections()
      } else {
        alert('Failed to delete collection')
      }
    } catch (e) {
      console.error('Error deleting collection:', e)
      alert('Failed to delete collection')
    }
  }

  if (!canEditCollections) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold">Edit Trending Collections</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <p className="text-gray-600 mb-6">
          Configure the 4-box trending collections grid shown on your homepage. 
          Click any box to edit or add a collection.
        </p>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
          </div>
        ) : editingPosition !== null ? (
          /* Edit Form */
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">
              Edit Position {editingPosition + 1} ({POSITION_ASPECT_RATIOS[editingPosition]} aspect ratio)
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Collection Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  placeholder="e.g., Summer Collection"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Label (shown on image)
                </label>
                <input
                  type="text"
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  placeholder="e.g., SUMMER"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image
                </label>
                
                {formImagePreview ? (
                  <div className={cn(
                    "relative rounded-lg overflow-hidden mb-2",
                    POSITION_ASPECT_RATIOS[editingPosition] === '3:2' ? 'aspect-[3/2]' : 'aspect-[5/6]'
                  )}>
                    <Image
                      src={formImagePreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                    <button
                      onClick={() => { setFormImage(null); setFormImagePreview(null) }}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <label className="flex-1 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gold-500 transition-colors flex flex-col items-center justify-center gap-2">
                      <Upload className="w-8 h-8 text-gray-400" />
                      <span className="text-sm text-gray-500">Upload Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    <button
                      onClick={handleGenerateImage}
                      disabled={isGenerating || !formName.trim()}
                      className="flex-1 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-gold-500 transition-colors flex flex-col items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
                      ) : (
                        <Sparkles className="w-8 h-8 text-gray-400" />
                      )}
                      <span className="text-sm text-gray-500">
                        {isGenerating ? 'Generating...' : 'Generate with AI'}
                      </span>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={resetForm}
                  className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                {getCollectionAtPosition(editingPosition) && (
                  <button
                    onClick={() => handleDelete(editingPosition)}
                    className="py-2 px-4 border border-red-300 text-red-500 rounded-lg hover:bg-red-50"
                  >
                    Delete
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={isSaving || !formName.trim()}
                  className="flex-1 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Grid Preview */
          <div className="grid grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((position) => {
              const collection = getCollectionAtPosition(position)
              const aspectRatio = POSITION_ASPECT_RATIOS[position]
              const isPortrait = aspectRatio === '5:6'
              
              return (
                <div
                  key={position}
                  onClick={() => startEdit(position)}
                  className={cn(
                    "relative rounded-xl overflow-hidden cursor-pointer group",
                    isPortrait ? 'aspect-[5/6]' : 'aspect-[3/2]',
                    !collection && 'border-2 border-dashed border-gray-300 bg-gray-100'
                  )}
                >
                  {collection ? (
                    <>
                      <Image
                        src={getImageUrl(collection.image_url)}
                        alt={collection.name}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-4 left-4">
                        <p className="text-white text-xl font-bold">
                          {collection.label || collection.name}
                        </p>
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 bg-white rounded-full shadow-md">
                          <Pencil className="w-4 h-4 text-gray-700" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                      <Pencil className="w-8 h-8 mb-2" />
                      <span className="text-sm">Click to add</span>
                      <span className="text-xs mt-1">Position {position + 1}</span>
                      <span className="text-xs">({aspectRatio})</span>
                    </div>
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
