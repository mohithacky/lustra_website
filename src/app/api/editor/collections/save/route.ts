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

    if (collectionType === 'hero') {
      // Get current max display order (matching Flutter's addHeroCollection)
      const { data: existing } = await supabase
        .from('user_hero_collections')
        .select('display_order')
        .eq('user_id', shopId)
        .order('display_order', { ascending: false })
        .limit(1)

      const maxOrder = existing && existing.length > 0 ? (existing[0].display_order || 0) : 0

      // Check if collection with same name exists
      const { data: existingCollection } = await supabase
        .from('user_hero_collections')
        .select('id')
        .eq('user_id', shopId)
        .eq('name', collectionName)
        .single()

      if (existingCollection) {
        // Update existing collection image
        const { error: updateError } = await supabase
          .from('user_hero_collections')
          .update({ 
            image_url: `${imageUrl}?v=${Date.now()}` // Add cache buster like Flutter
          })
          .eq('user_id', shopId)
          .eq('name', collectionName)

        if (updateError) {
          console.error('Update error:', updateError)
          return NextResponse.json({ error: 'Failed to update collection' }, { status: 500 })
        }
      } else {
        // Insert new hero collection (matching Flutter's addHeroCollection)
        const { error: insertError } = await supabase
          .from('user_hero_collections')
          .insert({
            user_id: shopId,
            name: collectionName,
            image_url: imageUrl,
            is_visible: true,
            display_order: maxOrder + 1
          })

        if (insertError) {
          console.error('Insert error:', insertError)
          return NextResponse.json({ error: 'Failed to save collection' }, { status: 500 })
        }
      }
    } else if (collectionType === 'trending') {
      // For trending collections (matching Flutter's setTrendingCollection)
      const targetPosition = position ?? 0
      const targetAspectRatio = aspectRatio || getAspectRatioForPosition(targetPosition)

      // Check if position is already taken
      const { data: existingAtPosition } = await supabase
        .from('user_trending_collections')
        .select('id')
        .eq('user_id', shopId)
        .eq('position', targetPosition)
        .single()

      if (existingAtPosition) {
        // Update existing
        const { error: updateError } = await supabase
          .from('user_trending_collections')
          .update({
            name: collectionName,
            image_url: `${imageUrl}?v=${Date.now()}`,
            aspect_ratio: targetAspectRatio
          })
          .eq('user_id', shopId)
          .eq('position', targetPosition)

        if (updateError) {
          console.error('Update error:', updateError)
          return NextResponse.json({ error: 'Failed to update trending collection' }, { status: 500 })
        }
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from('user_trending_collections')
          .insert({
            user_id: shopId,
            name: collectionName,
            image_url: imageUrl,
            position: targetPosition,
            aspect_ratio: targetAspectRatio,
            is_visible: true
          })

        if (insertError) {
          console.error('Insert error:', insertError)
          return NextResponse.json({ error: 'Failed to save trending collection' }, { status: 500 })
        }
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
