import { NextRequest, NextResponse } from 'next/server'

// Backend URL for AI generation (same as Flutter uses)
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api-5sqqk2n6ra-uc.a.run.app'

// Get the prompt for image generation (matching Flutter's _getImageGenerationPrompt)
function getImageGenerationPrompt(collectionName: string, aspectRatio: string, isTrending: boolean = false): string {
  if (isTrending) {
    const isSmallBox = aspectRatio === '3:2'
    return `Generate a poster image for a collection named ${collectionName} on the background I have provided in the image. This image will be shown on a ecommerce website for jewelleries. The poster should contain Indian model. Cover the full white background. It's not compulsory that you keep the background just white. The theme should be light pink and the background theme should be light pink.

No Text on the image.

The jewellery the model will be wearing must be either gold or diamond.
No seperate product showcase just the model with jewelleries wearing.
No flowers texture in the background.
${isSmallBox ? 'The image should be in landscape orientation (3:2 aspect ratio).' : 'The image should be in portrait orientation (5:6 aspect ratio).'}`
  } else {
    return `Generate a poster image for a collection named ${collectionName} on the background I have provided in the image. This image will be shown on a ecommerce website for jewelleries. The poster should contain model. Cover the full white background. It's not compulsory that you keep the background just white. The image should be in 16:9 landscape aspect ratio.`
  }
}

// Get base64 encoded white background image for the aspect ratio
function getBackgroundImageBase64(aspectRatio: string): string {
  // Create a simple white PNG as base64
  // This is a minimal 1x1 white pixel PNG that the AI will expand
  // In production, you'd want proper sized backgrounds like Flutter has
  return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { collectionName, aspectRatio = '16:9', shopId, collectionType = 'hero' } = body

    if (!collectionName) {
      return NextResponse.json({ error: 'collectionName is required' }, { status: 400 })
    }

    const isTrending = collectionType === 'trending'
    const prompt = getImageGenerationPrompt(collectionName, aspectRatio, isTrending)
    const backgroundBase64 = getBackgroundImageBase64(aspectRatio)

    console.log('Generating banner with prompt:', prompt.substring(0, 100) + '...')

    // Call backend /upload endpoint (same as Flutter's GeminiService.generateImageWithUpload)
    const response = await fetch(`${BACKEND_URL}/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        imgBase64: [backgroundBase64],
        mimeType: 'image/png'
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend AI generation error:', errorText)
      return NextResponse.json({ 
        error: 'Failed to generate image',
        details: errorText
      }, { status: 500 })
    }

    const data = await response.json()
    
    if (!data.generatedImage) {
      return NextResponse.json({ error: 'No image generated' }, { status: 500 })
    }

    // Return base64 image data (same format Flutter receives)
    return NextResponse.json({ 
      success: true,
      imageBase64: data.generatedImage,
      // Also return as data URL for easy display
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
