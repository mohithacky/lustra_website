'use client'

import { useState, useEffect } from 'react'
import { Star, CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Review {
  id: string
  customer_name: string
  rating: number
  review_text: string
  is_verified_purchase: boolean
  created_at: string
}

interface ProductReviewsProps {
  productId: string
  shopId: string
  isDark: boolean
}

export default function ProductReviews({ productId, shopId, isDark }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasAlreadyReviewed, setHasAlreadyReviewed] = useState(false)
  
  const [customerName, setCustomerName] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [selectedRating, setSelectedRating] = useState(5)

  const textColor = isDark ? 'text-white' : 'text-black'
  const mutedColor = isDark ? 'text-gray-400' : 'text-gray-500'
  const cardColor = isDark ? 'bg-zinc-800/50' : 'bg-gray-50'
  const borderColor = isDark ? 'border-zinc-700' : 'border-gray-200'

  const getCustomer = () => {
    if (typeof window === 'undefined') return null
    const saved = localStorage.getItem('websiteCustomer')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return null
      }
    }
    return null
  }

  useEffect(() => {
    loadReviews()
    checkIfAlreadyReviewed()
  }, [productId, shopId])

  const loadReviews = async () => {
    try {
      const response = await fetch(`/api/reviews?productId=${productId}&userId=${shopId}`)
      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews || [])
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const checkIfAlreadyReviewed = async () => {
    const customer = getCustomer()
    if (!customer) return

    try {
      const response = await fetch(
        `/api/reviews/check?productId=${productId}&userId=${shopId}&customerId=${customer.id}`
      )
      if (response.ok) {
        const data = await response.json()
        setHasAlreadyReviewed(data.hasReviewed || false)
      }
    } catch (error) {
      console.error('Error checking review status:', error)
    }
  }

  const handleSubmitReview = async () => {
    if (!customerName.trim() || !reviewText.trim()) {
      alert('Please fill in all fields')
      return
    }

    const customer = getCustomer()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          userId: shopId,
          customerName: customerName.trim(),
          rating: selectedRating,
          reviewText: reviewText.trim(),
          customerId: customer?.id || null,
          customerEmail: customer?.email || null,
        }),
      })

      if (response.ok) {
        setCustomerName('')
        setReviewText('')
        setSelectedRating(5)
        setHasAlreadyReviewed(true)
        await loadReviews()
        alert('Review submitted successfully! It will be visible after admin approval.')
      } else {
        alert('Failed to submit review. Please try again.')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('Failed to submit review. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-12 pt-12 border-t" style={{ borderColor: isDark ? '#3f3f46' : '#e5e7eb' }}>
      {/* Customer Reviews Section */}
      <h2 className={cn('font-display text-2xl font-bold mb-6', textColor)}>
        Customer Reviews
      </h2>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
        </div>
      ) : reviews.length === 0 ? (
        <p className={cn('text-sm italic py-4', mutedColor)}>
          No reviews yet. Be the first to review this product!
        </p>
      ) : (
        <div className="space-y-4 mb-8">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              isDark={isDark}
              cardColor={cardColor}
              textColor={textColor}
              mutedColor={mutedColor}
              borderColor={borderColor}
            />
          ))}
        </div>
      )}

      {/* Add a Review Section */}
      <div className="mt-8">
        <h3 className={cn('font-display text-xl font-bold mb-4', textColor)}>
          Add a Review
        </h3>

        {hasAlreadyReviewed ? (
          <div
            className={cn(
              'p-4 rounded-xl border flex items-center gap-3',
              cardColor,
              borderColor
            )}
          >
            <CheckCircle className="w-6 h-6 text-gold-500 flex-shrink-0" />
            <p className={cn('text-sm font-medium', textColor)}>
              Review already added by you.
            </p>
          </div>
        ) : (
          <div className={cn('p-6 rounded-xl border', cardColor, borderColor)}>
            <div className="space-y-4">
              {/* Name Input */}
              <div>
                <label className={cn('block text-sm font-medium mb-2', textColor)}>
                  Your Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your name"
                  className={cn(
                    'w-full px-4 py-3 rounded-lg border outline-none focus:border-gold-500 transition-colors',
                    isDark
                      ? 'bg-zinc-900 border-zinc-700 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-black placeholder-gray-400'
                  )}
                />
              </div>

              {/* Rating */}
              <div>
                <label className={cn('block text-sm font-medium mb-2', textColor)}>
                  Rating
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setSelectedRating(rating)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={cn(
                          'w-8 h-8',
                          rating <= selectedRating
                            ? 'fill-gold-500 text-gold-500'
                            : isDark
                            ? 'text-gray-600'
                            : 'text-gray-300'
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Text */}
              <div>
                <label className={cn('block text-sm font-medium mb-2', textColor)}>
                  Your Review
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience with this product"
                  rows={4}
                  className={cn(
                    'w-full px-4 py-3 rounded-lg border outline-none focus:border-gold-500 transition-colors resize-none',
                    isDark
                      ? 'bg-zinc-900 border-zinc-700 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-black placeholder-gray-400'
                  )}
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmitReview}
                disabled={isSubmitting}
                className="w-full py-3.5 bg-gold-500 hover:bg-gold-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Review'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface ReviewCardProps {
  review: Review
  isDark: boolean
  cardColor: string
  textColor: string
  mutedColor: string
  borderColor: string
}

function ReviewCard({ review, isDark, cardColor, textColor, mutedColor, borderColor }: ReviewCardProps) {
  return (
    <div className={cn('p-4 rounded-xl border', cardColor, borderColor)}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h4 className={cn('font-semibold', textColor)}>{review.customer_name}</h4>
            {review.is_verified_purchase && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                Verified Purchase
              </span>
            )}
          </div>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  'w-4 h-4',
                  star <= review.rating
                    ? 'fill-gold-500 text-gold-500'
                    : isDark
                    ? 'text-gray-600'
                    : 'text-gray-300'
                )}
              />
            ))}
          </div>
        </div>
        <span className={cn('text-xs', mutedColor)}>
          {new Date(review.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>
      <p className={cn('text-sm leading-relaxed', isDark ? 'text-gray-300' : 'text-gray-600')}>
        {review.review_text}
      </p>
    </div>
  )
}
 