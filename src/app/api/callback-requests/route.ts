import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, isServiceRoleConfigured } from '@/lib/supabase-server'

/**
 * GET /api/callback-requests?userId=xxx&customerId=xxx&productId=xxx
 * Get callback request status for a product
 */
export async function GET(request: NextRequest) {
  try {
    if (!isServiceRoleConfigured()) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const customerId = searchParams.get('customerId')
    const productId = searchParams.get('productId')

    if (!userId || !productId) {
      return NextResponse.json({ error: 'Missing userId or productId' }, { status: 400 })
    }

    let query = supabaseServer
      .from('customer_callback_requests')
      .select('id, status, created_at, updated_at')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(1)

    // If customerId provided, filter by it
    if (customerId) {
      query = query.eq('customer_id', customerId)
    }

    const { data, error } = await query.single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('[Callback API] Error fetching callback request:', error)
      return NextResponse.json({ error: 'Failed to fetch callback request' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ success: true, callbackRequest: null })
    }

    return NextResponse.json({ 
      success: true, 
      callbackRequest: {
        id: data.id,
        status: data.status,
        created_at: data.created_at,
        updated_at: data.updated_at,
      }
    })
  } catch (error) {
    console.error('[Callback API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/callback-requests
 * Create a callback request
 */
export async function POST(request: NextRequest) {
  try {
    if (!isServiceRoleConfigured()) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { 
      userId, 
      customerId, 
      productId, 
      productName, 
      productImageUrl, 
      customerPhone, 
      message 
    } = body

    if (!userId || !productId || !productName || !customerPhone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Insert callback request
    const { data, error } = await supabaseServer
      .from('customer_callback_requests')
      .insert({
        user_id: userId,
        customer_id: customerId || null,
        product_id: productId,
        product_name: productName,
        product_image_url: productImageUrl || null,
        customer_phone: customerPhone,
        message: message || null,
        status: 'pending',
      })
      .select('id, status')
      .single()

    if (error) {
      console.error('[Callback API] Error creating callback request:', error)
      return NextResponse.json({ error: 'Failed to create callback request' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      callbackRequest: data 
    })
  } catch (error) {
    console.error('[Callback API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
