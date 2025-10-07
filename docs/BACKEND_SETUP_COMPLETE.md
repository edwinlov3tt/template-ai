# Backend Setup Complete! ✅

## What's Been Set Up

### ✅ PostgreSQL Database
- **Status:** Connected and configured
- **Host:** 34.174.127.137:5432
- **Database:** dblzgplerkapao
- **Tables Created:**
  - `templates` - Store template metadata and JSON
  - `designs` - Store shareable design URLs

### ✅ Backend API Server
- **Status:** Running on `http://localhost:3001`
- **Framework:** Express.js
- **Database:** PostgreSQL connection pool configured
- **CORS:** Enabled for frontend communication

### ✅ API Endpoints

**Templates:**
- `GET /api/templates` - List all templates (with filtering)
- `GET /api/templates/:slug` - Get single template
- `POST /api/templates` - Create new template
- `PUT /api/templates/:id` - Update template
- `PATCH /api/templates/:id/publish` - Publish template
- `DELETE /api/templates/:id` - Delete template
- `GET /api/templates/search/:query` - Search templates

**Designs (Shareable URLs):**
- `POST /api/designs` - Create shareable design
- `GET /api/designs/:shareCode` - Get design by share code
- `DELETE /api/designs/cleanup` - Cleanup expired designs

**Health Check:**
- `GET /health` - Server status check

---

## How to Run

### Option 1: Run Both (Frontend + Backend)
```bash
npm run dev:all
```
This runs:
- Frontend (Vite): `http://localhost:5175`
- Backend API: `http://localhost:3001`

### Option 2: Run Separately
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run server
```

### Database Scripts
```bash
# Test database connection
npm run db:test

# Recreate database schema
npm run db:setup
```

---

## What's Next

### 1. **Update Frontend to Use API** (Not Yet Done)

The frontend still uses **local storage**. To switch to the database backend:

**Update `.env`:**
```env
VITE_API_URL=http://localhost:3001/api
```

**Update `src/services/templateService.ts`:**

Replace local storage methods with API calls:

```typescript
// Example: Get templates
static async getTemplates(category?: string): Promise<TemplateMetadata[]> {
  const url = category
    ? `${import.meta.env.VITE_API_URL}/templates?category=${category}&published=true`
    : `${import.meta.env.VITE_API_URL}/templates?published=true`

  const res = await fetch(url)
  const data = await res.json()

  return data.templates.map(t => ({
    id: t.id,
    slug: t.slug,
    title: t.title,
    description: t.description,
    category: t.category,
    tags: t.tags,
    previewUrl: t.preview_url,
    thumbnailUrl: t.thumbnail_url,
    createdAt: t.created_at,
    published: t.published,
    featured: t.featured
  }))
}

// Example: Save template
static async saveTemplate(template: Template, metadata: {...}) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ template, metadata })
  })

  return res.json()
}
```

### 2. **Test Full Flow**

1. Create a template in the editor
2. Click "Save" dropdown → "Save as Template"
3. Template should save to PostgreSQL
4. Go to `/templates` - template should appear
5. Click template - should load into editor

### 3. **Add Preview Images (Optional)**

Install `html-to-image`:
```bash
npm install html-to-image
```

Generate preview when saving template:
```typescript
import { toPng } from 'html-to-image'

const canvasElement = document.querySelector('#canvas-container')
const dataUrl = await toPng(canvasElement)

// Upload to Cloudflare R2 (next step)
```

### 4. **Set Up Cloudflare R2** (For Images)

**Already Configured in `.env`:**
- Account ID: 6f162004d5bd40500b824a2f7f5a1a13
- Access Key ID: 3ef9158977bdfdb49a34e007c0736693
- Bucket: template-ai-assets

**Create Upload Endpoint:**
```typescript
// server/routes/upload.js
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
})

router.post('/upload', async (req, res) => {
  const { filename, base64Data } = req.body

  const buffer = Buffer.from(base64Data.split(',')[1], 'base64')

  await s3.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: `templates/previews/${filename}`,
    Body: buffer,
    ContentType: 'image/png'
  }))

  res.json({ url: `${process.env.R2_PUBLIC_URL}/templates/previews/${filename}` })
})
```

### 5. **Implement Design Sharing**

**Update Editor to Load from Share Code:**

```typescript
// src/pages/Editor.tsx
import { useParams } from 'react-router-dom'

function Editor() {
  const { shareCode } = useParams()

  useEffect(() => {
    if (shareCode) {
      loadSharedDesign(shareCode)
    }
  }, [shareCode])

  async function loadSharedDesign(code: string) {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/designs/${code}`)
    const data = await res.json()
    setTemplate(data.template)
  }
}
```

**Create Share Button:**
```typescript
async function handleShare() {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/designs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      template,
      expiresInDays: 30 // Optional expiration
    })
  })

  const { shareCode, shareUrl } = await res.json()

  const fullUrl = `${window.location.origin}${shareUrl}`
  // Copy to clipboard or show modal
  navigator.clipboard.writeText(fullUrl)
  message.success('Share link copied!')
}
```

---

## File Structure

```
template-ai/
├── .env (database + R2 credentials)
├── server/
│   ├── index.js (Express server)
│   ├── db.js (Database queries)
│   └── routes/
│       ├── templates.js (Template API)
│       └── designs.js (Design sharing API)
├── scripts/
│   ├── db-setup.js (Create schema)
│   └── db-test.js (Test connection)
└── src/
    └── services/
        ├── templateService.ts (Frontend API client)
        └── database.ts (Types only - not used in browser)
```

---

## Testing the Backend

### Test Template Creation
```bash
curl -X POST http://localhost:3001/api/templates \
  -H "Content-Type: application/json" \
  -d '{
    "template": {"id": "test", "version": "1.0.0", "canvas": {}, "slots": [], "tokens": {}},
    "metadata": {
      "title": "Test Template",
      "description": "A test template",
      "category": "full-template",
      "tags": ["test"]
    }
  }'
```

### Test Template Listing
```bash
curl http://localhost:3001/api/templates
```

### Test Template by Slug
```bash
curl http://localhost:3001/api/templates/test-template
```

---

## Next Actions

**Immediate:**
1. ✅ Database setup complete
2. ✅ Backend API running
3. ⏳ Update frontend to use API
4. ⏳ Test template save/load flow

**Phase 2:**
5. Add preview image generation
6. Set up R2 upload endpoint
7. Implement design sharing

**Phase 3:**
8. Deploy backend (Vercel/Railway)
9. Deploy frontend (Vercel/Netlify)
10. Update R2 public URL

---

## Environment Variables

**Current `.env` file has:**
```
✅ POSTGRES_HOST
✅ POSTGRES_PORT
✅ POSTGRES_DATABASE
✅ POSTGRES_USER
✅ POSTGRES_PASSWORD
✅ R2_ACCOUNT_ID
✅ R2_ACCESS_KEY_ID
✅ R2_SECRET_ACCESS_KEY
✅ R2_BUCKET_NAME
✅ R2_ENDPOINT
```

**Needed for frontend:**
```
VITE_API_URL=http://localhost:3001/api (add this)
```

---

## Success! 🎉

You now have:
- ✅ PostgreSQL database connected
- ✅ Backend API server running
- ✅ Template and design tables created
- ✅ RESTful API endpoints
- ✅ Cloudflare R2 credentials configured

**Next step:** Update the frontend `templateService.ts` to call the API instead of using local storage!
