# How to Test the New Login Flow

## 🚀 Quick Test (5 Minutes)

### Step 1: Start the Development Server

```bash
cd website-nextjs
npm run dev
```

Server will start at: http://localhost:3000

---

### Step 2: Test the Auth Page Directly

1. **Visit:** http://localhost:3000/auth
2. **You should see:**
   - "Welcome to Lustra AI" heading
   - Phone number input field
   - "Send OTP" button
   - Clean amber/orange gradient background

---

### Step 3: Send OTP

1. **Enter your phone number:**
   - With country code: `+919876543210`
   - Or without (will auto-add +91): `9876543210`

2. **Click "Send OTP"**

3. **What happens:**
   - reCAPTCHA verification (invisible)
   - Loading state: "Sending OTP..."
   - SMS sent to your phone
   - Form switches to OTP input

4. **Possible errors:**
   - "Invalid phone number" - Check format
   - "reCAPTCHA failed" - Check Firebase Console settings
   - Network error - Check internet connection

---

### Step 4: Verify OTP

1. **Check your phone for SMS** (from Firebase)

2. **Enter the 6-digit OTP** in the input field

3. **Click "Verify OTP"**

4. **What happens:**
   - Loading state: "Verifying..."
   - Backend verification
   - Custom claim added: `role: authenticated`
   - Token refreshed
   - Redirect to home page

---

### Step 5: Test Protected Profile Page

1. **Visit:** http://localhost:3000/profile

2. **If logged in, you should see:**
   - Your phone number
   - User ID (Firebase UID)
   - Shop name (from Supabase)
   - Shop details status
   - Coins balance
   - Member since date
   - "Sign Out" button

3. **If NOT logged in:**
   - Auto-redirect to `/auth?returnUrl=/profile`
   - After login, redirect back to `/profile`

---

## 🔍 Detailed Testing

### Test 1: Check Firebase Auth State

Open browser console (F12) and run:

```javascript
// Check if user is logged in
firebase.auth().currentUser
// Should show: User { uid: "...", phoneNumber: "+91..." }

// Get Firebase token
const token = await firebase.auth().currentUser.getIdToken()
console.log('Token:', token)

// Decode token to see claims
const payload = JSON.parse(atob(token.split('.')[1]))
console.log('Claims:', payload)
console.log('UID:', payload.sub)
console.log('Role:', payload.role) // Should be 'authenticated'
console.log('Expires:', new Date(payload.exp * 1000))
```

**Expected:**
- User object exists
- Token is a valid JWT
- Has `sub` (Firebase UID)
- Has `role: authenticated` claim
- Expires in ~1 hour

---

### Test 2: Check Auth Context

In browser console:

```javascript
// Auth context should be available
// Check React DevTools > Components > AuthProvider
```

Or add this to any component:

```typescript
import { useAuth } from '@/contexts/AuthContext'

const { user, loading } = useAuth()
console.log('User:', user)
console.log('Loading:', loading)
```

**Expected:**
- `user` is Firebase User object
- `loading` is `false` after auth check
- `user.uid` matches Firebase UID
- `user.phoneNumber` is your phone

---

### Test 3: Test Supabase Database Access

In browser console or component:

```javascript
// Get Supabase client
const supabase = useSupabase() // In component

// Query users table
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', firebase.auth().currentUser.uid)

console.log('User data:', data)
console.log('Error:', error)
```

**Expected:**
- Data returned for your user
- No error
- Firebase token automatically included in request
- RLS policy allows access

---

### Test 4: Test Sign Out

1. **Click "Sign Out" button** (on profile page or AuthButton)

2. **What should happen:**
   - User signed out from Firebase
   - Auth state updated to `null`
   - Redirect to home page

3. **Verify in console:**
   ```javascript
   firebase.auth().currentUser
   // Should be: null
   ```

---

### Test 5: Test Redirect Flow

1. **While logged out, visit:** http://localhost:3000/profile

2. **Expected:**
   - Redirect to `/auth?returnUrl=/profile`

3. **Complete login**

4. **Expected:**
   - Redirect back to `/profile`
   - Profile data loads

---

### Test 6: Test Error Handling

**Invalid Phone Number:**
1. Enter: `123`
2. Click "Send OTP"
3. **Expected:** Error message

**Invalid OTP:**
1. Enter: `000000`
2. Click "Verify OTP"
3. **Expected:** "Invalid OTP" error

**Resend OTP:**
1. Click "Resend OTP"
2. **Expected:** New OTP sent

**Change Number:**
1. Click "Change number"
2. **Expected:** Back to phone input

---

## 🧪 Advanced Testing

### Test Network Requests

Open DevTools > Network tab:

