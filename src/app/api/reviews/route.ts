import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-new-architecture'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const shopId = searchParams.get('shopId')

    if (!productId || !shopId) {
      return NextResponse.json(
        { error: 'Missing productId or shopId' },
        { status: 400 }
      )
    }

    const { data: reviews, error } = await supabase
      .from('customer_reviews')
      .select('*')
      .eq('product_id', productId)
      .eq('shop_id', shopId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching reviews:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      )
    }

    return NextResponse.json({ reviews: reviews || [] })
  } catch (error) {
    console.error('Error in GET /api/reviews:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      productId,
      shopId,
      customerName,
      rating,
      reviewText,
      customerId,
      customerEmail,
    } = body

    if (!productId || !shopId || !customerName || !rating || !reviewText) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    const { error } = await supabase.from('customer_reviews').insert({
      product_id: productId,
      shop_id: shopId,
      customer_id: customerId || null,
      customer_name: customerName,
      customer_email: customerEmail || null,
      rating,
      review_text: reviewText,
      is_verified_purchase: false,
      is_approved: false,
    })

    if (error) {
      console.error('Error adding review:', error)
      return NextResponse.json(
        { error: 'Failed to add review' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/reviews:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
