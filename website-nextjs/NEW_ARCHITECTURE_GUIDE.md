# Dynamic Website Builder Architecture

## Overview

This document describes the new multi-tenant website builder architecture, similar to Shopify's approach where users can choose templates and customize sections.

## Core Concepts

### Golden Rule
- **WHAT goes in TABLES**: collections, business data, user-generated content
- **HOW goes in CONFIG (JSON)**: layout, variant, limits, visibility, behavior

### Mental Models
- **Templates**: "This is the shell, not the content"
- **Template Sections**: "If a website has this section, this is how it should behave by default"
- **User Websites**: "This is the instance of a template"
- **User Website Sections**: "Template gives defaults → user overrides small things"
- **Collections**: "Answer WHAT to show, not HOW"

## Database Schema

### 1. `website_templates` (Template Catalog)
What users choose first. Defines base website templates.

```
id, name, slug, is_active, is_premium, display_order
```

- No layout logic
- No section behavior
- Just template metadata

### 2. `website_template_sections` (Section Definitions)
Defines WHAT sections exist in a template + their default behavior.

```
id, template_id → website_templates.id, section_key, section_label,
description, default_config (JSON → DEFAULT HOW), schema, variant,
is_required, is_enabled_by_default, display_order, icon
```

- Declares sections supported
- Defines default behavior
- `default_config` contains layout, variant, limits, visibility
- Does NOT contain collections, text, images, user data

### 3. `user_websites` (Website Instances)
A real website created by a user.

```
user_id, template_id → website_templates.id, theme, is_active,
published_at, created_at, updated_at
```

- Represents one live website
- Chooses ONE template
- Holds global state

### 4. `user_website_sections` (Section Customizations)
Runtime control of sections for a specific website.

```
id, user_website_id → user_websites.id, 
template_section_id → website_template_sections.id,
section_key, is_enabled, display_order, 
config (JSON → OVERRIDES ONLY), collection_ids, content,
created_at, updated_at
```

- Controls what renders
- Applies overrides
- `config` JSON contains ONLY overrides (variant, limits, visibility)
- Never contains default values, large datasets, collections

### 5. `collections` (Business Content)
Business content used by sections.

```
id, user_id, name, slug, collection_label, image_url, description,
display_order, position, aspect_ratio, is_active, metadata
```

- Stores actual content
- Used by hero, trending, categories, etc.
- **Key Rule**: Sections DO NOT store items; Sections only QUERY collections

## Section Types and Data Sources

| Section Type | Behavior Source | Overrides Source | Data Source |
|--------------|-----------------|------------------|-------------|
| hero_carousel | website_template_sections.default_config | user_website_sections.config | collections table (label='hero') |
| trending | website_template_sections.default_config | user_website_sections.config | collections table (label='trending') |
| categories | website_template_sections.default_config | user_website_sections.config | collections table (label='category') |
| footer | default_config | config | NONE (inline in content) |
| testimonials | default_config | config | inline_JSON OR future table |
| best_collections | default_config | config | collections table (label='best') |
| occasion_collections | default_config | config | collections table (label='occasion') |

## Runtime Rendering Flow

```
1. Load user_website
      ↓
2. Get template_id
      ↓
3. Load website_template_sections (defaults)
      ↓
4. Load user_website_sections (overrides)
      ↓
5. Merge: final_config = default_config + config
      ↓
6. If section needs data → fetch from collections
      ↓
7. Render section
```

## Implementation Files

### SQL Migrations
- `025_create_website_templates_table.sql` - Template catalog
- `026_create_website_template_sections_table.sql` - Section definitions
- `027_create_user_websites_table.sql` - User website instances
- `028_create_user_website_sections_table.sql` - User section customizations
- `030_create_unified_collections_table.sql` - Unified collections table

### Backend (Firebase Functions)
- `functions/index.js` - `/onboarding/save-website-template` endpoint creates:
  - `user_websites` entry
  - `user_website_sections` entries for each template section
  - `collections` entries for hero, trending, categories, etc.

### Next.js Frontend
- `src/lib/supabase-new-architecture.ts` - New data fetching functions
- `src/app/[domain]/page.tsx` - Uses new architecture for rendering

### Flutter App
- No changes needed - uses same backend endpoint
- `lib/services/supabase_user_service.dart` - `saveUserWebsiteTemplate()` calls backend

## Backward Compatibility

The system maintains backward compatibility:
1. Backend still writes to `user_website_templates` (legacy table)
2. Old collections tables (`user_hero_collections`, `user_trending_collections`) remain
3. Data is migrated to new tables automatically

## Testing

### Test Onboarding Flow (Flutter)
1. Create a new user account
2. Complete onboarding with shop details, categories, collections
3. Verify in Supabase:
   - `user_websites` has entry for user
   - `user_website_sections` has entries for each section
   - `collections` has entries for hero, trending, category, best, occasion

### Test Website Rendering (Next.js)
1. Visit `https://your-domain.lustra.app`
2. Verify:
   - Hero carousel shows collections from `collections` table (label='hero')
   - Trending section shows collections (label='trending')
   - Categories section shows collections (label='category')
   - Footer uses data from `user_website_sections.content`

### SQL Verification Queries

```sql
-- Check user's website
SELECT * FROM user_websites WHERE user_id = 'YOUR_USER_ID';

-- Check user's sections
SELECT uws.*, wts.section_key, wts.default_config
FROM user_website_sections uws
JOIN website_template_sections wts ON wts.id = uws.template_section_id
WHERE uws.user_website_id = 'YOUR_WEBSITE_ID';

-- Check user's collections
SELECT * FROM collections 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY collection_label, display_order;
```

## Future Enhancements

1. **Multiple Templates**: Users can switch between templates
2. **Template Marketplace**: Premium templates for purchase
3. **Section Editor**: Visual editor for section customization
4. **Custom Domains**: Full custom domain support via `user_websites.custom_domain`
 