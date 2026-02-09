import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, senderName, senderEmail, senderPhone, message } = body

    if (!userId || !senderName || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, senderName, message' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseServer
      .from('contact_messages')
      .insert({
        user_id: userId,
        sender_name: senderName,
        sender_email: senderEmail || null,
        sender_phone: senderPhone || null,
        message: message,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[Contact API] Error inserting message:', error)
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, id: data.id })
  } catch (err) {
    console.error('[Contact API] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
