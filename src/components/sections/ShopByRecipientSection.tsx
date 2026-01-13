'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface ShopByRecipientSectionProps {
  isDark: boolean
  config?: Record<string, any>
  shopDomain: string
}

export default function ShopByRecipientSection({ isDark, config = {}, shopDomain }: ShopByRecipientSectionProps) {
  const showForHim = config.showForHim ?? true
  const showForHer = config.showForHer ?? true
  const forHimTitle = config.forHimTitle || 'Him'
  const forHerTitle = config.forHerTitle || 'Her'
  const forHimSubtitle = config.forHimSubtitle || 'Curated collection for men'
  const forHerSubtitle = config.forHerSubtitle || 'Elegant pieces for women'
  const forHimImage = config.forHimImage || 'https://phlccyxgyftspxnuzttf.supabase.co/storage/v1/object/public/default-categories/him.jpg'
  const forHerImage = config.forHerImage || 'https://phlccyxgyftspxnuzttf.supabase.co/storage/v1/object/public/default-categories/her.jpg'
  const forHimLink = config.forHimLink || '/products?gender=Him&source=recipient'
  const forHerLink = config.forHerLink || '/products?gender=Her&source=recipient'

  const recipients = []
  if (showForHim) {
    recipients.push({
      title: forHimTitle,
      subtitle: forHimSubtitle,
      imageUrl: forHimImage,
      link: forHimLink,
    })
  }
  if (showForHer) {
    recipients.push({
      title: forHerTitle,
      subtitle: forHerSubtitle,
      imageUrl: forHerImage,
      link: forHerLink,
    })
  }

  if (recipients.length === 0) return null

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
          {recipients.map((recipient) => (
            <RecipientCard
              key={recipient.title}
              title={recipient.title}
              subtitle={recipient.subtitle}
              imageUrl={recipient.imageUrl}
              link={recipient.link}
              isDark={isDark}
              shopDomain={shopDomain}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function RecipientCard({ title, subtitle, imageUrl, link, isDark, shopDomain }: {
  title: string
  subtitle?: string
  imageUrl: string
  link: string
  isDark: boolean
  shopDomain: string
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Link
      href={link}
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
 