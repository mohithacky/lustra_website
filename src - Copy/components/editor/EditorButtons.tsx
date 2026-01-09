'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Edit, Plus } from 'lucide-react'
import { isInEditorMode, canEditCollections, canEditSections, waitForEditorContext, logEditorContext } from '@/lib/editor-context'
import { cn } from '@/lib/utils'

interface EditorButtonsProps {
  shopDomain: string
  isDark: boolean
}

export default function EditorButtons({ shopDomain, isDark }: EditorButtonsProps) {
  const router = useRouter()
  const [isEditor, setIsEditor] = useState(false)
  const [canEditColl, setCanEditColl] = useState(false)
  const [canEditSect, setCanEditSect] = useState(false)

  useEffect(() => {
    // Wait for editor context to be injected
    waitForEditorContext(3000).then((context) => {
      if (context) {
        logEditorContext()
        setIsEditor(isInEditorMode())
        setCanEditColl(canEditCollections())
        setCanEditSect(canEditSections())
      }
    })
  }, [])

  if (!isEditor) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {canEditColl && (
        <>
          {/* Add Collection Button */}
          <button
            onClick={() => router.push(`/editor/collections/add`)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all hover:scale-105',
              isDark 
                ? 'bg-gold-500 hover:bg-gold-600 text-white' 
                : 'bg-gold-500 hover:bg-gold-600 text-white'
            )}
            title="Add Collection"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">Add Collection</span>
          </button>

          {/* Edit Trending Collections Button */}
          <button
            onClick={() => router.push(`/editor/trending`)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all hover:scale-105',
              isDark 
                ? 'bg-zinc-800 hover:bg-zinc-700 text-white border border-gold-500' 
                : 'bg-white hover:bg-gray-50 text-black border-2 border-gold-500'
            )}
            title="Edit Trending Collections"
          >
            <Edit className="w-5 h-5" />
            <span className="font-semibold">Edit Trending</span>
          </button>
        </>
      )}

      {canEditSect && (
        <button
          onClick={() => router.push(`/editor/sections`)}
          className={cn(
            'flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all hover:scale-105',
            isDark 
              ? 'bg-zinc-800 hover:bg-zinc-700 text-white border border-gold-500' 
              : 'bg-white hover:bg-gray-50 text-black border-2 border-gold-500'
          )}
          title="Edit Sections"
        >
          <Edit className="w-5 h-5" />
          <span className="font-semibold">Edit Sections</span>
        </button>
      )}
    </div>
  )
}
