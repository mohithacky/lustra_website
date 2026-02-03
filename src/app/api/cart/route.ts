import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, isServiceRoleConfigured } from '@/lib/supabase-server'

/**
 * GET /api/cart?userId=xxx&customerId=xxx
 * Get all cart items for a customer
 */
export async function GET(request: NextRequest) {
  try {
    if (!isServiceRoleConfigured()) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const customerId = searchParams.get('customerId')

    if (!userId || !customerId) {
      return NextResponse.json({ error: 'Missing userId or customerId' }, { status: 400 })
    }

    const { data: cartItems, error } = await supabaseServer
      .from('customer_cart')
      .select(`
        id,
        product_id,
        quantity,
        selected_variant,
        created_at,
        updated_at,
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
      console.error('[Cart API] Error fetching cart:', error)
      return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 })
    }

    // Transform to expected format
    const items = (cartItems || []).map((item: any) => ({
      id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      selected_variant: item.selected_variant,
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
    console.error('[Cart API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/cart
 * Add item to cart
 */
export async function POST(request: NextRequest) {
  try {
    if (!isServiceRoleConfigured()) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { userId, customerId, productId, quantity = 1, selectedVariant } = body

    if (!userId || !customerId || !productId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if item already exists in cart
    const { data: existing } = await supabaseServer
      .from('customer_cart')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('customer_id', customerId)
      .eq('product_id', productId)
      .single()

    if (existing) {
      // Update quantity
      const { error: updateError } = await supabaseServer
        .from('customer_cart')
        .update({ 
          quantity: existing.quantity + quantity,
          selected_variant: selectedVariant || null,
        })
        .eq('id', existing.id)

      if (updateError) {
        console.error('[Cart API] Error updating cart item:', updateError)
        return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 })
      }
    } else {
      // Insert new item
      const { error: insertError } = await supabaseServer
        .from('customer_cart')
        .insert({
          user_id: userId,
          customer_id: customerId,
          product_id: productId,
          quantity,
          selected_variant: selectedVariant || null,
        })

      if (insertError) {
        console.error('[Cart API] Error adding to cart:', insertError)
        return NextResponse.json({ error: 'Failed to add to cart' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Cart API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/cart
 * Clear entire cart or remove specific item
 */
export async function DELETE(request: NextRequest) {
  try {
    if (!isServiceRoleConfigured()) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const customerId = searchParams.get('customerId')
    const itemId = searchParams.get('itemId')

    if (!userId || !customerId) {
      return NextResponse.json({ error: 'Missing userId or customerId' }, { status: 400 })
    }

    if (itemId) {
      // Remove specific item
      const { error } = await supabaseServer
        .from('customer_cart')
        .delete()
        .eq('id', itemId)
        .eq('user_id', userId)
        .eq('customer_id', customerId)

      if (error) {
        console.error('[Cart API] Error removing item:', error)
        return NextResponse.json({ error: 'Failed to remove item' }, { status: 500 })
      }
    } else {
      // Clear entire cart
      const { error } = await supabaseServer
        .from('customer_cart')
        .delete()
        .eq('user_id', userId)
        .eq('customer_id', customerId)

      if (error) {
        console.error('[Cart API] Error clearing cart:', error)
        return NextResponse.json({ error: 'Failed to clear cart' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Cart API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/cart
 * Update cart item quantity
 */
export async function PUT(request: NextRequest) {
  try {
    if (!isServiceRoleConfigured()) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { userId, customerId, itemId, quantity } = body

    if (!userId || !customerId || !itemId || quantity === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      const { error } = await supabaseServer
        .from('customer_cart')
        .delete()
        .eq('id', itemId)
        .eq('user_id', userId)
        .eq('customer_id', customerId)

      if (error) {
        console.error('[Cart API] Error removing item:', error)
        return NextResponse.json({ error: 'Failed to remove item' }, { status: 500 })
      }
    } else {
      // Update quantity
      const { error } = await supabaseServer
        .from('customer_cart')
        .update({ quantity })
        .eq('id', itemId)
        .eq('user_id', userId)
        .eq('customer_id', customerId)

      if (error) {
        console.error('[Cart API] Error updating quantity:', error)
        return NextResponse.json({ error: 'Failed to update quantity' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Cart API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
