import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://phlccyxgyftspxnuzttf.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Use service role for write operations
const supabase = createClient(supabaseUrl, supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')

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

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  try {
    let query = supabase
      .from('collections')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (collectionLabel) {
      query = query.eq('collection_label', collectionLabel)
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
    const { userId, name, imageUrl, collectionLabel, displayOrder, slug } = body

    if (!userId || !name || !collectionLabel) {
      return NextResponse.json(
        { error: 'userId, name, and collectionLabel are required' },
        { status: 400 }
      )
    }

    const collectionSlug = slug || name.toLowerCase().replace(/\s+/g, '-')

    const { data, error } = await supabase
      .from('collections')
      .upsert({
        user_id: userId,
        name,
        slug: collectionSlug,
        collection_label: collectionLabel,
        image_url: imageUrl || null,
        display_order: displayOrder || 0,
        is_active: true,
      }, {
        onConflict: 'user_id,collection_label,name',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating collection:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

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
