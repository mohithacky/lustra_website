# Firebase + Supabase Auth Integration Guide

## ✅ What's Already Implemented

### 1. Auth Page (`/auth`)
- **Location:** `src/app/auth/page.tsx`
- **Features:**
  - Phone number input with country code
  - OTP verification
  - Firebase Phone Authentication
  - Automatic redirect back to original page after login
  - Beautiful UI with Tailwind CSS

### 2. Phone Auth Form Component
- **Location:** `src/components/auth/PhoneAuthForm.tsx`
- **Features:**
  - Two-step flow (phone → OTP)
  - reCAPTCHA integration
  - Resend OTP functionality
  - Error handling
  - Loading states

### 3. Firebase Integration
- **Location:** `src/lib/firebase.ts`
- Firebase initialized with your project config
- Singleton pattern to prevent multiple initializations

### 4. Firebase Auth Service
- **Location:** `src/lib/firebaseAuth.ts`
- `initializeRecaptcha()` - Sets up reCAPTCHA
- `sendFirebaseOtp()` - Sends OTP to phone
- `verifyFirebaseOtp()` - Verifies OTP and completes auth
- `getCurrentFirebaseUser()` - Gets current user
- `getCurrentFirebaseIdToken()` - Gets fresh ID token
- `signOutFirebase()` - Signs out user

### 5. Supabase Client with Dynamic Firebase Token
- **Location:** `src/lib/supabaseFirebaseClient.ts`
- `createSupabaseClientWithFirebaseAuth()` - Creates client with auto token injection
- Custom fetch intercepts all Supabase requests
- Automatically adds `Authorization: Bearer <firebase_token>` header
- Token fetched fresh on every request

### 6. Auth Context
- **Location:** `src/contexts/AuthContext.tsx`
- Monitors Firebase auth state with `onAuthStateChanged()`
- Provides `user`, `loading`, `signOut`, `redirectToAuth`
- Manages auth state globally

### 7. Auth Button Component
- **Location:** `src/components/AuthButton.tsx`
- Shows "Sign In" when logged out
- Shows "Sign Out" when logged in
- Handles loading state

### 8. Supabase Hook
- **Location:** `src/hooks/useSupabase.ts`
- `useSupabase()` - Returns Supabase client with Firebase auth
- Use this hook in any component that needs database access

---

## 🚀 How to Complete the Integration

### Step 1: Add AuthProvider to Root Layout

**File:** `src/app/layout.tsx`

```typescript
import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

export const metadata: Metadata = {
  title: 'Lustra AI - Beautiful Jewelry Websites',
  description: 'Create stunning jewelry websites with Lustra AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="light">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

### Step 2: Add Auth Button to Your Navigation

**Example:** Add to your header/navbar component

```typescript
import AuthButton from '@/components/AuthButton'

export default function Header() {
  return (
    <header className="bg-white shadow">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="text-xl font-bold">Lustra AI</div>
        <AuthButton />
      </nav>
    </header>
  )
}
```

### Step 3: Use Auth in Your Components

**Example: Protected Profile Page**

```typescript
'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useSupabase } from '@/hooks/useSupabase'
import { useEffect, useState } from 'react'

export default function ProfilePage() {
  const { user, loading, redirectToAuth } = useAuth()
  const supabase = useSupabase()
  const [userData, setUserData] = useState(null)

  useEffect(() => {
    if (loading) return
    
    if (!user) {
      redirectToAuth()
      return
    }

    async function fetchUserData() {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.uid)
        .single()

      if (data) setUserData(data)
      if (error) console.error('Error:', error)
    }

    fetchUserData()
  }, [user, loading, supabase, redirectToAuth])

  if (loading) return <div>Loading...</div>
  if (!user) return null

  return (
    <div>
      <h1>Profile</h1>
      <p>Phone: {user.phoneNumber}</p>
      <p>Shop Name: {userData?.shop_name}</p>
    </div>
  )
}
```

### Step 4: Configure Supabase RLS Policies

**Example: Users Table**

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own data"
ON users
FOR SELECT
USING ((auth.jwt() ->> 'sub') = id);

-- Users can update their own data
CREATE POLICY "Users can update own data"
ON users
FOR UPDATE
USING ((auth.jwt() ->> 'sub') = id);
```

**Example: Products Table**

```sql
-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Users can read their own products
CREATE POLICY "Users can read own products"
ON products
FOR SELECT
USING (user_id = (auth.jwt() ->> 'sub'));

-- Users can create products
CREATE POLICY "Users can create products"
ON products
FOR INSERT
WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

-- Users can update their own products
CREATE POLICY "Users can update own products"
ON products
FOR UPDATE
USING (user_id = (auth.jwt() ->> 'sub'));

-- Users can delete their own products
CREATE POLICY "Users can delete own products"
ON products
FOR DELETE
USING (user_id = (auth.jwt() ->> 'sub'));
```

---

## 🔐 How It Works

### Authentication Flow

```
1. User clicks "Sign In" button
   ↓
2. Redirected to /auth?returnUrl=<current_page>
   ↓
3. User enters phone number
   ↓
4. Firebase sends OTP via SMS
   ↓
5. User enters OTP
   ↓
6. Firebase verifies OTP and creates session
   ↓
7. Backend adds custom claim: role=authenticated
   ↓
8. User redirected back to original page
   ↓
9. AuthContext detects auth state change
   ↓
10. User is now authenticated
```

