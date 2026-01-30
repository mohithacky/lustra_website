# Testing Guide - Firebase + Supabase Auth

## 🧪 Complete Testing Checklist

### Prerequisites

- [x] AuthProvider added to root layout
- [x] Firebase configuration in place
- [x] Supabase configuration in place
- [x] Backend API running (for token verification)

---

## Step 1: Install Dependencies

```bash
cd website-nextjs
npm install
```

**Expected:** All dependencies install successfully.

---

## Step 2: Configure Environment Variables

Verify `.env.local` exists with:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://phlccyxgyftspxnuzttf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_BACKEND_URL=https://api-5sqqk2n6ra-uc.a.run.app
```

---

## Step 3: Start Development Server

```bash
npm run dev
```

**Expected:** Server starts on http://localhost:3000

---

## Step 4: Test Auth Page

### 4.1 Visit Auth Page Directly

1. Navigate to: http://localhost:3000/auth
2. **Expected:** See phone auth form with:
   - Phone number input field
   - "Send OTP" button
   - Clean UI with Lustra AI branding

### 4.2 Test Phone Number Input

1. Enter phone number: `9876543210` (without country code)
2. Click "Send OTP"
3. **Expected:** 
   - reCAPTCHA verification (invisible)
   - OTP sent to +919876543210
   - Form switches to OTP input

### 4.3 Test OTP Verification

1. Enter the 6-digit OTP from SMS
2. Click "Verify OTP"
3. **Expected:**
   - Loading state shown
   - Backend verification happens
   - Redirect to home page (or returnUrl if specified)

---

## Step 5: Test Protected Profile Page

### 5.1 Visit Profile (Not Logged In)

1. Navigate to: http://localhost:3000/profile
2. **Expected:** Redirect to `/auth?returnUrl=/profile`

### 5.2 Complete Login

1. Enter phone number and OTP
2. **Expected:** Redirect back to `/profile`

### 5.3 View Profile Data

**Expected to see:**
- Phone number
- User ID (Firebase UID)
- Shop name (from Supabase)
- Shop details status
- Coins balance
- Member since date
- "Authenticated via Firebase" status

---

## Step 6: Test Auth State Management

### 6.1 Check Browser Console

Open browser console and run:

```javascript
// Check Firebase user
firebase.auth().currentUser
// Should show: User object with uid, phoneNumber, etc.

// Get Firebase token
const token = await firebase.auth().currentUser.getIdToken()
console.log('Token:', token)

// Decode token to check claims
const payload = JSON.parse(atob(token.split('.')[1]))
console.log('Claims:', payload)
console.log('UID:', payload.sub)
console.log('Role:', payload.role) // Should be 'authenticated'
```

**Expected:**
- User object exists
- Token is a valid JWT
- Token has `sub` (Firebase UID)
- Token has `role: authenticated` claim

### 6.2 Test Auth Context

In any component, add:

```typescript
import { useAuth } from '@/contexts/AuthContext'

const { user, loading } = useAuth()
console.log('User:', user)
console.log('Loading:', loading)
```

**Expected:**
- `user` is Firebase User object when logged in
- `user` is null when logged out
- `loading` is true during auth state check

---

## Step 7: Test Supabase Database Access

### 7.1 Test in Browser Console

```javascript
// Get Supabase client
const supabase = window.supabase // If exposed, or use in component

// Query users table
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', firebase.auth().currentUser.uid)

console.log('User data:', data)
console.log('Error:', error)
```

**Expected:**
- Data returned for current user
- No error
- RLS policy allows access

### 7.2 Test in Component

Create a test component:

```typescript
'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useSupabase } from '@/hooks/useSupabase'
import { useEffect, useState } from 'react'

export default function TestComponent() {
  const { user } = useAuth()
  const supabase = useSupabase()
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!user) return

    async function test() {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.uid)
        .single()

      console.log('Data:', data)
      console.log('Error:', error)
      setData(data)
    }

    test()
  }, [user, supabase])

  return <pre>{JSON.stringify(data, null, 2)}</pre>
}
```

**Expected:**
- User data fetched successfully
- Firebase token automatically included in request
- RLS policy enforced

---

## Step 8: Test RLS Policies

### 8.1 Apply RLS Policies

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run the SQL from `supabase-rls-policies.sql`

**Expected:** All policies created successfully

### 8.2 Test Policy Enforcement

**Test 1: Read Own Data (Should Work)**

```javascript
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', user.uid)

// Expected: data returned, no error
```

**Test 2: Read Other User's Data (Should Fail)**

```javascript
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', 'different_user_id')

// Expected: empty data or error due to RLS
```

**Test 3: Update Own Data (Should Work)**

```javascript
const { data, error } = await supabase
  .from('users')
  .update({ shop_name: 'Test Shop' })
  .eq('id', user.uid)

