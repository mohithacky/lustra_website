import { NextRequest, NextResponse } from 'next/server'

// Backend URL for AI generation (same as Flutter uses)
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api-5sqqk2n6ra-uc.a.run.app'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { collectionName, aspectRatio = '16:9', shopId, collectionType = 'hero', editorToken } = body

    if (!collectionName) {
      return NextResponse.json({ error: 'collectionName is required' }, { status: 400 })
    }

    if (!editorToken || !shopId) {
      return NextResponse.json({ error: 'Editor authentication required' }, { status: 401 })
    }

    console.log('Generating banner for collection:', collectionName, 'type:', collectionType)

    // Call the new backend editor endpoint that uses editor token auth
    const response = await fetch(`${BACKEND_URL}/api/editor/generate-banner`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        collectionName,
        aspectRatio,
        collectionType,
        editorToken,
        userId: shopId,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('Backend AI generation error:', errorData)
      return NextResponse.json({ 
        error: errorData.error || 'Failed to generate image',
      }, { status: response.status })
    }

    const data = await response.json()
    
    if (!data.generatedImage) {
      return NextResponse.json({ error: 'No image generated' }, { status: 500 })
    }

    // Return base64 image data as data URL for easy display
    return NextResponse.json({ 
      success: true,
      imageBase64: data.generatedImage,
      imageUrl: `data:image/png;base64,${data.generatedImage}`
    })

  } catch (error) {
    console.error('Error in generate-banner API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
