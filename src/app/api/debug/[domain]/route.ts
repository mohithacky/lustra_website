import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Create a fresh client for debugging
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://phlccyxgyftspxnuzttf.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_tMc-l2KRHyKOXlR0tODIPw_VhBH-w5R'

export async function GET(
  request: NextRequest,
  { params }: { params: { domain: string } }
) {
  const domain = params.domain.toLowerCase()
  const results: Record<string, any> = {
    domain,
    timestamp: new Date().toISOString(),
    environment: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseUrl: supabaseUrl,
      nodeEnv: process.env.NODE_ENV,
    },
    queries: {},
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Test 1: Query users table
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, shop_name, shop_domain')
      .eq('shop_domain', domain)
      .single()

    results.queries.users = {
      success: !userError,
      data: userData,
      error: userError ? { code: userError.code, message: userError.message, details: userError.details } : null,
    }
  } catch (e: any) {
    results.queries.users = { success: false, error: e.message }
  }

  // Test 2: Query users table without filter (to check RLS)
  try {
    const { data: allUsers, error: allUsersError, count } = await supabase
      .from('users')
      .select('id, shop_name, shop_domain', { count: 'exact' })
      .not('shop_domain', 'is', null)
      .limit(5)

    results.queries.usersWithDomain = {
      success: !allUsersError,
      count: count,
      data: allUsers,
      error: allUsersError ? { code: allUsersError.code, message: allUsersError.message } : null,
    }
  } catch (e: any) {
    results.queries.usersWithDomain = { success: false, error: e.message }
  }

  // Test 3: If user found, query user_websites
  if (results.queries.users?.data?.id) {
    const userId = results.queries.users.data.id
    
    try {
      const { data: websiteData, error: websiteError } = await supabase
        .from('user_websites')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)

      results.queries.userWebsites = {
        success: !websiteError,
        data: websiteData,
        error: websiteError ? { code: websiteError.code, message: websiteError.message } : null,
      }
    } catch (e: any) {
      results.queries.userWebsites = { success: false, error: e.message }
    }

    // Test 4: Query collections
    try {
      const { data: collectionsData, error: collectionsError } = await supabase
        .from('collections')
        .select('id, name, collection_label, is_active')
        .eq('user_id', userId)
        .eq('is_active', true)

      results.queries.collections = {
        success: !collectionsError,
        count: collectionsData?.length || 0,
        data: collectionsData,
        error: collectionsError ? { code: collectionsError.code, message: collectionsError.message } : null,
      }
    } catch (e: any) {
      results.queries.collections = { success: false, error: e.message }
    }
  }

  return NextResponse.json(results, { status: 200 })
}
