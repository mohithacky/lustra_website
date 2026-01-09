import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://phlccyxgyftspxnuzttf.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')

// Get user_website_sections for a user
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const sectionType = searchParams.get('sectionType')

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  try {
    // First get the user's website
    const { data: website, error: websiteError } = await supabase
      .from('user_websites')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (websiteError || !website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 })
    }

    let query = supabase
      .from('user_website_sections')
      .select('*')
      .eq('user_website_id', website.id)
      .order('display_order', { ascending: true })

    if (sectionType) {
      query = query.eq('section_type', sectionType)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching sections:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ sections: data || [] })
  } catch (e: any) {
    console.error('Error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// Update a user_website_section config
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, sectionType, config, isEnabled } = body

    if (!userId || !sectionType) {
      return NextResponse.json(
        { error: 'userId and sectionType are required' },
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

    const updateData: Record<string, any> = {}
    if (config !== undefined) updateData.config = config
    if (isEnabled !== undefined) updateData.is_enabled = isEnabled

    const { data, error } = await supabase
      .from('user_website_sections')
      .update(updateData)
      .eq('user_website_id', website.id)
      .eq('section_type', sectionType)
      .select()
      .single()

    if (error) {
      console.error('Error updating section:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ section: data })
  } catch (e: any) {
    console.error('Error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
