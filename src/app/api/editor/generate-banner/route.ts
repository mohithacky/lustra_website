import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { readFile } from 'fs/promises'
import path from 'path'

// Backend URL for AI generation (same as Flutter uses)
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api-5sqqk2n6ra-uc.a.run.app'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://phlccyxgyftspxnuzttf.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Get the prompt for image generation based on collection type
// These prompts match exactly what Flutter uses in add_collection_screen.dart and collections_screen.dart
function getImageGenerationPrompt(collectionName: string, aspectRatio: string, collectionType: string): string {
  switch (collectionType) {
    case 'trending':
      // From Flutter: add_collection_screen.dart _getImageGenerationPrompt()
      const isSmallBox = aspectRatio === '3:2'
      return `Generate a poster image for a collection named ${collectionName} on the background I have provided in the image. This image will be shown on a ecommerce website for jewelleries. The poster should contain Indian model. Cover the full white background. It's not compulsory that you keep the background just white. The theme should be light pink and the background theme should be light pink.

No Text on the image.

The jewellery the model will be wearing must be either gold or diamond.
No seperate product showcase just the model with jewelleries wearing.
No flowers texture in the background.
${isSmallBox ? 'The image should be in landscape orientation (3:2 aspect ratio).' : 'The image should be in portrait orientation (5:6 aspect ratio).'}`

    case 'occasion':
      // From Flutter: collections_screen.dart EditOccasionCollectionScreen _generateImage()
      return `Generate a thumbnail image of a occasional collection named ${collectionName} for a jewellery ecommerce website on the given white background in the image.
The image should contain Indian looking model.
The theme should be green and the background theme should be light green.
No textures or flowers in the background.
No text on the image.
The jewellery which model will be wearing must be of diamond or gold.`

    case 'category':
      // Category uses 1:1 square - custom prompt for circular display
      return `Generate a thumbnail image for a jewellery category named ${collectionName} for an ecommerce website on the given white background in the image.
The image should contain Indian looking model wearing jewellery.
The image should work well when cropped to a circle.
Use a clean, elegant background - light cream or soft pink tones.
No text on the image.
The jewellery which model will be wearing must be of diamond or gold.
The image should be in 1:1 square aspect ratio.`

    case 'hero':
    case 'best':
    default:
      // From Flutter: add_collection_screen.dart _getImageGenerationPrompt() for hero mode
      return `Generate a poster image for a collection named ${collectionName} on the background I have provided in the image. This image will be shown on a ecommerce website for jewelleries. The poster should contain model. Cover the full white background. It's not compulsory that you keep the background just white. The image should be in 16:9 landscape aspect ratio.`
  }
}

// Get the white background image file path based on collection type and aspect ratio
// This matches Flutter's _getAssetForAspectRatio() function in add_collection_screen.dart
function getWhiteBackgroundImagePath(collectionType: string, aspectRatio: string): { filename: string; mimeType: string } {
  switch (collectionType) {
    case 'trending':
      // From Flutter: add_collection_screen.dart _getAssetForAspectRatio()
      // Trending uses 32.jpg for 3:2 (small boxes at position 0,3) and 56.jpg for 5:6 (large boxes at position 1,2)
      if (aspectRatio === '3:2') {
        return { filename: '32.jpg', mimeType: 'image/jpeg' }
      } else {
        return { filename: '56.jpg', mimeType: 'image/jpeg' }
      }
    
    case 'occasion':
      // From Flutter: collections_screen.dart EditOccasionCollectionScreen _generateImage()
      // Occasion collections use 11to14.jpg (11:14 aspect ratio)
      return { filename: '11to14.jpg', mimeType: 'image/jpeg' }
    
    case 'category':
      // Categories use 1:1 square images
      return { filename: '1to1.jpg', mimeType: 'image/jpeg' }
    
    case 'hero':
      return { filename: '16to9.jpg', mimeType: 'image/jpeg' }
    case 'best':
    default:
      // From Flutter: add_collection_screen.dart _getAssetForAspectRatio() for hero mode
      // Hero, Best, and default use 16:9 landscape
      // Note: Using JPG instead of AVIF because Gemini API doesn't support AVIF
      return { filename: '16to9.jpg', mimeType: 'image/jpeg' }
  }
}

// Fetch white background image and convert to base64
async function getBackgroundImageBase64(collectionType: string, aspectRatio: string): Promise<{ base64: string; mimeType: string }> {
  const { filename, mimeType } = getWhiteBackgroundImagePath(collectionType, aspectRatio)
  
  try {
    // In Next.js, public folder files are served from the root
    // For server-side, we need to read from the filesystem
    const publicDir = path.join(process.cwd(), 'public', 'white')
    const imagePath = path.join(publicDir, filename)
    
    console.log(`[getBackgroundImageBase64] Attempting to load: ${imagePath}`)
    console.log(`[getBackgroundImageBase64] Collection type: ${collectionType}, Aspect ratio: ${aspectRatio}`)
    console.log(`[getBackgroundImageBase64] Expected filename: ${filename}, mimeType: ${mimeType}`)
    
    const imageBuffer = await readFile(imagePath)
    const base64 = imageBuffer.toString('base64')
    
    console.log(`✅ Loaded white background image: ${filename} (${mimeType}), size: ${imageBuffer.length} bytes`)
    
    return { base64, mimeType }
  } catch (error) {
    console.error(`❌ Failed to load white background image ${filename}:`, error)
    console.error(`Error details:`, {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any)?.code,
      path: (error as any)?.path
    })
    // Fallback to a minimal white pixel PNG if file not found
    console.log('⚠️ Using fallback 1x1 PNG pixel')
    return {
      base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
      mimeType: 'image/png'
    }
  }
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
    const { base64: backgroundBase64, mimeType: backgroundMimeType } = await getBackgroundImageBase64(collectionType, aspectRatio)

    console.log(`Calling /upload endpoint with prompt: ${prompt.substring(0, 100)}...`)
    console.log(`Using white background for collectionType: ${collectionType}, aspectRatio: ${aspectRatio}`)

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
        mimeType: backgroundMimeType
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
 