# Frontend API Integration Complete! ✅

## What's Been Updated

### ✅ Environment Configuration
Added to `.env`:
```env
VITE_API_URL=http://localhost:3001/api
```

### ✅ Template Service Completely Rewritten
File: `src/services/templateService.ts`

**Changed from:** Local Storage
**Changed to:** PostgreSQL via Backend API

**All methods updated:**
- ✅ `getTemplates()` - GET /api/templates
- ✅ `getTemplateBySlug()` - GET /api/templates/:slug
- ✅ `saveTemplate()` - POST /api/templates
- ✅ `updateTemplate()` - PUT /api/templates/:id
- ✅ `publishTemplate()` - PATCH /api/templates/:id/publish
- ✅ `deleteTemplate()` - DELETE /api/templates/:id
- ✅ `importTemplateFromFile()` - POST /api/templates (imports to DB)
- ✅ `exportTemplateToFile()` - Still local (downloads JSON)

---

## Currently Running Services

### Frontend (Vite)
- **URL:** http://localhost:5175
- **Status:** ✅ Running with hot reload
- **Connected to:** Backend API at localhost:3001

### Backend (Express)
- **URL:** http://localhost:3001
- **Status:** ✅ Running
- **Connected to:** PostgreSQL at 34.174.127.137:5432

### Database (PostgreSQL)
- **Host:** 34.174.127.137:5432
- **Database:** dblzgplerkapao
- **Status:** ✅ Connected
- **Tables:** templates, designs

---

## How to Test the Full Flow

### 1. **Create a Template**

1. Go to http://localhost:5175
2. Click "Start Blank" or select a canvas size
3. Add some elements:
   - Click "+ Text" to add text
   - Click "+ Shape" to add shapes
   - Click "+ Image" to add images
4. Make some edits (change colors, move things around)

### 2. **Save as Template**

1. Click the "Save" dropdown in the top-right
2. Select "Save as Template"
3. Fill out the form:
   ```
   Title: My First Template
   Category: Full Template
   Description: A test template
   Tags: test, demo, first
   ```
4. Click "Save Template"
5. ✅ **Check:** Success message should appear
6. ✅ **Check:** Template saved to PostgreSQL

### 3. **Verify in Database**

Open a terminal and run:
```bash
npm run db:test
```

You should see:
```
✅ Connected successfully!

📋 Existing tables:
   - designs
   - templates

✅ Connection test passed!
```

Or query directly:
```bash
curl http://localhost:3001/api/templates
```

### 4. **Browse Templates**

1. Click "Browse Templates" (home page button)
2. Go to http://localhost:5175/templates
3. ✅ **Check:** Your template should appear in the gallery
4. ✅ **Check:** Search and category filters work

### 5. **Load Template**

1. Click on your template card
2. ✅ **Check:** Editor loads with template
3. ✅ **Check:** All elements are intact
4. ✅ **Check:** You can edit the loaded template

### 6. **Test Publish**

Templates are saved as **unpublished** by default. To make them visible:

**Option A: Via API**
```bash
# Get template ID from the list
curl http://localhost:3001/api/templates

# Publish it (replace {id} with actual ID)
curl -X PATCH http://localhost:3001/api/templates/{id}/publish
```

**Option B: Update frontend** (future feature)
Add a "Publish" button in admin mode

---

## API Testing Examples

### List All Templates
```bash
curl http://localhost:3001/api/templates
```

### Get Single Template
```bash
curl http://localhost:3001/api/templates/my-first-template
```

### Create Template
```bash
curl -X POST http://localhost:3001/api/templates \
  -H "Content-Type: application/json" \
  -d '{
    "template": {
      "id": "test-2",
      "version": "1.0.0",
      "canvas": {"baseViewBox": [0, 0, 1080, 1080]},
      "slots": [],
      "tokens": {"palette": {}}
    },
    "metadata": {
      "title": "Test Template 2",
      "description": "Another test",
      "category": "full-template",
      "tags": ["test"]
    }
  }'
```

