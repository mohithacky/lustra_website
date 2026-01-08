import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://phlccyxgyftspxnuzttf.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Use service key if available, otherwise anon key
const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string
    const collectionName = formData.get('collectionName') as string
    const collectionType = formData.get('collectionType') as string // 'category', 'hero', 'trending'

    if (!file || !userId) {
      return NextResponse.json(
        { error: 'file and userId are required' },
        { status: 400 }
      )
    }

    console.log('[Upload] Uploading file for user:', userId, 'collection:', collectionName, 'type:', collectionType)

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Determine bucket and filename based on collection type (matching Flutter)
    const safeName = (collectionName || 'collection').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    const extension = file.name.split('.').pop() || 'png'
    
    let bucketName: string
    let filename: string
    
    if (collectionType === 'category') {
      // Categories use category-images bucket with simple naming: userId/categoryName.ext
      bucketName = 'category-images'
      filename = `${userId}/${safeName}.${extension}`
    } else {
      // Collections (hero/trending) use collection-banners bucket
      bucketName = 'collection-banners'
      filename = `${userId}/${safeName}.${extension}`
    }

    console.log('[Upload] Uploading to bucket:', bucketName, 'path:', filename)

    // Upload to Supabase Storage
    const uploadResult = await supabase.storage
      .from(bucketName)
      .upload(filename, buffer, {
        contentType: file.type || 'image/png',
        upsert: true,
      })

    if (uploadResult.error) {
      console.error('[Upload] Error uploading file:', uploadResult.error)
      return NextResponse.json({ 
        error: uploadResult.error.message,
        details: `Failed to upload to ${bucketName} bucket. The bucket may not exist or you may not have permission.`
      }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filename)

    console.log('[Upload] Success, URL:', urlData.publicUrl)

    return NextResponse.json({ 
      success: true, 
      url: urlData.publicUrl,
      path: uploadResult.data?.path 
    })
  } catch (e: any) {
    console.error('[Upload] Error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
