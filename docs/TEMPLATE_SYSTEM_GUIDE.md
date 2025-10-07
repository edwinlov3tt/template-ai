# Template Management System - Implementation Guide

## ✅ Phase 1: Frontend (COMPLETED)

### What's Been Built

#### 1. **Local Storage Template System**
- ✅ `src/services/templateService.ts` - CRUD operations for templates
- ✅ Template metadata (title, category, description, tags)
- ✅ Import/Export JSON functionality
- ✅ Slug generation for URLs

#### 2. **Template Gallery**
- ✅ `src/pages/Templates.tsx` - Browse templates page
- ✅ Category filtering (Full Templates, Layouts, Text Blocks, etc.)
- ✅ Search by title/description/tags
- ✅ Template cards with preview placeholders
- ✅ Click to load template into editor

#### 3. **Admin Mode**
- ✅ Feature flag: `VITE_ADMIN_MODE=true`
- ✅ Save button dropdown in TopBar
- ✅ "Save as Template" option
- ✅ `src/components/admin/SaveTemplateDialog.tsx` - Metadata form
- ✅ Export JSON backup

#### 4. **Navigation**
- ✅ Home page (`/`) with "Browse Templates" button
- ✅ Templates gallery (`/templates`)
- ✅ Editor (`/editor`)
- ✅ React Router integration

---

## 📋 Phase 1 Testing Checklist

### Test the Complete Flow

1. **Create a Template**
   ```
   1. Go to http://localhost:5175/
   2. Select a canvas size (e.g., Instagram Square)
   3. Add elements (text, shapes, images)
   4. Click Save dropdown → "Save as Template"
   5. Fill out form:
      - Title: "My First Template"
      - Category: "Full Template"
      - Description: "A test template"
      - Tags: "test, demo"
   6. Click "Save Template"
   ```

2. **Browse Templates**
   ```
   1. Click "Browse Templates" (home page)
   2. Verify your template appears
   3. Test search functionality
   4. Test category filtering
   ```

3. **Load Template**
   ```
   1. Click on your template card
   2. Verify editor loads with template
   3. Verify all elements are intact
   ```

4. **Export/Import JSON**
   ```
   1. In Save Template dialog, click "Export JSON"
   2. Save the JSON file
   3. Later: Import via templateService if needed
   ```

---

## 🚀 Phase 2: Backend Integration (NEXT STEPS)

### What You Need to Set Up

#### 1. **Database Setup (SiteGround Postgres)**

**Schema to create:**

```sql
-- Templates table
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  template_json JSONB NOT NULL,
  preview_url TEXT,
  thumbnail_url TEXT,
  published BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for searching
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_tags ON templates USING GIN(tags);
CREATE INDEX idx_templates_published ON templates(published);

-- Designs table (for shareable URLs)
CREATE TABLE designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_code TEXT UNIQUE NOT NULL,
  template_json JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Index for share codes
CREATE INDEX idx_designs_share_code ON designs(share_code);
```

**Connection Steps:**
1. Log into SiteGround cPanel
2. Create new PostgreSQL database
3. Note down connection credentials:
   - Host
   - Port
   - Database name
   - Username
   - Password

#### 2. **Cloudflare R2 Setup (Asset Storage)**

**What to store:**
- Template preview images (PNG/JPG)
- Template thumbnails (smaller versions)
- User-uploaded images
- Font files (if custom fonts)

**Setup Steps:**
1. Go to Cloudflare Dashboard → R2
2. Create new bucket: `template-ai-assets`
3. Note down:
   - Account ID
   - Access Key ID
   - Secret Access Key
   - Bucket name

**Folder structure:**
```
/templates/
  /previews/        # Full-size preview images
    {template-id}.png
  /thumbnails/      # Smaller thumbnails
    {template-id}.png
/designs/
  /previews/        # User design previews
    {share-code}.png
/uploads/           # User-uploaded images
  {user-id}/{filename}
```

#### 3. **API Backend Setup**

