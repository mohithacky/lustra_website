import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, isServiceRoleConfigured } from '@/lib/supabase-server'
import { getSessionFromRequest } from '@/lib/auth-helpers'

/**
 * GET /api/reviews?productId=xxx&userId=xxx
 * Get approved reviews for a product
 */
export async function GET(request: NextRequest) {
  try {
    if (!isServiceRoleConfigured()) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const userId = searchParams.get('userId')

    if (!productId || !userId) {
      return NextResponse.json(
        { error: 'Missing productId or userId' },
        { status: 400 }
      )
    }

    const { data: reviews, error } = await supabaseServer
      .from('customer_reviews')
      .select('*')
      .eq('product_id', productId)
      .eq('user_id', userId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Reviews API] Error fetching reviews:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, reviews: reviews || [] })
  } catch (error) {
    console.error('[Reviews API] Error in GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/reviews
 * Submit a new review (pending approval) - requires authentication
 */
export async function POST(request: NextRequest) {
  try {
    if (!isServiceRoleConfigured()) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { userId, customerId } = session

    const body = await request.json()
    const {
      productId,
      customerName,
      rating,
      reviewText,
    } = body

    if (!productId || !customerName || !rating || !reviewText) {
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

    const { error } = await supabaseServer.from('customer_reviews').insert({
      product_id: productId,
      user_id: userId,
      customer_id: customerId || null,
      customer_name: customerName,
      customer_email: null,
      rating,
      review_text: reviewText,
      is_verified_purchase: false,
      is_approved: false,
    })

    if (error) {
      console.error('[Reviews API] Error adding review:', error)
      return NextResponse.json(
        { error: 'Failed to add review' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Reviews API] Error in POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}