export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          shop_name: string | null
          shop_address: string | null
          phone_number: string | null
          email: string | null
          instagram_id: string | null
          logo_url: string | null
          shop_domain: string | null
          created_at: string
          updated_at: string
        }
      }
      user_website_templates: {
        Row: {
          id: string
          user_id: string
          best_collections: BestCollection[]
          categories: Record<string, string>
          collections: Record<string, string>
          footer: FooterData
          gold_rate: GoldRate | null
          occasion_collections: OccasionCollection[]
          product_types: string[]
          show_testimonials: boolean
          trending_collections: TrendingCollection[]
          theme: 'light' | 'dark'
          website_type: string
          website_url: string
          created_at: string
          updated_at: string
        }
      }
      website_products: {
        Row: {
          id: string
          user_id: string
          product_id: string | null
          name: string
          sku: string | null
          category: string | null
          subcategory: string | null
          collection: string | null
          tags: string[]
          description: string | null
          karat: string | null
          material: string | null
          weight: string | null
          length: string | null
          making_charges: string | null
          stone: string | null
          gender: string | null
          type: string | null
          price: string | null
          image_url: string | null
          images: string[]
          videos: string[]
          stock: string | null
          show_on_website: boolean
          is_bestseller: boolean
          is_trending: boolean
          created_at: string
          updated_at: string
        }
      }
      user_hero_collections: {
        Row: {
          id: string
          user_id: string
          name: string
          image_url: string
          is_visible: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
      }
      user_collections: {
        Row: {
          id: string
          user_id: string
          name: string
          banner_url: string | null
          description: string | null
          display_order: number
          created_at: string
          updated_at: string
        }
      }
      user_categories: {
        Row: {
          id: string
          user_id: string
          name: string
          image_url: string | null
          description: string | null
          display_order: number
          created_at: string
          updated_at: string
        }
      }
      customer_reviews: {
        Row: {
          id: string
          user_id: string
          customer_name: string
          rating: number
          review_text: string
          is_approved: boolean
          created_at: string
        }
      }
      website_visitors: {
        Row: {
          id: string
          user_id: string
          page_path: string | null
          referrer: string | null
          user_agent: string | null
          visited_at: string
        }
        Insert: {
          user_id: string
          page_path?: string | null
          referrer?: string | null
          user_agent?: string | null
          visited_at?: string
        }
      }
    }
    Views: {
      website_templates_with_user: {
        Row: {
          id: string
          user_id: string
          best_collections: BestCollection[]
          categories: Record<string, string>
          collections: Record<string, string>
          footer: FooterData
          gold_rate: GoldRate | null
          occasion_collections: OccasionCollection[]
          product_types: string[]
          show_testimonials: boolean
          trending_collections: TrendingCollection[]
          theme: 'light' | 'dark'
          website_type: string
          website_url: string
          shop_address: string | null
          phone_number: string | null
          instagram_id: string | null
          logo_url: string | null
          email: string | null
          shop_domain: string | null
          shop_name: string | null
          created_at: string
          updated_at: string
        }
      }
    }
  }
}

export interface BestCollection {
  name: string
  image: string
  description?: string
}

export interface TrendingCollection {
  label: string
  image: string
}

export interface OccasionCollection {
  title: string
  imageUrl: string
}

export interface GoldRate {
  rates: Record<string, number>
  trendUp: boolean
  changeText: string
}

export interface FooterData {
  About?: string[]
  Shop?: string[]
  'Customer Care'?: string[]
  [key: string]: string[] | undefined
}

export interface WebsiteData {
  user: {
    id: string
    shop_name: string | null
    shop_address: string | null
    phone_number: string | null
    email: string | null
    instagram_id: string | null
    logo_url: string | null
    shop_domain: string | null
  }
  template: Database['public']['Tables']['user_website_templates']['Row'] | null
  heroCollections: Database['public']['Tables']['user_hero_collections']['Row'][]
  products: Database['public']['Tables']['website_products']['Row'][]
  collections: Database['public']['Tables']['user_collections']['Row'][]
  categories: Database['public']['Tables']['user_categories']['Row'][]
}

export type Product = Database['public']['Tables']['website_products']['Row']
export type HeroCollection = Database['public']['Tables']['user_hero_collections']['Row']
export type Collection = Database['public']['Tables']['user_collections']['Row']
export type Category = Database['public']['Tables']['user_categories']['Row']
export type WebsiteTemplate = Database['public']['Tables']['user_website_templates']['Row']
