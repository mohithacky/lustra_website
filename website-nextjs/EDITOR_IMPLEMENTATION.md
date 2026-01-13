# Editor Implementation for WebView Integration

This document explains how the Next.js website integrates with the Flutter native app's WebView to provide editing capabilities.

## Architecture Overview

The implementation follows the same secure architecture as the Flutter website:

### Security Flow
1. **App requests editor session** - Flutter app requests an editor session from the backend with login JWT
2. **Backend validates and issues token** - Backend validates ownership and issues a short-lived editor token (15 min)
3. **WebView loads website** - WebView loads the website directly (no URL parameters)
4. **JavaScript injection** - After page load, Flutter injects `window.lustraEditorContext` via JavaScript
5. **Website reads context** - Website reads the context to enable editing UI
6. **Backend validates all edits** - All edit actions are validated by backend using the token

### Security Guarantees
- Editor token is validated by backend on every edit request
- Token expires in 15 minutes
- Token is injected via JavaScript bridge (not URL params)
- Backend validates token + ownership on every mutation

## Implementation Files

### 1. Editor Context Detection (`src/lib/editor-context.ts`)
Handles the JavaScript bridge between Flutter app and Next.js website.

**Key Functions:**
- `isInEditorMode()` - Check if running in WebView with editor context
- `getEditorContext()` - Get the injected editor context
- `canEditCollections()` - Check collection editing permission
- `canEditSections()` - Check section editing permission
- `waitForEditorContext()` - Wait for context injection (with timeout)
- `getEditorToken()` - Get token for API requests

**How it works:**
```javascript
// Flutter injects this after page load:
window.lustraEditorContext = {
  enabled: true,
  token: "...",
  websiteId: "...",
  scopes: ["collections:write", "sections:write"],
  expiresAt: 1234567890,
  canEditSections: true,
  canEditCollections: true,
  injectedAt: 1234567890
}

// Website listens for this event:
window.addEventListener('lustraEditorContextReady', (event) => {
  // Context is ready, enable editor UI
})
```

### 2. Editor Buttons Component (`src/components/editor/EditorButtons.tsx`)
Floating action buttons that appear on the home page when in editor mode.

**Features:**
- Only visible when `window.lustraEditorContext.enabled === true`
- Shows "Add Collection" button if `canEditCollections === true`
- Shows "Edit Trending" button if `canEditCollections === true`
- Shows "Edit Sections" button if `canEditSections === true`
- Positioned fixed at bottom-right corner

### 3. Add Collections Screen (`src/app/[domain]/editor/collections/add/page.tsx`)
Allows adding new hero carousel collections.

**Features:**
- Collection name input
- Two banner options:
  - **Generate with AI** - Uses Gemini to generate collection banners
  - **Upload Image** - Upload custom banner image
- Lists existing collections
- Delete collections
- 16:9 aspect ratio for hero carousel

### 4. Edit Trending Collections Screen (`src/app/[domain]/editor/trending/page.tsx`)
Manages the 4 trending collection slots with specific aspect ratios.

**Features:**
- 4 fixed positions:
  - Position 1: Portrait (5:6 aspect ratio)
  - Position 2: Landscape (3:2 aspect ratio)
  - Position 3: Landscape (3:2 aspect ratio)
  - Position 4: Portrait (5:6 aspect ratio)
- Edit each position independently
- Generate or upload banners with correct aspect ratio
- Visual grid showing all 4 positions

## Integration with Flutter App

### Flutter Side (Already Implemented)
The Flutter app (`lib/screens/website_webview_screen.dart`) handles:

1. **Request editor session:**
```dart
final session = await EditorTokenService.requestEditorSession(
  websiteId: userId,
);
```

2. **Inject context after page load:**
```dart
final jsCode = '''
  window.lustraEditorContext = {
    enabled: true,
    token: "${session.token}",
    websiteId: "${session.websiteId}",
    scopes: ${json.encode(session.scopes)},
    expiresAt: ${session.expiresAt.millisecondsSinceEpoch},
    canEditSections: ${session.canEditSections},
    canEditCollections: ${session.canEditCollections},
    injectedAt: ${DateTime.now().millisecondsSinceEpoch}
  };
  
  window.dispatchEvent(new CustomEvent('lustraEditorContextReady', { 
    detail: window.lustraEditorContext 
  }));
''';

await _controller.runJavaScriptReturningResult(jsCode);
```

### Next.js Side (This Implementation)
The Next.js website:

1. **Waits for context injection:**
```typescript
useEffect(() => {
  waitForEditorContext(3000).then((context) => {
    if (context) {
      setIsEditor(true)
      // Show editor buttons
    }
  })
}, [])
```

2. **Uses token for API requests:**
```typescript
const token = getEditorToken()
const response = await fetch('/api/editor/collections/save', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({ ... })
})
```

## Required API Endpoints

The following API endpoints need to be implemented on the backend:

### Collections Management
- `GET /api/editor/collections/hero?shopId={id}` - Get hero collections
- `GET /api/editor/collections/trending?shopId={id}` - Get trending collections
- `POST /api/editor/collections/save` - Save new hero collection
- `POST /api/editor/collections/trending/save` - Save trending collection
- `DELETE /api/editor/collections/{id}` - Delete collection

### Image Generation
- `POST /api/editor/generate-banner` - Generate banner with AI
  - Body: `{ collectionName, aspectRatio, shopId }`
  - Returns: `{ imageUrl }`

### Authentication
All endpoints must:
1. Validate the `Authorization: Bearer {token}` header
2. Verify token hasn't expired
3. Verify user owns the website (websiteId matches shopId)
4. Check user has required scopes

## Testing the Implementation

### 1. Test in Flutter App WebView
1. Open the Flutter app
2. Navigate to Website section
3. Click "Preview Website"
4. Flutter will inject editor context
5. Editor buttons should appear at bottom-right
6. Click buttons to access editor screens

### 2. Test Context Injection
Open browser console and check:
```javascript
console.log(window.lustraEditorContext)
// Should show the injected context when in WebView
```

### 3. Test Without WebView
When accessing the website directly (not in WebView):
- Editor buttons should NOT appear
- `window.lustraEditorContext` should be undefined
- Website functions normally for customers

## Differences from Flutter Website

### Similarities
✅ Same JavaScript injection mechanism
✅ Same token-based authentication
✅ Same editor session flow
✅ Same security model
✅ Same UI for Add/Edit Collections

### Differences
- **Framework**: Next.js (React) vs Flutter Web
- **Styling**: Tailwind CSS vs Flutter widgets
- **State Management**: React hooks vs Flutter state
- **Image Upload**: Next.js file handling vs Flutter file picker

## Future Enhancements

1. **Edit Sections** - Add section editing capabilities
2. **Edit Categories** - Add category management
3. **Product Management** - Add/edit products from WebView
4. **Real-time Preview** - Live preview of changes
5. **Undo/Redo** - Change history management
6. **Collaborative Editing** - Multiple editors support

## Troubleshooting

### Editor Buttons Not Showing
1. Check if `window.lustraEditorContext` exists
2. Check if `enabled === true`
3. Check browser console for errors
4. Verify Flutter app is injecting context

### Token Expired
- Editor session expires in 15 minutes
- Flutter app shows warning 2 minutes before expiry
- User can refresh session from Flutter app

### API Errors
- Check token is being sent in Authorization header
- Verify backend is validating token correctly
- Check user has required scopes
- Verify websiteId matches shopId
 