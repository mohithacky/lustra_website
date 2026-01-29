# Lustra AI - Next.js Website Template

A beautiful, modern Next.js jewelry website template that connects to your Supabase database and existing backend.

## Features

- 🎨 **Modern Design** - Beautiful jewelry-focused design with light/dark theme support
- 📱 **Fully Responsive** - Works perfectly on mobile, tablet, and desktop
- ⚡ **Fast Performance** - Built with Next.js 14 and optimized for speed
- 🗄️ **Supabase Integration** - Connects to your existing Supabase database
- 🛒 **E-commerce Ready** - Product listings, categories, collections
- 🎠 **Hero Carousel** - Stunning hero section with auto-play carousel
- 💬 **Testimonials** - Customer reviews section
- 📊 **SEO Optimized** - Built-in metadata and OpenGraph support

## Project Structure

```
website-nextjs/
├── src/
│   ├── app/
│   │   ├── [domain]/       # Dynamic store pages
│   │   ├── demo/           # Demo store page
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Home page
│   ├── components/
│   │   ├── layout/
│   │   │   └── WebsiteLayout.tsx
│   │   └── sections/
│   │       ├── HeroCarousel.tsx
│   │       ├── TrendingSection.tsx
│   │       ├── CategoriesSection.tsx
│   │       ├── BestCollectionsSection.tsx
│   │       ├── ProductsSection.tsx
│   │       ├── TestimonialsSection.tsx
│   │       └── Footer.tsx
│   ├── lib/
│   │   ├── supabase.ts     # Supabase client & queries
│   │   └── utils.ts        # Utility functions
│   └── types/
│       └── database.ts     # TypeScript types
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json
└── .env.example
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account with database setup

### Installation

1. **Install dependencies:**
   ```bash
   cd website-nextjs
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   BACKEND_URL=https://api.lustrai.in
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000/demo](http://localhost:3000/demo)** to see the demo store.

## Deployment to Vercel

### Option 1: Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel --prod
   ```

### Option 2: GitHub Integration

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables in Vercel dashboard
5. Deploy!

### Custom Domain (lustrai.in)

1. In Vercel project settings, go to **Domains**
2. Add `lustrai.in` as a custom domain
3. Update your DNS settings:
   - Add an **A record** pointing to `76.76.21.21`
   - Or add a **CNAME record** pointing to `cname.vercel-dns.com`
4. For wildcard subdomains (e.g., `*.lustrai.in`), add the wildcard domain in Vercel

## Database Schema

This template expects the following Supabase tables:
- `users` - Store owner information
- `user_website_templates` - Website configuration
- `user_hero_collections` - Hero carousel items
- `website_products` - Product listings
- `user_collections` - Collections
- `user_categories` - Categories
- `customer_reviews` - Testimonials

See the migrations in `/supabase/migrations/` for complete schema.

## Customization

### Theme Colors

Edit `tailwind.config.ts` to customize the color palette:

```typescript
colors: {
  gold: {
    500: '#C5A572', // Primary gold color
    // ...
  },
}
```

### Fonts

The template uses:
- **Playfair Display** - Headings
- **Lato** - Body text

Modify in `src/app/globals.css`.

## API Routes

The template proxies API requests to your backend:

- `/api/backend/*` → `https://api.lustrai.in/*`

Configure in `next.config.js` and `vercel.json`.

## License

MIT License - feel free to use this template for your jewelry business!

---

Built with ❤️ by [Lustra AI](https://lustrai.in)
 