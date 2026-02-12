import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://phlccyxgyftspxnuzttf.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')

// Toggle page is_active status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, slug, isActive } = body

    if (!userId || !slug || typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'userId, slug, and isActive are required' },
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

    // Update the page's is_active status
    const { data, error } = await supabase
      .from('user_website_pages')
      .update({ is_active: isActive })
      .eq('user_website_id', website.id)
      .eq('slug', slug)
      .select()
      .single()

    if (error) {
      console.error('Error updating page status:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, page: data })
  } catch (e: any) {
    console.error('Error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// Get page status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const slug = searchParams.get('slug')

  if (!userId || !slug) {
    return NextResponse.json({ error: 'userId and slug are required' }, { status: 400 })
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
      return NextResponse.json({ isActive: true }) // Default to active if not found
    }

    // Get the page's is_active status
    const { data: page, error: pageError } = await supabase
      .from('user_website_pages')
      .select('is_active')
      .eq('user_website_id', website.id)
      .eq('slug', slug)
      .single()

    if (pageError || !page) {
      return NextResponse.json({ isActive: true }) // Default to active if not found
    }

    return NextResponse.json({ isActive: page.is_active })
  } catch (e: any) {
    console.error('Error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
