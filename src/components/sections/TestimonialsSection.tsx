'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Testimonial {
  id: string
  customer_name: string
  rating: number
  review_text: string
  created_at: string
}

interface TestimonialsSectionProps {
  testimonials: Testimonial[]
  isDark: boolean
  title?: string
  subtitle?: string
  layout?: string
  showRating?: boolean
  showAvatar?: boolean
  maxItems?: number
}

export default function TestimonialsSection({ 
  testimonials, 
  isDark,
  title = "What Our Customers Say",
  subtitle = "Real reviews from real customers",
  layout = "carousel",
  showRating = true,
  showAvatar = true,
  maxItems = 6
}: TestimonialsSectionProps) {
  if (!testimonials.length) return null

  const displayTestimonials = testimonials.slice(0, maxItems)

  return (
    <section className={cn(
      'py-12 md:py-16',
      isDark ? 'bg-[#080808]' : 'bg-offwhite'
    )}>
      <div className="max-w-[1100px] mx-auto px-6">
        {/* Section Header - matches Flutter's JewelleryTestimonialSection */}
        <div className="text-center mb-10">
          <h2 className={cn(
            'font-display text-3xl font-bold mb-2',
            isDark ? 'text-white' : 'text-black'
          )}>
            {title}
          </h2>
          <div className="w-16 h-0.5 bg-gold-500 mx-auto mb-4" />
          {subtitle && (
            <p className={cn(
              'text-sm',
              isDark ? 'text-gray-400' : 'text-gray-500'
            )}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Testimonials - horizontal scroll like Flutter PageView */}
        <div className="overflow-x-auto pb-4 -mx-6 px-6">
          <div className="flex gap-6 min-w-max md:justify-center">
            {displayTestimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className={cn(
                  'w-[320px] p-6 rounded-2xl flex-shrink-0',
                  isDark ? 'bg-zinc-800' : 'bg-white shadow-lg'
                )}
              >
                {/* Stars */}
                {showRating && (
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'w-4 h-4',
                          i < testimonial.rating
                            ? 'fill-gold-500 text-gold-500'
                            : isDark ? 'text-zinc-600' : 'text-gray-300'
                        )}
                      />
                    ))}
                  </div>
                )}

                {/* Review Text */}
                <p className={cn(
                  'text-sm leading-relaxed mb-6 line-clamp-4',
                  isDark ? 'text-gray-300' : 'text-gray-600'
                )}>
                  &ldquo;{testimonial.review_text}&rdquo;
                </p>

                {/* Customer Info */}
                <div className="flex items-center gap-3">
                  {showAvatar && (
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-lg',
                      isDark ? 'bg-gold-500/20 text-gold-400' : 'bg-gold-100 text-gold-600'
                    )}>
                      {testimonial.customer_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className={cn(
                      'font-semibold text-sm',
                      isDark ? 'text-white' : 'text-black'
                    )}>
                      {testimonial.customer_name}
                    </p>
                    <p className={cn(
                      'text-xs',
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    )}>
                      Verified Buyer
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
 