# Firebase Phone Authentication Setup for Next.js Website

This document explains how to implement Firebase phone authentication with Supabase third-party auth integration in the Next.js website, matching the Flutter app's implementation.

## Overview

The implementation follows the exact same authentication flow as the Flutter app:

1. **Firebase Phone Auth** → User signs in with phone OTP via Firebase
2. **Get Firebase ID Token** → Extract JWT from Firebase user
3. **Backend Verification** → Send token to `/auth/verify-phone-token` endpoint
4. **Add Custom Claims** → Backend adds `role: 'authenticated'` claim to Firebase token
5. **Refresh Token** → Get updated token with custom claims
6. **Create Supabase Client** → Use Firebase token as Authorization header
7. **Access Supabase Tables** → RLS policies accept Firebase JWT with role claim

## Installation

### 1. Install Firebase SDK

```bash
cd website-nextjs
npm install firebase
```

### 2. Install Supabase Client

```bash
npm install @supabase/supabase-js
```

## Configuration

### Firebase Configuration

The Firebase configuration is already set up in `src/lib/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyBlDsaqVXou8_m4Yn6HTir5LpYUUnJLAnE",
  authDomain: "lustra-ai.firebaseapp.com",
  projectId: "lustra-ai",
  storageBucket: "lustra-ai.firebasestorage.app",
  messagingSenderId: "853834753761",
  appId: "1:853834753761:web:50c28641e3f7e03b12f9a0",
  measurementId: "G-H1XEWD5SK5"
}
```

### Supabase Configuration

Set these environment variables in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://phlccyxgyftspxnuzttf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Usage

### Replace Twilio Phone Login with Firebase Phone Login

In your component where you currently use `PhoneLoginDialog`, replace it with `FirebasePhoneLoginDialog`:

```typescript
import FirebasePhoneLoginDialog from '@/components/auth/FirebasePhoneLoginDialog'

// In your component
const [isLoginOpen, setIsLoginOpen] = useState(false)

const handleLoginSuccess = (
  userId: string, 
  userName: string, 
  authResult: FirebaseAuthResult
) => {
  console.log('User authenticated:', userId)
  console.log('Is new user:', authResult.isNewUser)
  console.log('Shop details filled:', authResult.shopDetailsFilled)
  
  // Store user data and proceed with your app logic
  // The Firebase ID token is available in authResult.idToken
  // Use it for authenticated Supabase requests
}

<FirebasePhoneLoginDialog
  isOpen={isLoginOpen}
  onClose={() => setIsLoginOpen(false)}
  onSuccess={handleLoginSuccess}
  shopName={shopName}
  shopId={shopId}
  isDark={isDark}
/>
```

### Making Authenticated Supabase Requests

After successful authentication, use the Firebase ID token to create a Supabase client:

```typescript
import { createSupabaseClientWithFirebaseToken } from '@/lib/supabaseFirebaseClient'
import { getCurrentFirebaseIdToken } from '@/lib/firebaseAuth'

// Get current Firebase ID token
const idToken = await getCurrentFirebaseIdToken()

if (idToken) {
  // Create Supabase client with Firebase token
  const supabase = createSupabaseClientWithFirebaseToken(idToken)
  
  // Now you can make authenticated requests
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
}
```

## Authentication Flow Details

### Step 1: Send OTP

```typescript
import { initializeRecaptcha, sendFirebaseOtp } from '@/lib/firebaseAuth'

// Initialize reCAPTCHA (required by Firebase for web)
const recaptchaVerifier = initializeRecaptcha('recaptcha-container')

// Send OTP
const confirmationResult = await sendFirebaseOtp('+919876543210', recaptchaVerifier)
```

### Step 2: Verify OTP and Complete Authentication

```typescript
import { verifyFirebaseOtp } from '@/lib/firebaseAuth'

// Verify OTP (this handles all 7 steps automatically)
const authResult = await verifyFirebaseOtp(confirmationResult, '123456')

// authResult contains:
// - firebaseUser: Firebase user object
// - idToken: Firebase ID token with custom claims
// - isNewUser: boolean
// - shopDetailsFilled: boolean
// - userId: Firebase UID
// - phoneNumber: User's phone number
```

### Step 3: Use Authenticated Supabase Client

```typescript
import { createSupabaseClientWithFirebaseToken } from '@/lib/supabaseFirebaseClient'

const supabase = createSupabaseClientWithFirebaseToken(authResult.idToken)

// Make authenticated requests
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', authResult.userId)
```

## Backend Requirements

The backend endpoint `/auth/verify-phone-token` is already implemented in `functions/index.js`. It:

1. Verifies the Firebase ID token
2. Adds custom claim `role: 'authenticated'` to the token
3. Creates or updates user in Supabase `users` table with `auth_provider: 'firebase'`
4. Returns user data and `isNewUser` flag

## Security Considerations

1. **reCAPTCHA**: Firebase requires reCAPTCHA verification for web phone auth to prevent abuse
2. **Token Expiration**: Firebase ID tokens expire after 1 hour. Refresh them using `user.getIdToken(true)`
3. **Custom Claims**: The `role: 'authenticated'` claim is required for Supabase RLS policies to work
4. **HTTPS Only**: Firebase phone auth only works over HTTPS in production

## Troubleshooting

### reCAPTCHA Issues

If you see reCAPTCHA errors:
- Ensure your domain is whitelisted in Firebase Console → Authentication → Settings
- For localhost development, Firebase automatically allows it

### "Invalid phone number" Error

- Phone numbers must be in E.164 format: `+[country code][number]`
- Example: `+919876543210` for India

### "Too many requests" Error

- Firebase has rate limits on SMS sending
- Wait a few minutes before trying again
- Consider implementing exponential backoff

### Supabase RLS Errors

If you get permission errors when accessing Supabase tables:
- Check that the `role: 'authenticated'` claim is present in the token
- Verify RLS policies allow access for `auth.role() = 'authenticated'`
- Ensure the Firebase JWT secret is configured in Supabase

## Migration from Twilio

To migrate from Twilio to Firebase:

1. Replace `PhoneLoginDialog` with `FirebasePhoneLoginDialog`
2. Update authentication state management to use Firebase user
3. Replace Twilio API calls with Firebase auth methods
4. Update backend to handle Firebase tokens instead of Twilio UIDs
5. Test thoroughly with both new and existing users

## Testing

### Development Testing

```typescript
// Test phone number (works without SMS in development)
// Configure in Firebase Console → Authentication → Phone
const testPhone = '+919999999999'
const testOtp = '123456'
```

### Production Testing

1. Test with a real phone number
2. Verify OTP is received via SMS
3. Check that user is created in Supabase `users` table
4. Verify authenticated requests work correctly
5. Test token refresh after expiration

## Additional Resources

- [Firebase Phone Auth Documentation](https://firebase.google.com/docs/auth/web/phone-auth)
- [Supabase Third-Party Auth](https://supabase.com/docs/guides/auth/third-party-auth)
- [Flutter App Implementation](../lib/services/auth_service.dart)
