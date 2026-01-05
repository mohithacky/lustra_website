'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { cn, getImageUrl } from '@/lib/utils'
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, Upload, Sparkles } from 'lucide-react'
import { useEditor } from '@/contexts/EditorContext'

interface Collection {
  id: string
  name: string
  banner_url: string | null
  display_order: number
}

const BACKEND_URL = 'https://api-5sqqk2n6ra-uc.a.run.app'

export default function ManageCollectionsPage() {
  const router = useRouter()
  const { canEditCollections, editorData } = useEditor()
  
  const [heroCollections, setHeroCollections] = useState<Collection[]>([])
  const [trendingCollections, setTrendingCollections] = useState<Collection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'hero' | 'trending'>('hero')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)
  const [formName, setFormName] = useState('')
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
      // Load hero collections
      const heroRes = await fetch(`${BACKEND_URL}/collections/hero/${shopId}`)
      if (heroRes.ok) {
        const heroData = await heroRes.json()
        setHeroCollections(heroData.collections || [])
      }

      // Load trending collections
      const trendingRes = await fetch(`${BACKEND_URL}/collections/trending/${shopId}`)
      if (trendingRes.ok) {
        const trendingData = await trendingRes.json()
        setTrendingCollections(trendingData.collections || [])
      }
    } catch (e) {
      console.error('Error loading collections:', e)
    } finally {
      setIsLoading(false)
    }
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
    if (!formName.trim()) {
      alert('Please enter a collection name first')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch(`${BACKEND_URL}/generate-collection-banner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${editorData?.token}`,
        },
        body: JSON.stringify({
          collectionName: formName,
          type: activeTab,
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

  const handleSave = async () => {
    if (!formName.trim()) {
      alert('Please enter a collection name')
      return
    }

    setIsSaving(true)
    try {
      const formData = new FormData()
      formData.append('name', formName)
      formData.append('type', activeTab)
      if (formImage) {
        formData.append('banner', formImage)
      } else if (formImagePreview) {
        formData.append('bannerUrl', formImagePreview)
      }

      const url = editingCollection
        ? `${BACKEND_URL}/collections/${activeTab}/${shopId}/${editingCollection.id}`
        : `${BACKEND_URL}/collections/${activeTab}/${shopId}`

      const response = await fetch(url, {
        method: editingCollection ? 'PUT' : 'POST',
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

  const handleDelete = async (collection: Collection) => {
    if (!confirm(`Are you sure you want to delete "${collection.name}"?`)) return

    try {
      const response = await fetch(
        `${BACKEND_URL}/collections/${activeTab}/${shopId}/${collection.id}`,
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

  const startEdit = (collection: Collection) => {
    setEditingCollection(collection)
    setFormName(collection.name)
    setFormImagePreview(collection.banner_url)
    setShowAddForm(true)
  }

  const resetForm = () => {
    setShowAddForm(false)
    setEditingCollection(null)
    setFormName('')
    setFormImage(null)
    setFormImagePreview(null)
  }

  const collections = activeTab === 'hero' ? heroCollections : trendingCollections

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
          <h1 className="text-xl font-semibold">Manage Collections</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setActiveTab('hero'); resetForm() }}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors',
              activeTab === 'hero'
                ? 'bg-gold-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            )}
          >
            Hero Collections
          </button>
          <button
            onClick={() => { setActiveTab('trending'); resetForm() }}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors',
              activeTab === 'trending'
                ? 'bg-gold-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            )}
          >
            Trending Collections
          </button>
        </div>

        {/* Add Button */}
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full mb-6 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-gold-500 hover:text-gold-500 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add New {activeTab === 'hero' ? 'Hero' : 'Trending'} Collection
          </button>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">
              {editingCollection ? 'Edit Collection' : 'Add New Collection'}
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
                  placeholder="Enter collection name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Banner Image
                </label>
                
                {formImagePreview ? (
                  <div className="relative aspect-video rounded-lg overflow-hidden mb-2">
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
                <button
                  onClick={handleSave}
                  disabled={isSaving || !formName.trim()}
                  className="flex-1 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingCollection ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Collections List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            No {activeTab} collections yet. Add your first one!
          </div>
        ) : (
          <div className="grid gap-4">
            {collections.map((collection) => (
              <div
                key={collection.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm flex"
              >
                <div className="relative w-32 h-24 flex-shrink-0">
                  <Image
                    src={getImageUrl(collection.banner_url)}
                    alt={collection.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 p-4 flex items-center justify-between">
                  <h3 className="font-medium">{collection.name}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(collection)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <Pencil className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(collection)}
                      className="p-2 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
