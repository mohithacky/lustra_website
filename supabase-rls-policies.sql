-- ============================================================================
-- Supabase RLS Policies for Firebase Authentication
-- ============================================================================
-- 
-- These policies enforce row-level security using Firebase ID tokens.
-- Firebase owns the session, Supabase trusts Firebase JWTs.
--
-- How it works:
-- 1. Client sends request with: Authorization: Bearer <firebase_id_token>
-- 2. Supabase verifies the Firebase JWT signature
-- 3. RLS policies use auth.jwt() to read Firebase claims
-- 4. Policies check: (auth.jwt() ->> 'sub') = user_id
-- 5. Only authorized rows are returned
-- ============================================================================

-- ============================================================================
-- USERS TABLE
-- ============================================================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- Users can read their own data
CREATE POLICY "Users can read own data"
ON users
FOR SELECT
USING (
  (auth.jwt() ->> 'sub') = id
);

-- Users can update their own data
CREATE POLICY "Users can update own data"
ON users
FOR UPDATE
USING (
  (auth.jwt() ->> 'sub') = id
)
WITH CHECK (
  (auth.jwt() ->> 'sub') = id
);

-- Users can insert their own data (for new user creation)
CREATE POLICY "Users can insert own data"
ON users
FOR INSERT
WITH CHECK (
  (auth.jwt() ->> 'sub') = id
);

-- ============================================================================
-- PRODUCTS TABLE (if exists)
-- ============================================================================

-- Enable RLS
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read own products" ON products;
DROP POLICY IF EXISTS "Users can create products" ON products;
DROP POLICY IF EXISTS "Users can update own products" ON products;
DROP POLICY IF EXISTS "Users can delete own products" ON products;

-- Users can read their own products
CREATE POLICY "Users can read own products"
ON products
FOR SELECT
USING (
  user_id = (auth.jwt() ->> 'sub')
);

-- Users can create products
CREATE POLICY "Users can create products"
ON products
FOR INSERT
WITH CHECK (
  user_id = (auth.jwt() ->> 'sub')
);

-- Users can update their own products
CREATE POLICY "Users can update own products"
ON products
FOR UPDATE
USING (
  user_id = (auth.jwt() ->> 'sub')
)
WITH CHECK (
  user_id = (auth.jwt() ->> 'sub')
);

-- Users can delete their own products
CREATE POLICY "Users can delete own products"
ON products
FOR DELETE
USING (
  user_id = (auth.jwt() ->> 'sub')
);

-- ============================================================================
-- ORDERS TABLE (if exists)
-- ============================================================================

-- Enable RLS
ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read own orders" ON orders;
DROP POLICY IF EXISTS "Users can create orders" ON orders;

-- Users can read their own orders
CREATE POLICY "Users can read own orders"
ON orders
FOR SELECT
USING (
  user_id = (auth.jwt() ->> 'sub')
);

-- Users can create orders
CREATE POLICY "Users can create orders"
ON orders
FOR INSERT
WITH CHECK (
  user_id = (auth.jwt() ->> 'sub')
);

-- ============================================================================
-- TEMPLATES TABLE (if exists)
-- ============================================================================

-- Enable RLS
ALTER TABLE IF EXISTS templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read own templates" ON templates;
DROP POLICY IF EXISTS "Users can create templates" ON templates;
DROP POLICY IF EXISTS "Users can update own templates" ON templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON templates;

-- Users can read their own templates
CREATE POLICY "Users can read own templates"
ON templates
FOR SELECT
USING (
  user_id = (auth.jwt() ->> 'sub')
);

-- Users can create templates
CREATE POLICY "Users can create templates"
ON templates
FOR INSERT
WITH CHECK (
  user_id = (auth.jwt() ->> 'sub')
);

-- Users can update their own templates
CREATE POLICY "Users can update own templates"
ON templates
FOR UPDATE
USING (
  user_id = (auth.jwt() ->> 'sub')
)
WITH CHECK (
  user_id = (auth.jwt() ->> 'sub')
);

-- Users can delete their own templates
CREATE POLICY "Users can delete own templates"
ON templates
FOR DELETE
USING (
  user_id = (auth.jwt() ->> 'sub')
);

-- ============================================================================
-- PUBLIC TEMPLATES TABLE (if exists)
-- ============================================================================

-- Enable RLS
ALTER TABLE IF EXISTS public_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public templates are readable by all" ON public_templates;

-- Anyone can read public templates (no authentication required)
CREATE POLICY "Public templates are readable by all"
ON public_templates
FOR SELECT
USING (true);

-- ============================================================================
-- STORE INFO TABLE (if exists)
-- ============================================================================

-- Enable RLS
ALTER TABLE IF EXISTS store_info ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read own store info" ON store_info;
DROP POLICY IF EXISTS "Users can update own store info" ON store_info;
DROP POLICY IF EXISTS "Users can insert own store info" ON store_info;

-- Users can read their own store info
CREATE POLICY "Users can read own store info"
ON store_info
FOR SELECT
USING (
  user_id = (auth.jwt() ->> 'sub')
);

-- Users can update their own store info
CREATE POLICY "Users can update own store info"
ON store_info
FOR UPDATE
USING (
  user_id = (auth.jwt() ->> 'sub')
)
WITH CHECK (
  user_id = (auth.jwt() ->> 'sub')
);

-- Users can insert their own store info
CREATE POLICY "Users can insert own store info"
ON store_info
FOR INSERT
WITH CHECK (
  user_id = (auth.jwt() ->> 'sub')
);

-- ============================================================================
-- TESTING RLS POLICIES
-- ============================================================================

-- To test RLS policies, use the Supabase SQL Editor or your application.
-- The policies will automatically enforce access control based on the
-- Firebase ID token sent in the Authorization header.

-- Example: Testing in SQL Editor (won't work without proper JWT)
-- SELECT * FROM users WHERE id = 'firebase_uid_here';

-- Example: Testing in your application
-- const { data, error } = await supabase
--   .from('users')
--   .select('*')
--   .eq('id', user.uid)

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. Firebase UID is stored in the 'sub' claim of the JWT
-- 2. Access it in RLS policies using: (auth.jwt() ->> 'sub')
-- 3. Custom claims can be added by your backend after phone auth
-- 4. Example custom claim: (auth.jwt() ->> 'role') = 'authenticated'
-- 5. Always test policies with actual Firebase tokens
-- 6. Use Supabase Dashboard > Authentication > Policies to view/edit

-- ============================================================================
-- SECURITY BEST PRACTICES
-- ============================================================================

-- ✅ DO:
-- - Always enable RLS on tables with user data
-- - Use (auth.jwt() ->> 'sub') to check Firebase UID
-- - Test policies thoroughly before production
-- - Use WITH CHECK for INSERT and UPDATE policies
-- - Add indexes on user_id columns for performance

-- ❌ DON'T:
-- - Don't disable RLS on tables with user data
-- - Don't use service role key in client-side code
-- - Don't trust client-side checks alone
-- - Don't bypass RLS in production
-- - Don't hardcode user IDs in policies

-- ============================================================================
-- END OF RLS POLICIES
-- ============================================================================
