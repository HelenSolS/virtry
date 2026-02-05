import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { renderer } from './renderer'

type Bindings = {
  GATEWAY_URL?: string
  GATEWAY_TOKEN?: string
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

// API endpoint for virtual try-on via Cloudflare AI Gateway
app.post('/api/tryon', async (c) => {
  try {
    const formData = await c.req.formData()
    const photoFile = formData.get('photo') as File
    const outfitFile = formData.get('outfit') as File

    if (!photoFile || !outfitFile) {
      return c.json({ error: 'Требуются оба изображения' }, 400)
    }

    // Check if Gateway is configured
    const gatewayUrl = c.env.GATEWAY_URL
    const gatewayToken = c.env.GATEWAY_TOKEN
    
    if (!gatewayUrl || !gatewayToken) {
      return c.json({ 
        error: 'Gateway не настроен',
        message: 'Установите GATEWAY_URL и GATEWAY_TOKEN в переменных окружения.' 
      }, 500)
    }

    // Convert files to base64
    const fileToBase64 = async (file: File): Promise<string> => {
      const arrayBuffer = await file.arrayBuffer()
      const bytes = new Uint8Array(arrayBuffer)
      
      // Convert to string in chunks to avoid stack overflow
      let binary = ''
      const chunkSize = 8192 // 8KB chunks
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, Math.min(i + chunkSize, bytes.length))
        binary += String.fromCharCode(...chunk)
      }
      
      return btoa(binary)
    }

    const photoBase64 = await fileToBase64(photoFile)
    const outfitBase64 = await fileToBase64(outfitFile)

    // ========================================
    // STEP 1: Get JSON description of outfit (PHOTO B)
    // ========================================
    console.log('Step 1: Describing outfit from PHOTO B...')
    
    const describePrompt = `Analyze this clothing image and provide a detailed JSON description.

Return ONLY valid JSON in this exact format:
{
  "garment_type": "type of clothing (e.g., dress, shirt, pants, jacket)",
  "color": "primary color(s)",
  "style": "style description (e.g., casual, formal, sporty, elegant)",
  "fit": "fit type (e.g., slim, loose, fitted, oversized)",
  "details": "notable features (e.g., buttons, patterns, sleeves, collar)"
}`

    const describeResponse = await fetch(gatewayUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${gatewayToken}`
      },
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
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 32,
          topP: 1
        }
      })
    })

    if (!describeResponse.ok) {
      const errorData = await describeResponse.json()
      console.error('Step 1 error:', errorData)
      return c.json({ 
        error: 'Ошибка Gateway (описание одежды)', 
        message: 'Не удалось описать одежду. Попробуйте другое изображение.',
        details: errorData 
      }, describeResponse.status)
    }

    const describeData = await describeResponse.json()
    
    // Extract outfit description
    let outfitDescription = '{"garment_type": "casual outfit", "color": "unknown", "style": "casual", "fit": "regular", "details": "none"}'
    try {
      if (describeData.candidates && describeData.candidates[0]?.content?.parts) {
        const textPart = describeData.candidates[0].content.parts.find((p: any) => p.text)
        if (textPart && textPart.text) {
          // Try to extract JSON
          const jsonMatch = textPart.text.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            outfitDescription = jsonMatch[0]
            console.log('Extracted outfit description:', outfitDescription)
          } else {
            console.warn('No JSON found in response, using text as-is')
            outfitDescription = textPart.text
          }
        }
      }
    } catch (e) {
      console.warn('Could not parse outfit description:', e)
    }

    // ========================================
    // STEP 2: Generate try-on image with description
    // ========================================
    console.log('Step 2: Generating virtual try-on image...')
    
    const tryonPrompt = `Virtual try-on task:

PHOTO A (Person): The person who will try on the outfit.
PHOTO B (Outfit): The target clothing to apply.

OUTFIT DESCRIPTION from PHOTO B:
${outfitDescription}

TASK: Apply the outfit from PHOTO B onto the person from PHOTO A.

REQUIREMENTS:
- Keep the person's face, body shape, pose, and background EXACTLY the same
- Only change the clothing to match PHOTO B and its description
- Use the outfit description to ensure accuracy of garment type, color, style, fit, and details
- Make it look natural and realistic
- Maintain consistent lighting and shadows
- Preserve all body proportions
- Ensure the outfit fits the person's body naturally

Generate a photorealistic image showing the person wearing the new outfit.`

    const tryonResponse = await fetch(gatewayUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${gatewayToken}`
      },
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
          responseModalities: ['IMAGE'],
          temperature: 0.4,
          topK: 32,
          topP: 1
        }
      })
    })

    if (!tryonResponse.ok) {
      const errorData = await tryonResponse.json()
      console.error('Step 2 error:', errorData)
      return c.json({ 
        error: 'Ошибка Gateway (генерация изображения)', 
        message: 'Не удалось сгенерировать результат. Попробуйте позже.',
        details: errorData 
      }, tryonResponse.status)
    }

    const data = await tryonResponse.json()

    // Check for common API errors
    if (data.error) {
      console.error('Gemini API error:', data.error)
      return c.json({ 
        error: 'Ошибка API генерации изображений',
        message: 'Сервис временно недоступен. Попробуйте позже.',
        details: data.error 
      }, 500)
    }

    // Check if response contains safety filters or blocked content
    if (data.candidates && data.candidates[0]?.finishReason) {
      const reason = data.candidates[0].finishReason
      if (reason === 'SAFETY' || reason === 'BLOCKED_REASON') {
        return c.json({ 
          error: 'Контент заблокирован',
          message: 'Изображения не прошли проверку безопасности. Попробуйте другие фото.',
          finishReason: reason
        }, 400)
      }
    }

    // Extract generated image from response
    if (data.candidates && data.candidates[0]?.content?.parts) {
      for (const part of data.candidates[0].content.parts) {
        if (part.inlineData) {
          const generatedImage = part.inlineData.data
          
          // Check if generated image is suspiciously similar to input
          const inputPhotoHash = photoBase64.substring(0, 100)
          const outputHash = generatedImage.substring(0, 100)
          
          if (inputPhotoHash === outputHash) {
            return c.json({
              error: 'Результат идентичен входному изображению',
              message: 'AI не смог обработать изображения корректно. Попробуйте другие фото или повторите позже.',
              warning: 'same_as_input'
            }, 400)
          }
          
          return c.json({
            success: true,
            image: `data:${part.inlineData.mimeType};base64,${generatedImage}`,
            outfitDescription: outfitDescription
          })
        }
      }
    }

    // No image in response
    return c.json({ 
      error: 'Не удалось получить результат',
      message: 'Сервис не вернул изображение. Попробуйте позже.',
      details: data 
    }, 500)

  } catch (error: any) {
    console.error('Try-on error:', error)
    
    // Provide user-friendly error messages
    let userMessage = 'Произошла ошибка при обработке изображений. Попробуйте позже.'
    
    if (error.message?.includes('fetch')) {
      userMessage = 'Не удалось подключиться к сервису AI. Проверьте подключение.'
    } else if (error.message?.includes('timeout')) {
      userMessage = 'Превышено время ожидания. Попробуйте уменьшить размер изображений.'
    } else if (error.message?.includes('stack')) {
      userMessage = 'Изображения слишком большие. Попробуйте меньшего размера (до 2MB).'
    }
    
    return c.json({ 
      error: 'Ошибка обработки',
      message: userMessage,
      details: error.message,
      support: 'Если проблема повторяется, попробуйте другие изображения или обратитесь к администратору.'
    }, 500)
  }
})

export default app
