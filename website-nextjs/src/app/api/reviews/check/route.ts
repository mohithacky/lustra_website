import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-new-architecture'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const shopId = searchParams.get('shopId')
    const customerId = searchParams.get('customerId')

    if (!productId || !shopId || !customerId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('customer_reviews')
      .select('id')
      .eq('product_id', productId)
      .eq('shop_id', shopId)
      .eq('customer_id', customerId)
      .limit(1)

    if (error) {
      console.error('Error checking review status:', error)
      return NextResponse.json(
        { error: 'Failed to check review status' },
        { status: 500 }
      )
    }

    return NextResponse.json({ hasReviewed: data && data.length > 0 })
  } catch (error) {
    console.error('Error in GET /api/reviews/check:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
 