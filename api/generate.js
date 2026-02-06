// Vercel Edge Function for Virtual Try-On Generation
// Using EXPENSIVE image model (Gemini 2.5 Flash IMAGE) only for final generation

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Метод не поддерживается' }), 
      { 
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const formData = await request.formData();
    const photoFile = formData.get('photo');
    const outfitFile = formData.get('outfit');
    const descriptionJson = formData.get('description'); // Pre-computed from /api/describe

    if (!photoFile || !outfitFile) {
      return new Response(
        JSON.stringify({ error: 'Требуются оба изображения' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse description (from /api/describe or fallback)
    let outfitDescription;
    try {
      outfitDescription = descriptionJson ? JSON.parse(descriptionJson) : null;
    } catch (e) {
      console.warn('[GENERATE] Invalid description JSON, will use fallback');
      outfitDescription = null;
    }

    // Check if we should use direct API or Gateway
    const useDirectAPI = process.env.USE_DIRECT_API === 'true';
    const googleApiKey = process.env.GOOGLE_API_KEY;
    const gatewayUrl = process.env.GENERATE_GATEWAY_URL || process.env.GATEWAY_URL;
    const gatewayToken = process.env.GATEWAY_TOKEN;
    
    let apiUrl, headers;
    
    if (useDirectAPI) {
      // Use direct Google API
      if (!googleApiKey) {
        return new Response(
          JSON.stringify({ 
            error: 'API не настроен',
            message: 'Установите GOOGLE_API_KEY в переменных окружения.' 
          }), 
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${googleApiKey}`;
      headers = {
        'Content-Type': 'application/json'
      };
      console.log('[GENERATE] Using DIRECT Google API (no Gateway)');
    } else {
      // Use Cloudflare Gateway
      if (!gatewayUrl || !gatewayToken) {
        return new Response(
          JSON.stringify({ 
            error: 'Gateway не настроен',
            message: 'Установите GENERATE_GATEWAY_URL и GATEWAY_TOKEN в переменных окружения.' 
          }), 
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      apiUrl = gatewayUrl;
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${gatewayToken}`,
        'X-Cost-Optimization': 'generate-only'
      };
      console.log('[GENERATE] Using Cloudflare Gateway');
    }

    // Convert files to base64
    const fileToBase64 = async (file) => {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      // Convert to string in chunks to avoid stack overflow
      let binary = '';
      const chunkSize = 8192; // 8KB chunks
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, Math.min(i + chunkSize, bytes.length));
        binary += String.fromCharCode(...chunk);
      }
      
      return btoa(binary);
    };

    const photoBase64 = await fileToBase64(photoFile);
    const outfitBase64 = await fileToBase64(outfitFile);

    console.log('[GENERATE] Using expensive image model for try-on generation');

    // Build prompt with pre-computed description
    const descriptionText = outfitDescription 
      ? JSON.stringify(outfitDescription, null, 2)
      : '{"garment_type": "clothing", "color": "unknown", "style": "casual", "fit": "regular", "details": "none"}';

    const tryonPrompt = `Virtual try-on task:

PHOTO A (Person): The person who will try on the outfit.
PHOTO B (Outfit): The target clothing to apply.

OUTFIT DESCRIPTION from PHOTO B (pre-analyzed):
${descriptionText}

TASK: Apply the outfit from PHOTO B onto the person from PHOTO A.

REQUIREMENTS:
- Keep the person's face, body shape, pose, and background EXACTLY the same
- Only change the clothing to match PHOTO B and its description
- Use the outfit description to ensure accuracy of garment type, color, style, fit, and details
- Make it look natural and realistic
- Maintain consistent lighting and shadows
- Preserve all body proportions
- Ensure the outfit fits the person's body naturally

Generate a photorealistic image showing the person wearing the new outfit.`;

    const tryonResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
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
    });

    if (!tryonResponse.ok) {
      const errorData = await tryonResponse.json();
      console.error('[GENERATE] Error:', errorData);
      return new Response(
        JSON.stringify({ 
          error: 'Ошибка генерации', 
          message: 'Не удалось сгенерировать результат. Попробуйте позже.',
          details: errorData 
        }), 
        { 
          status: tryonResponse.status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await tryonResponse.json();

    // Check for common API errors
    if (data.error) {
      console.error('[GENERATE] Gemini API error:', data.error);
      return new Response(
        JSON.stringify({ 
          error: 'Ошибка API генерации изображений',
          message: 'Сервис временно недоступен. Попробуйте позже.',
          details: data.error 
        }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if response contains safety filters or blocked content
    if (data.candidates && data.candidates[0]?.finishReason) {
      const reason = data.candidates[0].finishReason;
      if (reason === 'SAFETY' || reason === 'BLOCKED_REASON') {
        return new Response(
          JSON.stringify({ 
            error: 'Контент заблокирован',
            message: 'Изображения не прошли проверку безопасности. Попробуйте другие фото.',
            finishReason: reason
          }), 
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Extract generated image from response
    if (data.candidates && data.candidates[0]?.content?.parts) {
      for (const part of data.candidates[0].content.parts) {
        if (part.inlineData) {
          const generatedImage = part.inlineData.data;
          
          // Check if generated image is suspiciously similar to input
          const inputPhotoHash = photoBase64.substring(0, 100);
          const outputHash = generatedImage.substring(0, 100);
          
          if (inputPhotoHash === outputHash) {
            return new Response(
              JSON.stringify({
                error: 'Результат идентичен входному изображению',
                message: 'AI не смог обработать изображения корректно. Попробуйте другие фото или повторите позже.',
                warning: 'same_as_input'
              }), 
              { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          }
          
          console.log('[GENERATE] Success!');
          
          return new Response(
            JSON.stringify({
              success: true,
              image: `data:${part.inlineData.mimeType};base64,${generatedImage}`,
              metadata: {
                model: 'gemini-2.5-flash-image',
                cost_tier: 'high',
                used_description: outfitDescription !== null,
                timestamp: new Date().toISOString()
              }
            }), 
            { 
              status: 200,
              headers: { 
                'Content-Type': 'application/json',
                'X-Cost-Tier': 'high'
              }
            }
          );
        }
      }
    }

    // No image in response
    return new Response(
      JSON.stringify({ 
        error: 'Не удалось получить результат',
        message: 'Сервис не вернул изображение. Попробуйте позже.',
        details: data 
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[GENERATE] Error:', error);
    
    let userMessage = 'Произошла ошибка при генерации изображения. Попробуйте позже.';
    
    if (error.message?.includes('fetch')) {
      userMessage = 'Не удалось подключиться к сервису AI. Проверьте подключение.';
    } else if (error.message?.includes('timeout')) {
      userMessage = 'Превышено время ожидания. Попробуйте уменьшить размер изображений.';
    } else if (error.message?.includes('stack')) {
      userMessage = 'Изображения слишком большие. Попробуйте меньшего размера (до 2MB).';
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Ошибка генерации',
        message: userMessage,
        details: error.message,
        support: 'Если проблема повторяется, попробуйте другие изображения или обратитесь к администратору.'
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
