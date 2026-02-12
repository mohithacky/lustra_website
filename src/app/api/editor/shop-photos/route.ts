import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://phlccyxgyftspxnuzttf.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')

// Get shop photos
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  try {
    // Get the user's website
    const { data: website, error: websiteError } = await supabase
      .from('user_websites')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (websiteError || !website) {
      return NextResponse.json({ photos: [] })
    }

    // Get shop photos from user_website_pages (our-shop page)
    const { data: page, error: pageError } = await supabase
      .from('user_website_pages')
      .select('photos')
      .eq('user_website_id', website.id)
      .eq('slug', 'our-shop')
      .single()

    if (pageError || !page) {
      return NextResponse.json({ photos: [] })
    }

    return NextResponse.json({ photos: page?.photos || [] })
  } catch (e: any) {
    console.error('Error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// Update shop photos
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, photos } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Get the user's website
    const { data: website, error: websiteError } = await supabase
      .from('user_websites')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (websiteError || !website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 })
    }

    // Update photos in user_website_pages (our-shop page)
    const { data, error } = await supabase
      .from('user_website_pages')
      .update({ photos: photos || [] })
      .eq('user_website_id', website.id)
      .eq('slug', 'our-shop')
      .select()
      .single()

    if (error) {
      console.error('Error updating shop photos:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, page: data })
  } catch (e: any) {
    console.error('Error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
