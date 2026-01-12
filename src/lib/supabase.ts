import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { DEMO_PRODUCTS, DEMO_CATEGORIES_MAP, DEMO_COLLECTIONS_MAP, DEMO_CATEGORIES, DEMO_COLLECTIONS, DEMO_TESTIMONIALS, DEMO_TRENDING_COLLECTIONS, DemoProduct, DemoTestimonial } from '@/constants/demo-products'

// Re-export demo constants for use in other files
export { DEMO_PRODUCTS, DEMO_CATEGORIES_MAP, DEMO_COLLECTIONS_MAP, DEMO_CATEGORIES, DEMO_COLLECTIONS, DEMO_TESTIMONIALS, DEMO_TRENDING_COLLECTIONS }

const supabaseUrl = 'https://phlccyxgyftspxnuzttf.supabase.co'
const supabaseAnonKey = 'sb_publishable_tMc-l2KRHyKOXlR0tODIPw_VhBH-w5R'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Backend API URL
export const backendBaseUrl = 'https://api-5sqqk2n6ra-uc.a.run.app'

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

// Product type definition
export interface ProductData {
  id: string
  user_id: string
  name: string
  price: string | number | null
  description: string | null
  image_url: string | null
  images: string[] | null
  category: string | null
  collection: string | string[] | null
  type: string | null
  product_type: string | null
  weight: string | null
  purity: string | null
  gender: string | null
  is_bestseller: boolean | null
  is_trending: boolean | null
  show_on_website: boolean | null
  created_at: string
  updated_at: string
  is_demo?: boolean
}

export interface WebsiteTemplate {
  id: string
  user_id: string
  theme: 'light' | 'dark'
  website_type: string | null
  website_url: string | null
  categories: Record<string, string> | null
  collections: Record<string, string> | null
  trending_collections: Array<{name?: string, label?: string, image?: string}> | null
  best_collections: Array<{name?: string, image?: string, description?: string}> | null
  occasion_collections: Array<{name?: string, imageUrl?: string}> | null
  footer: Record<string, string[]> | null
  testimonials: Array<any> | null
  show_testimonials: boolean | null
  gold_rate: any | null
  product_types: string[] | null
  created_at: string
  updated_at: string
}

export async function getWebsiteByDomain(domain: string): Promise<UserData | null> {
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
    .eq('shop_domain', domain)
    .single()

  if (error) {
    console.error('Error fetching website by domain:', error)
    return null
  }

  return data as UserData
}

export async function getWebsiteTemplate(userId: string): Promise<WebsiteTemplate | null> {
  const { data, error } = await supabase
    .from('user_website_templates')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching website template:', error)
    return null
  }

  return data as WebsiteTemplate
}

export async function getWebsiteTemplateWithUser(userId: string) {
  const { data, error } = await supabase
    .from('website_templates_with_user')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching website template with user:', error)
    return null
  }

  return data
}

export async function getHeroCollections(userId: string) {
  const { data, error } = await supabase
    .from('user_hero_collections')
    .select('*')
    .eq('user_id', userId)
    .eq('is_visible', true)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching hero collections:', error)
    return []
  }

  return data || []
}

export async function getProducts(userId: string, options?: {
  category?: string
  collection?: string
  gender?: string
  limit?: number
  offset?: number
  showOnWebsite?: boolean
}): Promise<ProductData[]> {
  let query = supabase
    .from('website_products')
    .select('*')
    .eq('user_id', userId)

  // Only filter by show_on_website if explicitly set to true in options
  // If not specified or set to false, show all products
  if (options?.showOnWebsite === true) {
    query = query.eq('show_on_website', true)
  }

  if (options?.category) {
    query = query.eq('category', options.category)
  }

  if (options?.collection) {
    query = query.eq('collection', options.collection)
  }

  if (options?.gender) {
    query = query.eq('gender', options.gender)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error('[getProducts] Error fetching products:', error)
    return []
  }

  const products = (data as ProductData[]) || []

  console.log(`[getProducts] Found ${products.length} products for user ${userId}`, {
    filters: options,
    sampleProduct: products[0] ? {
      id: products[0].id,
      name: products[0].name,
      show_on_website: products[0].show_on_website,
      category: products[0].category,
      collection: products[0].collection,
      gender: products[0].gender
    } : null
  })

  return products
}

