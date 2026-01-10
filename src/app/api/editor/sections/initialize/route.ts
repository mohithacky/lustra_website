import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Helper: Extract default values from JSON Schema format
 * Converts { "field": { "type": "string", "default": "value" } } to { "field": "value" }
 */
function extractDefaultsFromSchema(schema: Record<string, any>): Record<string, any> {
  const defaults: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(schema)) {
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
 * POST - Initialize user_website_sections for a new user
 * 
 * This endpoint creates section entries for a user based on their website's template.
 * Each section gets config populated with default values from schema.
 * 
 * JSON SCHEMA PATTERN:
 * - schema (from website_template_sections): JSON Schema format (form definition)
 *   { "title": { "type": "string", "default": "New Arrivals", "label": "Section Title" } }
 * - config (in user_website_sections): Flat values (form data)
 *   { "title": "New Arrivals" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Step 1: Get or create user's website
    let { data: website, error: websiteError } = await supabase
      .from('user_websites')
      .select('id, template_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (websiteError || !website) {
      // Create a new website for the user with the default template
      const { data: defaultTemplate } = await supabase
        .from('website_templates')
        .select('id')
        .eq('slug', 'classic-jewelry')
        .single()

      if (!defaultTemplate) {
        return NextResponse.json({ error: 'Default template not found' }, { status: 500 })
      }

      const { data: newWebsite, error: createError } = await supabase
        .from('user_websites')
        .insert({
          user_id: userId,
          template_id: defaultTemplate.id,
          name: 'My Website',
          theme: 'light',
          is_active: true,
          is_primary: true,
        })
        .select('id, template_id')
        .single()

      if (createError || !newWebsite) {
        console.error('Error creating website:', createError)
        return NextResponse.json({ error: 'Failed to create website' }, { status: 500 })
      }

      website = newWebsite
      console.log(`Created new website for user ${userId}: ${website.id}`)
    }

    // Step 2: Get all template sections for this template
    const { data: templateSections, error: sectionsError } = await supabase
      .from('website_template_sections')
      .select('id, section_type, section_label, is_enabled_by_default, display_order, schema')
      .eq('template_id', website.template_id)
      .order('display_order', { ascending: true })

    if (sectionsError || !templateSections) {
      console.error('Error fetching template sections:', sectionsError)
      return NextResponse.json({ error: 'Failed to fetch template sections' }, { status: 500 })
    }

    // Step 3: Check which sections already exist for this user
    const { data: existingSections } = await supabase
      .from('user_website_sections')
      .select('template_section_id')
      .eq('user_website_id', website.id)

    const existingSectionIds = new Set(existingSections?.map(s => s.template_section_id) || [])

    // Step 4: Create missing sections with config populated from schema defaults
    const sectionsToCreate = templateSections
      .filter(ts => !existingSectionIds.has(ts.id))
      .map(ts => {
        // Extract default values from JSON Schema format
        const configDefaults = extractDefaultsFromSchema(ts.schema || {})
        
        return {
          user_website_id: website.id,
          template_section_id: ts.id,
          section_type: ts.section_type,
          section_label: ts.section_label,
          config: configDefaults, // Config populated with schema defaults
          is_enabled: ts.is_enabled_by_default,
          display_order: ts.display_order,
        }
      })

    if (sectionsToCreate.length > 0) {
      const { error: insertError } = await supabase
        .from('user_website_sections')
        .insert(sectionsToCreate)

      if (insertError) {
        console.error('Error creating sections:', insertError)
        return NextResponse.json({ error: 'Failed to create sections' }, { status: 500 })
      }

      console.log(`Created ${sectionsToCreate.length} sections for website ${website.id}`)
    }

    // Step 5: Fetch all user sections
    const { data: allUserSections, error: fetchError } = await supabase
      .from('user_website_sections')
      .select('id, section_type, section_label, config, is_enabled, display_order, template_section_id')
      .eq('user_website_id', website.id)
      .order('display_order', { ascending: true })

    if (fetchError) {
      console.error('Error fetching user sections:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 })
    }

    // Step 6: Fetch template sections for schema (defaults)
    const templateSectionIds = allUserSections?.map(s => s.template_section_id).filter(Boolean) || []
    
    let templateSectionMap = new Map<string, any>()
    if (templateSectionIds.length > 0) {
      const { data: templateSectionsData } = await supabase
        .from('website_template_sections')
        .select('id, schema, section_label, description')
        .in('id', templateSectionIds)
      
      templateSectionsData?.forEach(ts => {
        templateSectionMap.set(ts.id, ts)
      })
    }

    // Transform to include schema and config
    const sectionsWithSchema = allUserSections?.map(section => {
      const templateSection = templateSectionMap.get(section.template_section_id)
      // schema = JSON Schema format (form definition)
      const schema = templateSection?.schema || {}
      // config = actual values (form data)
      const config = section.config || {}
      
      // Extract defaults for backwards compatibility (if config is empty)
      const schemaDefaults = extractDefaultsFromSchema(schema)
      const finalConfig = Object.keys(config).length > 0 
        ? { ...schemaDefaults, ...config } 
        : schemaDefaults
      
      return {
        id: section.id,
        section_type: section.section_type,
        section_label: section.section_label || templateSection?.section_label,
        is_enabled: section.is_enabled,
        display_order: section.display_order,
        schema: schema,
        config: finalConfig,
        description: templateSection?.description,
      }
    }) || []

    return NextResponse.json({
      success: true,
      website_id: website.id,
      template_id: website.template_id,
      sections: sectionsWithSchema,
      created_count: sectionsToCreate.length,
      total_count: sectionsWithSchema.length,
    })

  } catch (error) {
    console.error('Error in initialize sections:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
