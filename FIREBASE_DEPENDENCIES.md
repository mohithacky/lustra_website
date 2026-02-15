# Firebase Authentication Dependencies for Next.js

## Required NPM Packages

Add these dependencies to your `package.json`:

```json
{
  "dependencies": {
    "firebase": "^10.7.1",
    "@supabase/supabase-js": "^2.39.0"
  }
}
```

## Installation Command

```bash
cd website-nextjs
npm install firebase @supabase/supabase-js
```

## Package Details

### firebase (^10.7.1)
- **Purpose**: Firebase SDK for web applications
- **Used for**: 
  - Phone authentication with OTP
  - Firebase user management
  - ID token generation and refresh
  - reCAPTCHA verification
- **Modules used**:
  - `firebase/app` - Core Firebase app initialization
  - `firebase/auth` - Authentication services

### @supabase/supabase-js (^2.39.0)
- **Purpose**: Supabase client library for JavaScript
- **Used for**:
  - Creating Supabase client with custom headers
  - Accessing Supabase database tables
  - Row Level Security (RLS) with Firebase tokens
- **Features**:
  - Custom authorization headers support
  - TypeScript support
  - Real-time subscriptions (if needed)

## Environment Variables

Create or update `.env.local` in the `website-nextjs` directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://phlccyxgyftspxnuzttf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobGNjeXhneWZ0c3B4bnV6dHRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0NTc4MTIsImV4cCI6MjA1MTAzMzgxMn0.vYZ_OPuJOGJXqNuYvyPMqgp9F-oPqJxCeJRqwRhLJqk

# Backend API URL
NEXT_PUBLIC_BACKEND_URL=https://api-5sqqk2n6ra-uc.a.run.app
```

## Verification

After installation, verify the packages are installed correctly:

```bash
npm list firebase @supabase/supabase-js
```

Expected output:
```
website-nextjs@0.1.0
├── @supabase/supabase-js@2.39.0
└── firebase@10.7.1
```

## TypeScript Support

Both packages include TypeScript definitions out of the box. No additional `@types` packages are needed.

## Build Configuration

No additional build configuration is required. Next.js will automatically handle the Firebase and Supabase SDKs.

## Browser Compatibility

- **Firebase**: Supports all modern browsers (Chrome, Firefox, Safari, Edge)
- **Supabase**: Works in all browsers that support ES6+
- **reCAPTCHA**: Requires JavaScript enabled and modern browser

## Production Considerations

1. **Firebase Console Setup**:
   - Enable Phone Authentication in Firebase Console
   - Add your production domain to authorized domains
   - Configure reCAPTCHA settings

2. **Supabase Setup**:
   - Ensure Firebase JWT secret is configured in Supabase
   - Verify RLS policies are set up correctly
   - Test authentication flow in production environment

3. **Environment Variables**:
   - Never commit `.env.local` to version control
   - Use Vercel/Netlify environment variables for production
   - Keep Supabase anon key public (it's safe for client-side use)

## Troubleshooting

### Module Not Found Errors

If you see "Module not found" errors:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Firebase Version Conflicts

If you have version conflicts:
```bash
npm install firebase@latest
```

### Build Errors

If you encounter build errors:
1. Clear Next.js cache: `rm -rf .next`
2. Reinstall dependencies: `npm install`
3. Rebuild: `npm run build`
