# Website-NextJS Project - Complete Documentation

## Project Overview

**Lustra AI Website-NextJS** is a modern, multi-tenant jewelry e-commerce website builder built with Next.js 14, TypeScript, and Tailwind CSS. It connects to Supabase for data storage and provides a dynamic, template-based website system where users can customize their online jewelry stores.

### Key Features
- 🎨 Multi-tenant architecture with dynamic routing
- 📱 Fully responsive design
- ⚡ Server-side rendering with Next.js 14
- 🗄️ Supabase integration for database and storage
- 🛠️ WebView editor integration with Flutter app
- 🎠 Dynamic sections (Hero, Trending, Categories, Products)
- 🛒 E-commerce features (Cart, Wishlist, Products)
- 🔐 Phone-based authentication

---

## Project Structure

```
website-nextjs/
├── src/
│   ├── app/                    # Next.js App Router pages
│   ├── components/             # React components
│   ├── contexts/               # React contexts
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility libraries
│   ├── types/                  # TypeScript type definitions
│   └── middleware.ts           # Next.js middleware
├── public/                     # Static assets
├── .env.local                  # Environment variables (local)
├── .env.example                # Environment template
├── next.config.js              # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Dependencies
├── vercel.json                 # Vercel deployment config
└── netlify.toml                # Netlify deployment config
```

---

## Root Configuration Files

### 1. `package.json`
**Purpose**: Defines project dependencies and scripts

**Key Dependencies**:
- `next@14.0.4` - React framework
- `react@18.2.0` - UI library
- `@supabase/supabase-js` - Database client
- `tailwindcss` - Styling framework
- `lucide-react` - Icon library
- `sharp` - Image optimization

**Scripts**:
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server

### 2. `next.config.js`
**Purpose**: Next.js framework configuration

**Key Settings**:
- Image domains whitelist (Supabase, Firebase, Unsplash)
- API rewrites to backend (`/api/backend/*` → backend server)
- Experimental features configuration

### 3. `tailwind.config.ts`
**Purpose**: Tailwind CSS styling configuration

**Custom Theme**:
- Gold color palette for jewelry theme
- Custom fonts (Playfair Display, Lato)
- Responsive breakpoints
- Animation utilities

### 4. `tsconfig.json`
**Purpose**: TypeScript compiler configuration

**Settings**:
- Path aliases (`@/*` → `./src/*`)
- Strict type checking enabled
- JSX support for React

### 5. `.env.local` / `.env.example`
**Purpose**: Environment variables

**Required Variables**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_BACKEND_URL=https://api-url.com
NEXT_PUBLIC_SITE_URL=https://lustrai.in
```

### 6. `vercel.json` / `netlify.toml`
**Purpose**: Deployment configuration for hosting platforms

**Features**:
- Rewrites for API proxying
- Headers configuration
- Build settings

---

## Source Directory (`src/`)

### Middleware (`src/middleware.ts`)

**Purpose**: Request interceptor for domain-based routing

**Functionality**:
1. Extracts subdomain from hostname
2. Validates shop domain exists in database
3. Rewrites URL to `[domain]` dynamic route
4. Handles localhost development mode
5. Skips middleware for API routes and static files

**Flow**:
```
Request: shop1.lustrai.in
  ↓
Middleware extracts "shop1"
  ↓
Checks if shop1 exists in users table
  ↓
Rewrites to /shop1 (dynamic route)
  ↓
