# Enhanced Firebase + Supabase Authentication Flow

## Overview

This document details the integration between Firebase Phone Authentication and Supabase with support for user signup, cross-domain authentication, and customer data management.

## Authentication Flow

```
┌─────────────────┐         ┌───────────────┐         ┌──────────────────┐        ┌───────────────┐
│                 │         │               │         │                  │        │               │
│  Website/Store  │ ──────► │  Auth Domain  │ ──────► │  Firebase Auth   │ ─────► │   Backend     │
│                 │         │               │         │                  │        │               │
└─────────────────┘         └───────────────┘         └──────────────────┘        └───────────────┘
        │                          │                          │                         │
        │                          │                          │                         │
        │                          │                          │                         ▼
        │                          │                          │                ┌───────────────┐
        │                          │                          │                │               │
        │                          │                          └───────────────►│   Supabase    │
        │                          │                                           │               │
        │                          │                                           └───────────────┘
        │                          │                                                  │
        │                          │                                                  │
        └──────────────────────────┼──────────────────────────────────────────────────┘
                                   ▼
                         User returns to original site
                         with authenticated session
```

## Key Components

### 1. Enhanced Phone Authentication Form
- Includes name field for new user signup
- Supports both login and signup modes
- Preserves user data across domains
- Handles cross-domain redirects

### 2. Firebase Authentication Flow
- `verifyFirebaseOtpWithCustomData`: Enhanced function that accepts customer data
- Communicates with backend to add custom claims
- Creates or updates customer records in Supabase
- Handles both new user signup and existing user login

### 3. Supabase Integration
- Uses Firebase ID token with role claim for Supabase authentication
- Implements row-level security based on Firebase user ID
- Stores customer data in customers table
- Links Firebase user ID with Supabase records

### 4. Cross-Domain Authentication
- Redirects to central auth domain (`lustrai.in/auth`)
- Passes full return URL with subdomain
- Handles authentication process centrally
- Returns to original subdomain with active Firebase session

## Detailed Flow

1. **Redirect to Auth Domain**
   - User clicks login/signup on subdomain website
   - Website captures current URL as returnUrl
   - User is redirected to `https://lustrai.in/auth?returnUrl=https://subdomain.lustrai.in/page`

2. **User Authentication**
   - User chooses login or signup mode
   - If signup, user enters name and phone number
   - If login, user enters phone number only
   - Firebase sends OTP via SMS
   - User enters OTP to verify

3. **Firebase Token Verification**
   - Frontend verifies OTP with Firebase
   - Gets Firebase ID token
   - Sends token to backend with customer data
   - Backend verifies token and adds role claim
   - Token is refreshed to include new claims

4. **Supabase Integration**
   - Create Supabase client with Firebase token
   - Token includes role=authenticated claim
   - Supabase RLS policies trust the Firebase token
   - Customer record is created/updated in Supabase

5. **Return to Original Website**
   - User is redirected back to original URL
   - Firebase session is preserved across subdomains
   - Customer data is available via Supabase

## Implementation Details

### Frontend Code Changes

1. **Auth Page Component**
   - Added toggle between Login and Signup modes
   - Added name field for new user registration
   - Enhanced logging throughout the flow
   - Added proper redirection logic for cross-domain auth

2. **Firebase Authentication**
   - Added `verifyFirebaseOtpWithCustomData` function
   - Enhanced logging for better debugging
   - Added customer data management functions
   - Improved error handling

3. **Supabase Integration**
   - Enhanced client creation with Firebase token
   - Added token payload inspection and validation
   - Improved logging for authentication flow

## Backend API Endpoints

### `/auth/verify-phone-token`

**Request:**
```json
{
  "idToken": "firebase-id-token",
  "isSignup": true,
  "fullName": "User Name",
  "shopId": "optional-shop-id",
  "shopDomain": "optional-shop-domain",
  "metadata": {}
}
```

**Response:**
```json
{
  "isNewUser": true,
  "user": {
    "id": "user-id",
    "phone_number": "+1234567890",
    "name": "User Name"
  }
}
```

## Supabase Tables

### `customers` Table

| Column        | Type      | Description                |
|---------------|-----------|----------------------------|
| id            | uuid      | Firebase UID               |
| name          | text      | Customer full name         |
| phone_number  | text      | Customer phone number      |
| shop_id       | uuid      | Associated shop ID         |
| shop_domain   | text      | Shop subdomain             |
| auth_provider | text      | Auth provider (firebase)   |
| created_at    | timestamp | Record creation timestamp  |
| updated_at    | timestamp | Record last update time    |

## Security Considerations

1. **JWT Validation**
   - Backend verifies Firebase ID token authenticity
   - Validates token is not expired
   - Checks issuer and audience claims

2. **Role Claims**
   - Backend adds role=authenticated claim
   - Role claim is used by Supabase RLS policies
   - Token is refreshed to include updated claims

3. **Cross-Domain Security**
   - All domains use HTTPS
   - Return URLs are properly encoded
   - Firebase session is preserved across subdomains

## Logging

Comprehensive logging is implemented throughout the auth flow:

1. **Client-Side Logs**
   - Auth form state changes
   - OTP requests and verification
   - Token handling
   - Cross-domain redirects

2. **Server-Side Logs**
   - Token verification
   - Custom claim addition
   - User creation/update
   - Authentication status

## Testing

1. **Login Flow**
   - Existing user logs in from subdomain
   - Redirected to auth domain
   - Completes phone auth
   - Returns to subdomain with active session

2. **Signup Flow**
   - New user signs up from subdomain
   - Enters name and phone number
   - Completes phone auth
   - Customer record created in Supabase
   - Returns to subdomain with active session

## Troubleshooting

1. **Firebase Authentication Issues**
   - Check Firebase console for auth errors
   - Verify phone auth is enabled
   - Check reCAPTCHA configuration

2. **Supabase Integration Issues**
   - Verify token has role=authenticated claim
   - Check RLS policies in Supabase
   - Verify database permissions

3. **Cross-Domain Issues**
   - Check URL encoding of return URL
   - Verify domains are properly configured
   - Ensure HTTPS is used on all domains
