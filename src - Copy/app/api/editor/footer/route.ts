import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://phlccyxgyftspxnuzttf.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')

// Get footer data from user_website_sections config
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
      return NextResponse.json({ error: 'Website not found' }, { status: 404 })
    }

    // Get footer section
    const { data: section, error: sectionError } = await supabase
      .from('user_website_sections')
      .select('config')
      .eq('user_website_id', website.id)
      .eq('section_type', 'footer')
      .single()

    if (sectionError) {
      // Return default footer data if section not found
      return NextResponse.json({
        footer: {
          About: ['Our Story', 'Our Shop', 'Careers', 'Press'],
          Shop: [],
          'Customer Care': ['FAQs', 'Contact Us', 'Shipping & Returns', 'Warranty'],
        }
      })
    }

    return NextResponse.json({ footer: section?.config?.footer || {} })
  } catch (e: any) {
    console.error('Error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// Update footer data in user_website_sections config
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, footer } = body

    if (!userId || !footer) {
      return NextResponse.json(
        { error: 'userId and footer are required' },
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

    // Get current section config
    const { data: currentSection } = await supabase
      .from('user_website_sections')
      .select('config')
      .eq('user_website_id', website.id)
      .eq('section_type', 'footer')
      .single()

    // Merge footer data into config
    const newConfig = {
      ...(currentSection?.config || {}),
      footer,
    }

    const { data, error } = await supabase
      .from('user_website_sections')
      .update({ config: newConfig })
      .eq('user_website_id', website.id)
      .eq('section_type', 'footer')
      .select()
      .single()

    if (error) {
      console.error('Error updating footer:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, section: data })
  } catch (e: any) {
    console.error('Error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
