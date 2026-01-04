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
}

export default function TestimonialsSection({ testimonials, isDark }: TestimonialsSectionProps) {
  if (!testimonials.length) return null

  return (
    <section className={cn(
      'py-16 md:py-24',
      isDark ? 'bg-zinc-900' : 'bg-gray-50'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className={cn(
            'text-xs font-bold tracking-[0.2em] uppercase',
            isDark ? 'text-gray-400' : 'text-gray-500'
          )}>
            Reviews
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-semibold mt-2">
            What Our Customers Say
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className={cn(
                'p-6 rounded-2xl',
                isDark ? 'bg-zinc-800' : 'bg-white shadow-md'
              )}
            >
              {/* Stars */}
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

              {/* Review Text */}
              <p className={cn(
                'text-sm leading-relaxed mb-4',
                isDark ? 'text-gray-300' : 'text-gray-600'
              )}>
                "{testimonial.review_text}"
              </p>

              {/* Customer Name */}
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-semibold',
                  isDark ? 'bg-gold-500/20 text-gold-400' : 'bg-gold-100 text-gold-600'
                )}>
                  {testimonial.customer_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className={cn(
                    'font-medium text-sm',
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
    </section>
  )
}
