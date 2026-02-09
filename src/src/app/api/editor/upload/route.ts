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

    if (!file || !userId) {
      return NextResponse.json(
        { error: 'file and userId are required' },
        { status: 400 }
      )
    }

    console.log('[Upload] Uploading file for user:', userId, 'collection:', collectionName)

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const timestamp = Date.now()
    const safeName = (collectionName || 'collection').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const extension = file.name.split('.').pop() || 'png'
    const filename = `${userId}/${safeName}_${timestamp}.${extension}`

    // Try to upload to 'collection-banners' bucket first, fallback to 'website-images' if it doesn't exist
    let uploadResult = await supabase.storage
      .from('collection-banners')
      .upload(filename, buffer, {
        contentType: file.type || 'image/png',
        upsert: true,
      })

    let bucketName = 'collection-banners'
    
    // If bucket doesn't exist, try website-images bucket
    if (uploadResult.error?.message?.includes('not found') || uploadResult.error?.message?.includes('Bucket')) {
      console.log('[Upload] collection-banners bucket not found, trying website-images')
      bucketName = 'website-images'
      uploadResult = await supabase.storage
        .from('website-images')
        .upload(filename, buffer, {
          contentType: file.type || 'image/png',
          upsert: true,
        })
    }

    if (uploadResult.error) {
      console.error('[Upload] Error uploading file:', uploadResult.error)
      return NextResponse.json({ 
        error: uploadResult.error.message,
        details: 'Failed to upload to storage. The bucket may not exist or you may not have permission.'
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
 