### Search Templates
```bash
curl http://localhost:3001/api/templates/search/test
```

---

## Data Flow

### Save Template Flow
```
User clicks "Save as Template"
  ↓
SaveTemplateDialog.tsx
  ↓
TemplateService.saveTemplate()
  ↓
POST http://localhost:3001/api/templates
  ↓
server/routes/templates.js
  ↓
server/db.js (templateQueries.create)
  ↓
PostgreSQL INSERT
  ↓
Returns saved template with ID
  ↓
Success message to user
```

### Load Template Flow
```
User clicks template card
  ↓
Templates.tsx → handleTemplateClick()
  ↓
TemplateService.getTemplateBySlug()
  ↓
GET http://localhost:3001/api/templates/:slug
  ↓
server/routes/templates.js
  ↓
server/db.js (templateQueries.getBySlug)
  ↓
PostgreSQL SELECT
  ↓
Returns template JSON
  ↓
setTemplate() → Editor loads
```

---

## Debugging

### Check if API is reachable from frontend

Open browser console on http://localhost:5175 and run:
```javascript
fetch('http://localhost:3001/api/templates')
  .then(r => r.json())
  .then(console.log)
```

Should return:
```json
{
  "templates": [...],
  "count": 0
}
```

### Check CORS

If you see CORS errors:
```
Access to fetch at 'http://localhost:3001/api/templates' from origin 'http://localhost:5175' has been blocked by CORS policy
```

The backend already has CORS enabled. Check:
```javascript
// server/index.js
app.use(cors()) // ✅ Already enabled
```

### Check database connection

```bash
npm run db:test
```

Should show:
```
✅ Connected successfully!
```

---

## Next Steps (Optional Enhancements)

### 1. **Add Preview Images**

Install:
```bash
npm install html-to-image
```

Update SaveTemplateDialog to generate preview:
```typescript
import { toPng } from 'html-to-image'

// In handleSave, before API call:
const canvasElement = document.querySelector('#canvas-container')
const dataUrl = await toPng(canvasElement)

// Send to upload endpoint
const res = await fetch(`${API_URL}/upload`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    filename: `${slug}.png`,
    base64Data: dataUrl
  })
})

const { url } = await res.json()

// Include in template metadata
metadata.previewUrl = url
```

### 2. **Add Design Sharing**

Update Editor.tsx to handle share codes:
```typescript
const { shareCode } = useParams()

useEffect(() => {
  if (shareCode) {
    loadSharedDesign(shareCode)
  }
}, [shareCode])

async function loadSharedDesign(code: string) {
  const res = await fetch(`${API_URL}/designs/${code}`)
  const data = await res.json()
  setTemplate(data.template)
}
```

Add Share button:
```typescript
async function handleShare() {
  const res = await fetch(`${API_URL}/designs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ template })
  })

  const { shareCode } = await res.json()
  const url = `${window.location.origin}/editor/${shareCode}`

  navigator.clipboard.writeText(url)
  message.success('Share link copied!')
}
```

### 3. **Add Publish/Unpublish UI**

In Templates.tsx, add admin controls:
```typescript
{import.meta.env.VITE_ADMIN_MODE === 'true' && (
  <button onClick={() => handlePublish(template.id)}>
    {template.published ? 'Unpublish' : 'Publish'}
  </button>
)}
```

---

## Success! 🎉

You now have a **fully functional template management system** with:
- ✅ PostgreSQL database storage
- ✅ RESTful backend API
- ✅ Frontend integration complete
- ✅ Save templates from editor
- ✅ Browse template gallery
- ✅ Load templates into editor
- ✅ Search and filter
- ✅ Import/export JSON

**The app is now using the backend instead of local storage!**

Test it out by creating a template and seeing it appear in the gallery. All data is now persisted in PostgreSQL! 🚀
