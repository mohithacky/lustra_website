'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { waitForEditorContext, canEditCollections, canEditSections, logEditorContext } from '@/lib/editor-context'

interface EditorContextValue {
  isEditorMode: boolean
  canEditCollections: boolean
  canEditSections: boolean
  isLoading: boolean
}

const EditorContext = createContext<EditorContextValue>({
  isEditorMode: false,
  canEditCollections: false,
  canEditSections: false,
  isLoading: true,
})

export function useEditor() {
  return useContext(EditorContext)
}

interface EditorProviderProps {
  children: ReactNode
}

export default function EditorProvider({ children }: EditorProviderProps) {
  const [state, setState] = useState<EditorContextValue>({
    isEditorMode: false,
    canEditCollections: false,
    canEditSections: false,
    isLoading: true,
  })

  useEffect(() => {
    // Wait for editor context to be injected by native app
    waitForEditorContext(3000).then((context) => {
      if (context) {
        logEditorContext()
        setState({
          isEditorMode: true,
          canEditCollections: canEditCollections(),
          canEditSections: canEditSections(),
          isLoading: false,
        })
      } else {
        setState({
          isEditorMode: false,
          canEditCollections: false,
          canEditSections: false,
          isLoading: false,
        })
      }
    })
  }, [])

  return (
    <EditorContext.Provider value={state}>
      {children}
    </EditorContext.Provider>
  )
}
