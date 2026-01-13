import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { shopId, collectionName, bannerImage, collectionType = 'hero', position, aspectRatio } = body

    if (!shopId || !collectionName) {
      return NextResponse.json({ error: 'shopId and collectionName are required' }, { status: 400 })
    }

    if (!bannerImage) {
      return NextResponse.json({ error: 'bannerImage is required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Convert base64 to buffer for upload
    let imageBuffer: Buffer
    let fileExt = 'png'
    
    if (bannerImage.startsWith('data:')) {
      // Data URL format
      const matches = bannerImage.match(/^data:image\/(\w+);base64,(.+)$/)
      if (matches) {
        fileExt = matches[1]
        imageBuffer = Buffer.from(matches[2], 'base64')
      } else {
        return NextResponse.json({ error: 'Invalid image format' }, { status: 400 })
      }
    } else {
      // Raw base64
      imageBuffer = Buffer.from(bannerImage, 'base64')
    }

    // Upload to Supabase Storage (matching Flutter's uploadCollectionBanner)
    const fileName = `${collectionName.toLowerCase().replace(/\s+/g, '_')}.${fileExt}`
    const filePath = `${shopId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('collection-banners')
      .upload(filePath, imageBuffer, {
        contentType: `image/${fileExt}`,
        upsert: true // Replace if exists
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('collection-banners')
      .getPublicUrl(filePath)

    const imageUrl = publicUrlData.publicUrl

    console.log('[Collections Save] Saving to collections table:', { shopId, collectionName, collectionType })

    // Use the new unified collections table
    const collectionLabel = collectionType === 'hero' ? 'hero' : 'trending'
    const slug = collectionName.toLowerCase().replace(/\s+/g, '-')

    // Get current max display order for this collection type
    const { data: existing } = await supabase
      .from('collections')
      .select('display_order')
      .eq('user_id', shopId)
      .eq('collection_label', collectionLabel)
      .order('display_order', { ascending: false })
      .limit(1)

    const maxOrder = existing && existing.length > 0 ? (existing[0].display_order || 0) : 0

    // Check if collection with same name exists
    const { data: existingCollection } = await supabase
      .from('collections')
      .select('id')
      .eq('user_id', shopId)
      .eq('collection_label', collectionLabel)
      .eq('name', collectionName)
      .maybeSingle()

    if (existingCollection) {
      // Update existing collection image
      console.log('[Collections Save] Updating existing collection:', existingCollection.id)
      const { error: updateError } = await supabase
        .from('collections')
        .update({ 
          image_url: `${imageUrl}?v=${Date.now()}`, // Add cache buster
          slug,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingCollection.id)

      if (updateError) {
        console.error('[Collections Save] Update error:', updateError)
        return NextResponse.json({ error: 'Failed to update collection', details: updateError }, { status: 500 })
      }
    } else {
      // Insert new collection
      console.log('[Collections Save] Inserting new collection')
      const { error: insertError } = await supabase
        .from('collections')
        .insert({
          user_id: shopId,
          name: collectionName,
          slug,
          collection_label: collectionLabel,
          image_url: imageUrl,
          display_order: maxOrder + 1,
          is_active: true
        })

      if (insertError) {
        console.error('[Collections Save] Insert error:', insertError)
        return NextResponse.json({ error: 'Failed to save collection', details: insertError }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      success: true,
      imageUrl,
      message: 'Collection saved successfully'
    })

  } catch (error) {
    console.error('Error in save collection API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper function matching Flutter's getAspectRatioForPosition
function getAspectRatioForPosition(position: number): string {
  // Positions 0 and 3 are small boxes (3:2)
  // Positions 1 and 2 are large boxes (5:6)
  return (position === 0 || position === 3) ? '3:2' : '5:6'
}
 