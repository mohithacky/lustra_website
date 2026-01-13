'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface GoldRateData {
  rate_24k: number | null
  rate_22k: number | null
  rate_18k: number | null
  rate_14k: number | null
  trend_up: boolean
  change_text: string | null
}

interface GoldRateBannerProps {
  goldRate: GoldRateData
  isDark?: boolean
}

export default function GoldRateBanner({ goldRate, isDark = false }: GoldRateBannerProps) {
  // Build array of rates to display
  const rates: { karat: string; value: number }[] = []
  
  if (goldRate.rate_24k != null) {
    rates.push({ karat: '24K', value: goldRate.rate_24k })
  }
  if (goldRate.rate_22k != null) {
    rates.push({ karat: '22K', value: goldRate.rate_22k })
  }
  if (goldRate.rate_18k != null) {
    rates.push({ karat: '18K', value: goldRate.rate_18k })
  }
  if (goldRate.rate_14k != null) {
    rates.push({ karat: '14K', value: goldRate.rate_14k })
  }

  // Don't render if no rates
  if (rates.length === 0) {
    return null
  }

  const trendUp = goldRate.trend_up ?? true
  const changeText = goldRate.change_text?.trim() || ''

  return (
    <div className="w-full flex justify-center py-3">
      <div className="max-w-[1100px] px-6 w-full">
        <div className="flex flex-wrap justify-center gap-3">
          {rates.map((rate, index) => (
            <div
              key={rate.karat}
              className={cn(
                'inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border transition-colors',
                isDark 
                  ? 'bg-[#181818] border-gold-500/35' 
                  : 'bg-offwhite border-gold-500/35'
              )}
            >
              {/* Karat Label */}
              <span className={cn(
                'text-sm font-medium',
                isDark ? 'text-white/70' : 'text-black'
              )}>
                {rate.karat}
              </span>

              {/* Rate Value */}
              <span className={cn(
                'text-base font-bold',
                isDark ? 'text-gold-400' : 'text-black'
              )}>
                ₹{rate.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })} / g
              </span>

              {/* Trend Indicator (only show on first rate if change text exists) */}
              {index === 0 && changeText && (
                <>
                  {trendUp ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className={cn(
                    'text-xs font-medium',
                    trendUp ? 'text-green-500' : 'text-red-500'
                  )}>
                    {changeText}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
