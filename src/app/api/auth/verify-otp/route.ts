import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { phone, otp, shopId, name } = await request.json()

    if (!phone || !otp || !shopId) {
      return NextResponse.json(
        { error: 'Phone, OTP, and shopId are required' },
        { status: 400 }
      )
    }

    // Verify OTP from database
    const { data: otpRecord, error: otpError } = await supabase
      .from('website_otp_codes')
      .select('*')
      .eq('phone', phone)
      .eq('shop_id', shopId)
      .eq('otp_code', otp)
      .eq('verified', false)
      .single()

    // Check if OTP is valid and not expired
    if (otpError || !otpRecord) {
      return NextResponse.json(
        { error: 'Invalid OTP. Please try again.' },
        { status: 400 }
      )
    }

    if (new Date(otpRecord.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Mark OTP as verified
    await supabase
      .from('website_otp_codes')
      .update({ verified: true })
      .eq('id', otpRecord.id)

    // Check if customer exists
    let { data: customer } = await supabase
      .from('website_customers')
      .select('*')
      .eq('shop_id', shopId)
      .eq('phone', phone)
      .single()

    // If customer doesn't exist, create one (signup flow)
    if (!customer && name) {
      const { data: newCustomer, error: createError } = await supabase
        .from('website_customers')
        .insert({
          shop_id: shopId,
          phone,
          name: name.trim(),
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating customer:', createError)
        return NextResponse.json(
          { error: 'Failed to create account' },
          { status: 500 }
        )
      }

      customer = newCustomer
    }

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found. Please sign up first.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
    })
  } catch (error) {
    console.error('Error verifying OTP:', error)
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    )
  }
}
 