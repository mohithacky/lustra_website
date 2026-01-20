'use client'

import { useState, useEffect } from 'react'
import { Pencil, Save, X, Loader2, MapPin, Phone, Mail, Clock, Upload, Trash2, Plus } from 'lucide-react'
import Image from 'next/image'
import { cn, getImageUrl } from '@/lib/utils'
import { useEditor } from '@/components/editor/EditorProvider'

interface EditableOurShopPageProps {
  userId: string
  user: {
    id: string
    shop_name: string | null
    shop_address: string | null
    phone_number: string | null
    email: string | null
    logo_url: string | null
  }
  initialTitle: string
  initialContent: string
  isDark: boolean
  businessHours?: Array<{
    day: string
    openTime: string
    closeTime: string
    isClosed: boolean
  }>
}

interface ShopPhoto {
  id: string
  url: string
  caption?: string
}

export default function EditableOurShopPage({
  userId,
  user,
  initialTitle,
  initialContent,
  isDark,
  businessHours = [],
}: EditableOurShopPageProps) {
  const { isEditorMode } = useEditor()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [editTitle, setEditTitle] = useState(initialTitle)
  const [editContent, setEditContent] = useState(initialContent)
  const [photos, setPhotos] = useState<ShopPhoto[]>([])
  const [editPhotos, setEditPhotos] = useState<ShopPhoto[]>([])
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)

  useEffect(() => {
    setTitle(initialTitle)
    setContent(initialContent)
    setEditTitle(initialTitle)
    setEditContent(initialContent)
    loadPhotos()
  }, [initialTitle, initialContent])

  const loadPhotos = async () => {
    try {
      const response = await fetch(`/api/editor/shop-photos?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setPhotos(data.photos || [])
        setEditPhotos(data.photos || [])
      }
    } catch (error) {
      console.error('Error loading photos:', error)
    }
  }

  const handleEdit = () => {
    setEditTitle(title)
    setEditContent(content)
    setEditPhotos([...photos])
    setIsEditing(true)
  }

  const handleCancel = () => {
    setEditTitle(title)
    setEditContent(content)
    setEditPhotos([...photos])
    setIsEditing(false)
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', userId)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        const newPhoto: ShopPhoto = {
          id: Date.now().toString(),
          url: data.url,
          caption: '',
        }
        setEditPhotos([...editPhotos, newPhoto])
      } else {
        alert('Failed to upload photo')
      }
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('Error uploading photo')
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handleDeletePhoto = (photoId: string) => {
    setEditPhotos(editPhotos.filter(p => p.id !== photoId))
  }

  const handleUpdateCaption = (photoId: string, caption: string) => {
    setEditPhotos(editPhotos.map(p => p.id === photoId ? { ...p, caption } : p))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Save page content
      const pageResponse = await fetch('/api/editor/pages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          slug: 'our-shop',
          title: editTitle,
          content: editContent,
        }),
      })

      // Save photos
      const photosResponse = await fetch('/api/editor/shop-photos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          photos: editPhotos,
        }),
      })

      if (pageResponse.ok && photosResponse.ok) {
        setTitle(editTitle)
        setContent(editContent)
        setPhotos(editPhotos)
        setIsEditing(false)
        alert('Shop page saved successfully! Refresh to see changes.')
      } else {
        alert('Error saving shop page')
      }
    } catch (error) {
      console.error('Error saving:', error)
      alert('Error saving shop page')
    } finally {
      setIsSaving(false)
    }
  }

  if (isEditing) {
    return (
      <div className={`min-h-screen py-16 px-6 ${isDark ? 'bg-[#080808]' : 'bg-offwhite'}`}>
        <div className="max-w-4xl mx-auto">
          {/* Edit Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
              Editing Our Shop Page
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Changes
              </button>
            </div>
          </div>

          {/* Title Input */}
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Page Title
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className={cn(
                'w-full px-4 py-3 rounded-lg border text-lg font-semibold',
                isDark
                  ? 'bg-gray-900 border-gray-700 text-white'
                  : 'bg-white border-gray-300 text-black'
              )}
            />
          </div>

          {/* Content Textarea */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Page Content
            </label>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={10}
              className={cn(
                'w-full px-4 py-3 rounded-lg border font-mono text-sm',
                isDark
                  ? 'bg-gray-900 border-gray-700 text-white'
                  : 'bg-white border-gray-300 text-black'
              )}
            />
          </div>

          {/* Shop Photos Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Shop Photos
              </label>
              <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white cursor-pointer">
                {isUploadingPhoto ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Add Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={isUploadingPhoto}
                  className="hidden"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {editPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className={cn(
                    'rounded-lg border overflow-hidden',
                    isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'
                  )}
                >
                  <div className="relative h-48">
                    <Image
                      src={getImageUrl(photo.url)}
                      alt={photo.caption || 'Shop photo'}
                      fill
                      className="object-cover"
                    />
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 rounded-full text-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-3">
                    <input
                      type="text"
                      value={photo.caption || ''}
                      onChange={(e) => handleUpdateCaption(photo.id, e.target.value)}
                      placeholder="Add caption..."
                      className={cn(
                        'w-full px-3 py-2 rounded border text-sm',
                        isDark
                          ? 'bg-gray-800 border-gray-600 text-white'
                          : 'bg-gray-50 border-gray-200 text-black'
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>

            {editPhotos.length === 0 && (
              <p className={`text-sm italic ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                No photos added yet. Click "Add Photo" to upload shop photos.
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen py-16 px-6 ${isDark ? 'bg-[#080808]' : 'bg-offwhite'} relative`}>
      {/* Edit Button - Only show in editor mode */}
      {isEditorMode && (
        <button
          onClick={handleEdit}
          className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-2 bg-white/90 hover:bg-white rounded-full shadow-lg border border-gray-200 transition-all hover:scale-105"
          title="Edit Page"
        >
          <Pencil className="w-4 h-4 text-gray-700" />
          <span className="text-sm font-medium text-gray-700">Edit Page</span>
        </button>
      )}

      <div className="max-w-4xl mx-auto">
        <h1 className={`font-display text-3xl md:text-4xl font-bold mb-8 text-center ${isDark ? 'text-white' : 'text-black'}`}>
          {title}
        </h1>

        {/* Shop Photos Gallery */}
        {photos.length > 0 && (
          <div className="mb-12">
            <h2 className={`font-display text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-black'}`}>
              Gallery
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className={cn(
                    'rounded-2xl overflow-hidden',
                    isDark ? 'bg-zinc-900' : 'bg-white shadow-lg'
                  )}
                >
                  <div className="relative h-64">
                    <Image
                      src={getImageUrl(photo.url)}
                      alt={photo.caption || 'Shop photo'}
                      fill
                      className="object-cover"
                    />
                  </div>
                  {photo.caption && (
                    <div className="p-4">
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {photo.caption}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shop Info */}
        <div className={`rounded-2xl p-8 ${isDark ? 'bg-zinc-900' : 'bg-white shadow-lg'}`}>
          <h2 className={`font-display text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-black'}`}>
            {user.shop_name}
          </h2>

          {/* Custom Content */}
          {content && (
            <div className={`whitespace-pre-wrap leading-relaxed mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {content}
            </div>
          )}

          <div className="space-y-4">
            {user.shop_address && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gold-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>Address</p>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{user.shop_address}</p>
                </div>
              </div>
            )}

            {user.phone_number && (
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gold-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>Phone</p>
                  <a href={`tel:${user.phone_number}`} className="text-gold-500 hover:underline">
                    {user.phone_number}
                  </a>
                </div>
              </div>
            )}

            {user.email && (
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gold-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>Email</p>
                  <a href={`mailto:${user.email}`} className="text-gold-500 hover:underline">
                    {user.email}
                  </a>
                </div>
              </div>
            )}

            {businessHours.length > 0 && (
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gold-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>Hours</p>
                  {businessHours.map((hours, index) => (
                    <p key={index} className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                      {hours.isClosed 
                        ? `${hours.day}: Closed`
                        : `${hours.day}: ${hours.openTime} - ${hours.closeTime}`
                      }
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
