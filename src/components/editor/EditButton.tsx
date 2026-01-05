'use client'

import { Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EditButtonProps {
  onClick: () => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

export default function EditButton({ 
  onClick, 
  className,
  size = 'md',
  position = 'top-right'
}: EditButtonProps) {
  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
  }

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
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
        e.preventDefault()
        e.stopPropagation()
        onClick()
      }}
      className={cn(
        'absolute z-10 bg-white/90 hover:bg-white text-gray-700 rounded-full shadow-md transition-all hover:scale-110',
        sizeClasses[size],
        positionClasses[position],
        className
      )}
      title="Edit"
    >
      <Pencil className={iconSizes[size]} />
    </button>
  )
}