### Database Access Flow

```
1. Component calls: const supabase = useSupabase()
   ↓
2. Component queries: supabase.from('users').select()
   ↓
3. Custom fetch intercepts request
   ↓
4. Calls: firebase.auth().currentUser.getIdToken()
   ↓
5. Adds header: Authorization: Bearer <firebase_token>
   ↓
6. Supabase receives request with Firebase JWT
   ↓
7. Supabase verifies JWT signature
   ↓
8. RLS policy checks: (auth.jwt() ->> 'sub') = user_id
   ↓
9. Only authorized rows returned
```

---

## 📝 Usage Examples

### Example 1: Fetch User's Products

```typescript
'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useSupabase } from '@/hooks/useSupabase'
import { useEffect, useState } from 'react'

export default function ProductsPage() {
  const { user } = useAuth()
  const supabase = useSupabase()
  const [products, setProducts] = useState([])

  useEffect(() => {
    if (!user) return

    async function fetchProducts() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.uid)
        .order('created_at', { ascending: false })

      if (data) setProducts(data)
    }

    fetchProducts()
  }, [user, supabase])

  return (
    <div>
      <h1>My Products</h1>
      {products.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  )
}
```

### Example 2: Create New Product

```typescript
async function createProduct(name: string, price: number) {
  const { user } = useAuth()
  const supabase = useSupabase()

  const { data, error } = await supabase
    .from('products')
    .insert({
      user_id: user.uid,
      name: name,
      price: price
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating product:', error)
    return null
  }

  return data
}
```

### Example 3: Update User Profile

```typescript
async function updateProfile(shopName: string) {
  const { user } = useAuth()
  const supabase = useSupabase()

  const { data, error } = await supabase
    .from('users')
    .update({ shop_name: shopName })
    .eq('id', user.uid)
    .select()
    .single()

  if (error) {
    console.error('Error updating profile:', error)
    return false
  }

  return true
}
```

### Example 4: Protected Route

```typescript
'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect } from 'react'

export default function ProtectedPage() {
  const { user, loading, redirectToAuth } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      redirectToAuth()
    }
  }, [user, loading, redirectToAuth])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return null
  }

  return (
    <div>
      <h1>Protected Content</h1>
      <p>Only authenticated users can see this</p>
    </div>
  )
}
```

---

## 🧪 Testing

### Test Authentication

1. Start dev server: `npm run dev`
2. Visit http://localhost:3000
3. Click "Sign In"
4. Enter phone number with country code (e.g., +919876543210)
5. Enter OTP from SMS
6. Should redirect back to original page
7. Open browser console and check:
   ```javascript
   firebase.auth().currentUser
   // Should show user object
   ```

### Test Database Access

1. Open browser console
2. Get current user:
   ```javascript
   const user = firebase.auth().currentUser
   console.log('User:', user.uid)
   ```
3. Get Firebase token:
   ```javascript
   const token = await user.getIdToken()
   console.log('Token:', token)
   ```
4. Decode token to check claims:
   ```javascript
   const payload = JSON.parse(atob(token.split('.')[1]))
   console.log('Claims:', payload)
   console.log('Role:', payload.role) // Should be 'authenticated'
   ```

### Test Supabase Query

In a component:
```typescript
const { user } = useAuth()
const supabase = useSupabase()

const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', user.uid)

console.log('User data:', data)
console.log('Error:', error)
```

---

## 🐛 Troubleshooting

### "reCAPTCHA not working"
- Ensure you're on localhost or a domain registered in Firebase Console
- Check Firebase Console > Authentication > Sign-in method > Phone
- Make sure reCAPTCHA container div exists

### "Token verification failed"
- Check backend is adding custom claims
- Verify token has `role: authenticated` claim
- Check Supabase trusts Firebase JWTs

### "RLS policy blocks access"
- Verify Firebase UID matches database user ID
- Check RLS policy uses `(auth.jwt() ->> 'sub')`
- Test policy in Supabase SQL Editor

### "User not found in database"
- Ensure backend creates user after phone auth
- Check `/auth/verify-phone-token` endpoint
- Verify `users` table schema

---

## 📚 Additional Resources

- **Full Documentation:** `FIREBASE_SUPABASE_AUTH_GUIDE.md`
- **Quick Start:** `QUICK_START.md`
- **Firebase Docs:** https://firebase.google.com/docs/auth/web/phone-auth
- **Supabase RLS:** https://supabase.com/docs/guides/auth/row-level-security

---

## ✅ Checklist

- [x] Auth page created at `/auth`
- [x] Firebase Phone Auth integrated
- [x] Supabase client with dynamic token retrieval
- [x] Auth context for state management
- [x] Auth button component
- [x] Supabase hook for easy database access
- [ ] Add AuthProvider to root layout
- [ ] Add AuthButton to navigation
- [ ] Configure Supabase RLS policies
- [ ] Test complete auth flow
- [ ] Deploy to production

---

**You're ready to go! Just add the AuthProvider to your layout and start using auth in your components.**
