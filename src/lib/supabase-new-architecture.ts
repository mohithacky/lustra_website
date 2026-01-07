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

const supabaseUrl = 'https://phlccyxgyftspxnuzttf.supabase.co'
const supabaseAnonKey = 'sb_publishable_tMc-l2KRHyKOXlR0tODIPw_VhBH-w5R'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
  config: Record<string, any>  // Merged: default_config + user config
  collections?: Collection[]   // Fetched collections based on section_type
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
  console.log(`   Querying users table with shop_domain='${normalizedDomain}'`)
  
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
    console.error('Error fetching website by domain:', error)
    return null
  }

  return data as UserData
}

// ============================================================================
// Step 2: Get user's primary website
// ============================================================================
export async function getUserWebsite(userId: string): Promise<UserWebsite | null> {
  const { data, error } = await supabase
    .from('user_websites')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .eq('is_primary', true)
    .single()

  if (error) {
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
      console.error('Error fetching user website:', fallbackError)
      return null
    }
    return fallbackData as UserWebsite
  }

  return data as UserWebsite
}

// ============================================================================
// Step 3: Get template and its sections
// ============================================================================
export async function getWebsiteTemplate(templateId: string): Promise<WebsiteTemplate | null> {
  const { data, error } = await supabase
    .from('website_templates')
    .select('*')
    .eq('id', templateId)
    .single()

  if (error) {
    console.error('Error fetching website template:', error)
    return null
  }

  return data as WebsiteTemplate
}

export async function getTemplateSections(templateId: string): Promise<WebsiteTemplateSection[]> {
  const { data, error } = await supabase
    .from('website_template_sections')
    .select('*')
    .eq('template_id', templateId)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching template sections:', error)
    return []
  }

  return (data || []) as WebsiteTemplateSection[]
}

// ============================================================================
// Step 4: Get user's section customizations
// ============================================================================
export async function getUserWebsiteSections(userWebsiteId: string): Promise<UserWebsiteSection[]> {
  const { data, error } = await supabase
    .from('user_website_sections')
    .select('*')
    .eq('user_website_id', userWebsiteId)

  if (error) {
    console.error('Error fetching user website sections:', error)
    return []
  }

  return (data || []) as UserWebsiteSection[]
}

// ============================================================================
// Step 5 & 6: Merge configs and fetch collections
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
    
    // Merge default_config with user config (user overrides default)
    const mergedConfig = {
      ...templateSection.default_config,
      ...(userSection?.config || {})
    }

    mergedSections.push({
      section_type: templateSection.section_type,
      section_label: userSection?.section_label || templateSection.section_label,
      is_enabled: userSection?.is_enabled ?? templateSection.is_enabled_by_default,
      display_order: userSection?.display_order ?? templateSection.display_order,
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
  console.log(`   Fetching collections: user_id=${userId}, label=${label}`)
  
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('user_id', userId)
    .eq('collection_label', label)
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) {
    console.error(`   ❌ Error fetching ${label} collections:`, error.message)
    return []
  }

  console.log(`   ✅ Found ${data?.length || 0} ${label} collections`)
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
  console.log(`\n========== getWebsiteRenderData for domain: ${domain} ==========`)
  
  // Step 1: Get user by domain
  const user = await getWebsiteByDomain(domain)
  if (!user) {
    console.error('❌ User not found for domain:', domain)
    return null
  }
  console.log(`✅ User found: ${user.id}, shop_name: ${user.shop_name}`)

  // Step 2: Get user's primary website
  const website = await getUserWebsite(user.id)
  if (!website) {
    console.error('❌ User website not found for user:', user.id)
    return null
  }
  console.log(`✅ Website found: ${website.id}, template_id: ${website.template_id}, is_primary: ${website.is_primary}`)

  // Step 3: Get template
  const template = await getWebsiteTemplate(website.template_id)
  if (!template) {
    console.error('❌ Template not found:', website.template_id)
    return null
  }
  console.log(`✅ Template found: ${template.name} (${template.slug})`)

  // Step 3b: Get template sections
  const templateSections = await getTemplateSections(template.id)
  console.log(`📋 Template sections found: ${templateSections.length}`)
  if (templateSections.length > 0) {
    console.log(`   Types: ${templateSections.map(s => s.section_type).join(', ')}`)
  }

  // Step 4: Get user's section customizations
  const userSections = await getUserWebsiteSections(website.id)
  console.log(`📄 User website sections found: ${userSections.length}`)
  if (userSections.length > 0) {
    console.log(`   Types: ${userSections.map(s => s.section_type).join(', ')}`)
  }

  // Step 5 & 6: Merge configs and fetch collections
  const sections = await getMergedSections(templateSections, userSections, user.id)
  console.log(`🔗 Merged sections: ${sections.length}`)
  
  // Log collection counts per section
  for (const section of sections) {
    if (section.collections && section.collections.length > 0) {
      console.log(`   ${section.section_type}: ${section.collections.length} collections`)
    }
  }
  
  console.log(`========== END getWebsiteRenderData ==========\n`)

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

export function getFooterData(sections: MergedSection[]): Record<string, string[]> {
  const footerSection = getSectionByType(sections, 'footer')
  // Footer data is now stored in config since there's no content column
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
