# 🚀 Virtual Try-On - Vercel Deployment

## Deployment Instructions

### Step 1: Push to GitHub

```bash
git add -A
git commit -m "Add Vercel deployment configuration"
git push origin vercel-deployment
```

### Step 2: Import in Vercel

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select `HelenSolS/virtry`
4. **Important:** Select branch `vercel-deployment`

### Step 3: Configure Environment Variables

In Vercel project settings, add:

**Name:** `GOOGLE_API_KEY`
**Value:** Your Google API key (from Google AI Studio)

### Step 4: Deploy

Click "Deploy" and wait for deployment to complete.

---

## Project Structure

```
virtry/
├── api/
│   └── tryon.js          # Vercel Edge Function (API endpoint)
├── public/
│   ├── index.html        # Main HTML page
│   └── static/
│       ├── app.js        # Frontend JavaScript
│       ├── style.css     # Styles
│       └── hero-video.mp4
└── vercel.json           # Vercel configuration
```

---

## API Endpoint

**POST** `/api/tryon`

**Parameters:**
- `photo` (File) - Person image
- `outfit` (File) - Clothing image

**Response:**
```json
{
  "success": true,
  "image": "data:image/png;base64,...",
  "outfitDescription": "{...}"
}
```

---

## Features

- ✅ Two-step AI generation (describe → try-on)
- ✅ Gemini 2.5 Flash IMAGE integration
- ✅ Error handling with user-friendly messages
- ✅ Responsive UI with drag & drop
- ✅ Works on Vercel Edge Functions

---

## Differences from Cloudflare Version

### Cloudflare Version:
- Uses Cloudflare AI Gateway
- Requires GATEWAY_URL and GATEWAY_TOKEN
- Deploys to Cloudflare Pages

### Vercel Version:
- Uses direct Google API
- Requires only GOOGLE_API_KEY
- Deploys to Vercel
- Uses Vercel Edge Functions

---

## Cost Comparison

### Vercel:
- **Free tier:** 100 GB bandwidth, 100 GB-hours compute
- **Hobby plan:** Free
- **Pro plan:** $20/month (for teams)

### Google Gemini API:
- **Free tier:** 15 req/min, 1,500 req/day
- **Paid:** ~$0.0005 per generation

**Total for 100 users/day:** $0/month (within free limits)

---

## Troubleshooting

### Error: "API ключ не настроен"
**Solution:** Add GOOGLE_API_KEY in Vercel environment variables

### Error: "Контент заблокирован"
**Solution:** Use appropriate images, avoid content that triggers safety filters

### Error: "Изображения слишком большие"
**Solution:** Compress images to < 2MB before uploading

---

## Links

- **Main branch (Cloudflare):** https://github.com/HelenSolS/virtry/tree/main
- **Vercel branch:** https://github.com/HelenSolS/virtry/tree/vercel-deployment
- **Vercel Dashboard:** https://vercel.com/dashboard

---

**Version:** 1.0.0 (Vercel Edition)
**Status:** Ready to deploy
**Date:** 2026-02-04
