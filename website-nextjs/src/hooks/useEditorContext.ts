'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  EditorContext, 
  getEditorContext, 
  waitForEditorContext,
  logEditorContext 
} from '@/lib/editor-context'

interface UseEditorContextResult {
  isEditorMode: boolean
  editorContext: EditorContext | null
  canEditSections: boolean
  canEditCollections: boolean
  isLoading: boolean
  editorToken: string | null
  websiteId: string | null
}

/**
 * React hook to access editor context injected by Flutter WebView
 * 
 * Usage:
 * ```tsx
 * const { isEditorMode, canEditCollections } = useEditorContext()
 * 
 * return (
 *   <div>
 *     {isEditorMode && canEditCollections && (
 *       <button onClick={handleEdit}>Edit</button>
 *     )}
 *   </div>
 * )
 * ```
 */
export function useEditorContext(): UseEditorContextResult {
  const [editorContext, setEditorContext] = useState<EditorContext | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const initializeContext = async () => {
      // First check if context is already available
      const existingContext = getEditorContext()
      if (existingContext) {
        console.log('[useEditorContext] Context already available')
        logEditorContext()
        if (mounted) {
          setEditorContext(existingContext)
          setIsLoading(false)
        }
        return
      }

      // Wait for context to be injected (with timeout)
      console.log('[useEditorContext] Waiting for editor context...')
      const context = await waitForEditorContext(3000)
      
      if (mounted) {
        if (context) {
          console.log('[useEditorContext] Editor context received')
          logEditorContext()
        } else {
          console.log('[useEditorContext] No editor context (not in WebView or timeout)')
        }
        setEditorContext(context)
        setIsLoading(false)
      }
    }

    initializeContext()

    // Also listen for context updates (e.g., token refresh)
    const handleContextReady = () => {
      const context = getEditorContext()
      if (mounted && context) {
        console.log('[useEditorContext] Context updated via event')
        setEditorContext(context)
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('lustraEditorContextReady', handleContextReady)
    }

    return () => {
      mounted = false
      if (typeof window !== 'undefined') {
        window.removeEventListener('lustraEditorContextReady', handleContextReady)
      }
    }
  }, [])

  return {
    isEditorMode: editorContext?.enabled === true,
    editorContext,
    canEditSections: editorContext?.canEditSections === true,
    canEditCollections: editorContext?.canEditCollections === true,
    isLoading,
    editorToken: editorContext?.token || null,
    websiteId: editorContext?.websiteId || null,
  }
}
 