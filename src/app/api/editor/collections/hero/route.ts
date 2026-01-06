import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const shopId = searchParams.get('shopId')

    if (!shopId) {
      return NextResponse.json({ error: 'shopId is required' }, { status: 400 })
    }

    // Create Supabase client with service role key for server-side operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch all hero collections for the user (matching Flutter's getHeroCollections)
    const { data: collections, error } = await supabase
      .from('user_hero_collections')
      .select('*')
      .eq('user_id', shopId)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching hero collections:', error)
      return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 })
    }

    return NextResponse.json({ 
      collections: collections || [],
      count: collections?.length || 0
    })

  } catch (error) {
    console.error('Error in hero collections API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
