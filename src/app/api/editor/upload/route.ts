import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://phlccyxgyftspxnuzttf.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')

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

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const timestamp = Date.now()
    const safeName = (collectionName || 'collection').toLowerCase().replace(/\s+/g, '-')
    const extension = file.name.split('.').pop() || 'png'
    const filename = `${userId}/${safeName}_${timestamp}.${extension}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('collection-banners')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (error) {
      console.error('Error uploading file:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('collection-banners')
      .getPublicUrl(filename)

    return NextResponse.json({ 
      success: true, 
      url: urlData.publicUrl,
      path: data.path 
    })
  } catch (e: any) {
    console.error('Error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