// Get products with demo fallback - returns demo products if user has no real products
export async function getProductsWithDemoFallback(userId: string, options?: {
  category?: string
  collection?: string
  gender?: string
  limit?: number
  offset?: number
  showOnWebsite?: boolean
}): Promise<{ products: ProductData[], isDemo: boolean }> {
  // First check if user has ANY products at all (ignoring show_on_website flag)
  const { data: allProducts, error: checkError } = await supabase
    .from('website_products')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
  
  if (checkError) {
    console.error('Error checking for products:', checkError)
  }
  
  // If user has any real products, never show demo products
  if (allProducts && allProducts.length > 0) {
    const filteredProducts = await getProducts(userId, options)
    return { products: filteredProducts, isDemo: false }
  }
  
  // Return demo products only for users with no products at all
  let demoProducts = DEMO_PRODUCTS.map(p => ({
    ...p,
    user_id: userId,
    show_on_website: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })) as ProductData[]
  
  // Apply filters to demo products
  if (options?.category) {
    demoProducts = demoProducts.filter(p => p.category === options.category)
  }
  
  if (options?.collection) {
    demoProducts = demoProducts.filter(p => p.collection === options.collection)
  }
  
  if (options?.gender) {
    demoProducts = demoProducts.filter(p => p.gender === options.gender)
  }
  
  if (options?.limit) {
    demoProducts = demoProducts.slice(0, options.limit)
  }
  
  return { products: demoProducts, isDemo: true }
}

export async function getProductsByIds(productIds: string[]) {
  if (!productIds.length) return []

  const { data, error } = await supabase
    .from('website_products')
    .select('*')
    .in('id', productIds)

  if (error) {
    console.error('Error fetching products by IDs:', error)
    return []
  }

  return data || []
}

// Get collections from user_website_templates (map of name -> bannerUrl)
export async function getCollectionsMap(userId: string): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('user_website_templates')
    .select('collections')
    .eq('user_id', userId)
    .single()

  if (error || !(data as any)?.collections) {
    return {}
  }

  return (data as any).collections as Record<string, string>
}

// Get collections with demo fallback
export async function getCollectionsMapWithDemoFallback(userId: string): Promise<{ collections: Record<string, string>, isDemo: boolean }> {
  const realCollections = await getCollectionsMap(userId)
  
  if (Object.keys(realCollections).length > 0) {
    return { collections: realCollections, isDemo: false }
  }
  
  return { collections: DEMO_COLLECTIONS_MAP, isDemo: true }
}

// Get categories from user_website_templates (map of name -> imageUrl)
export async function getCategoriesMap(userId: string): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('user_website_templates')
    .select('categories')
    .eq('user_id', userId)
    .single()

  if (error || !(data as any)?.categories) {
    return {}
  }

  return (data as any).categories as Record<string, string>
}

// Get categories with demo fallback
export async function getCategoriesMapWithDemoFallback(userId: string): Promise<{ categories: Record<string, string>, isDemo: boolean }> {
  const realCategories = await getCategoriesMap(userId)
  
  if (Object.keys(realCategories).length > 0) {
    return { categories: realCategories, isDemo: false }
  }
  
  return { categories: DEMO_CATEGORIES_MAP, isDemo: true }
}

// Get trending collections from user_website_templates
export async function getTrendingCollections(userId: string): Promise<Array<{label: string, image: string}>> {
  const { data, error } = await supabase
    .from('user_website_templates')
    .select('trending_collections')
    .eq('user_id', userId)
    .single()

  if (error || !(data as any)?.trending_collections) {
    return []
  }

  const trending = (data as any).trending_collections as Array<{name?: string, label?: string, image?: string}>
  return trending.map(item => ({
    label: item.label || item.name || '',
    image: item.image || ''
  }))
}

// Get best collections from user_website_templates
export async function getBestCollections(userId: string): Promise<Array<{name: string, image: string, description: string}>> {
  const { data, error } = await supabase
    .from('user_website_templates')
    .select('best_collections')
    .eq('user_id', userId)
    .single()

  if (error || !(data as any)?.best_collections) {
    return []
  }

  const best = (data as any).best_collections as Array<{name?: string, image?: string, description?: string}>
  return best.map(item => ({
    name: item.name || '',
    image: item.image || '',
    description: item.description || `Discover the ${item.name} collection`
  }))
}

// Get footer data from user_website_templates
export async function getFooterData(userId: string): Promise<Record<string, string[]>> {
  const { data, error } = await supabase
    .from('user_website_templates')
    .select('footer')
    .eq('user_id', userId)
    .single()

  if (error || !(data as any)?.footer) {
    return {}
  }

  return (data as any).footer as Record<string, string[]>
}

