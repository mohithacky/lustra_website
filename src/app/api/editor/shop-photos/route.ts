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

    // Get shop photos from user_website_sections config
    const { data: section, error: sectionError } = await supabase
      .from('user_website_sections')
      .select('config')
      .eq('user_website_id', website.id)
      .eq('section_type', 'our_shop')
      .single()

    if (sectionError || !section) {
      return NextResponse.json({ photos: [] })
    }

    return NextResponse.json({ photos: section?.config?.photos || [] })
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

    // Check if section exists
    const { data: existingSection } = await supabase
      .from('user_website_sections')
      .select('id, config')
      .eq('user_website_id', website.id)
      .eq('section_type', 'our_shop')
      .single()

    const newConfig = {
      ...(existingSection?.config || {}),
      photos: photos || [],
    }

    if (existingSection) {
      // Update existing section
      const { data, error } = await supabase
        .from('user_website_sections')
        .update({ config: newConfig })
        .eq('user_website_id', website.id)
        .eq('section_type', 'our_shop')
        .select()
        .single()

      if (error) {
        console.error('Error updating shop photos:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, section: data })
    } else {
      // Create new section - need to get template_section_id for our_shop
      // First get the user's website template_id
      const { data: websiteData } = await supabase
        .from('user_websites')
        .select('template_id')
        .eq('id', website.id)
        .single()

      if (!websiteData?.template_id) {
        return NextResponse.json({ error: 'Website template not found' }, { status: 404 })
      }

      // Get the template section for our_shop
      const { data: templateSection } = await supabase
        .from('website_template_sections')
        .select('id, section_label')
        .eq('template_id', websiteData.template_id)
        .eq('section_type', 'our_shop')
        .single()

      if (!templateSection) {
        return NextResponse.json({ error: 'Template section for our_shop not found' }, { status: 404 })
      }

      const { data, error } = await supabase
        .from('user_website_sections')
        .insert({
          user_website_id: website.id,
          template_section_id: templateSection.id,
          section_type: 'our_shop',
          section_label: templateSection.section_label,
          is_enabled: true,
          display_order: 999,
          config: newConfig,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating shop photos section:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, section: data })
    }
  } catch (e: any) {
    console.error('Error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
