import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, isServiceRoleConfigured } from '@/lib/supabase-server'
import { getSessionFromRequest } from '@/lib/auth-helpers'

/**
 * GET /api/wishlist
 * Get all wishlist items for authenticated customer
 */
export async function GET(request: NextRequest) {
  try {
    if (!isServiceRoleConfigured()) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { userId, customerId } = session
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId') // For checking if product is in wishlist

    // If productId is provided, just check if it's in wishlist
    if (productId) {
      const { data, error } = await supabaseServer
        .from('customer_wishlist')
        .select('id')
        .eq('user_id', userId)
        .eq('customer_id', customerId)
        .eq('product_id', productId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('[Wishlist API] Error checking wishlist:', error)
        return NextResponse.json({ error: 'Failed to check wishlist' }, { status: 500 })
      }

      return NextResponse.json({ success: true, inWishlist: Boolean(data) })
    }

    // Get all wishlist items
    const { data: wishlistItems, error } = await supabaseServer
      .from('customer_wishlist')
      .select(`
        id,
        product_id,
        created_at,
        products:product_id (
          id,
          name,
          price,
          image_url,
          images
        )
      `)
      .eq('user_id', userId)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Wishlist API] Error fetching wishlist:', error)
      return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 })
    }

    // Transform to expected format
    const items = (wishlistItems || []).map((item: any) => ({
      id: item.id,
      product_id: item.product_id,
      created_at: item.created_at,
      product: item.products ? {
        id: item.products.id,
        name: item.products.name,
        price: item.products.price,
        image_url: item.products.image_url,
        images: item.products.images,
      } : null,
    }))

    return NextResponse.json({ success: true, items })
  } catch (error) {
    console.error('[Wishlist API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/wishlist
 * Add item to wishlist for authenticated customer
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
    const { productId } = body

    if (!productId) {
      return NextResponse.json({ error: 'Missing productId' }, { status: 400 })
    }

    // Check if item already exists (unique constraint will handle this, but good to check)
    const { data: existing } = await supabaseServer
      .from('customer_wishlist')
      .select('id')
      .eq('user_id', userId)
      .eq('customer_id', customerId)
      .eq('product_id', productId)
      .single()

    if (existing) {
      // Item already in wishlist
      return NextResponse.json({ success: true, message: 'Already in wishlist' })
    }

    // Insert new item
    const { error: insertError } = await supabaseServer
      .from('customer_wishlist')
      .insert({
        user_id: userId,
        customer_id: customerId,
        product_id: productId,
      })

    if (insertError) {
      console.error('[Wishlist API] Error adding to wishlist:', insertError)
      return NextResponse.json({ error: 'Failed to add to wishlist' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Wishlist API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/wishlist
 * Remove item from wishlist for authenticated customer
 */
export async function DELETE(request: NextRequest) {
  try {
    if (!isServiceRoleConfigured()) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { userId, customerId } = session
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ error: 'Missing productId' }, { status: 400 })
    }

    const { error } = await supabaseServer
      .from('customer_wishlist')
      .delete()
      .eq('user_id', userId)
      .eq('customer_id', customerId)
      .eq('product_id', productId)

    if (error) {
      console.error('[Wishlist API] Error removing from wishlist:', error)
      return NextResponse.json({ error: 'Failed to remove from wishlist' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Wishlist API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