Renders shop1's website
```

---

## App Directory (`src/app/`)

### Root Files

#### `layout.tsx`
**Purpose**: Root layout wrapper for all pages

**Features**:
- HTML structure
- Global metadata
- Font loading (Playfair Display, Lato)
- Global CSS import

#### `page.tsx`
**Purpose**: Landing page (lustrai.in root)

**Content**: Marketing page or redirect to demo

#### `globals.css`
**Purpose**: Global styles and Tailwind directives

**Includes**:
- Tailwind base, components, utilities
- Custom CSS variables
- Font imports
- Global animations

---

### Dynamic Domain Routes (`src/app/[domain]/`)

**Purpose**: Multi-tenant routing - each shop gets its own subdomain

**Structure**:
```
[domain]/
├── page.tsx                    # Shop homepage
├── about/page.tsx              # About page
├── cart/page.tsx               # Shopping cart
├── categories/[slug]/page.tsx  # Category pages
├── collections/[slug]/page.tsx # Collection pages
├── contact/page.tsx            # Contact form
├── editor/                     # Editor routes (WebView only)
├── products/[id]/page.tsx      # Product detail
├── wishlist/page.tsx           # Wishlist
└── [other pages]/              # Static pages
```

#### `[domain]/page.tsx` - Homepage
**Purpose**: Main storefront page

**Sections Rendered**:
1. Hero Carousel (from `collections` table, label='hero')
2. Trending Collections (label='trending')
3. Categories (label='category')
4. Best Collections (label='best')
5. Products Grid
6. Shop By Recipient (Him/Her)
7. Testimonials
8. Footer

**Data Flow**:
```typescript
1. Extract domain from params
2. Fetch user data by shop_domain
3. Fetch website configuration
4. Fetch collections by label
5. Fetch products
6. Render sections dynamically
```

#### `[domain]/products/[id]/page.tsx`
**Purpose**: Product detail page

**Features**:
- Product images gallery
- Price, description, specifications
- Add to cart/wishlist
- Related products
- Breadcrumb navigation

#### `[domain]/cart/page.tsx`
**Purpose**: Shopping cart management

**Features**:
- Cart items list
- Quantity adjustment
- Price calculation
- Checkout button
- Empty cart state

#### `[domain]/wishlist/page.tsx`
**Purpose**: Saved products list

**Features**:
- Wishlist items grid
- Remove from wishlist
- Add to cart from wishlist
- Empty state

---

### Editor Routes (`src/app/[domain]/editor/`)

**Purpose**: WebView-only editing interface for Flutter app integration

**Security**: Only accessible when `window.lustraEditorContext` is injected by Flutter app

#### `editor/collections/add/page.tsx`
**Purpose**: Add new collections (hero/trending)

**Component**: Uses `AddCollectionContent`

**Features**:
- Collection name input
- AI banner generation
- Image upload
- Existing collections list
- Delete collections

#### `editor/hero/page.tsx`
**Purpose**: Edit hero carousel collections

**Component**: Uses `CollectionsEditor` with `collectionLabel="hero"`

#### `editor/trending/page.tsx`
**Purpose**: Edit trending collections

**Component**: Uses `CollectionsEditor` with `collectionLabel="trending"`

#### `editor/categories/page.tsx`
**Purpose**: Edit category collections

**Component**: Uses `CollectionsEditor` with `collectionLabel="category"`

#### `editor/best-collections/page.tsx`
**Purpose**: Edit best collections

**Component**: Uses `CollectionsEditor` with `collectionLabel="best"`

#### `editor/footer/page.tsx`
**Purpose**: Edit footer content

**Component**: Uses `FooterEditor`

---

### API Routes (`src/app/api/`)

**Purpose**: Backend API endpoints for data operations

#### Authentication (`api/auth/`)

##### `auth/send-otp/route.ts`
**Method**: POST

**Purpose**: Send OTP for phone authentication

**Body**:
```json
{
  "phone": "+1234567890",
  "shopId": "user-id",
  "isSignup": true
}
```

**Response**: OTP sent confirmation

##### `auth/verify-otp/route.ts`
**Method**: POST

**Purpose**: Verify OTP and authenticate user

**Body**:
```json
{
  "phone": "+1234567890",
  "otp": "123456",
  "shopId": "user-id",
  "name": "Shop Name"
}
```

**Response**: Authentication token

#### Editor Collections (`api/editor/collections/`)

##### `collections/route.ts`
**Methods**: GET, POST, PUT, DELETE

**Purpose**: CRUD operations for collections table

**GET**: Fetch collections by userId and label
```
GET /api/editor/collections?userId=xxx&label=hero
```

**POST**: Create new collection
```json
{
  "userId": "xxx",
  "name": "Summer Collection",
  "imageUrl": "https://...",
  "collectionLabel": "hero",
  "displayOrder": 0
}
```

**PUT**: Update collection
```json
{
  "id": "collection-id",
  "userId": "xxx",
  "name": "Updated Name",
  "imageUrl": "https://...",
  "isActive": true
}
```

**DELETE**: Delete collection
```
DELETE /api/editor/collections?id=xxx&userId=xxx
```

##### `collections/save/route.ts`
**Method**: POST

**Purpose**: Save collection with image upload to storage

**Body**:
```json
{
  "shopId": "user-id",
  "collectionName": "Collection Name",
  "bannerImage": "base64_or_data_url",
  "collectionType": "hero"
}
```

**Process**:
1. Upload image to Supabase Storage
2. Insert/update in `collections` table
3. Return success with image URL

##### `collections/hero/route.ts`
**Method**: GET

**Purpose**: Fetch hero collections (legacy endpoint)

**Query**: `?shopId=xxx`

##### `collections/trending/route.ts`
**Method**: GET

**Purpose**: Fetch trending collections (legacy endpoint)

**Query**: `?shopId=xxx`

##### `collections/visibility/route.ts`
**Method**: POST

**Purpose**: Toggle collection visibility

**Body**:
```json
{
  "shopId": "xxx",
  "collectionName": "Collection Name",
  "isVisible": true,
  "collectionType": "hero"
}
```

#### Editor Other (`api/editor/`)

##### `editor/upload/route.ts`
**Method**: POST

**Purpose**: Upload images to Supabase Storage

**Body**: FormData with file

**Response**:
```json
{
  "success": true,
  "url": "https://storage.url/path/to/file",
  "path": "user-id/filename.png"
}
```

##### `editor/generate-banner/route.ts`
**Method**: POST

**Purpose**: Generate AI banner using backend service

**Body**:
```json
{
  "collectionName": "Summer Collection",
  "aspectRatio": "16:9",
  "shopId": "user-id",
  "collectionType": "hero",
  "editorToken": "token"
}
```

**Process**:
1. Validate editor token
2. Call backend AI service
3. Return generated image URL

##### `editor/sections/route.ts`
**Method**: GET, PUT

**Purpose**: Manage website sections configuration

**GET**: Fetch sections for a website
**PUT**: Update section config

##### `editor/footer/route.ts`
**Method**: GET, PUT

**Purpose**: Manage footer content

**GET**: Fetch footer data
**PUT**: Update footer content

#### Debug (`api/debug/`)

##### `debug/[domain]/route.ts`
**Method**: GET

**Purpose**: Debug endpoint to check website data

**Response**: Complete website data dump for debugging

---

## Components (`src/components/`)

### Layout Components (`components/layout/`)

#### `WebsiteLayout.tsx`
**Purpose**: Main layout wrapper for all shop pages

**Features**:
- Navigation bar with logo, search, cart, wishlist
- Mobile responsive menu
- Footer
- EditorButtons (when in editor mode)
- Phone login dialog

**Props**:
```typescript
{
  children: React.ReactNode
  userData: UserData
  shopDomain: string
}
```

### Section Components (`components/sections/`)

#### `HeroCarousel.tsx`
**Purpose**: Homepage hero carousel

**Data Source**: `collections` table (label='hero')

**Features**:
- Auto-play carousel
- Swipe navigation
- Responsive images
- Overlay text

#### `TrendingSection.tsx`
**Purpose**: Trending collections grid

**Data Source**: `collections` table (label='trending')

**Layout**: 4-item grid with mixed aspect ratios

#### `CategoriesSection.tsx`
**Purpose**: Product categories grid

**Data Source**: `collections` table (label='category')

**Features**:
- Grid layout
- Category images
- Click to filter products

#### `BestCollectionsSection.tsx`
**Purpose**: Best/featured collections

**Data Source**: `collections` table (label='best')

#### `ProductsSection.tsx`
**Purpose**: Products grid display

**Data Source**: `website_products` table

**Features**:
- Product cards
- Pagination
- Filters (category, collection, gender)
- Add to cart/wishlist

#### `ShopByRecipientSection.tsx`
**Purpose**: Gender-based product filtering (Him/Her)

**Data Source**: Products filtered by gender field

#### `TestimonialsSection.tsx`
**Purpose**: Customer reviews carousel

**Data Source**: `customer_reviews` table or inline JSON

#### `Footer.tsx`
**Purpose**: Website footer

**Data Source**: `user_website_sections` content field

**Sections**:
- Shop info
- Quick links
- Policies
- Social media
- Contact info

### Product Components (`components/products/`)

#### `ProductCard.tsx`
**Purpose**: Reusable product card

**Props**:
```typescript
{
  product: ProductData
  shopDomain: string
}
```

**Features**:
- Product image
- Name, price
- Quick add to cart
- Add to wishlist
- Click to view details

#### `ProductsGrid.tsx`
**Purpose**: Grid layout for products

**Props**:
```typescript
{
  products: ProductData[]
  shopDomain: string
}
```

#### `ProductDetail.tsx`
**Purpose**: Detailed product view

**Features**:
- Image gallery
- Full description
- Specifications
- Add to cart with quantity
- Related products

### Cart/Wishlist Components

#### `cart/CartContent.tsx`
**Purpose**: Shopping cart UI

**Features**:
- Cart items list
- Quantity controls
- Remove items
- Price calculation
- Checkout button

#### `wishlist/WishlistContent.tsx`
**Purpose**: Wishlist UI

**Features**:
- Wishlist items grid
- Remove from wishlist
- Move to cart
- Empty state

### Editor Components (`components/editor/`)

#### `EditorProvider.tsx`
**Purpose**: React context for editor state

**Provides**:
- `isEditorMode` - Boolean flag
- `editorToken` - Authentication token
- `canEditCollections` - Permission check
- `canEditSections` - Permission check

#### `EditorButtons.tsx`
**Purpose**: Floating action buttons for editor

**Visibility**: Only when `window.lustraEditorContext.enabled === true`

**Buttons**:
- Add Collection
- Edit Trending
- Edit Sections
- Edit Footer

#### `EditButton.tsx`
**Purpose**: Generic edit button component

**Props**:
```typescript
{
  onClick: () => void
  label: string
  icon?: React.ReactNode
}
```

#### `CollectionsEditor.tsx`
**Purpose**: Unified collections editor

**Props**:
```typescript
{
  userId: string
  shopDomain: string
  collectionLabel: 'hero' | 'trending' | 'best' | 'category' | 'occasion'
  title: string
  description: string
  aspectRatio?: string
  maxItems?: number
  showAIGeneration?: boolean
}
```

**Features**:
- Add new collections
- Edit existing collections
- Delete collections
- Toggle visibility
- AI banner generation
- Image upload
- Drag to reorder (display_order)

#### `AddCollectionContent.tsx`
**Purpose**: Legacy add collection interface

**Note**: Being replaced by `CollectionsEditor`

#### `FooterEditor.tsx`
**Purpose**: Footer content editor

**Features**:
- Edit footer sections
- Add/remove links
- Update social media
- Save to database

#### `EditableSections.tsx`
**Purpose**: Section-level editing interface

**Features**:
- Enable/disable sections
- Reorder sections
- Configure section settings

### Auth Components (`components/auth/`)

#### `PhoneLoginDialog.tsx`
**Purpose**: Phone authentication modal

**Features**:
- Phone number input
- OTP verification
- Sign up / Sign in flow
- Error handling

---

## Library Files (`src/lib/`)

### `supabase.ts`
**Purpose**: Main Supabase client and data fetching functions

**Key Functions**:
- `getWebsiteByDomain(domain)` - Fetch user by shop_domain
- `getWebsiteTemplate(userId)` - Fetch website config
- `getHeroCollections(userId)` - Fetch hero collections
- `getProducts(userId, options)` - Fetch products with filters
- `getCollectionsMap(userId)` - Fetch collections as map
- `getCategoriesMap(userId)` - Fetch categories as map
- `getTrendingCollections(userId)` - Fetch trending
- `getBestCollections(userId)` - Fetch best collections
- `getFooterData(userId)` - Fetch footer content
- `getTestimonials(userId)` - Fetch testimonials
- `trackVisitor(userId, data)` - Track website visitors

### `supabase-new-architecture.ts`
**Purpose**: New architecture data fetching (template-based system)

**Key Functions**:
- `getUserWebsite(userId)` - Fetch user_websites entry
- `getWebsiteSections(websiteId)` - Fetch user_website_sections
- `getCollectionsByLabel(userId, label)` - Fetch from collections table
- `getSectionConfig(sectionId)` - Get merged config (default + overrides)

### `supabase-client.ts`
**Purpose**: Client-side Supabase instance

**Exports**: Configured Supabase client for browser use

### `utils.ts`
**Purpose**: Utility helper functions

**Key Functions**:
- `cn(...classes)` - Conditional className merger (clsx + tailwind-merge)
- `getImageUrl(url)` - Process image URLs (add cache busters, handle relative paths)
- `formatPrice(price)` - Format currency
- `slugify(text)` - Convert text to URL slug

### `editor-context.ts`
**Purpose**: Editor mode detection and context management

**Key Functions**:
- `isInEditorMode()` - Check if running in WebView editor
- `getEditorContext()` - Get injected editor context
- `waitForEditorContext(timeout)` - Wait for context injection
- `getEditorToken()` - Get authentication token
- `canEditCollections()` - Check collection edit permission
- `canEditSections()` - Check section edit permission

**Context Structure**:
```typescript
interface EditorContext {
  enabled: boolean
  token: string
  websiteId: string
  scopes: string[]
  expiresAt: number
  canEditSections: boolean
  canEditCollections: boolean
  injectedAt: number
}
```

### `api.ts`
**Purpose**: API client functions

**Functions**:
- HTTP request wrappers
- Error handling
- Response parsing

---

## Types (`src/types/`)

### `database.ts`
**Purpose**: TypeScript type definitions for database schema

**Key Types**:
- `Database` - Full database schema
- `Tables` - All table types
- `UserData` - User profile
- `ProductData` - Product details
- `Collection` - Collection data
- `WebsiteTemplate` - Template config

---

## Contexts (`src/contexts/`)

**Purpose**: React Context providers for global state

**Potential Contexts**:
- Cart context
- Wishlist context
- Auth context
- Editor context

---

## Hooks (`src/hooks/`)

**Purpose**: Custom React hooks

**Potential Hooks**:
- `useCart()` - Cart management
- `useWishlist()` - Wishlist management
- `useEditor()` - Editor state
- `useAuth()` - Authentication

---

## Data Flow Architecture

### 1. Multi-Tenant Routing
```
User visits: shop1.lustrai.in
  ↓
