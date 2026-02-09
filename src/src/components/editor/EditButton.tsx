'use client'

import { Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EditButtonProps {
  onClick: () => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  label?: string
}

/**
 * Edit button that appears when in editor mode (WebView from Flutter app)
 * 
 * Styled to match Flutter's edit button appearance
 */
export function EditButton({ 
  onClick, 
  className,
  size = 'md',
  position = 'top-right',
  label,
}: EditButtonProps) {
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  }

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 20,
  }

  const positionClasses = {
    'top-right': 'top-2 right-2',
    'top-left': 'top-2 left-2',
    'bottom-right': 'bottom-2 right-2',
    'bottom-left': 'bottom-2 left-2',
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        onClick()
      }}
      className={cn(
        'absolute z-10 flex items-center justify-center',
        'bg-white/90 hover:bg-white',
        'rounded-full shadow-lg',
        'border border-gray-200',
        'transition-all duration-200',
        'hover:scale-110',
        sizeClasses[size],
        positionClasses[position],
        className
      )}
      title={label || 'Edit'}
    >
      <Pencil className="text-gray-700" size={iconSizes[size]} />
    </button>
  )
}

/**
 * Wrapper component that adds edit button to any section
 */
interface EditableSectionProps {
  children: React.ReactNode
  canEdit: boolean
  onEdit: () => void
  editPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  editLabel?: string
  className?: string
}

export function EditableSection({
  children,
  canEdit,
  onEdit,
  editPosition = 'top-right',
  editLabel,
  className,
}: EditableSectionProps) {
  return (
    <div className={cn('relative', className)}>
      {children}
      {canEdit && (
        <EditButton 
          onClick={onEdit} 
          position={editPosition}
          label={editLabel}
        />
      )}
    </div>
  )
}
 