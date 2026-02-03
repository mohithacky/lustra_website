import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, isServiceRoleConfigured } from '@/lib/supabase-server'
import { getSessionFromRequest } from '@/lib/auth-helpers'

/**
 * GET /api/callback-requests?productId=xxx
 * Get callback request status for a product (requires authentication)
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
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ error: 'Missing productId' }, { status: 400 })
    }

    const query = supabaseServer
      .from('customer_callback_requests')
      .select('id, status, created_at, updated_at')
      .eq('user_id', userId)
      .eq('customer_id', customerId)
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(1)

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
 * Create a callback request (requires authentication)
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
      productName, 
      productImageUrl, 
      customerPhone, 
      message 
    } = body

    if (!productId || !productName || !customerPhone) {
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
