import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, isServiceRoleConfigured } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    if (!isServiceRoleConfigured()) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const userId = searchParams.get('userId')
    const customerId = searchParams.get('customerId')

    if (!productId || !userId || !customerId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
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