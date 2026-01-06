/**
 * Editor Context for WebView Integration
 * 
 * This module handles the JavaScript bridge between the Flutter native app
 * and the Next.js website when opened in a WebView.
 * 
 * FLOW:
 * 1. Flutter app requests editor session from backend
 * 2. Backend validates ownership and issues short-lived token
 * 3. WebView loads website
 * 4. After page load, Flutter injects window.lustraEditorContext via JavaScript
 * 5. Website reads this context to enable editing UI
 */

export interface EditorContext {
  enabled: boolean
  token: string
  websiteId: string
  scopes: string[]
  expiresAt: number
  canEditSections: boolean
  canEditCollections: boolean
  injectedAt: number
}

/**
 * Check if the website is running in a WebView with editor context
 */
export function isInEditorMode(): boolean {
  if (typeof window === 'undefined') return false
  
  const context = (window as any).lustraEditorContext
  return context?.enabled === true
}

/**
 * Get the editor context from the window object
 */
export function getEditorContext(): EditorContext | null {
  if (typeof window === 'undefined') return null
  
  const context = (window as any).lustraEditorContext
  if (!context || context.enabled !== true) return null
  
  // Check if token is expired
  const now = Date.now()
  if (context.expiresAt && context.expiresAt < now) {
    console.warn('[EditorContext] Token expired')
    return null
  }
  
  return context as EditorContext
}

/**
 * Check if user has permission for a specific scope
 */
export function hasEditorScope(scope: string): boolean {
  const context = getEditorContext()
  if (!context) return false
  
  return context.scopes.includes(scope)
}

/**
 * Check if user can edit sections
 */
export function canEditSections(): boolean {
  const context = getEditorContext()
  return context?.canEditSections === true
}

/**
 * Check if user can edit collections
 */
export function canEditCollections(): boolean {
  const context = getEditorContext()
  return context?.canEditCollections === true
}

/**
 * Wait for editor context to be injected by the native app
 * Returns a promise that resolves when context is ready or times out
 */
export function waitForEditorContext(timeoutMs: number = 5000): Promise<EditorContext | null> {
  return new Promise((resolve) => {
    // Check if already available
    const existing = getEditorContext()
    if (existing) {
      console.log('[EditorContext] Context already available')
      resolve(existing)
      return
    }
    
    let resolved = false
    
    // Listen for the custom event dispatched by native app
    const handleContextReady = (event: any) => {
      if (resolved) return
      resolved = true
      
      console.log('[EditorContext] Received lustraEditorContextReady event')
      const context = getEditorContext()
      resolve(context)
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('lustraEditorContextReady', handleContextReady)
    }
    
    // Timeout fallback
    setTimeout(() => {
      if (resolved) return
      resolved = true
      
      console.log('[EditorContext] Timeout waiting for context')
      if (typeof window !== 'undefined') {
        window.removeEventListener('lustraEditorContextReady', handleContextReady)
      }
      
      // One final check
      resolve(getEditorContext())
    }, timeoutMs)
  })
}

/**
 * Get the editor token for API requests
 */
export function getEditorToken(): string | null {
  const context = getEditorContext()
  return context?.token || null
}

/**
 * Log editor context for debugging
 */
export function logEditorContext(): void {
  const context = getEditorContext()
  if (context) {
    console.log('[EditorContext] ===== EDITOR CONTEXT =====')
    console.log('[EditorContext] enabled:', context.enabled)
    console.log('[EditorContext] websiteId:', context.websiteId)
    console.log('[EditorContext] scopes:', context.scopes)
    console.log('[EditorContext] canEditSections:', context.canEditSections)
    console.log('[EditorContext] canEditCollections:', context.canEditCollections)
    console.log('[EditorContext] expiresAt:', new Date(context.expiresAt).toISOString())
    console.log('[EditorContext] ============================')
  } else {
    console.log('[EditorContext] No editor context available')
  }
}
