# Cross-Domain Authentication Flow

## 🔄 Overview

This document explains the cross-domain authentication flow between subdomain websites (e.g., `ashishjewellers.lustrai.in`) and the central auth service (`lustrai.in/auth`).

---

## 🔐 How It Works

### 1. Flow Diagram

```
┌─────────────────────┐                 ┌───────────────────┐                 ┌─────────────────────┐
│                     │                 │                   │                 │                     │
│  Subdomain Website  │                 │   Auth Service    │                 │  Subdomain Website  │
│                     │                 │                   │                 │                     │
│ ashishjewellers.    │ ─────────────▶  │  lustrai.in/auth  │ ─────────────▶  │ ashishjewellers.    │
│ lustrai.in          │    Redirect     │                   │    Redirect     │ lustrai.in          │
│                     │                 │                   │    back         │                     │
└─────────────────────┘                 └───────────────────┘                 └─────────────────────┘
        Step 1                                 Step 2                                Step 3
     User clicks                        User authenticates                    Firebase session is
      "Login"                                                                    established
```

### 2. Step-by-Step Process

#### Step 1: Redirect to Central Auth

1. User visits a subdomain website (e.g., `ashishjewellers.lustrai.in`)
2. User clicks "Login" button
3. Website captures current URL as `returnUrl` 
4. User is redirected to `https://lustrai.in/auth?returnUrl=https://ashishjewellers.lustrai.in/current-page`

#### Step 2: Authentication at Central Service

1. User arrives at `lustrai.in/auth`
2. User can choose between "Login" or "Sign Up" mode
3. User enters phone number
4. Firebase sends OTP via SMS
5. User enters OTP
6. OTP is verified with Firebase
7. Firebase creates auth session (ID token)
8. Auth service processes redirect back to original subdomain

#### Step 3: Return to Original Website

1. User is redirected back to the original URL in `returnUrl` parameter
2. Firebase session is preserved across subdomains
3. Original website recognizes Firebase session automatically
4. User has access to authenticated features

---

## 🔧 Technical Implementation

### 1. Redirect Links

```typescript
// From a subdomain website to central auth
<a href={`https://lustrai.in/auth?returnUrl=${encodeURIComponent(window.location.href)}`}>
  Login
</a>
```

### 2. Auth Page Component

```typescript
// Auth page handling
const returnUrl = searchParams.get('returnUrl')
// After successful auth
if (returnUrl.startsWith('http')) {
  window.location.href = returnUrl
}
```

### 3. Cross-Domain Session Management

Firebase handles session persistence across subdomains automatically through:
- First-party cookies (`.lustrai.in`)
- IndexedDB storage
- localStorage with proper domain scope

### 4. Sign Up vs Login Flow

Both flows use the same phone authentication method but:
- **Login**: Used for existing users
- **Sign Up**: Indicates this is a new user, proper welcome flows can be triggered

---

## 🔍 Important Considerations

### 1. Security

- **HTTPS Required**: All domains must use HTTPS to ensure secure cookie transmission
- **Proper Encoding**: All URL parameters are properly encoded
- **Validation**: Return URLs are validated to prevent open redirects

### 2. User Experience

- **Loading States**: Proper loading indicators during auth flow
- **Error Handling**: Clear error messages during auth process
- **Domain Indication**: Users are shown which domain they will return to

### 3. Cookie Considerations

- Firebase uses same-site cookies which work across subdomains
- All subdomains must be on the same root domain (`.lustrai.in`)

---

## 🧪 Testing the Flow

### 1. Full Flow Test

1. Visit a subdomain: `https://ashishjewellers.lustrai.in`
2. Click "Login" - should redirect to `https://lustrai.in/auth?returnUrl=...`
3. Complete phone auth
4. Should redirect back to the exact page on subdomain
5. Firebase session should be active (check `firebase.auth().currentUser`)

### 2. Mobile Testing

Test the flow on mobile devices to ensure:
- SMS reception works properly
- Redirects function correctly on mobile browsers
- Session persistence works after app switching

---

## 🐛 Troubleshooting

### Common Issues

1. **Session Not Persisting**: 
   - Check Firebase config has correct authDomain
   - Ensure all sites use HTTPS
   - Verify browsers allow third-party cookies

2. **Redirect Not Working**:
   - Check URL encoding is correct
   - Verify returnUrl parameter is complete with protocol
   - Ensure no client-side routing conflicts

3. **Auth Flow Errors**:
   - Check Firebase Phone Auth is enabled in console
   - Verify test phone numbers if in development
   - Check reCAPTCHA setup is correct

---

## 📝 Implementation Notes

1. **Supabase Integration**: 
   - Supabase receives Firebase ID token for authentication
   - Row Level Security enforces access using Firebase UID

2. **User Types**:
   - Login: Existing user flow
   - Sign Up: New user onboarding flow

3. **Edge Cases**:
   - Browser back button handling
   - Session timeout handling
   - Incomplete auth flow handling

---

## ✅ Configuration Requirements

1. **Firebase Project**:
   - Phone Authentication enabled
   - Web application configured
   - Domains added to authorized domains

2. **Domain Setup**:
   - All subdomains configured properly
   - Main domain hosting auth page
   - CORS configuration if needed

3. **Environment Variables**:
   - `NEXT_PUBLIC_FIREBASE_CONFIG` properly set
   - `NEXT_PUBLIC_BACKEND_URL` for token verification

---

## 🚀 Deployment

Ensure all domains are correctly set up in:

1. **Firebase Console**:
   - Add main domain: `lustrai.in`
   - Add all subdomains: `*.lustrai.in`

2. **DNS Configuration**:
   - Wildcard DNS record for subdomains
   - Proper A/CNAME records for main domain

---

This implementation ensures a seamless login experience across all Lustra AI domains while maintaining a centralized authentication service.
