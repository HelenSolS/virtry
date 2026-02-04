import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { renderer } from './renderer'

type Bindings = {
  GOOGLE_API_KEY?: string
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for API routes
app.use('/api/*', cors())

app.use(renderer)

app.get('/', (c) => {
  return c.render(
    <div>
      <section id="hero" class="hero-section">
        <div class="hero-content">
          <video autoplay muted loop playsinline class="hero-video">
            <source src="/static/hero-video.mp4" type="video/mp4" />
          </video>
          <div class="hero-overlay">
            <h1 class="hero-title">Virtual Try-On</h1>
            <p class="hero-subtitle">Попробуйте любую одежду виртуально</p>
            <div class="scroll-indicator">
              <span>Прокрутите вниз</span>
              <div class="arrow-down"></div>
            </div>
          </div>
        </div>
      </section>

      <section id="tryon" class="tryon-section">
        <div class="container">
          <h2 class="section-title">Виртуальная примерочная</h2>
          <p class="section-description">
            Загрузите свое фото и фото одежды, которую хотите примерить
          </p>

          <div class="upload-container">
            <div class="upload-box">
              <div class="upload-area" id="photo-upload">
                <input type="file" id="photo-input" accept="image/*" style="display: none;" />
                <div class="upload-placeholder">
                  <svg class="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p>Ваше фото</p>
                  <span>Нажмите для загрузки</span>
                </div>
                <img id="photo-preview" class="image-preview" style="display: none;" />
              </div>
              <p class="upload-label">Фото человека</p>
            </div>

            <div class="plus-icon">+</div>

            <div class="upload-box">
              <div class="upload-area" id="outfit-upload">
                <input type="file" id="outfit-input" accept="image/*" style="display: none;" />
                <div class="upload-placeholder">
                  <svg class="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                  <p>Фото одежды</p>
                  <span>Нажмите для загрузки</span>
                </div>
                <img id="outfit-preview" class="image-preview" style="display: none;" />
              </div>
              <p class="upload-label">Одежда для примерки</p>
            </div>

            <div class="equals-icon">=</div>

            <div class="upload-box">
              <div class="result-area" id="result-area">
                <div class="result-placeholder">
                  <svg class="result-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                  </svg>
                  <p>Результат</p>
                  <span>Появится здесь</span>
                </div>
                <img id="result-preview" class="image-preview" style="display: none;" />
                <div id="loading-spinner" class="loading-spinner" style="display: none;">
                  <div class="spinner"></div>
                  <p>Обрабатываем изображения...</p>
                </div>
              </div>
              <p class="upload-label">Ваш новый образ</p>
            </div>
          </div>

          <button id="generate-btn" class="generate-btn" disabled>
            Создать образ
          </button>

          <div id="error-message" class="error-message" style="display: none;"></div>
        </div>
      </section>

      <script src="/static/app.js"></script>
    </div>
  )
})

// API endpoint for virtual try-on
app.post('/api/tryon', async (c) => {
  try {
    const formData = await c.req.formData()
    const photoFile = formData.get('photo') as File
    const outfitFile = formData.get('outfit') as File

    if (!photoFile || !outfitFile) {
      return c.json({ error: 'Both images are required' }, 400)
    }

    // Check if API key is configured
    const apiKey = c.env.GOOGLE_API_KEY
    if (!apiKey) {
      return c.json({ 
        error: 'API key not configured. Please set GOOGLE_API_KEY in your environment variables.' 
      }, 500)
    }

    // Convert files to base64 (proper way for Workers)
    const photoBuffer = await photoFile.arrayBuffer()
    const outfitBuffer = await outfitFile.arrayBuffer()
    
    // Helper function to convert ArrayBuffer to base64
    const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
      const bytes = new Uint8Array(buffer)
      let binary = ''
      const chunkSize = 0x8000 // 32KB chunks to avoid stack overflow
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length))
        binary += String.fromCharCode.apply(null, Array.from(chunk))
      }
      return btoa(binary)
    }
    
    const photoBase64 = arrayBufferToBase64(photoBuffer)
    const outfitBase64 = arrayBufferToBase64(outfitBuffer)

    // Import Google AI SDK
    const { google } = await import('@ai-sdk/google')
    const { generateImage } = await import('ai')

    // First, describe the outfit from photo B
    const describePrompt = `Photo B shows clothing/outfit. Describe it in JSON format with these fields:
{
  "garment_type": "type of clothing",
  "style": "style description",
  "colors": ["dominant colors"],
  "patterns": "patterns or prints",
  "details": "notable details"
}`

    // Step 1: Describe the outfit
    const descriptionResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: describePrompt },
              { 
                inlineData: { 
                  mimeType: outfitFile.type,
                  data: outfitBase64 
                } 
              }
            ]
          }]
        })
      }
    )

    const descriptionData = await descriptionResponse.json()
    const outfitDescription = descriptionData.candidates?.[0]?.content?.parts?.[0]?.text || 'casual outfit'

    // Step 2: Generate the try-on image with detailed prompt
    const tryonPrompt = `PHOTO A: Person in their original photo
PHOTO B: Outfit/clothing to apply

TASK: Take the outfit from PHOTO B and apply it to the person in PHOTO A.

REQUIREMENTS:
- Keep the person's face, body type, pose, and background from PHOTO A EXACTLY the same
- Only change the clothing to match PHOTO B
- Make it look natural and realistic
- Maintain consistent lighting and shadows
- Preserve all body proportions

OUTFIT DESCRIPTION from PHOTO B:
${outfitDescription}

Generate a photorealistic image showing the person from PHOTO A wearing the outfit from PHOTO B.`

    const imageResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: tryonPrompt },
              { 
                inlineData: { 
                  mimeType: photoFile.type,
                  data: photoBase64 
                } 
              },
              { 
                inlineData: { 
                  mimeType: outfitFile.type,
                  data: outfitBase64 
                } 
              }
            ]
          }],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 4096
          }
        })
      }
    )

    const imageData = await imageResponse.json()
    
    // Extract generated image
    if (imageData.candidates && imageData.candidates[0]?.content?.parts) {
      const parts = imageData.candidates[0].content.parts
      for (const part of parts) {
        if (part.inlineData) {
          return c.json({
            success: true,
            image: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
          })
        }
      }
    }

    return c.json({ error: 'Failed to generate image', details: imageData }, 500)

  } catch (error: any) {
    console.error('Try-on error:', error)
    return c.json({ 
      error: 'Failed to process images', 
      details: error.message 
    }, 500)
  }
})

export default app
