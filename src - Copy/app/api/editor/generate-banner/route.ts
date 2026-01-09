import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Backend URL for AI generation (same as Flutter uses)
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api-5sqqk2n6ra-uc.a.run.app'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://phlccyxgyftspxnuzttf.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Get the prompt for image generation based on collection type
function getImageGenerationPrompt(collectionName: string, aspectRatio: string, collectionType: string): string {
  const basePrompt = `Generate a poster image for a collection named "${collectionName}" on the background I have provided in the image. This image will be shown on an ecommerce website for jewelleries.`
  
  switch (collectionType) {
    case 'hero':
      return `${basePrompt} The poster should contain an elegant Indian model wearing jewellery. Cover the full white background with a luxurious setting. It's not compulsory that you keep the background just white - use warm gold or cream tones.

No Text on the image.
The jewellery the model will be wearing must be either gold or diamond.
The model should be prominently featured with elegant pose.
No flowers texture in the background.
The image should be in 16:9 landscape aspect ratio for hero carousel display.`

    case 'trending':
      const isSmallBox = aspectRatio === '3:2'
      return `${basePrompt} The poster should contain an Indian model wearing jewellery. Cover the full white background. It's not compulsory that you keep the background just white. The theme should be light pink and the background theme should be light pink.

No Text on the image.
The jewellery the model will be wearing must be either gold or diamond.
No separate product showcase just the model with jewelleries wearing.
No flowers texture in the background.
${isSmallBox ? 'The image should be in landscape orientation (3:2 aspect ratio).' : 'The image should be in portrait orientation (5:6 aspect ratio).'}`

    case 'category':
      return `${basePrompt} Create a circular-friendly image showcasing ${collectionName} jewellery category. The image should feature elegant jewellery pieces or a model wearing the jewellery.

No Text on the image.
The image should work well when cropped to a circle.
Use a clean, elegant background - light cream or soft pink tones.
Focus on the jewellery as the main subject.
The image should be in 1:1 square aspect ratio.`

    case 'best':
      return `${basePrompt} The poster should feature a stunning collection display or model wearing premium jewellery. Use luxurious gold and cream tones.

No Text on the image.
The jewellery should be either gold or diamond, showcased elegantly.
Create a premium, high-end aesthetic.
The image should be in 16:9 landscape aspect ratio.`

    case 'occasion':
      return `${basePrompt} Create an image that represents the "${collectionName}" occasion with appropriate jewellery styling and mood.

No Text on the image.
Feature jewellery appropriate for the occasion.
Use colors and styling that evoke the occasion's mood.
The image should be in 16:9 landscape aspect ratio.`

    default:
      return `${basePrompt} The poster should contain a model wearing jewellery. Cover the full white background. The image should be in 16:9 landscape aspect ratio.

No Text on the image.`
  }
}

// Get base64 encoded white background image for the aspect ratio
function getBackgroundImageBase64(aspectRatio: string): string {
  // Create a simple white PNG as base64
  // This is a minimal 1x1 white pixel PNG that the AI will expand
  return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
}

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

    // Get Supabase access token for the user
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { session } } = await supabase.auth.getSession()
    
    // For editor mode, we need to get a valid Supabase token
    // Since we're in server-side context, we'll use the editor token to authenticate with backend
    // The backend will validate the editor token and use the userId from it
    
    const prompt = getImageGenerationPrompt(collectionName, aspectRatio, collectionType)
    const backgroundBase64 = getBackgroundImageBase64(aspectRatio)

    console.log('Calling /upload endpoint with prompt:', prompt.substring(0, 100) + '...')

    // Call the existing /upload endpoint (same as Flutter uses)
    // We need to pass a valid Supabase token - we'll use a workaround by calling via the editor session
    const response = await fetch(`${BACKEND_URL}/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Pass editor token in a custom header that backend can validate
        'X-Editor-Token': editorToken,
        'X-User-Id': shopId,
      },
      body: JSON.stringify({
        prompt,
        imgBase64: [backgroundBase64],
        mimeType: 'image/png'
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
