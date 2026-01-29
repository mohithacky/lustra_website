/**
 * Firebase Configuration and Initialization for Next.js Website
 * 
 * This mirrors the Flutter app's Firebase phone authentication setup
 * with Supabase third-party auth integration.
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { 
  getAuth, 
  Auth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  PhoneAuthProvider,
  signInWithCredential
} from 'firebase/auth'

// Firebase configuration for web app
const firebaseConfig = {
  apiKey: "AIzaSyBlDsaqVXou8_m4Yn6HTir5LpYUUnJLAnE",
  authDomain: "lustra-ai.firebaseapp.com",
  projectId: "lustra-ai",
  storageBucket: "lustra-ai.firebasestorage.app",
  messagingSenderId: "853834753761",
  appId: "1:853834753761:web:50c28641e3f7e03b12f9a0",
  measurementId: "G-H1XEWD5SK5"
}

// Initialize Firebase (singleton pattern)
let firebaseApp: FirebaseApp
let auth: Auth

export function initializeFirebase() {
  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig)
    auth = getAuth(firebaseApp)
    console.log('[Firebase] Initialized successfully')
  } else {
    firebaseApp = getApps()[0]
    auth = getAuth(firebaseApp)
  }
  return { app: firebaseApp, auth }
}

// Get Firebase Auth instance
export function getFirebaseAuth(): Auth {
  if (!auth) {
    const { auth: initializedAuth } = initializeFirebase()
    return initializedAuth
  }
  return auth
}

// Initialize Firebase on module load
initializeFirebase()

export { auth, firebaseApp }