**Option A: Next.js API Routes (Recommended)**

1. **Install Next.js in separate folder:**
   ```bash
   npx create-next-app@latest template-ai-backend
   cd template-ai-backend
   npm install prisma @prisma/client @aws-sdk/client-s3
   ```

2. **Configure Prisma:**
   ```bash
   npx prisma init
   ```

   Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }

   model Template {
     id           String   @id @default(uuid())
     slug         String   @unique
     title        String
     description  String?
     category     String
     tags         String[]
     templateJson Json     @map("template_json")
     previewUrl   String?  @map("preview_url")
     thumbnailUrl String?  @map("thumbnail_url")
     published    Boolean  @default(false)
     featured     Boolean  @default(false)
     createdAt    DateTime @default(now()) @map("created_at")
     updatedAt    DateTime @updatedAt @map("updated_at")

     @@map("templates")
   }

   model Design {
     id           String   @id @default(uuid())
     shareCode    String   @unique @map("share_code")
     templateJson Json     @map("template_json")
     createdAt    DateTime @default(now()) @map("created_at")
     expiresAt    DateTime? @map("expires_at")

     @@map("designs")
   }
   ```

3. **Create API routes:**
   ```
   /api/templates
     GET    - List templates (with filters)
     POST   - Create template (admin only)

   /api/templates/[slug]
     GET    - Get single template
     PUT    - Update template (admin only)
     DELETE - Delete template (admin only)

   /api/designs
     POST   - Create shareable design

   /api/designs/[shareCode]
     GET    - Get design by share code

   /api/upload
     POST   - Upload preview image to R2
   ```

4. **Environment variables (`.env`):**
   ```env
   DATABASE_URL="postgresql://user:password@host:port/database"

   # Cloudflare R2
   R2_ACCOUNT_ID="your-account-id"
   R2_ACCESS_KEY_ID="your-access-key"
   R2_SECRET_ACCESS_KEY="your-secret-key"
   R2_BUCKET_NAME="template-ai-assets"
   R2_PUBLIC_URL="https://your-r2-domain.com"

   # Admin API Key (for template creation)
   ADMIN_API_KEY="your-secret-admin-key"
   ```

**Option B: Express.js Backend**

1. **Setup Express:**
   ```bash
   mkdir template-ai-backend && cd template-ai-backend
   npm init -y
   npm install express pg @aws-sdk/client-s3 dotenv cors
   ```

2. **Create similar API routes as Next.js option**

#### 4. **Frontend Integration**

**Update `src/services/templateService.ts`:**

```typescript
// Replace local storage with API calls

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export class TemplateService {
  // GET /api/templates
  static async getTemplates(category?: string): Promise<TemplateMetadata[]> {
    const url = category
      ? `${API_BASE}/templates?category=${category}`
      : `${API_BASE}/templates`

    const res = await fetch(url)
    return res.json()
  }

  // GET /api/templates/:slug
  static async getTemplateBySlug(slug: string): Promise<SavedTemplate | null> {
    const res = await fetch(`${API_BASE}/templates/${slug}`)
    if (!res.ok) return null
    return res.json()
  }

  // POST /api/templates (admin only)
  static async saveTemplate(
    template: Template,
    metadata: { ... }
  ): Promise<SavedTemplate> {
    const res = await fetch(`${API_BASE}/templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_ADMIN_API_KEY}`
      },
      body: JSON.stringify({ template, metadata })
    })
    return res.json()
  }

  // POST /api/designs (create shareable URL)
  static async shareDesign(template: Template): Promise<{ shareCode: string }> {
    const res = await fetch(`${API_BASE}/designs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template })
    })
    return res.json()
  }
}
```

**Add to `.env`:**
```env
VITE_API_URL=http://localhost:3000/api
VITE_ADMIN_API_KEY=your-secret-admin-key
```

#### 5. **Preview Image Generation**

**Install html-to-image:**
```bash
npm install html-to-image
```

**Create preview generator:**
```typescript
// src/utils/generatePreview.ts
import { toPng } from 'html-to-image'

export async function generateTemplatePreview(
  canvasElement: HTMLElement
): Promise<Blob> {
  const dataUrl = await toPng(canvasElement, {
    quality: 0.95,
    pixelRatio: 2
  })

  const res = await fetch(dataUrl)
  return res.blob()
}

// Usage in SaveTemplateDialog:
const previewBlob = await generateTemplatePreview(canvasRef.current)
const previewUrl = await uploadToR2(previewBlob) // Upload to R2
```

**Upload to R2:**
```typescript
// Backend API route: /api/upload
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
})

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  const filename = `templates/previews/${crypto.randomUUID()}.png`

  await s3.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: filename,
    Body: Buffer.from(await file.arrayBuffer()),
    ContentType: 'image/png'
  }))

  return Response.json({
    url: `${process.env.R2_PUBLIC_URL}/${filename}`
  })
}
```

---

## 🎯 Phase 3: Advanced Features (FUTURE)

### 1. **Design Sharing**
- [ ] Generate unique share codes (e.g., `/editor/abc123xyz`)
- [ ] Save designs to `designs` table
- [ ] Load designs from share code in Editor.tsx
- [ ] Optional: Expiration dates for shares

### 2. **Template Improvements**
- [ ] Automatic preview generation on save
- [ ] Thumbnail generation (300x300)
- [ ] Template versioning
- [ ] Template duplication
- [ ] Template analytics (views, uses)

### 3. **Admin Dashboard**
- [ ] Full admin panel at `/admin`
- [ ] Bulk template management
- [ ] Publish/unpublish templates
- [ ] Featured template selection
- [ ] Usage statistics

### 4. **Multi-Size Template Generation**
- [ ] Auto-generate templates for all supported ratios
- [ ] Save multiple size variants
- [ ] Smart layout adaptation per ratio

### 5. **User Features**
- [ ] User authentication
- [ ] Save personal designs
- [ ] Template favorites
- [ ] Design history

---

## 📝 Summary: What YOU Need to Do

### Immediate Next Steps:

1. **Test Phase 1** (Local Storage)
   - Create templates in the editor
   - Browse the gallery
   - Verify load functionality

2. **Set Up Database**
   - Create PostgreSQL database on SiteGround
   - Run SQL schema (provided above)
   - Note connection credentials

3. **Set Up Cloudflare R2**
   - Create R2 bucket
   - Configure access keys
   - Note bucket details

4. **Choose Backend Framework**
   - **Recommended:** Next.js (simpler, same tech stack)
   - Alternative: Express.js

5. **Build API Backend**
   - Install dependencies
   - Configure Prisma + database
   - Create API routes (templates, designs, upload)
   - Set environment variables

6. **Update Frontend**
   - Replace `templateService.ts` with API calls
   - Add preview image generation
   - Test with backend running

7. **Deploy**
   - Deploy backend to Vercel (Next.js) or Railway (Express)
   - Deploy frontend to Vercel/Netlify
   - Update environment variables

### Migration Path:

```
Phase 1 (Current): Local Storage → Test UX
         ↓
Phase 2 (Next):    API Backend → Production Ready
         ↓
Phase 3 (Future):  Advanced Features → Full Product
```

---

## 🔗 Helpful Resources

- [Prisma Docs](https://www.prisma.io/docs)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/welcome.html)

---

## ❓ Questions to Decide

1. **Backend Framework:**
   - Next.js (recommended - same ecosystem)
   - Express.js (more control)

2. **Deployment:**
   - Vercel (easiest for Next.js)
   - Railway (good for Express)
   - DigitalOcean App Platform

3. **Image Processing:**
   - Client-side (html-to-image)
   - Server-side (Puppeteer/Playwright for better quality)

4. **Authentication (Phase 3):**
   - NextAuth.js
   - Clerk
   - Supabase Auth

Let me know which direction you want to go and I can help with the implementation!