middleware.ts extracts "shop1"
  ↓
Checks users table for shop_domain='shop1'
  ↓
Rewrites to /shop1 (dynamic route)
  ↓
[domain]/page.tsx renders with shop1 data
```

### 2. Homepage Rendering
```
[domain]/page.tsx
  ↓
getWebsiteByDomain(domain) → user data
  ↓
Parallel data fetching:
  - getCollectionsByLabel('hero')
  - getCollectionsByLabel('trending')
  - getCollectionsByLabel('category')
  - getProducts()
  ↓
Render sections with data
```

### 3. Editor Mode
```
Flutter app opens WebView
  ↓
Requests editor session from backend
  ↓
Backend validates and issues token
  ↓
WebView loads website
  ↓
Flutter injects window.lustraEditorContext
  ↓
Website detects context → shows EditorButtons
  ↓
User clicks "Add Collection"
  ↓
Navigate to /editor/collections/add
  ↓
User creates collection
  ↓
POST /api/editor/collections/save (with token)
  ↓
Backend validates token
  ↓
Upload image to Storage
  ↓
Insert into collections table
  ↓
Return success
```

### 4. Product Purchase Flow
```
User browses products
  ↓
Clicks "Add to Cart"
  ↓
Cart state updated (localStorage/context)
  ↓
