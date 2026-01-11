import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://phlccyxgyftspxnuzttf.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')

/**
 * Helper: Extract default values from JSON Schema format
 * Converts { "field": { "type": "string", "default": "value" } } to { "field": "value" }
 */
function extractDefaultsFromSchema(settings_schema: Record<string, any>): Record<string, any> {
  const defaults: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(settings_schema)) {
    if (value && typeof value === 'object' && 'default' in value) {
      // JSON Schema format: { type, default, label, ... }
      defaults[key] = value.default
    } else {
      // Flat format fallback (for backwards compatibility)
      defaults[key] = value
    }
  }
  
  return defaults
}

/**
 * GET - Fetch user_website_sections with settings_schema and config
 * 
 * JSON SCHEMA PATTERN:
 * - settings_schema (from website_template_sections): JSON Schema format (form definition)
 *   { "title": { "type": "string", "default": "New Arrivals", "label": "Section Title" } }
 * - config (in user_website_sections): Complete flat values with ALL fields
 *   { "title": "New Arrivals" }
 * - Website displays data from config ONLY
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const sectionType = searchParams.get('sectionType')
  const includeSchema = searchParams.get('includeSchema') !== 'false' // Default true

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  try {
    // First get the user's website with template info
    const { data: website, error: websiteError } = await supabase
      .from('user_websites')
      .select('id, template_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (websiteError || !website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 })
    }

    // Build query to get user sections with template section data (schema, default_config)
    let query = supabase
      .from('user_website_sections')
      .select(`
        id,
        section_type,
        section_label,
        config,
        is_enabled,
        display_order,
        template_section_id,
        created_at,
        updated_at
      `)
      .eq('user_website_id', website.id)
      .order('display_order', { ascending: true })

    if (sectionType) {
      query = query.eq('section_type', sectionType)
    }

    const { data: userSections, error } = await query

    if (error) {
      console.error('Error fetching sections:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If we need schema info, fetch template sections
    let sectionsWithSchema = userSections || []
    
    if (includeSchema && userSections && userSections.length > 0) {
      const templateSectionIds = userSections.map(s => s.template_section_id).filter(Boolean)
      
      if (templateSectionIds.length > 0) {
        const { data: templateSections } = await supabase
          .from('website_template_sections')
          .select('id, settings_schema, section_label, description')
          .in('id', templateSectionIds)

        const templateMap = new Map(templateSections?.map(ts => [ts.id, ts]) || [])

        sectionsWithSchema = userSections.map(section => {
          const templateSection = templateMap.get(section.template_section_id)
          // settings_schema = JSON Schema format (form definition)
          const settings_schema = templateSection?.settings_schema || {}
          // config = complete actual values (ALL fields for display)
          const config = section.config || {}
          
          // Extract defaults for backwards compatibility (if config is empty)
          const finalConfig = Object.keys(config).length > 0 
            ? config 
            : extractDefaultsFromSchema(settings_schema)
          
          return {
            ...section,
            settings_schema: settings_schema,
            config: finalConfig,  // Website uses config ONLY for display
            template_label: templateSection?.section_label,
            description: templateSection?.description,
          }
        })
      }
    }

    return NextResponse.json({ 
      sections: sectionsWithSchema,
      website_id: website.id,
      template_id: website.template_id,
    })
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
 