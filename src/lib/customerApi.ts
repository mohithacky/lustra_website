/**
 * Customer API Service
 * 
 * Handles all communication with the functions backend for customer operations.
 * All sensitive data is encrypted using AES-256-GCM before transmission.
 */

const BACKEND_URL = 'https://api-5sqqk2n6ra-uc.a.run.app';

// This must match the CUSTOMER_API_SECRET in Firebase Functions
// In production, this should come from environment variables
const CUSTOMER_API_SECRET = process.env.NEXT_PUBLIC_CUSTOMER_API_SECRET || 'lustra-customer-api-secret-2024';

/**
 * Encrypt payload using AES-256-GCM
 * Uses Web Crypto API for browser compatibility
 */
async function encryptPayload(data: Record<string, any>): Promise<string> {
  try {
    // Convert secret to key using SHA-256
    const encoder = new TextEncoder();
    const secretBuffer = encoder.encode(CUSTOMER_API_SECRET);
    const hashBuffer = await crypto.subtle.digest('SHA-256', secretBuffer);
    
    // Import as AES-GCM key
    const key = await crypto.subtle.importKey(
      'raw',
      hashBuffer,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    
    // Generate random IV (16 bytes)
    const iv = crypto.getRandomValues(new Uint8Array(16));
    
    // Encrypt the data
    const dataBuffer = encoder.encode(JSON.stringify(data));
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      dataBuffer
    );
    
    // Extract auth tag (last 16 bytes of encrypted data in Web Crypto)
    const encryptedArray = new Uint8Array(encryptedBuffer);
    const ciphertext = encryptedArray.slice(0, encryptedArray.length - 16);
    const authTag = encryptedArray.slice(encryptedArray.length - 16);
    
    // Convert to base64 and format as iv:authTag:ciphertext
    const ivBase64 = btoa(String.fromCharCode.apply(null, Array.from(iv)));
    const authTagBase64 = btoa(String.fromCharCode.apply(null, Array.from(authTag)));
    const ciphertextBase64 = btoa(String.fromCharCode.apply(null, Array.from(ciphertext)));
    
    return `${ivBase64}:${authTagBase64}:${ciphertextBase64}`;
  } catch (error) {
    console.error('[CustomerAPI] Encryption error:', error);
    throw new Error('Failed to encrypt payload');
  }
}

/**
 * Decrypt response payload using AES-256-GCM
 */
async function decryptPayload(encryptedData: string): Promise<any> {
  try {
    // Parse the encrypted data
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Uint8Array.from(atob(parts[0]), c => c.charCodeAt(0));
    const authTag = Uint8Array.from(atob(parts[1]), c => c.charCodeAt(0));
    const ciphertext = Uint8Array.from(atob(parts[2]), c => c.charCodeAt(0));
    
    // Convert secret to key using SHA-256
    const encoder = new TextEncoder();
    const secretBuffer = encoder.encode(CUSTOMER_API_SECRET);
    const hashBuffer = await crypto.subtle.digest('SHA-256', secretBuffer);
    
    // Import as AES-GCM key
    const key = await crypto.subtle.importKey(
      'raw',
      hashBuffer,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    // Combine ciphertext and auth tag (Web Crypto expects them together)
    const combinedBuffer = new Uint8Array(ciphertext.length + authTag.length);
    combinedBuffer.set(ciphertext);
    combinedBuffer.set(authTag, ciphertext.length);
    
    // Decrypt
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      combinedBuffer
    );
    
    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decryptedBuffer));
  } catch (error) {
    console.error('[CustomerAPI] Decryption error:', error);
    throw new Error('Failed to decrypt response');
  }
}

export interface CustomerAuthData {
  isSignup: boolean;
  fullName?: string;
  shopOwnerId?: string;
  shopDomain?: string;
}

export interface CustomerData {
  id: string;
  firebase_uid: string;
  phone_number: string;
  name: string | null;
  user_id: string;
  shop_domain: string | null;
}

export interface CustomerAuthResponse {
  success: boolean;
  isNewUser: boolean;
  customer: CustomerData;
}

/**
 * Authenticate customer with the backend after Firebase phone auth
 * This creates or updates the customer in Supabase using service role
 */
export async function authenticateCustomer(
  firebaseIdToken: string,
  customerData: CustomerAuthData
): Promise<CustomerAuthResponse> {
  console.log('[CustomerAPI] ===== AUTHENTICATING CUSTOMER =====');
  console.log('[CustomerAPI] Encrypting customer data...');
  
  try {
    // Encrypt the customer data
    const encryptedPayload = await encryptPayload(customerData);
    console.log('[CustomerAPI] Payload encrypted successfully');
    
    // Send to backend
    console.log('[CustomerAPI] Sending request to backend...');
    const response = await fetch(`${BACKEND_URL}/customer/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken: firebaseIdToken,
        encryptedPayload
      })
    });
    
    console.log('[CustomerAPI] Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('[CustomerAPI] Backend error:', errorData);
      throw new Error(errorData.error || `Backend error: ${response.status}`);
    }
    
    const responseData = await response.json();
    console.log('[CustomerAPI] Response received, success:', responseData.success);
    
    // Decrypt the response if encrypted
    if (responseData.encryptedPayload) {
      console.log('[CustomerAPI] Decrypting response...');
      const decryptedResponse = await decryptPayload(responseData.encryptedPayload);
      console.log('[CustomerAPI] Response decrypted successfully');
      console.log('[CustomerAPI] Is new user:', decryptedResponse.isNewUser);
      console.log('[CustomerAPI] Customer ID:', decryptedResponse.customer?.id);
      return decryptedResponse;
    }
    
    return responseData;
  } catch (error) {
    console.error('[CustomerAPI] Error authenticating customer:', error);
    throw error;
  }
}

/**
 * Check if a customer already exists with the given phone number
 * Used to detect existing customers during signup flow
 */
export async function checkCustomerExists(
  phoneNumber: string,
  shopOwnerId?: string
): Promise<{ exists: boolean; customerName: string | null }> {
  try {
    console.log('[CustomerAPI] Checking if customer exists...');
    console.log('[CustomerAPI] Phone:', phoneNumber);
    console.log('[CustomerAPI] Shop owner:', shopOwnerId || 'any');
    
    const response = await fetch(`${BACKEND_URL}/customer/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber,
        shopOwnerId
      })
    });
    
    if (!response.ok) {
      console.error('[CustomerAPI] Check customer failed:', response.status);
      return { exists: false, customerName: null };
    }
    
    const data = await response.json();
    console.log('[CustomerAPI] Check result:', data);
    
    return {
      exists: data.exists || false,
      customerName: data.customerName || null
    };
  } catch (error) {
    console.error('[CustomerAPI] Error checking customer:', error);
    return { exists: false, customerName: null };
  }
}

/**
 * Get current customer data from backend
 */
export async function getCurrentCustomer(firebaseIdToken: string): Promise<CustomerData | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/customer/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${firebaseIdToken}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }
    
    const responseData = await response.json();
    
    // Decrypt if encrypted
    if (responseData.encryptedPayload) {
      const decrypted = await decryptPayload(responseData.encryptedPayload);
      return decrypted.customer;
    }
    
    return responseData.customer;
  } catch (error) {
    console.error('[CustomerAPI] Error getting customer:', error);
    throw error;
  }
}
