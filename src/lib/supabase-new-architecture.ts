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
  settings_schema?: Record<string, any>
  is_required: boolean
  is_enabled_by_default: boolean
  display_order: number
  icon: string | null
  created_at?: string
  updated_at?: string
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
  settings_schema: Record<string, any>  // JSON Schema format (form definition)
  config: Record<string, any>           // Complete flat values (ALL fields for display)
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
// Helper: Extract default values from JSON Schema format
// Converts { "field": { "type": "string", "default": "value" } } to { "field": "value" }
// ============================================================================
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

// ============================================================================
// Step 5 & 6: Get configs and fetch collections
// 
// JSON SCHEMA PATTERN (Option A):
// - settings_schema (from website_template_sections): JSON Schema format defining form fields
//   { "title": { "type": "string", "default": "New Arrivals", "label": "Section Title" } }
// - config (in user_website_sections): Complete flat values with ALL fields
//   { "title": "New Arrivals" }
// - Website displays data from config ONLY (not from settings_schema)
// - For backwards compatibility, we extract defaults if config is empty
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
    
    // settings_schema = JSON Schema format (form definition)
    const settings_schema = templateSection.settings_schema || {}
    
    // config = complete actual values (ALL fields, for display)
    const config = userSection?.config || {}
    
    // For backwards compatibility: if config is empty, extract defaults from settings_schema
    const finalConfig = Object.keys(config).length > 0
      ? config
      : extractDefaultsFromSchema(settings_schema)

    mergedSections.push({
      section_type: templateSection.section_type,
      section_label: userSection?.section_label || templateSection.section_label,
      is_enabled: userSection?.is_enabled ?? templateSection.is_enabled_by_default,
      display_order: userSection?.display_order ?? templateSection.display_order,
      settings_schema: settings_schema,
      config: finalConfig,  // Website uses config ONLY for display
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
    'shop_by_product_type': 'product_type',
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
  const renderStart = Date.now()
  
  console.log(`\n` + '='.repeat(70))
  console.log(`[RENDER] 🚀 getWebsiteRenderData("${domain}")`)
  console.log(`[RENDER] Timestamp: ${new Date().toISOString()}`)
  console.log('='.repeat(70))
  
  // Step 1: Get user by domain (required first - everything depends on this)
  const step1Start = Date.now()
  const user = await getWebsiteByDomain(domain)
  const step1Time = Date.now() - step1Start
  console.log(`[RENDER] Step 1 - User lookup: ${step1Time}ms ${user ? '✅' : '❌'}`)
  
  if (!user) {
    console.error(`[RENDER] ❌ FAILED - No user with shop_domain="${domain}"`)
    return null
  }

  // Step 2: Get user's primary website (depends on user.id)
  const step2Start = Date.now()
  const website = await getUserWebsite(user.id)
  const step2Time = Date.now() - step2Start
  console.log(`[RENDER] Step 2 - Website lookup: ${step2Time}ms ${website ? '✅' : '❌'}`)
  
  if (!website) {
    console.error(`[RENDER] ❌ FAILED - No user_websites for user: ${user.id}`)
    return null
  }

  // Step 3: Get template (depends on website.template_id)
  const step3Start = Date.now()
  const template = await getWebsiteTemplate(website.template_id)
  const step3Time = Date.now() - step3Start
  console.log(`[RENDER] Step 3 - Template lookup: ${step3Time}ms ${template ? '✅' : '❌'}`)
  
  if (!template) {
    console.error(`[RENDER] ❌ FAILED - Template not found: ${website.template_id}`)
    return null
  }

  // Steps 4 & 5: PARALLEL - template sections + user sections (independent of each other)
  const step45Start = Date.now()
  const [templateSections, userSections] = await Promise.all([
    getTemplateSections(template.id),
    getUserWebsiteSections(website.id),
  ])
  const step45Time = Date.now() - step45Start
  console.log(`[RENDER] Steps 4+5 - Template sections + User sections (PARALLEL): ${step45Time}ms ✅`)
  console.log(`[RENDER]   Template sections: ${templateSections.length}, User sections: ${userSections.length}`)

  // Step 6: Merge configs and fetch collections
  const step6Start = Date.now()
  const sections = await getMergedSections(templateSections, userSections, user.id)
  const step6Time = Date.now() - step6Start
  console.log(`[RENDER] Step 6 - Merge + collections: ${step6Time}ms ✅`)
  
  const totalTime = Date.now() - renderStart
  
  // ========== SUMMARY ==========
  let totalCollections = 0
  for (const section of sections) {
    const count = section.collections?.length || 0
    totalCollections += count
  }
  
  console.log(`\n` + '-'.repeat(70))
  console.log(`[RENDER] 📊 SUMMARY for "${domain}"`)
  console.log('-'.repeat(70))
  console.log(`[RENDER]   User: ${user.shop_name} (${user.id})`)
  console.log(`[RENDER]   Website: ${website.id}`)
  console.log(`[RENDER]   Template: ${template.name} (${template.slug})`)
  console.log(`[RENDER]   Sections: ${sections.length} merged, ${totalCollections} total collections`)
  console.log('-'.repeat(70))
  console.log(`[RENDER] ⏱️  TIMING BREAKDOWN:`)
  console.log(`[RENDER]   Step 1 (user):              ${step1Time}ms`)
  console.log(`[RENDER]   Step 2 (website):           ${step2Time}ms`)
  console.log(`[RENDER]   Step 3 (template):          ${step3Time}ms`)
  console.log(`[RENDER]   Steps 4+5 (sections):       ${step45Time}ms (parallel)`)
  console.log(`[RENDER]   Step 6 (merge+collections): ${step6Time}ms`)
  console.log(`[RENDER]   ─────────────────────────────`)
  console.log(`[RENDER]   TOTAL:                      ${totalTime}ms`)
  console.log('-'.repeat(70))
  
  if (totalTime > 500) {
    console.warn(`[RENDER] ⚠️ Slow render data fetch (${totalTime}ms > 500ms threshold)`)
  } else {
    console.log(`[RENDER] ✅ Fast render data fetch (${totalTime}ms)`)
  }
  
  // Warnings for missing data
  if (templateSections.length === 0) {
    console.warn(`[RENDER] ⚠️ No template sections found! Run migration 033_create_default_template_sections.sql`)
  }
  if (totalCollections === 0) {
    console.warn(`[RENDER] ⚠️ No collections found! Sections that need collections won't render.`)
  }
  
  console.log('='.repeat(70) + '\n')

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

export function getProductTypeCollections(sections: MergedSection[]): Collection[] {
  const productTypeSection = getSectionByType(sections, 'shop_by_product_type')
  return productTypeSection?.collections || []
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

// Get footer data directly from config - matches pattern of other sections
export function getFooterData(sections: MergedSection[]): Record<string, string[]> {
  const footerSection = getSectionByType(sections, 'footer')
  
  if (!footerSection?.config) {
    console.log('[getFooterData] No footer section or config found')
    return {}
  }
  
  console.log('[getFooterData] Footer config keys:', Object.keys(footerSection.config))
  
  // Footer config structure: { columns: { "Help": [...], "Shop": [...] }, socialLinks: {...}, ... }
  // Extract the columns object which contains the actual footer sections
  const columns = footerSection.config.columns
  
  if (!columns || typeof columns !== 'object') {
    console.log('[getFooterData] No columns found in footer config')
    return {}
  }
  
  // Filter out any metadata keys and return only the footer section data
  const result: Record<string, string[]> = {}
  
  for (const [key, value] of Object.entries(columns)) {
    // Only include actual footer sections (arrays of strings)
    if (Array.isArray(value) && value.every(item => typeof item === 'string')) {
      result[key] = value
    }
  }
  
  console.log('[getFooterData] Footer sections found:', Object.keys(result))
  return result
}

export function getGoldRateData(sections: MergedSection[]): any {
  const goldRateSection = getSectionByType(sections, 'gold_rate')
  // Gold rate data is now stored in config since there's no content column
  return goldRateSection?.config?.gold_rate || null
}

export function isTestimonialsEnabled(sections: MergedSection[]): boolean {
  const testimonialsSection = getSectionByType(sections, 'testimonials')
  // Check if testimonials section is enabled in new architecture
  // If section exists and is enabled, and show_testimonials is not explicitly false
  return Boolean(testimonialsSection?.is_enabled && testimonialsSection?.config?.show_testimonials !== false)
}

// Also check legacy table for testimonials enabled status
export async function isTestimonialsEnabledLegacy(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_website_templates')
    .select('show_testimonials')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return false
  }

  return Boolean(data.show_testimonials)
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
  // Hardcoded description templates - each index gets a unique description.
  // If collections are replaced, the same template is reused with just the name swapped.
  const descriptionTemplates = [
    (name: string) => `Explore our exquisite ${name} collection, thoughtfully curated to bring elegance and sophistication to every occasion. Each piece is crafted with precision and designed to make a lasting impression.`,
    (name: string) => `Discover the timeless beauty of our ${name} collection. From classic designs to contemporary masterpieces, find the perfect piece that reflects your unique style and personality.`,
    (name: string) => `Indulge in the luxurious charm of our ${name} collection. Handpicked for quality and artistry, these stunning pieces are perfect for gifting or adding a touch of glamour to your everyday look.`,
    (name: string) => `Celebrate life's special moments with our ${name} collection. Featuring intricate craftsmanship and premium materials, each design tells a story of tradition, beauty, and modern elegance.`,
    (name: string) => `Unveil the allure of our ${name} collection, where heritage meets innovation. These carefully selected pieces blend traditional artistry with contemporary flair for a truly captivating experience.`,
    (name: string) => `Step into a world of refined taste with our ${name} collection. Designed for those who appreciate fine craftsmanship, every piece is a testament to quality, beauty, and enduring style.`,
  ]

  return collections.map((c, index) => {
    const templateIndex = index % descriptionTemplates.length
    return {
      name: c.name,
      image: c.image_url || '',
      description: descriptionTemplates[templateIndex](c.name),
    }
  })
}

// ============================================================================
// Get product types from collections table (collection_label='product_type')
// ============================================================================
export async function getProductTypes(userId: string): Promise<Collection[]> {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('user_id', userId)
    .eq('collection_label', 'product_type')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) {
    console.error(`[DB ERROR] Failed to fetch product_types for user ${userId}:`, error)
    return []
  }

  if (!data || data.length === 0) {
    console.log(`[DB] No product_types found for user ${userId}`)
    return []
  }

  return data as Collection[]
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
} // Added missing closing brace here

// ============================================================================
// Helper function to fetch footer data from pages (for all pages)
// ============================================================================
// Simplified footer data fetching - matches pattern of other sections
export async function getFooterDataFromPages(
  sections: MergedSection[],
  userWebsiteId: string
): Promise<Record<string, string[]>> {
  // Simply get footer data from config like other sections do
  const footerData = getFooterData(sections)
  
  console.log('[getFooterDataFromPages] Returning footer data with sections:', Object.keys(footerData))
  
  // If no data found in config, try legacy fallback
  if (Object.keys(footerData).length === 0) {
    console.log('[getFooterDataFromPages] No footer data in config, trying legacy table')
    return getLegacyFooterData(userWebsiteId)
  }
  
  // Filter out inactive pages
  console.log('\n[getFooterDataFromPages] === Starting page filtering ===')
  console.log('[getFooterDataFromPages] user_website_id:', userWebsiteId)
  
  const { data: pages, error } = await supabase
    .from('user_website_pages')
    .select('slug, is_active')
    .eq('user_website_id', userWebsiteId)
  
  if (error) {
    console.error('[getFooterDataFromPages] ❌ Error fetching page statuses:', error)
    return footerData
  }
  
  console.log('[getFooterDataFromPages] Pages fetched from DB:', pages?.length || 0)
  
  // Create a map of page slugs to their active status
  const pageStatusMap: Record<string, boolean> = {}
  pages?.forEach((page: any) => {
    pageStatusMap[page.slug] = page.is_active ?? true
    console.log(`[getFooterDataFromPages]   ${page.slug}: ${page.is_active ? '✓ ACTIVE' : '✗ INACTIVE'}`)
  })
  
  // Map of link text to slug
  const linkToSlugMap: Record<string, string> = {
    'Our Story': 'our-story',
    'Careers': 'careers',
    'Press': 'press',
    'Our Shop': 'our-shop',
    'Contact Us': 'contact',
    'FAQs': 'faqs',
    'Shipping & Returns': 'shipping-returns',
    'Warranty': 'warranty',
    'Privacy Policy': 'privacy',
    'Terms of Service': 'terms',
  }
  
  console.log('\n[getFooterDataFromPages] Filtering footer links...')
  console.log('[getFooterDataFromPages] Original footer sections:', Object.keys(footerData))
  
  // Filter out inactive pages from footer data
  const filteredFooterData: Record<string, string[]> = {}
  for (const [section, links] of Object.entries(footerData)) {
    console.log(`\n[getFooterDataFromPages] Section: "${section}"`)
    console.log(`[getFooterDataFromPages]   Original links (${links.length}):`, links)
    
    const activeLinks = links.filter(link => {
      const slug = linkToSlugMap[link]
      if (!slug) {
        console.log(`[getFooterDataFromPages]     "${link}" → no slug mapping, keeping`)
        return true // Keep links that don't map to pages
      }
      
      const isActive = pageStatusMap[slug] !== false
      const status = pageStatusMap[slug] === undefined ? 'not in DB (default active)' : (pageStatusMap[slug] ? 'ACTIVE' : 'INACTIVE')
      console.log(`[getFooterDataFromPages]     "${link}" → ${slug} → ${status} → ${isActive ? 'KEEP' : 'REMOVE'}`)
      
      return isActive // Keep if active or not found (default to active)
    })
    
    console.log(`[getFooterDataFromPages]   Filtered links (${activeLinks.length}):`, activeLinks)
    
    if (activeLinks.length > 0) {
      filteredFooterData[section] = activeLinks
    } else {
      console.log(`[getFooterDataFromPages]   ⚠ Section "${section}" removed (no active links)`)
    }
  }
  
  console.log('\n[getFooterDataFromPages] === Filtering complete ===')
  console.log('[getFooterDataFromPages] Final footer sections:', Object.keys(filteredFooterData))
  console.log('[getFooterDataFromPages] Total links before:', Object.values(footerData).flat().length)
  console.log('[getFooterDataFromPages] Total links after:', Object.values(filteredFooterData).flat().length)
  
  return filteredFooterData
}

// ============================================================================
// Get footer data from legacy user_website_templates table
// ============================================================================
async function getLegacyFooterData(userWebsiteId: string): Promise<Record<string, string[]>> {
  // First get user_id from user_websites
  const { data: websiteData, error: websiteError } = await supabase
    .from('user_websites')
    .select('user_id')
    .eq('id', userWebsiteId)
    .single()

  if (websiteError || !websiteData) {
    console.log(`[DB] Could not find user_websites entry for id=${userWebsiteId}`)
    return {}
  }

  // Then get footer from user_website_templates
  const { data, error } = await supabase
    .from('user_website_templates')
    .select('footer')
    .eq('user_id', websiteData.user_id)
    .single()

  if (error || !data?.footer) {
    console.log(`[DB] No footer found in user_website_templates for user_id=${websiteData.user_id}`)
    return {}
  }

  console.log(`[DB SUCCESS] Found footer data from legacy table:`, Object.keys(data.footer))
  return data.footer as Record<string, string[]>
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

// ============================================================================
// Promotional Announcements
// ============================================================================
export interface PromotionalAnnouncement {
  id: string
  user_id: string
  message: string
  background_color: string
  text_color: string
  is_active: boolean
  priority: number
  show_close_button: boolean
  auto_rotate: boolean
  created_at: string
  updated_at: string
  start_date: string | null
  end_date: string | null
}

export async function getActiveAnnouncements(userId: string): Promise<PromotionalAnnouncement[]> {
  const now = new Date().toISOString()
  
  console.log(`[DB] Fetching active announcements for user_id='${userId}'`)
  
  const { data, error } = await supabase
    .from('promotional_announcements')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .or(`start_date.is.null,start_date.lte.${now}`)
    .or(`end_date.is.null,end_date.gte.${now}`)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[DB ERROR] Failed to fetch announcements:', error)
    return []
  }

  console.log(`[DB SUCCESS] Found ${data?.length || 0} active announcements`)
  return (data || []) as PromotionalAnnouncement[]
}

export function getAnnouncementBarConfig(sections: MergedSection[]): Record<string, any> {
  const announcementSection = getSectionByType(sections, 'promotional_announcement_bar')
  return announcementSection?.config || {
    autoRotate: true,
    rotateInterval: 5000,
    showCloseButton: true,
    defaultBackgroundColor: '#D4AF37',
    defaultTextColor: '#000000',
  }
}

export function isAnnouncementBarEnabled(sections: MergedSection[]): boolean {
  const announcementSection = sections.find(s => s.section_type === 'promotional_announcement_bar')
  return announcementSection?.is_enabled ?? true
}

// ============================================================================
// Gold Rates
// ============================================================================
export interface GoldRateData {
  id: string
  user_id: string
  rate_24k: number | null
  rate_22k: number | null
  rate_18k: number | null
  rate_14k: number | null
  trend_up: boolean
  change_text: string | null
  created_at: string
  updated_at: string
}

export async function getGoldRate(userId: string): Promise<GoldRateData | null> {
  console.log(`[DB] Fetching gold rate for user_id='${userId}'`)
  
  const { data, error } = await supabase
    .from('gold_rates')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('[DB ERROR] Failed to fetch gold rate:', error)
    return null
  }

  if (!data) {
    console.log('[DB] No gold rate found for user')
    return null
  }

  console.log(`[DB SUCCESS] Found gold rate for user`)
  return data as GoldRateData
}

