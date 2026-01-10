import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - Test endpoint to check if table exists and has data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

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
      return NextResponse.json({ 
        error: 'Website not found',
        details: websiteError 
      }, { status: 404 })
    }

    // Check if user_website_pages table exists and get all pages
    const { data: pages, error: pagesError } = await supabase
      .from('user_website_pages')
      .select('*')
      .eq('user_website_id', website.id)

    if (pagesError) {
      return NextResponse.json({ 
        error: 'Error fetching pages - table might not exist',
        details: pagesError,
        websiteId: website.id
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      websiteId: website.id,
      pageCount: pages?.length || 0,
      pages: pages || []
    })
  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
