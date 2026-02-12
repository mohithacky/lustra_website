import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://phlccyxgyftspxnuzttf.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')

// Toggle page is_active status
export async function PUT(request: NextRequest) {
  console.log('\n=== API /toggle-page PUT: Starting ===');
  try {
    const body = await request.json()
    const { userId, slug, isActive } = body
    
    console.log('Request body:', { userId, slug, isActive });

    if (!userId || !slug || typeof isActive !== 'boolean') {
      console.log('❌ Validation failed: Missing required fields');
      return NextResponse.json(
        { error: 'userId, slug, and isActive are required' },
        { status: 400 }
      )
    }
    
    console.log('✓ Validation passed');

    // Get the user's website
    console.log('\n→ Fetching user_website for userId:', userId);
    const { data: website, error: websiteError } = await supabase
      .from('user_websites')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (websiteError || !website) {
      console.log('❌ Website not found');
      console.log('  Error:', websiteError);
      return NextResponse.json({ error: 'Website not found' }, { status: 404 })
    }
    
    console.log('✓ Website found:', website.id);

    // Update the page's is_active status
    console.log('\n→ Updating user_website_pages');
    console.log('  user_website_id:', website.id);
    console.log('  slug:', slug);
    console.log('  Setting is_active to:', isActive);
    
    const { data, error } = await supabase
      .from('user_website_pages')
      .update({ is_active: isActive })
      .eq('user_website_id', website.id)
      .eq('slug', slug)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating page status:', error);
      console.error('  Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    if (!data) {
      console.log('⚠ No page found with slug:', slug);
      console.log('  This might mean the page does not exist in user_website_pages table');
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    console.log('✓ Page updated successfully!');
    console.log('  Updated page data:', JSON.stringify(data, null, 2));
    console.log('=== API /toggle-page PUT: SUCCESS ===\n');
    return NextResponse.json({ success: true, page: data })
  } catch (e: any) {
    console.error('❌ EXCEPTION in /toggle-page PUT:', e);
    console.error('  Stack:', e.stack);
    console.log('=== API /toggle-page PUT: EXCEPTION ===\n');
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// Get page status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const slug = searchParams.get('slug')
  
  console.log('\n=== API /toggle-page GET: Starting ===');
  console.log('Query params:', { userId, slug });

  if (!userId || !slug) {
    console.log('❌ Validation failed: Missing userId or slug');
    return NextResponse.json({ error: 'userId and slug are required' }, { status: 400 })
  }

  try {
    // Get the user's website
    console.log('→ Fetching user_website for userId:', userId);
    const { data: website, error: websiteError } = await supabase
      .from('user_websites')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (websiteError || !website) {
      console.log('⚠ Website not found, defaulting to active');
      console.log('  Error:', websiteError);
      return NextResponse.json({ isActive: true }) // Default to active if not found
    }
    
    console.log('✓ Website found:', website.id);

    // Get the page's is_active status
    console.log('→ Fetching page status from user_website_pages');
    console.log('  user_website_id:', website.id);
    console.log('  slug:', slug);
    
    const { data: page, error: pageError } = await supabase
      .from('user_website_pages')
      .select('is_active')
      .eq('user_website_id', website.id)
      .eq('slug', slug)
      .single()

    if (pageError || !page) {
      console.log('⚠ Page not found, defaulting to active');
      console.log('  Error:', pageError);
      return NextResponse.json({ isActive: true }) // Default to active if not found
    }

    console.log('✓ Page found, is_active:', page.is_active);
    console.log('=== API /toggle-page GET: SUCCESS ===\n');
    return NextResponse.json({ isActive: page.is_active })
  } catch (e: any) {
    console.error('❌ EXCEPTION in /toggle-page GET:', e);
    console.error('  Stack:', e.stack);
    console.log('=== API /toggle-page GET: EXCEPTION ===\n');
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