// Get testimonials from user_website_templates
export async function getTestimonials(userId: string): Promise<Array<any>> {
  const { data, error } = await supabase
    .from('user_website_templates')
    .select('testimonials, show_testimonials')
    .eq('user_id', userId)
    .single()

  const d = data as any
  if (error || !d?.testimonials || !d?.show_testimonials) {
    return []
  }

  return d.testimonials as Array<any>
}

// Get testimonials with demo fallback
export async function getTestimonialsWithDemoFallback(userId: string): Promise<{ testimonials: Array<any>, isDemo: boolean }> {
  const realTestimonials = await getTestimonials(userId)
  
  if (realTestimonials.length > 0) {
    return { testimonials: realTestimonials, isDemo: false }
  }
  
  return { testimonials: DEMO_TESTIMONIALS, isDemo: true }
}

// Legacy: Get user collections from separate table (if used)
export async function getUserCollections(userId: string) {
  const { data, error } = await supabase
    .from('user_collections')
    .select('*')
    .eq('user_id', userId)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching user collections:', error)
    return []
  }

  return data || []
}

// Legacy: Get user categories from separate table (if used)
export async function getUserCategories(userId: string) {
  const { data, error } = await supabase
    .from('user_categories')
    .select('*')
    .eq('user_id', userId)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching user categories:', error)
    return []
  }

  return data || []
}

export async function trackVisitor(userId: string, visitorData: {
  page_path?: string
  referrer?: string
  user_agent?: string
}) {
  const { error } = await supabase
    .from('website_visitors')
    .insert({
      user_id: userId,
      ...visitorData,
      visited_at: new Date().toISOString(),
    } as any)

  if (error) {
    console.error('Error tracking visitor:', error)
  }
}

// Get trending products (products marked as trending or bestseller)
export async function getTrendingProducts(userId: string, limit: number = 10) {
  const { data, error } = await supabase
    .from('website_products')
    .select('*')
    .eq('user_id', userId)
    .eq('show_on_website', true)
    .or('is_trending.eq.true,is_bestseller.eq.true')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching trending products:', error)
    return []
  }

  return data || []
}

// Get trending products with demo fallback
export async function getTrendingProductsWithDemoFallback(userId: string, limit: number = 10): Promise<{ products: ProductData[], isDemo: boolean }> {
  const realProducts = await getTrendingProducts(userId, limit)
  
  if (realProducts.length > 0) {
    return { products: realProducts as ProductData[], isDemo: false }
  }
  
  // Return demo trending products
  const demoProducts = DEMO_PRODUCTS
    .filter(p => p.is_trending || p.is_bestseller)
    .slice(0, limit)
    .map(p => ({
      ...p,
      user_id: userId,
      show_on_website: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })) as ProductData[]
  
  return { products: demoProducts, isDemo: true }
}

// Get a single product by ID
export async function getProductById(productId: string): Promise<ProductData | null> {
  const { data, error } = await supabase
    .from('website_products')
    .select('*')
    .eq('id', productId)
    .single()

  if (error) {
    console.error('Error fetching product:', error)
    return null
  }

  return data as ProductData
}

// Get a single product by ID with demo fallback
export async function getProductByIdWithDemoFallback(productId: string): Promise<{ product: ProductData | null, isDemo: boolean }> {
  // Check if it's a demo product ID
  if (productId.startsWith('demo-product-')) {
    const demoProduct = DEMO_PRODUCTS.find(p => p.id === productId)
    if (demoProduct) {
      return { 
        product: {
          ...demoProduct,
          user_id: 'demo',
          purity: null,
          show_on_website: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as ProductData, 
        isDemo: true 
      }
    }
  }
  
  // Try to fetch real product
  const realProduct = await getProductById(productId)
  return { product: realProduct, isDemo: false }
}

// Get products by product type (Gold, Silver, Diamond, etc.)
export async function getProductsByType(userId: string, productType: string, limit?: number): Promise<ProductData[]> {
  let query = supabase
    .from('website_products')
    .select('*')
    .eq('user_id', userId)
    .eq('show_on_website', true)
    .ilike('type', productType)
    .order('created_at', { ascending: false })

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching products by type:', error)
    return []
  }

  return (data as ProductData[]) || []
}

// Get products for gender (Him/Her)
export async function getProductsByGender(userId: string, gender: string, limit?: number): Promise<ProductData[]> {
  let query = supabase
    .from('website_products')
    .select('*')
    .eq('user_id', userId)
    .eq('show_on_website', true)
    .ilike('gender', gender)
    .order('created_at', { ascending: false })

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching products by gender:', error)
    return []
  }

  return (data as ProductData[]) || []
}
 