// Expected: update successful
```

---

## Step 9: Test Sign Out

### 9.1 Click Sign Out Button

1. Add AuthButton to a page
2. Click "Sign Out"
3. **Expected:**
   - User signed out from Firebase
   - Auth state updated
   - Redirected to home or login

### 9.2 Verify Session Cleared

```javascript
firebase.auth().currentUser
// Expected: null
```

---

## Step 10: Test Token Refresh

### 10.1 Wait for Token Expiry

Firebase tokens expire after 1 hour. To test:

1. Log in
2. Wait 1 hour (or force token expiry)
3. Make a Supabase query

**Expected:**
- Token automatically refreshed by Firebase
- Query succeeds with new token

### 10.2 Force Token Refresh

```javascript
const user = firebase.auth().currentUser
const newToken = await user.getIdToken(true) // Force refresh
console.log('New token:', newToken)
```

**Expected:** New token generated

---

## Step 11: Test Error Handling

### 11.1 Invalid Phone Number

1. Enter invalid phone: `123`
2. Click "Send OTP"
3. **Expected:** Error message shown

### 11.2 Invalid OTP

1. Enter wrong OTP: `000000`
2. Click "Verify OTP"
3. **Expected:** Error message: "Invalid OTP"

### 11.3 Network Error

1. Disconnect internet
2. Try to send OTP
3. **Expected:** Error message shown

---

## Step 12: Test Redirect Flow

### 12.1 Test returnUrl Parameter

1. Visit: http://localhost:3000/auth?returnUrl=/profile
2. Complete login
3. **Expected:** Redirect to `/profile`

### 12.2 Test from Protected Page

1. Visit protected page while logged out
2. **Expected:** Redirect to `/auth?returnUrl=<current_page>`
3. Complete login
4. **Expected:** Redirect back to protected page

---

## Common Issues & Solutions

### Issue: "reCAPTCHA not working"

**Solution:**
- Check Firebase Console > Authentication > Sign-in method
- Ensure Phone authentication is enabled
- Verify domain is authorized (localhost is allowed by default)

### Issue: "Token verification failed"

**Solution:**
- Check backend is running
- Verify backend adds custom claims
- Check token has `role: authenticated` claim

### Issue: "RLS policy blocks access"

**Solution:**
- Verify policies are applied in Supabase
- Check Firebase UID matches database user ID
- Test policy in Supabase SQL Editor

### Issue: "User not found in database"

**Solution:**
- Ensure backend creates user after phone auth
- Check `/auth/verify-phone-token` endpoint
- Verify `users` table schema

---

## Performance Testing

### Test 1: Auth State Load Time

**Expected:** < 500ms for auth state check

### Test 2: Database Query Time

**Expected:** < 1000ms for simple queries

### Test 3: Token Refresh Time

**Expected:** < 500ms for token refresh

---

## Security Testing

### Test 1: Verify JWT Signature

```javascript
// Token should be signed by Firebase
const token = await user.getIdToken()
// Verify at: https://jwt.io
```

### Test 2: Check Token Claims

```javascript
const payload = JSON.parse(atob(token.split('.')[1]))
console.log('Issuer:', payload.iss) // Should be Firebase
console.log('Audience:', payload.aud) // Should be your project
console.log('Expiry:', new Date(payload.exp * 1000))
```

### Test 3: Test RLS Bypass Attempts

Try to access other users' data - should fail.

---

## ✅ Final Verification Checklist

- [ ] Auth page loads correctly
- [ ] Phone OTP sends successfully
- [ ] OTP verification works
- [ ] User redirected after login
- [ ] Profile page shows user data
- [ ] Firebase token includes custom claims
- [ ] Supabase queries work with Firebase token
- [ ] RLS policies enforce access control
- [ ] Sign out works correctly
- [ ] Token refresh works automatically
- [ ] Error handling works properly
- [ ] Protected routes redirect to auth
- [ ] returnUrl parameter works

---

## 🎉 Success Criteria

**All tests pass when:**

1. ✅ User can log in with phone number
2. ✅ Firebase session persists across page reloads
3. ✅ Supabase queries automatically include Firebase token
4. ✅ RLS policies enforce user-specific access
5. ✅ Protected pages redirect to auth when not logged in
6. ✅ User data displays correctly on profile page
7. ✅ Sign out clears session properly
8. ✅ No console errors during normal flow

---

## Next Steps After Testing

1. Deploy to production
2. Configure production Firebase settings
3. Update environment variables for production
4. Test on production domain
5. Monitor error logs
6. Set up analytics

**Your auth system is ready for production! 🚀**
