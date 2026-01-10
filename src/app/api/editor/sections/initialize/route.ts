import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * POST - Initialize user_website_sections for a new user
 * 
 * This endpoint creates section entries for a user based on their website's template.
 * Each section gets empty config ({}), which means it will use schema defaults.
 * 
 * Multi-tenant Pattern:
 * - schema (from website_template_sections): DEFAULT values (same structure as config)
 * - config (in user_website_sections): User's CUSTOM values (overrides schema defaults)
 * - merged_config: { ...schema, ...user_config }
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

    // Step 4: Create missing sections with empty config (will use template defaults)
    const sectionsToCreate = templateSections
      .filter(ts => !existingSectionIds.has(ts.id))
      .map(ts => ({
        user_website_id: website.id,
        template_section_id: ts.id,
        section_type: ts.section_type,
        section_label: ts.section_label,
        config: {}, // Empty config = use template defaults
        is_enabled: ts.is_enabled_by_default,
        display_order: ts.display_order,
      }))

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

    // Transform to include schema and merged config
    const sectionsWithSchema = allUserSections?.map(section => {
      const templateSection = templateSectionMap.get(section.template_section_id)
      // schema = template defaults (same structure as config)
      const schema = templateSection?.schema || {}
      // user config = user's custom overrides
      const userConfig = section.config || {}
      
      return {
        id: section.id,
        section_type: section.section_type,
        section_label: section.section_label || templateSection?.section_label,
        is_enabled: section.is_enabled,
        display_order: section.display_order,
        schema: schema,
        config: userConfig,
        // Merged config: schema defaults + user overrides
        merged_config: {
          ...schema,
          ...userConfig,
        },
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
