import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { shopId, collectionName, isVisible, collectionType = 'hero' } = body

    if (!shopId || !collectionName) {
      return NextResponse.json({ error: 'shopId and collectionName are required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (collectionType === 'hero') {
      // Toggle hero collection visibility (matching Flutter's toggleHeroCollectionVisibility)
      const { error } = await supabase
        .from('user_hero_collections')
        .update({ is_visible: isVisible })
        .eq('user_id', shopId)
        .eq('name', collectionName)

      if (error) {
        console.error('Error toggling hero visibility:', error)
        return NextResponse.json({ error: 'Failed to toggle visibility' }, { status: 500 })
      }
    } else if (collectionType === 'trending') {
      // Toggle trending collection visibility
      const { error } = await supabase
        .from('user_trending_collections')
        .update({ is_visible: isVisible })
        .eq('user_id', shopId)
        .eq('name', collectionName)

      if (error) {
        console.error('Error toggling trending visibility:', error)
        return NextResponse.json({ error: 'Failed to toggle visibility' }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      success: true,
      message: isVisible ? 'Collection added to website' : 'Collection removed from website'
    })

  } catch (error) {
    console.error('Error in visibility toggle API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
 