Navigate to /cart
  ↓
Review cart items
  ↓
Click "Checkout"
  ↓
Redirect to payment gateway
  ↓
Payment confirmation
  ↓
Order created in database
```

---

## Database Schema (Supabase)

### Core Tables

#### `users`
**Purpose**: Store owner profiles
```sql
id, email, shop_name, shop_domain, phone_number, 
shop_address, instagram_id, logo_url, coins, created_at
```

#### `collections`
**Purpose**: Unified collections table (NEW ARCHITECTURE)
```sql
id, user_id, name, slug, collection_label, image_url,
display_order, is_active, created_at, updated_at
```

**collection_label values**: 'hero', 'trending', 'category', 'best', 'occasion'

#### `website_products`
**Purpose**: Product catalog
```sql
id, user_id, name, price, description, image_url, images[],
category, collection, weight, purity, gender, is_bestseller,
is_trending, show_on_website, created_at, updated_at
```

#### `user_websites`
**Purpose**: Website instances (NEW ARCHITECTURE)
```sql
id, user_id, template_id, theme, is_active, published_at,
created_at, updated_at
```

#### `user_website_sections`
**Purpose**: Section configurations (NEW ARCHITECTURE)
```sql
id, user_website_id, template_section_id, section_type,
section_label, is_enabled, display_order, config (JSON),
created_at, updated_at
```

#### `website_templates`
**Purpose**: Template catalog
```sql
id, name, slug, is_active, is_premium, display_order
```

#### `website_template_sections`
**Purpose**: Template section definitions
```sql
id, template_id, section_type, section_label, description,
default_config (JSON), schema, variant, is_required,
is_enabled_by_default, display_order, icon
```

### Legacy Tables (Deprecated)

- `user_hero_collections` - Migrated to `collections` (label='hero')
- `user_trending_collections` - Migrated to `collections` (label='trending')
- `user_website_templates` - Replaced by new architecture

---

## Key Concepts

### 1. Multi-Tenancy
Each jewelry store gets its own subdomain:
- `shop1.lustrai.in` → Shop 1's website
- `shop2.lustrai.in` → Shop 2's website

All powered by the same Next.js application with dynamic routing.

### 2. Template System
Users choose a template (e.g., "Classic Jewelry") which defines:
- Available sections
- Default layouts
- Section behavior

Users can then customize:
- Section visibility
- Section order
- Section content
- Collections and products

### 3. Collections vs Products
- **Collections**: Curated groups (Hero, Trending, Categories)
- **Products**: Individual items for sale

Collections are managed through the editor, products through the main app.

### 4. Editor Integration
The website can be edited from within the Flutter mobile app using WebView:
- Flutter app injects editor context
- Website detects context and shows editor UI
- All edits are authenticated with short-lived tokens
- Changes are saved to Supabase

### 5. Security Model
- **Public Access**: Anyone can view websites
- **Editor Access**: Only authenticated shop owners via Flutter app
- **API Access**: Service role key for server-side operations
- **RLS Policies**: Row-level security on all tables

---

## Deployment

### Vercel (Recommended)
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Netlify
1. Connect repository
2. Configure build settings in `netlify.toml`
3. Set environment variables
4. Deploy

### Custom Domain Setup
1. Add domain in hosting platform
2. Update DNS records:
   - A record: `76.76.21.21` (Vercel)
   - CNAME: `cname.vercel-dns.com`
3. Add wildcard subdomain: `*.lustrai.in`

---

## Development Workflow

### Local Development
```bash
cd website-nextjs
npm install
npm run dev
```

Visit: `http://localhost:3000/demo` or `http://localhost:3000/{shop-domain}`

