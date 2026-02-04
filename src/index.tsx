import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { renderer } from './renderer'

type Bindings = {
  REPLICATE_API_TOKEN?: string
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

// API endpoint for virtual try-on with Replicate IDM-VTON
app.post('/api/tryon', async (c) => {
  try {
    const formData = await c.req.formData()
    const photoFile = formData.get('photo') as File
    const outfitFile = formData.get('outfit') as File

    if (!photoFile || !outfitFile) {
      return c.json({ error: 'Требуются оба изображения' }, 400)
    }

    // Check if API key is configured
    const apiToken = c.env.REPLICATE_API_TOKEN
    if (!apiToken) {
      return c.json({ 
        error: 'API ключ не настроен. Установите REPLICATE_API_TOKEN в переменных окружения.' 
      }, 500)
    }

    // Convert files to base64 data URLs for Replicate
    const fileToDataURL = async (file: File): Promise<string> => {
      const arrayBuffer = await file.arrayBuffer()
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
        )
      )
      return `data:${file.type};base64,${base64}`
    }

    const photoDataURL = await fileToDataURL(photoFile)
    const outfitDataURL = await fileToDataURL(outfitFile)

    // Create prediction with Replicate IDM-VTON model
    const predictionResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait'
      },
      body: JSON.stringify({
        version: 'c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4',
        input: {
          garm_img: outfitDataURL,
          vton_img: photoDataURL,
          n_samples: 1,
          n_steps: 20,
          image_scale: 768,
          seed: -1
        }
      })
    })

    if (!predictionResponse.ok) {
      const errorData = await predictionResponse.json()
      return c.json({ 
        error: 'Ошибка Replicate API', 
        details: errorData 
      }, predictionResponse.status)
    }

    const prediction = await predictionResponse.json()

    // Wait for prediction to complete (with timeout)
    let result = prediction
    let attempts = 0
    const maxAttempts = 60 // 60 seconds timeout

    while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const statusResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${result.id}`,
        {
          headers: {
            'Authorization': `Bearer ${apiToken}`,
          }
        }
      )

      if (!statusResponse.ok) {
        return c.json({ error: 'Не удалось получить статус' }, 500)
      }

      result = await statusResponse.json()
      attempts++
    }

    if (result.status === 'failed') {
      return c.json({ 
        error: 'Генерация не удалась', 
        details: result.error 
      }, 500)
    }

    if (result.status !== 'succeeded') {
      return c.json({ 
        error: 'Превышено время ожидания' 
      }, 504)
    }

    // Return the generated image URL
    if (result.output && result.output.length > 0) {
      return c.json({
        success: true,
        image: result.output[0]
      })
    }

    return c.json({ 
      error: 'Не удалось получить результат',
      details: result 
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
