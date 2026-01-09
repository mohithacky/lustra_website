'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface ShopByRecipientSectionProps {
  isDark: boolean
  shopDomain: string
}

const RECIPIENT_DATA = [
  {
    title: 'Him',
    imageUrl: 'https://phlccyxgyftspxnuzttf.supabase.co/storage/v1/object/public/default-categories/him.jpg',
  },
  {
    title: 'Her',
    imageUrl: 'https://phlccyxgyftspxnuzttf.supabase.co/storage/v1/object/public/default-categories/her.jpg',
  },
]

export default function ShopByRecipientSection({ isDark, shopDomain }: ShopByRecipientSectionProps) {
  return (
    <section className={cn(
      'py-8',
      isDark ? 'bg-black' : 'bg-offwhite'
    )}>
      <div className="max-w-[1100px] mx-auto px-6">
        {/* Section Header - matches Flutter */}
        <div className="text-center mb-6">
          <span className={cn(
            'text-xs font-bold tracking-[0.15em] uppercase',
            isDark ? 'text-white/70' : 'text-gray-500'
          )}>
            SHOP BY RECIPIENT
          </span>
          <h2 className={cn(
            'font-display text-xl md:text-2xl font-semibold mt-2',
            isDark ? 'text-white' : 'text-black'
          )}>
            Thoughtful pieces for every story
          </h2>
        </div>

        {/* Recipient Cards - centered horizontal layout */}
        <div className="flex justify-center gap-4">
          {RECIPIENT_DATA.map((recipient) => (
            <RecipientCard
              key={recipient.title}
              title={recipient.title}
              imageUrl={recipient.imageUrl}
              isDark={isDark}
              shopDomain={shopDomain}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function RecipientCard({ title, imageUrl, isDark, shopDomain }: {
  title: string
  imageUrl: string
  isDark: boolean
  shopDomain: string
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Link
      href={`/gender/${title.toLowerCase()}`}
      className="block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          'flex flex-col items-center transition-transform duration-300',
          isHovered && '-translate-y-1.5'
        )}
      >
        {/* Square image - 150px mobile, 300px desktop (matches Flutter) */}
        <div
          className={cn(
            'relative w-[150px] h-[150px] lg:w-[300px] lg:h-[300px] rounded-xl overflow-hidden',
            'transition-shadow duration-300',
            isHovered ? 'shadow-2xl' : 'shadow-lg'
          )}
        >
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 150px, 300px"
          />
        </div>
        
        {/* Title */}
        <h3 className={cn(
          'mt-3 text-sm font-semibold',
          isDark ? 'text-white' : 'text-black'
        )}>
          {title}
        </h3>
      </div>
    </Link>
  )
}
