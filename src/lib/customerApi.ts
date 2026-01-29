/**
 * Customer API for Firebase-based authentication
 * Creates and manages customers using Firebase UID instead of Twilio UID
 */

import { createSupabaseClientWithFirebaseToken } from './supabaseFirebaseClient'

const BACKEND_URL = 'https://api-5sqqk2n6ra-uc.a.run.app'

export interface FirebaseCustomerData {
  id: string
  user_id: string  // Firebase UID of the shop owner
  phone_number: string
  name?: string
  email?: string
  created_at?: string
  updated_at?: string
}

/**
 * Create or get customer using Firebase authentication
 * This replaces the Twilio-based customer creation
 */
export async function createOrGetFirebaseCustomer(
  shopOwnerId: string,  // Firebase UID of the shop owner
  phoneNumber: string,
  firebaseIdToken: string,
  name?: string,
  email?: string
): Promise<FirebaseCustomerData> {
  try {
    console.log('[CustomerAPI] Creating/getting customer for shop owner:', shopOwnerId)
    console.log('[CustomerAPI] Phone number:', phoneNumber)
    console.log('[CustomerAPI] Name:', name)

    // Create Supabase client with Firebase token
    const supabase = createSupabaseClientWithFirebaseToken(firebaseIdToken)

    // Check if customer already exists
    const { data: existingCustomer, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', shopOwnerId)
      .eq('phone_number', phoneNumber)
      .maybeSingle()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[CustomerAPI] Error fetching customer:', fetchError)
      throw new Error('Failed to fetch customer')
    }

    if (existingCustomer) {
      console.log('[CustomerAPI] Customer already exists:', existingCustomer.id)
      
      // Update last_login_at
      const { data: updatedCustomer, error: updateError } = await supabase
        .from('customers')
        .update({ 
          last_login_at: new Date().toISOString(),
          ...(name && { name }),
          ...(email && { email })
        })
        .eq('id', existingCustomer.id)
        .select()
        .single()

      if (updateError) {
        console.error('[CustomerAPI] Error updating customer:', updateError)
        // Return existing customer even if update fails
        return existingCustomer as FirebaseCustomerData
      }

      return updatedCustomer as FirebaseCustomerData
    }

    // Create new customer
    console.log('[CustomerAPI] Creating new customer')
    const newCustomer = {
      user_id: shopOwnerId,
      phone_number: phoneNumber,
      name: name || null,
      email: email || null,
      last_login_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: createdCustomer, error: createError } = await supabase
      .from('customers')
      .insert(newCustomer)
      .select()
      .single()

    if (createError) {
      console.error('[CustomerAPI] Error creating customer:', createError)
      throw new Error('Failed to create customer')
    }

    console.log('[CustomerAPI] Customer created successfully:', createdCustomer.id)
    return createdCustomer as FirebaseCustomerData

  } catch (error) {
    console.error('[CustomerAPI] Error in createOrGetFirebaseCustomer:', error)
    throw error
  }
}

/**
 * Get customer by ID
 */
export async function getCustomerById(
  customerId: string,
  firebaseIdToken: string
): Promise<FirebaseCustomerData | null> {
  try {
    const supabase = createSupabaseClientWithFirebaseToken(firebaseIdToken)

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single()

    if (error) {
      console.error('[CustomerAPI] Error fetching customer by ID:', error)
      return null
    }

    return data as FirebaseCustomerData
  } catch (error) {
    console.error('[CustomerAPI] Error in getCustomerById:', error)
    return null
  }
}

/**
 * Update customer information
 */
export async function updateCustomer(
  customerId: string,
  firebaseIdToken: string,
  updates: Partial<FirebaseCustomerData>
): Promise<FirebaseCustomerData | null> {
  try {
    const supabase = createSupabaseClientWithFirebaseToken(firebaseIdToken)

    const { data, error } = await supabase
      .from('customers')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId)
      .select()
      .single()

    if (error) {
      console.error('[CustomerAPI] Error updating customer:', error)
      return null
    }

    return data as FirebaseCustomerData
  } catch (error) {
    console.error('[CustomerAPI] Error in updateCustomer:', error)
    return null
  }
}
