'use client'

import { useState, useEffect } from 'react'
import { Pencil, Save, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEditor } from '@/components/editor/EditorProvider'

interface EditableStaticPageProps {
  userId: string
  slug: string
  initialTitle: string
  initialContent: string
  isDark: boolean
}

export default function EditableStaticPage({
  userId,
  slug,
  initialTitle,
  initialContent,
  isDark,
}: EditableStaticPageProps) {
  const { isEditorMode } = useEditor()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [editTitle, setEditTitle] = useState(initialTitle)
  const [editContent, setEditContent] = useState(initialContent)

  useEffect(() => {
    setTitle(initialTitle)
    setContent(initialContent)
    setEditTitle(initialTitle)
    setEditContent(initialContent)
  }, [initialTitle, initialContent])

  const handleEdit = () => {
    setEditTitle(title)
    setEditContent(content)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setEditTitle(title)
    setEditContent(content)
    setIsEditing(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/editor/pages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          slug,
          title: editTitle,
          content: editContent,
        }),
      })

      if (response.ok) {
        setTitle(editTitle)
        setContent(editContent)
        setIsEditing(false)
      } else {
        const data = await response.json()
        alert(`Error saving: ${data.error}`)
      }
    } catch (error) {
      console.error('Error saving page:', error)
      alert('Error saving page')
    } finally {
      setIsSaving(false)
    }
  }

  if (isEditing) {
    return (
      <div className={`min-h-screen py-16 px-6 ${isDark ? 'bg-[#080808]' : 'bg-offwhite'}`}>
        <div className="max-w-3xl mx-auto">
          {/* Edit Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
              Editing Page
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
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Page Content
            </label>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={20}
              className={cn(
                'w-full px-4 py-3 rounded-lg border font-mono text-sm',
                isDark
                  ? 'bg-gray-900 border-gray-700 text-white'
                  : 'bg-white border-gray-300 text-black'
              )}
            />
          </div>

          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Tip: Use line breaks to separate paragraphs. The content will be displayed with preserved formatting.
          </p>
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

      <div className="max-w-3xl mx-auto">
        <h1 className={`font-display text-3xl md:text-4xl font-bold mb-8 ${isDark ? 'text-white' : 'text-black'}`}>
          {title}
        </h1>
        <div className={`whitespace-pre-wrap leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          {content}
        </div>
      </div>
    </div>
  )
}
