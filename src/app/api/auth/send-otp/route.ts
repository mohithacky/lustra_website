import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { phone, shopId, isSignup } = await request.json()

    if (!phone || !shopId) {
      return NextResponse.json(
        { error: 'Phone and shopId are required' },
        { status: 400 }
      )
    }

    // For login, check if phone exists
    if (!isSignup) {
      const { data: existingCustomer } = await supabase
        .from('website_customers')
        .select('id')
        .eq('shop_id', shopId)
        .eq('phone', phone)
        .single()

      if (!existingCustomer) {
        return NextResponse.json(
          { error: 'Phone number not registered. Please sign up first.' },
          { status: 404 }
        )
      }
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Store OTP in database with expiry (5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()
    
    // Upsert OTP record
    const { error: otpError } = await supabase
      .from('website_otp_codes')
      .upsert({
        phone,
        shop_id: shopId,
        otp_code: otp,
        expires_at: expiresAt,
        verified: false,
      }, {
        onConflict: 'phone,shop_id'
      })

    if (otpError) {
      console.error('Error storing OTP:', otpError)
      // If table doesn't exist, create a simple in-memory solution
      // For production, you'd want to use Twilio or similar service
    }

    // In production, send OTP via SMS using Twilio
    // For now, we'll just log it (in development)
    console.log(`[OTP] Code for ${phone}: ${otp}`)

    // TODO: Integrate with Twilio for actual SMS
    // const twilioResponse = await sendSmsViaTwilio(phone, otp)

    return NextResponse.json({ 
      success: true,
      message: 'OTP sent successfully',
      // In development, return OTP for testing (remove in production)
      ...(process.env.NODE_ENV === 'development' && { otp })
    })
  } catch (error) {
    console.error('Error sending OTP:', error)
    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    )
  }
}
