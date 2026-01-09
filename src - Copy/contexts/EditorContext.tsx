'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface EditorContextData {
  enabled: boolean
  token: string | null
  websiteId: string | null
  scopes: string[]
  canEditSections: boolean
  canEditCollections: boolean
  canEditCategories: boolean
  expiresAt: number | null
}

interface EditorContextValue {
  isEditorMode: boolean
  editorData: EditorContextData | null
  canEdit: boolean
  canEditSections: boolean
  canEditCollections: boolean
  canEditCategories: boolean
}

const defaultContext: EditorContextValue = {
  isEditorMode: false,
  editorData: null,
  canEdit: false,
  canEditSections: false,
  canEditCollections: false,
  canEditCategories: false,
}

const EditorContext = createContext<EditorContextValue>(defaultContext)

export function useEditor() {
  return useContext(EditorContext)
}

interface EditorProviderProps {
  children: ReactNode
  shopId?: string
}

export function EditorProvider({ children, shopId }: EditorProviderProps) {
  const [editorData, setEditorData] = useState<EditorContextData | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check for injected editor context from native app WebView
    const checkForEditorContext = () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const windowContext = (window as any).lustraEditorContext
        if (windowContext) {
          console.log('[EditorContext] Found injected editor context:', windowContext)
          
          const context: EditorContextData = {
            enabled: windowContext.enabled === true,
            token: windowContext.token || null,
            websiteId: windowContext.websiteId || null,
            scopes: Array.isArray(windowContext.scopes) ? windowContext.scopes : [],
            canEditSections: windowContext.canEditSections === true,
            canEditCollections: windowContext.canEditCollections === true,
            canEditCategories: windowContext.scopes?.includes('categories:write') || false,
            expiresAt: windowContext.expiresAt || null,
          }

          // Verify the websiteId matches the current shop
          if (shopId && context.websiteId && context.websiteId !== shopId) {
            console.log('[EditorContext] WebsiteId mismatch, ignoring editor context')
            return false
          }

          // Check if token has expired
          if (context.expiresAt && Date.now() > context.expiresAt) {
            console.log('[EditorContext] Editor token has expired')
            return false
          }

          setEditorData(context)
          return true
        }
      } catch (e) {
        console.error('[EditorContext] Error reading lustraEditorContext:', e)
      }
      return false
    }

    // Initial check
    const found = checkForEditorContext()
    if (found) return

    // Listen for the custom event dispatched by native app
    const handleEditorContextReady = () => {
      console.log('[EditorContext] Received lustraEditorContextReady event')
      checkForEditorContext()
    }

    window.addEventListener('lustraEditorContextReady', handleEditorContextReady)

    // Poll for a short time in case the event was missed
    let attempts = 0
    const maxAttempts = 10
    const pollInterval = setInterval(() => {
      attempts++
      if (checkForEditorContext() || attempts >= maxAttempts) {
        clearInterval(pollInterval)
      }
    }, 500)

    return () => {
      window.removeEventListener('lustraEditorContextReady', handleEditorContextReady)
      clearInterval(pollInterval)
    }
  }, [shopId])

  const value: EditorContextValue = {
    isEditorMode: editorData?.enabled ?? false,
    editorData,
    canEdit: editorData?.enabled ?? false,
    canEditSections: editorData?.canEditSections ?? false,
    canEditCollections: editorData?.canEditCollections ?? false,
    canEditCategories: editorData?.canEditCategories ?? false,
  }

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  )
}
