/**
 * New Architecture Supabase Client
 * 
 * Runtime Rendering Flow (from diagram):
 * 1. Load user_website
 * 2. Get template_id
 * 3. Load website_template_sections (defaults)
 * 4. Load user_website_sections (overrides)
 * 5. Merge: final_config = default_config + config
 * 6. If section needs data → fetch from collections
 * 7. Render section
 * 
 * Golden Rule:
 * - WHAT goes in TABLES: collections, business data, user-generated content
 * - HOW goes in CONFIG (JSON): layout, variant, limits, visibility, behavior
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://phlccyxgyftspxnuzttf.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_tMc-l2KRHyKOXlR0tODIPw_VhBH-w5R'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('[SUPABASE] Using fallback hardcoded credentials. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel environment variables.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

// ============================================================================
// Types
// ============================================================================

export interface UserData {
  id: string
  shop_name: string | null
  shop_address: string | null
  phone_number: string | null
  email: string | null
  instagram_id: string | null
  logo_url: string | null
  shop_domain: string | null
}

export interface WebsiteTemplate {
  id: string
  name: string
  slug: string
  description: string | null
  thumbnail_url: string | null
  default_theme: string
  color_scheme: Record<string, any>
  font_config: Record<string, any>
  is_active: boolean
  is_premium: boolean
  display_order: number
}

export interface WebsiteTemplateSection {
  id: string
  template_id: string
  section_type: string
  section_label: string
  description: string | null
  default_config: Record<string, any>
  schema: Record<string, any>
  variant: string | null
  is_required: boolean
  is_enabled_by_default: boolean
  display_order: number
  icon: string | null
}

export interface UserWebsite {
  id: string
  user_id: string
  template_id: string
  name: string
  theme: 'light' | 'dark'
  color_scheme: Record<string, any>
  font_config: Record<string, any>
  is_active: boolean
  is_primary: boolean
  website_type: string | null
  website_url: string | null
  meta_title: string | null
  meta_description: string | null
  created_at: string
  updated_at: string
  published_at: string | null
}

export interface UserWebsiteSection {
  id: string
  user_website_id: string
  template_section_id: string
  section_type: string
  section_label: string | null
  config: Record<string, any>
  is_enabled: boolean
  display_order: number | null
  created_at: string
  updated_at: string
}

export interface Collection {
  id: string
  user_id: string
  name: string
  slug: string | null
  image_url: string | null
  collection_label: string
  display_order: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface MergedSection {
  section_type: string
  section_label: string
  is_enabled: boolean
  display_order: number
  schema: Record<string, any>        // From template: DEFAULT values (same structure as config)
  config: Record<string, any>        // Merged: { ...schema, ...user_config }
  collections?: Collection[]         // Fetched collections based on section_type
}

export interface WebsiteRenderData {
  user: UserData
  website: UserWebsite
  template: WebsiteTemplate
  sections: MergedSection[]
}

// ============================================================================
// Step 1: Get user by domain
// ============================================================================
export async function getWebsiteByDomain(domain: string): Promise<UserData | null> {
  // Convert to lowercase to match Flutter's behavior
  const normalizedDomain = domain.toLowerCase()
  console.log(`[DB] Querying users table with shop_domain='${normalizedDomain}'`)
  
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      shop_name,
      shop_address,
      phone_number,
      email,
      instagram_id,
      logo_url,
      shop_domain
    `)
    .eq('shop_domain', normalizedDomain)
    .single()

  if (error) {
    console.error(`[DB ERROR] Failed to fetch user by domain '${normalizedDomain}':`, JSON.stringify(error))
    return null
  }

  console.log(`[DB SUCCESS] Found user: id=${data.id}, shop_name=${data.shop_name}`)
  return data as UserData
}

// ============================================================================
// Step 2: Get user's primary website
// ============================================================================
export async function getUserWebsite(userId: string): Promise<UserWebsite | null> {
  console.log(`[DB] Querying user_websites for user_id='${userId}' (is_active=true, is_primary=true)`)
  
  const { data, error } = await supabase
    .from('user_websites')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .eq('is_primary', true)
    .single()

  if (error) {
    console.log(`[DB] Primary website query failed, trying fallback without is_primary filter...`)
    // Try without is_primary filter (for users who might not have primary set)
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('user_websites')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (fallbackError) {
      console.error(`[DB ERROR] Failed to fetch user_websites for user '${userId}':`, JSON.stringify(fallbackError))
      return null
    }
    console.log(`[DB SUCCESS] Found website (fallback): id=${fallbackData.id}, template_id=${fallbackData.template_id}`)
    return fallbackData as UserWebsite
  }

  console.log(`[DB SUCCESS] Found website: id=${data.id}, template_id=${data.template_id}, is_primary=${data.is_primary}`)
  return data as UserWebsite
}

// ============================================================================
// Step 3: Get template and its sections
// ============================================================================
export async function getWebsiteTemplate(templateId: string): Promise<WebsiteTemplate | null> {
  console.log(`[DB] Querying website_templates for id='${templateId}'`)
  
  const { data, error } = await supabase
    .from('website_templates')
    .select('*')
    .eq('id', templateId)
    .single()

  if (error) {
    console.error(`[DB ERROR] Failed to fetch template '${templateId}':`, JSON.stringify(error))
    return null
  }

  console.log(`[DB SUCCESS] Found template: name=${data.name}, slug=${data.slug}`)
  return data as WebsiteTemplate
}

export async function getTemplateSections(templateId: string): Promise<WebsiteTemplateSection[]> {
  console.log(`[DB] Querying website_template_sections for template_id='${templateId}'`)
  
  const { data, error } = await supabase
    .from('website_template_sections')
    .select('*')
    .eq('template_id', templateId)
    .order('display_order', { ascending: true })

  if (error) {
    console.error(`[DB ERROR] Failed to fetch template sections:`, JSON.stringify(error))
    return []
  }

  console.log(`[DB SUCCESS] Found ${data?.length || 0} template sections`)
  if (data && data.length > 0) {
    console.log(`[DB] Section types: ${data.map(s => s.section_type).join(', ')}`)
  }
  return (data || []) as WebsiteTemplateSection[]
}

// ============================================================================
// Step 4: Get user's section customizations
// ============================================================================
export async function getUserWebsiteSections(userWebsiteId: string): Promise<UserWebsiteSection[]> {
  console.log(`[DB] Querying user_website_sections for user_website_id='${userWebsiteId}'`)
  
  const { data, error } = await supabase
    .from('user_website_sections')
    .select('*')
    .eq('user_website_id', userWebsiteId)

  if (error) {
    console.error(`[DB ERROR] Failed to fetch user_website_sections:`, JSON.stringify(error))
    return []
  }

  console.log(`[DB SUCCESS] Found ${data?.length || 0} user_website_sections`)
  if (data && data.length > 0) {
    console.log(`[DB] User section types: ${data.map(s => s.section_type).join(', ')}`)
  } else {
    console.log(`[DB WARNING] No user_website_sections found - will use template defaults`)
  }
  return (data || []) as UserWebsiteSection[]
}

// ============================================================================
// Step 5 & 6: Merge configs and fetch collections
// 
// Multi-tenant Pattern:
// - schema (from website_template_sections): DEFAULT values (same structure as config)
// - config (in user_website_sections): User's CUSTOM values (overrides schema defaults)
// - merged config: { ...schema, ...user_config }
// ============================================================================
export async function getMergedSections(
  templateSections: WebsiteTemplateSection[],
  userSections: UserWebsiteSection[],
  userId: string
): Promise<MergedSection[]> {
  const mergedSections: MergedSection[] = []
  
  // Create a map of user sections by template_section_id
  const userSectionMap = new Map<string, UserWebsiteSection>()
  for (const us of userSections) {
    userSectionMap.set(us.template_section_id, us)
  }

  for (const templateSection of templateSections) {
    const userSection = userSectionMap.get(templateSection.id)
    
    // schema = template defaults (same structure as config)
    const schema = templateSection.schema || {}
    
    // user config = user's custom overrides (empty {} = use all defaults)
    const userConfig = userSection?.config || {}
    
    // Merge: schema (defaults) + user config (overrides)
    const mergedConfig = {
      ...schema,
      ...userConfig
    }

    mergedSections.push({
      section_type: templateSection.section_type,
      section_label: userSection?.section_label || templateSection.section_label,
      is_enabled: userSection?.is_enabled ?? templateSection.is_enabled_by_default,
      display_order: userSection?.display_order ?? templateSection.display_order,
      schema: schema,
      config: mergedConfig,
    })
  }

  // Fetch collections for each section based on section_type -> collection_label mapping
  const labelMap: Record<string, string> = {
    'hero': 'hero',
    'hero_carousel': 'hero',
    'trending': 'trending',
    'categories': 'category',
    'best_collections': 'best',
    'occasion_collections': 'occasion',
  }

  for (const section of mergedSections) {
    const label = labelMap[section.section_type]
    if (label) {
      section.collections = await getCollectionsByLabel(userId, label)
    }
  }

  // Sort by display_order
  mergedSections.sort((a, b) => a.display_order - b.display_order)

  return mergedSections
}

// ============================================================================
// Collection fetching functions
// ============================================================================
export async function getCollectionsByIds(ids: string[]): Promise<Collection[]> {
  if (ids.length === 0) return []

  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .in('id', ids)
    .eq('is_active', true)

  if (error) {
    console.error('Error fetching collections by IDs:', error)
    return []
  }

  return (data || []) as Collection[]
}

export async function getCollectionsByLabel(userId: string, label: string): Promise<Collection[]> {
  console.log(`[DB] Querying collections: user_id='${userId}', collection_label='${label}'`)
  
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('user_id', userId)
    .eq('collection_label', label)
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) {
    console.error(`[DB ERROR] Failed to fetch ${label} collections:`, JSON.stringify(error))
    return []
  }

  console.log(`[DB SUCCESS] Found ${data?.length || 0} ${label} collections`)
  if (data && data.length > 0) {
    console.log(`[DB] Collection names: ${data.map(c => c.name).join(', ')}`)
  }
  return (data || []) as Collection[]
}

export async function getAllUserCollections(userId: string): Promise<Collection[]> {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('collection_label', { ascending: true })
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching all user collections:', error)
    return []
  }

  return (data || []) as Collection[]
}

// ============================================================================
// Main function: Get complete website render data
// ============================================================================
export async function getWebsiteRenderData(domain: string): Promise<WebsiteRenderData | null> {
  console.log(`\n`)
  console.log(`================================================================`)
  console.log(`[RENDER] Starting getWebsiteRenderData for domain: "${domain}"`)
  console.log(`================================================================`)
  
  // Step 1: Get user by domain
  console.log(`\n[STEP 1] Fetching user by shop_domain...`)
  const user = await getWebsiteByDomain(domain)
  if (!user) {
    console.error(`[RENDER ERROR] User not found for domain: "${domain}"`)
    console.log(`[RENDER] FAILED - No user with shop_domain="${domain}" in users table`)
    return null
  }

  // Step 2: Get user's primary website
  console.log(`\n[STEP 2] Fetching user_websites for user_id="${user.id}"...`)
  const website = await getUserWebsite(user.id)
  if (!website) {
    console.error(`[RENDER ERROR] No user_websites found for user: ${user.id}`)
    console.log(`[RENDER] FAILED - User exists but has no entry in user_websites table`)
    return null
  }

  // Step 3: Get template
  console.log(`\n[STEP 3] Fetching template for template_id="${website.template_id}"...`)
  const template = await getWebsiteTemplate(website.template_id)
  if (!template) {
    console.error(`[RENDER ERROR] Template not found: ${website.template_id}`)
    console.log(`[RENDER] FAILED - Template does not exist`)
    return null
  }

  // Step 3b: Get template sections
  console.log(`\n[STEP 4] Fetching website_template_sections for template="${template.slug}"...`)
  const templateSections = await getTemplateSections(template.id)

  // Step 4: Get user's section customizations
  console.log(`\n[STEP 5] Fetching user_website_sections for website_id="${website.id}"...`)
  const userSections = await getUserWebsiteSections(website.id)

  // Step 5 & 6: Merge configs and fetch collections
  console.log(`\n[STEP 6] Merging sections and fetching collections for user_id="${user.id}"...`)
  const sections = await getMergedSections(templateSections, userSections, user.id)
  
  // ========== SUMMARY ==========
  console.log(`\n================================================================`)
  console.log(`[RENDER SUMMARY] Domain: ${domain}`)
  console.log(`================================================================`)
  console.log(`  User ID:              ${user.id}`)
  console.log(`  Shop Name:            ${user.shop_name}`)
  console.log(`  Website ID:           ${website.id}`)
  console.log(`  Template:             ${template.name} (${template.slug})`)
  console.log(`  Template Sections:    ${templateSections.length}`)
  console.log(`  User Sections:        ${userSections.length}`)
  console.log(`  Merged Sections:      ${sections.length}`)
  console.log(``)
  console.log(`  Collections by type:`)
  
  let totalCollections = 0
  for (const section of sections) {
    const count = section.collections?.length || 0
    totalCollections += count
    if (count > 0) {
      console.log(`    - ${section.section_type}: ${count} collections`)
    }
  }
  
  console.log(`  Total Collections:    ${totalCollections}`)
  console.log(`================================================================`)
  
  // Warnings for missing data
  if (templateSections.length === 0) {
    console.warn(`[WARNING] No template sections found! Run migration 033_create_default_template_sections.sql`)
  }
  if (totalCollections === 0) {
    console.warn(`[WARNING] No collections found! The website sections that need collections won't render.`)
    console.warn(`[WARNING] Either run onboarding again or manually insert collections into the collections table.`)
  }
  
  console.log(`[RENDER] SUCCESS - Data fetched, returning to page.tsx`)
  console.log(`================================================================\n`)

  return {
    user,
    website,
    template,
    sections,
  }
}

// ============================================================================
// Helper functions to extract specific section data
// ============================================================================

export function getSectionByType(sections: MergedSection[], sectionType: string): MergedSection | undefined {
  return sections.find(s => s.section_type === sectionType && s.is_enabled)
}

export function getHeroCollections(sections: MergedSection[]): Collection[] {
  const heroSection = getSectionByType(sections, 'hero') || getSectionByType(sections, 'hero_carousel')
  return heroSection?.collections || []
}

export function getTrendingCollections(sections: MergedSection[]): Collection[] {
  const trendingSection = getSectionByType(sections, 'trending')
  return trendingSection?.collections || []
}

export function getCategoryCollections(sections: MergedSection[]): Collection[] {
  const categoriesSection = getSectionByType(sections, 'categories')
  return categoriesSection?.collections || []
}

export function getBestCollections(sections: MergedSection[]): Collection[] {
  const bestSection = getSectionByType(sections, 'best_collections')
  return bestSection?.collections || []
}

export function getOccasionCollections(sections: MergedSection[]): Collection[] {
  const occasionSection = getSectionByType(sections, 'occasion_collections')
  return occasionSection?.collections || []
}

// ============================================================================
// Helper to get section config by type
// ============================================================================
export function getSectionConfig(sections: MergedSection[], sectionType: string): Record<string, any> {
  const section = getSectionByType(sections, sectionType)
  return section?.config || {}
}

export interface FooterGroup {
  title: string
  page_slugs: string[]
}

export interface FooterConfig {
  groups?: FooterGroup[]
  show_social_links?: boolean
  show_contact_info?: boolean
  show_copyright?: boolean
}

export interface WebsitePage {
  id: string
  user_website_id: string
  title: string
  slug: string
  page_type: string
  content?: string | null
  is_active: boolean
  display_order: number
}

export function getFooterConfig(sections: MergedSection[]): FooterConfig {
  const footerSection = getSectionByType(sections, 'footer')
  return footerSection?.config || {}
}

// Legacy function for backward compatibility - converts to old format
export function getFooterData(sections: MergedSection[]): Record<string, string[]> {
  const footerSection = getSectionByType(sections, 'footer')
  // Check for new structure (groups array)
  if (footerSection?.config?.groups) {
    const result: Record<string, string[]> = {}
    for (const group of footerSection.config.groups) {
      // Convert page slugs to display titles for backward compatibility
      result[group.title] = group.page_slugs.map((slug: string) => 
        slug.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
      )
    }
    return result
  }
  // Fallback to old structure
  return footerSection?.config?.footer || {}
}

export function getGoldRateData(sections: MergedSection[]): any {
  const goldRateSection = getSectionByType(sections, 'gold_rate')
  // Gold rate data is now stored in config since there's no content column
  return goldRateSection?.config?.gold_rate || null
}

export function isTestimonialsEnabled(sections: MergedSection[]): boolean {
  const testimonialsSection = getSectionByType(sections, 'testimonials')
  return Boolean(testimonialsSection?.is_enabled && testimonialsSection?.config?.show_testimonials !== false)
}

// ============================================================================
// Transform collections to legacy format (for backward compatibility)
// ============================================================================

export function transformHeroToLegacy(collections: Collection[]): Array<{
  id: string
  user_id: string
  name: string
  image_url: string
  is_visible: boolean
  display_order: number
  created_at: string
  updated_at: string
}> {
  return collections.map(c => ({
    id: c.id,
    user_id: c.user_id,
    name: c.name,
    image_url: c.image_url || '',
    is_visible: c.is_active,
    display_order: c.display_order,
    created_at: c.created_at || '',
    updated_at: c.updated_at || '',
  }))
}

export function transformTrendingToLegacy(collections: Collection[]): Array<{
  label: string
  image: string
  name?: string
}> {
  return collections.map((c, index) => ({
    label: c.name,
    image: c.image_url || '',
    name: c.name,
  }))
}

export function transformCategoriesToMap(collections: Collection[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const c of collections) {
    map[c.name] = c.image_url || ''
  }
  return map
}

export function transformBestToLegacy(collections: Collection[]): Array<{
  name: string
  image: string
  description: string
}> {
  return collections.map(c => ({
    name: c.name,
    image: c.image_url || '',
    description: `Discover the ${c.name} collection`,
  }))
}

// ============================================================================
// Fetch pages for a website
// ============================================================================
export async function getWebsitePages(userWebsiteId: string): Promise<WebsitePage[]> {
  const { data, error } = await supabase
    .from('user_website_pages')
    .select('*')
    .eq('user_website_id', userWebsiteId)
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) {
    console.log(`[DB] user_website_pages table may not exist yet, falling back to config-based footer`)
    return []
  }

  return (data || []) as WebsitePage[]
}

// ============================================================================
// Fetch a single page by slug
// ============================================================================
export async function getPageBySlug(userWebsiteId: string, slug: string): Promise<WebsitePage | null> {
  const { data, error } = await supabase
    .from('user_website_pages')
    .select('*')
    .eq('user_website_id', userWebsiteId)
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error) {
    console.log(`[DB] Page '${slug}' not found in user_website_pages table`)
    return null
  }

  return data as WebsitePage
}

// ============================================================================
// Fetch page content for a user by slug
// ============================================================================
export async function getPageContentForUser(userId: string, slug: string): Promise<WebsitePage | null> {
  // Get user's website
  const website = await getUserWebsite(userId)
  if (!website) return null

  // Fetch the page
  return getPageBySlug(website.id, slug)
}

// ============================================================================
// Helper function to build footer data from pages and config
// ============================================================================
async function buildFooterDataFromPages(
  footerConfig: FooterConfig,
  userWebsiteId: string
): Promise<Record<string, string[]>> {
  // Fetch pages from user_website_pages table
  const pages = await getWebsitePages(userWebsiteId)
  
  // Build footer data from pages based on config groups
  const result: Record<string, string[]> = {}
  
  if (footerConfig.groups && footerConfig.groups.length > 0) {
    for (const group of footerConfig.groups) {
      const groupPages: string[] = []
      
      for (const slug of group.page_slugs) {
        // Find the page by slug
        const page = pages.find(p => p.slug === slug)
        if (page) {
          groupPages.push(page.title)
        } else {
          // Page not in database yet, convert slug to title as fallback
          const title = slug.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ')
          groupPages.push(title)
        }
      }
      
      if (groupPages.length > 0) {
        result[group.title] = groupPages
      }
    }
  }
  
  return result
}

// ============================================================================
// Helper function to fetch footer data from pages (for all pages)
// ============================================================================
export async function getFooterDataFromPages(
  sections: MergedSection[],
  userWebsiteId: string
): Promise<Record<string, string[]>> {
  // Get footer config
  const footerConfig = getFooterConfig(sections)
  
  // If using new page-based architecture (groups with page_slugs)
  if (footerConfig.groups && footerConfig.groups.length > 0) {
    return buildFooterDataFromPages(footerConfig, userWebsiteId)
  }
  
  // Fallback to old config-based footer data
  return getFooterData(sections)
}

// ============================================================================
// Helper function to fetch footer data for any user (for non-home pages)
// ============================================================================
export async function getFooterDataForUser(userId: string): Promise<Record<string, string[]>> {
  // Get user's website
  const website = await getUserWebsite(userId)
  if (!website) return {}

  // Get template sections
  const templateSections = await getTemplateSections(website.template_id)
  
  // Get user sections
  const userSections = await getUserWebsiteSections(website.id)
  
  // Merge sections
  const mergedSections = await getMergedSections(templateSections, userSections, userId)
  
  // Use the new page-based footer data fetching
  return getFooterDataFromPages(mergedSections, website.id)
}
