import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://phlccyxgyftspxnuzttf.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Log which key is being used (first 20 chars only for security)
const keyUsed = supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
console.log('[Collections API] Using key type:', supabaseServiceKey ? 'SERVICE_ROLE' : 'ANON', 'key prefix:', keyUsed.substring(0, 20))

// Use service role for write operations - with explicit auth options to ensure RLS bypass
const supabase = createClient(supabaseUrl, keyUsed, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Map collection labels to section types
const LABEL_TO_SECTION_TYPE: Record<string, string> = {
  'hero': 'hero_carousel',
  'trending': 'trending_collections', 
  'category': 'categories',
  'best': 'best_collections',
  'occasion': 'occasion_collections'
}

// Helper to update user_website_sections with collection IDs
async function updateWebsiteSectionCollections(userId: string, collectionLabel: string) {
  try {
    // Get the user's active website
    const { data: website, error: websiteError } = await supabase
      .from('user_websites')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (websiteError || !website) {
      console.log('No active website found for user:', userId)
      return
    }

    // Get all active collections for this label
    const { data: collections, error: collectionsError } = await supabase
      .from('collections')
      .select('id, name, slug, image_url, display_order')
      .eq('user_id', userId)
      .eq('collection_label', collectionLabel)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (collectionsError) {
      console.error('Error fetching collections:', collectionsError)
      return
    }

    const sectionType = LABEL_TO_SECTION_TYPE[collectionLabel] || collectionLabel
    const collectionIds = (collections || []).map(c => c.id)

    // Update or insert the section config with collection IDs
    const { error: upsertError } = await supabase
      .from('user_website_sections')
      .upsert({
        user_website_id: website.id,
        section_type: sectionType,
        config: { 
          collection_ids: collectionIds,
          collections: collections || []
        },
        is_enabled: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_website_id,section_type'
      })

    if (upsertError) {
      console.error('Error updating website section:', upsertError)
    } else {
      console.log(`Updated ${sectionType} section with ${collectionIds.length} collections`)
    }
  } catch (e) {
    console.error('Error in updateWebsiteSectionCollections:', e)
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const collectionLabel = searchParams.get('label') // hero, category, trending, best, occasion
  const aspectRatioFilter = searchParams.get('aspectRatio') // Optional: '3:2' or '5:6' for trending

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  try {
    let query = supabase
      .from('collections')
      .select('*')
      .eq('user_id', userId)
      .order('display_order', { ascending: true })

    if (collectionLabel) {
      query = query.eq('collection_label', collectionLabel)
    }

    // For trending collections, optionally filter by aspect ratio
    // Small boxes (positions 0 & 3) use 3:2, Large boxes (positions 1 & 2) use 5:6
    if (aspectRatioFilter && collectionLabel === 'trending') {
      query = query.eq('aspect_ratio', aspectRatioFilter)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching collections:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ collections: data || [] })
  } catch (e: any) {
    console.error('Error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, imageUrl, collectionLabel, displayOrder, slug, aspectRatio } = body

    console.log('[Collections POST] Request body:', { userId, name, imageUrl: imageUrl?.substring(0, 50), collectionLabel, displayOrder, aspectRatio })

    if (!userId || !name || !collectionLabel) {
      console.error('[Collections POST] Missing required fields:', { userId: !!userId, name: !!name, collectionLabel: !!collectionLabel })
      return NextResponse.json(
        { error: 'userId, name, and collectionLabel are required' },
        { status: 400 }
      )
    }

    const collectionSlug = slug || name.toLowerCase().replace(/\s+/g, '-')

    console.log('[Collections POST] Attempting to insert:', {
      user_id: userId,
      name,
      slug: collectionSlug,
      collection_label: collectionLabel,
      display_order: displayOrder || 0,
    })

    const insertData: Record<string, any> = {
      user_id: userId,
      name,
      slug: collectionSlug,
      collection_label: collectionLabel,
      image_url: imageUrl || null,
      display_order: displayOrder || 0,
      is_active: true,
    }
    
    // Add aspect_ratio for trending collections
    if (aspectRatio && collectionLabel === 'trending') {
      insertData.aspect_ratio = aspectRatio
    }
    
    console.log('[Collections POST] Insert data:', JSON.stringify(insertData, null, 2))

    // First check if this collection already exists
    const { data: existing } = await supabase
      .from('collections')
      .select('id')
      .eq('user_id', userId)
      .eq('collection_label', collectionLabel)
      .eq('name', name)
      .maybeSingle()

    console.log('[Collections POST] Existing collection check:', existing)

    let data, error
    if (existing) {
      // Update existing
      const result = await supabase
        .from('collections')
        .update({
          slug: insertData.slug,
          image_url: insertData.image_url,
          display_order: insertData.display_order,
          is_active: insertData.is_active,
        })
        .eq('id', existing.id)
        .select()
        .single()
      data = result.data
      error = result.error
    } else {
      // Insert new
      const result = await supabase
        .from('collections')
        .insert(insertData)
        .select()
        .single()
      data = result.data
      error = result.error
    }

    console.log('[Collections POST] Upsert result - data:', data, 'error:', error)

    if (error) {
      console.error('[Collections POST] Error creating collection:', JSON.stringify(error, null, 2))
      console.error('[Collections POST] Error code:', error.code, 'message:', error.message, 'details:', error.details, 'hint:', error.hint)
      return NextResponse.json({ error: error.message, details: error, code: error.code }, { status: 500 })
    }

    console.log('[Collections POST] Successfully created collection:', data?.id, 'name:', data?.name)

    // Sync to user_website_sections
    await updateWebsiteSectionCollections(userId, collectionLabel)

    return NextResponse.json({ collection: data })
  } catch (e: any) {
    console.error('Error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, userId, name, imageUrl, displayOrder, isActive, collectionLabel } = body

    if (!id || !userId) {
      return NextResponse.json(
        { error: 'id and userId are required' },
        { status: 400 }
      )
    }

    const updateData: Record<string, any> = {}
    if (name !== undefined) updateData.name = name
    if (imageUrl !== undefined) updateData.image_url = imageUrl
    if (displayOrder !== undefined) updateData.display_order = displayOrder
    if (isActive !== undefined) updateData.is_active = isActive

    const { data, error } = await supabase
      .from('collections')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating collection:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Sync to user_website_sections if we have the label
    if (data?.collection_label) {
      await updateWebsiteSectionCollections(userId, data.collection_label)
    }

    return NextResponse.json({ collection: data })
  } catch (e: any) {
    console.error('Error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const userId = searchParams.get('userId')

  if (!id || !userId) {
    return NextResponse.json(
      { error: 'id and userId are required' },
      { status: 400 }
    )
  }

  try {
    // First get the collection to know its label
    const { data: collection } = await supabase
      .from('collections')
      .select('collection_label')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting collection:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Sync to user_website_sections after deletion
    if (collection?.collection_label) {
      await updateWebsiteSectionCollections(userId, collection.collection_label)
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('Error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