### Testing Editor Mode
1. Run Flutter app
2. Navigate to Website section
3. Click "Preview Website"
4. Editor buttons should appear
5. Test collection editing

### Database Changes
1. Create migration in `/supabase/migrations/`
2. Run migration in Supabase dashboard
3. Update TypeScript types in `src/types/database.ts`
4. Update data fetching functions in `src/lib/supabase.ts`

---

## Troubleshooting

### Issue: Website not loading
- Check if shop_domain exists in users table
- Verify Supabase connection
- Check middleware.ts logs

### Issue: Editor buttons not showing
- Verify `window.lustraEditorContext` exists
- Check if `enabled === true`
- Ensure running in Flutter WebView

### Issue: Images not loading
- Check Supabase Storage bucket permissions
- Verify image URLs are public
- Check Next.js image domains in `next.config.js`

### Issue: API errors
- Verify environment variables are set
- Check Supabase service role key
- Review API route logs

---

## Future Enhancements

1. **Multiple Templates**: Allow users to switch templates
2. **Custom Domains**: Full custom domain support per shop
3. **Advanced Editor**: Visual drag-and-drop section editor
4. **Product Management**: Add/edit products from WebView
5. **Analytics Dashboard**: Traffic and sales analytics
6. **SEO Tools**: Meta tags, sitemaps, structured data
7. **Payment Integration**: Stripe, Razorpay integration
8. **Order Management**: Order tracking and fulfillment
9. **Customer Accounts**: User registration and login
10. **Inventory Management**: Stock tracking

---

## Summary

The **website-nextjs** project is a sophisticated multi-tenant e-commerce platform that combines:
- Modern web technologies (Next.js, React, TypeScript)
- Flexible template system
- Seamless mobile app integration
- Scalable architecture
- Beautiful jewelry-focused design

It serves as the customer-facing storefront for jewelry businesses while providing powerful editing capabilities through the Flutter mobile app.
 