export function isGoldRateSectionEnabled(sections: MergedSection[]): boolean {
  const goldRateSection = sections.find(s => s.section_type === 'gold_rate')
  return goldRateSection?.is_enabled ?? false
}

export function getGoldRateConfig(sections: MergedSection[]): Record<string, any> {
  const goldRateSection = getSectionByType(sections, 'gold_rate')
  return goldRateSection?.config || {
    show_trend: true,
    update_frequency: 'daily',
  }
}

// ============================================================================
// Filter Data Fetching - Direct from collections table
// ============================================================================
export interface FilterData {
  categories: string[]
  collections: string[]
  trendingCollections: string[]
  productTypes: string[]
  genders: string[]
}

export async function getFilterDataForUser(userId: string): Promise<FilterData> {
  console.log(`[DB] Fetching all filter data for user_id='${userId}'`)
  
  // Fetch all collections for this user
  const { data, error } = await supabase
    .from('collections')
    .select('name, collection_label')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('[DB ERROR] Failed to fetch collections for filters:', error)
    return {
      categories: [],
      collections: [],
      trendingCollections: [],
      productTypes: [],
      genders: ['Her', 'Him'],
    }
  }

  // Group by collection_label
  const categories: string[] = []
  const collections: string[] = []
  const trendingCollections: string[] = []
  const productTypes: string[] = []

  for (const item of data || []) {
    const name = item.name
    switch (item.collection_label) {
      case 'category':
        if (!categories.includes(name)) categories.push(name)
        break
      case 'hero':
        if (!collections.includes(name)) collections.push(name)
        break
      case 'trending':
        if (!trendingCollections.includes(name)) trendingCollections.push(name)
        break
      case 'product_type':
        if (!productTypes.includes(name)) productTypes.push(name)
        break
    }
  }

  console.log(`[DB SUCCESS] Filter data: ${categories.length} categories, ${collections.length} collections, ${trendingCollections.length} trending, ${productTypes.length} product types`)

  return {
    categories,
    collections,
    trendingCollections,
    productTypes,
    genders: ['Her', 'Him'],
  }
}