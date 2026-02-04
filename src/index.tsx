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

// API endpoint for virtual try-on with Gemini 2.5 Flash IMAGE (Nano Banana)
app.post('/api/tryon', async (c) => {
  try {
    const formData = await c.req.formData()
    const photoFile = formData.get('photo') as File
    const outfitFile = formData.get('outfit') as File

    if (!photoFile || !outfitFile) {
      return c.json({ error: 'Требуются оба изображения' }, 400)
    }

    // Check if API key is configured
    const apiKey = c.env.GOOGLE_API_KEY
    if (!apiKey) {
      return c.json({ 
        error: 'API ключ не настроен. Установите GOOGLE_API_KEY в переменных окружения.' 
      }, 500)
    }

    // Convert files to base64 - simple approach for Gemini API
    const fileToBase64 = async (file: File): Promise<string> => {
      const arrayBuffer = await file.arrayBuffer()
      const bytes = new Uint8Array(arrayBuffer)
      // Use reduce to avoid stack overflow
      const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '')
      return btoa(binary)
    }

    const photoBase64 = await fileToBase64(photoFile)
    const outfitBase64 = await fileToBase64(outfitFile)

    // Use Gemini 2.5 Flash IMAGE for virtual try-on
    // This is image-to-image generation model
    const prompt = `Virtual try-on task:

IMAGE 1 (Person): Shows a person in their current clothing
IMAGE 2 (Outfit): Shows the clothing/outfit to apply

TASK: Apply the outfit from IMAGE 2 onto the person from IMAGE 1.

REQUIREMENTS:
- Keep the person's face, body shape, pose, and background EXACTLY the same
- Only change the clothing to match IMAGE 2
- Make it look natural and realistic
- Maintain consistent lighting and shadows
- Preserve all body proportions
- Ensure the outfit fits the person's body naturally

Generate a photorealistic image showing the person wearing the new outfit.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
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
            responseModalities: ['IMAGE'],
            temperature: 0.4
          }
        })
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      return c.json({ 
        error: 'Ошибка Gemini API', 
        details: errorData 
      }, response.status)
    }

    const data = await response.json()

    // Extract generated image from response
    if (data.candidates && data.candidates[0]?.content?.parts) {
      for (const part of data.candidates[0].content.parts) {
        if (part.inlineData) {
          return c.json({
            success: true,
            image: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
          })
        }
      }
    }

    return c.json({ 
      error: 'Не удалось получить результат',
      details: data 
    }, 500)

  } catch (error: any) {
    console.error('Try-on error:', error)
    return c.json({ 
      error: 'Ошибка обработки изображений', 
      details: error.message 
    }, 500)
  }
})

export default app
