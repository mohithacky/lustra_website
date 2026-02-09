import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, isServiceRoleConfigured } from '@/lib/supabase-server'
import { getSessionFromRequest } from '@/lib/auth-helpers'

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
      return NextResponse.json(
        { error: 'Missing productId' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseServer
      .from('customer_reviews')
      .select('id')
      .eq('product_id', productId)
      .eq('user_id', userId)
      .eq('customer_id', customerId)
      .limit(1)

    if (error) {
      console.error('[Reviews Check API] Error:', error)
      return NextResponse.json(
        { error: 'Failed to check review status' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, hasReviewed: data && data.length > 0 })
  } catch (error) {
    console.error('[Reviews Check API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}