1. **Send OTP:**
   - Should see Firebase API calls
   - reCAPTCHA verification

2. **Verify OTP:**
   - Firebase verification
   - Backend call to `/auth/verify-phone-token`
   - Token refresh

3. **Database query:**
   - Supabase API call
   - Check request headers: `Authorization: Bearer <firebase_token>`

---

### Test Token Refresh

Firebase tokens expire after 1 hour. To test:

1. **Log in**
2. **Wait 1 hour** (or force expiry)
3. **Make a database query**
4. **Expected:** Token auto-refreshed, query succeeds

Force refresh:
```javascript
const user = firebase.auth().currentUser
const newToken = await user.getIdToken(true) // Force refresh
console.log('New token:', newToken)
```

---

### Test RLS Policies

**Before applying policies:**
- Queries may work without proper auth

**After applying policies** (run `supabase-rls-policies.sql`):

1. **Test own data access (should work):**
   ```javascript
   const { data } = await supabase
     .from('users')
     .select('*')
     .eq('id', user.uid)
   // Should return your data
   ```

2. **Test other user's data (should fail):**
   ```javascript
   const { data } = await supabase
     .from('users')
     .select('*')
     .eq('id', 'different_user_id')
   // Should return empty or error
   ```

---

## 📱 Test on Mobile

1. **Get your local IP:**
   ```bash
   ipconfig  # Windows
   ifconfig  # Mac/Linux
   ```

2. **Update Firebase Console:**
   - Add your IP to authorized domains
   - Example: `192.168.1.100:3000`

3. **Visit from phone:**
   - http://192.168.1.100:3000/auth

4. **Test phone auth flow**

---

## ✅ Success Checklist

- [ ] Auth page loads at `/auth`
- [ ] Phone number input works
- [ ] OTP sends successfully
- [ ] OTP verification works
- [ ] User redirected after login
- [ ] Profile page shows user data
- [ ] Firebase token has custom claims
- [ ] Supabase queries include Firebase token
- [ ] RLS policies enforce access
- [ ] Sign out works
- [ ] Protected routes redirect to auth
- [ ] returnUrl parameter works
- [ ] Error messages display correctly
- [ ] Loading states work
- [ ] Token refresh works

---

## 🐛 Common Issues

### "reCAPTCHA not working"
**Fix:**
1. Go to Firebase Console
2. Authentication > Sign-in method
3. Enable Phone authentication
4. Add authorized domains (localhost is auto-added)

### "Token verification failed"
**Fix:**
1. Check backend is running
2. Verify backend URL in `.env.local`
3. Check backend adds custom claims
4. Test token in browser console

### "User not found in database"
**Fix:**
1. Check backend creates user after phone auth
2. Verify `/auth/verify-phone-token` endpoint works
3. Check Supabase `users` table

### "RLS policy blocks access"
**Fix:**
1. Apply RLS policies from `supabase-rls-policies.sql`
2. Verify Firebase UID matches database user ID
3. Check policy uses `(auth.jwt() ->> 'sub')`

---

## 🎯 What to Look For

### ✅ Good Signs:
- Smooth OTP flow
- No console errors
- User data loads on profile
- Token has `role: authenticated`
- Database queries work
- Sign out clears session

### ❌ Bad Signs:
- Console errors
- Infinite redirects
- Token missing claims
- Database queries fail
- RLS blocks own data

---

## 📝 Test Scenarios

### Scenario 1: New User
1. Use a phone number not in database
2. Complete auth flow
3. Check backend creates user
4. Verify user appears in Supabase

### Scenario 2: Existing User
1. Use a phone number already in database
2. Complete auth flow
3. Check user data loads
4. Verify no duplicate created

### Scenario 3: Multiple Tabs
1. Log in on one tab
2. Open another tab
3. Check auth state syncs
4. Sign out on one tab
5. Check other tab updates

### Scenario 4: Page Refresh
1. Log in
2. Refresh page
3. Check auth state persists
4. Verify no re-login needed

---

## 🚀 Ready for Production?

Before deploying:

- [ ] Test on production domain
- [ ] Update Firebase authorized domains
- [ ] Test with real phone numbers
- [ ] Apply RLS policies on production Supabase
- [ ] Test error scenarios
- [ ] Monitor Firebase quota
- [ ] Set up error logging
- [ ] Test token refresh
- [ ] Verify security headers
- [ ] Test on multiple devices

---

**Happy Testing! 🎉**

For detailed documentation, see:
- `TESTING_GUIDE.md` - Comprehensive testing
- `INTEGRATION_GUIDE.md` - Usage examples
- `DEPLOYMENT_COMPLETE.md` - Complete overview
