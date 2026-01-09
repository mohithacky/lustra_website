import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - Fetch a page by slug for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const slug = searchParams.get('slug')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Get user's website
    const { data: website, error: websiteError } = await supabase
      .from('user_websites')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (websiteError || !website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 })
    }

    // If slug is provided, get specific page
    if (slug) {
      const { data: page, error: pageError } = await supabase
        .from('user_website_pages')
        .select('*')
        .eq('user_website_id', website.id)
        .eq('slug', slug)
        .single()

      if (pageError) {
        // Page doesn't exist yet, return null (will use defaults)
        return NextResponse.json({ page: null })
      }

      return NextResponse.json({ page })
    }

    // Get all pages for the website
    const { data: pages, error: pagesError } = await supabase
      .from('user_website_pages')
      .select('*')
      .eq('user_website_id', website.id)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (pagesError) {
      return NextResponse.json({ error: pagesError.message }, { status: 500 })
    }

    return NextResponse.json({ pages })
  } catch (error) {
    console.error('Error fetching pages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update page content
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, slug, title, content } = body

    if (!userId || !slug) {
      return NextResponse.json({ error: 'userId and slug are required' }, { status: 400 })
    }

    // Get user's website
    const { data: website, error: websiteError } = await supabase
      .from('user_websites')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (websiteError || !website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 })
    }

    // Check if page exists
    const { data: existingPage } = await supabase
      .from('user_website_pages')
      .select('id')
      .eq('user_website_id', website.id)
      .eq('slug', slug)
      .single()

    if (existingPage) {
      // Update existing page
      const { data: updatedPage, error: updateError } = await supabase
        .from('user_website_pages')
        .update({
          title: title || undefined,
          content: content || undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPage.id)
        .select()
        .single()

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      return NextResponse.json({ page: updatedPage, message: 'Page updated successfully' })
    } else {
      // Create new page
      const { data: newPage, error: createError } = await supabase
        .from('user_website_pages')
        .insert({
          user_website_id: website.id,
          slug,
          title: title || slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          content: content || '',
          page_type: 'static',
          is_active: true,
        })
        .select()
        .single()

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 500 })
      }

      return NextResponse.json({ page: newPage, message: 'Page created successfully' })
    }
  } catch (error) {
    console.error('Error updating page:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
