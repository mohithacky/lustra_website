# Website Customer Authentication Flow

## Overview

This document details the authentication flow for customer websites (subdomains) using Firebase Phone Authentication and Supabase integration for customer data management.

## Key Concepts

1. **Users vs. Customers**: 
   - **Users table**: For Flutter app users (store owners)
   - **Customers table**: For website visitors who create accounts on store subdomains

2. **Firebase Integration**:
   - Firebase handles phone authentication via OTP
   - `firebase_uid` field (previously `twilio_uid`) links Firebase auth to Supabase customers

3. **Cross-Domain Authentication**:
   - Central auth page at `lustrai.in/auth`
   - Authentication completes and redirects back to original subdomain
   - Authentication state persists across domains

## Authentication Flow Diagram

```
┌───────────────────────┐               ┌──────────────────┐               ┌───────────────────┐
│                       │               │                  │               │                   │
│  Subdomain Website    │               │  Central Auth    │               │  Firebase Auth    │
│                       │──────────────►│                  │──────────────►│                   │
│ (store.lustrai.in)    │  Redirect to  │ (lustrai.in/auth)│  Phone Auth   │                   │
│                       │  auth domain  │                  │               │                   │
└───────────┬───────────┘               └─────────┬────────┘               └─────────┬─────────┘
            ▲                                     │                                  │
            │                                     │                                  │
            │                                     │                                  │
            │                                     │                                  │
            │                                     │                                  │
            │                                     │                                  │
            │                                     ▼                                  ▼
┌───────────┴───────────┐               ┌─────────┴────────┐               ┌─────────┴─────────┐
│                       │               │                  │               │                   │
│  Subdomain Website    │               │  Supabase        │               │  Backend API      │
│                       │◄──────────────│                  │◄──────────────│                   │
│ (store.lustrai.in)    │  Redirect to  │  Customer Record │  Token + Role │                   │
│                       │  original URL │  Created/Updated │  Claim Added  │                   │
└───────────────────────┘               └──────────────────┘               └───────────────────┘
```

## Detailed Flow

1. **Redirect to Auth Domain**
   - User visits a store subdomain (e.g., `ashishjewellers.lustrai.in`)
   - User clicks "Login" or "Sign Up"
   - Full URL is captured as `returnUrl` parameter
   - User is redirected to `https://lustrai.in/auth?returnUrl=https://ashishjewellers.lustrai.in/current-page`

2. **Central Authentication**
   - User chooses between Login/Signup mode
   - If signing up, user enters name and phone number
   - If logging in, user enters phone number only
   - Firebase sends OTP via SMS
   - User enters OTP for verification

3. **Backend Processing**
   - Firebase authentication completes successfully
   - Firebase ID token is sent to backend API
   - Backend adds `role: "authenticated"` claim to token
   - Token is refreshed to include new claims

4. **Customer Record Management**
   - For new users, customer record is created in `customers` table (not `users`)
   - `firebase_uid` field stores the Firebase user ID
   - Other details (name, phone, etc.) are also stored
   - If customer already exists, record is updated

5. **Redirect Back to Subdomain**
   - User is redirected back to original subdomain URL
   - Firebase session is preserved across domains
   - `new_user` parameter is added for signup flows
   - Subdomain site recognizes Firebase auth session

## Supabase Tables

### `customers` Table

| Column       | Type      | Description              |
|--------------|-----------|--------------------------|
| id           | uuid      | Primary key (auto-gen)   |
| firebase_uid | text      | Firebase User ID         |
| shop_id      | uuid      | Associated store ID      |
| shop_domain  | text      | Store subdomain          |
| name         | text      | Customer's name          |
| phone_number | text      | Customer's phone number  |
| created_at   | timestamp | Record creation time     |
| updated_at   | timestamp | Record last update time  |

Note: The `firebase_uid` column was previously named `twilio_uid`. The codebase has been updated to use the new column name.

## Code Components

### 1. Auth Page (`/auth` Route)

- Serves as central auth page for all subdomains
- Handles login and signup modes
- Collects name field for signup flow
- Renders phone input and OTP verification UI

### 2. Firebase Authentication

- `verifyFirebaseOtpWithCustomData` function handles the authentication flow
- Sends the Firebase ID token to backend for verification
- Creates/updates customer record in Supabase customers table
- Adds customer metadata to record (name, phone, etc.)

### 3. Supabase Integration

- `createSupabaseClientWithFirebaseToken` function creates a Supabase client with the Firebase token
- Token includes `role: "authenticated"` claim added by backend
- Row-level security policies use this role for data access
- Token is refreshed to ensure latest claims are included

### 4. Redirect Handling

- After successful authentication, user is redirected back to original subdomain
- Authentication state is preserved across domains
- Full URL is used to ensure proper subdomain is preserved
- Query parameters added to indicate login/signup status

## Security Considerations

1. **Token Verification**
   - Firebase ID tokens are verified by backend
   - Custom role claims are added by backend
   - Tokens are refreshed to include new claims

2. **Cross-Domain Security**
   - All domains use HTTPS
   - Full URLs are properly encoded
   - Firebase session is preserved across domains

3. **Data Access**
   - Supabase row-level security policies enforce access control
   - Each customer can only access their own data
   - Store owners can access all customer data for their store

## Implementation Notes

1. **Customer vs. User**
   - Always use `customers` table for website visitors
   - Never use `users` table for website visitors
   - `customers` table uses `firebase_uid` field, not primary key ID

2. **Cross-Domain Redirects**
   - Always redirect to full URL with original subdomain
   - Use `window.location.href` for cross-domain redirects
   - Use `router.push()` only for same-domain redirects

3. **Column Name Change**
   - `twilio_uid` column has been renamed to `firebase_uid`
   - All code references updated to use new column name
   - Database queries now use `firebase_uid` field

## Troubleshooting

1. **Firebase Authentication Issues**
   - Check Firebase console for auth errors
   - Verify phone auth is enabled in Firebase console
   - Check reCAPTCHA configuration

2. **Redirect Issues**
   - Verify full URL is being used for redirects
   - Check URL encoding of parameters
   - Ensure window.location.href is used for cross-domain redirects

3. **Database Issues**
   - Check for errors when creating/updating customer records
   - Verify `firebase_uid` field is being used (not `twilio_uid`)
   - Ensure queries are targeting the `customers` table (not `users`)
