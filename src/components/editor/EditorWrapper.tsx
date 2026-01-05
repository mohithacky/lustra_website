'use client'

import { ReactNode } from 'react'
import { EditorProvider } from '@/contexts/EditorContext'

interface EditorWrapperProps {
  children: ReactNode
  shopId: string
}

export default function EditorWrapper({ children, shopId }: EditorWrapperProps) {
  return (
    <EditorProvider shopId={shopId}>
      {children}
    </EditorProvider>
  )
}
