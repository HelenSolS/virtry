// Vercel Edge Function for Outfit Description
// Using CHEAP text model (Gemini 1.5 Flash) for cost optimization

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
    const outfitFile = formData.get('outfit');

    if (!outfitFile) {
      return new Response(
        JSON.stringify({ error: 'Требуется изображение одежды' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get Gateway credentials from environment
    // DESCRIBE_GATEWAY_URL points to CHEAP text model (Gemini 1.5 Flash)
    const gatewayUrl = process.env.DESCRIBE_GATEWAY_URL || process.env.GATEWAY_URL;
    const gatewayToken = process.env.GATEWAY_TOKEN;
    
    if (!gatewayUrl || !gatewayToken) {
      return new Response(
        JSON.stringify({ 
          error: 'Gateway не настроен',
          message: 'Установите DESCRIBE_GATEWAY_URL и GATEWAY_TOKEN в переменных окружения.' 
        }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Convert file to base64
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

    const outfitBase64 = await fileToBase64(outfitFile);

    console.log('[DESCRIBE] Using cheap text model for outfit analysis');

    // Optimized prompt for text model
    const describePrompt = `Analyze this clothing image and provide a detailed JSON description.

Return ONLY valid JSON in this exact format:
{
  "garment_type": "type of clothing (e.g., dress, shirt, pants, jacket)",
  "color": "primary color(s)",
  "style": "style description (e.g., casual, formal, sporty, elegant)",
  "fit": "fit type (e.g., slim, loose, fitted, oversized)",
  "details": "notable features (e.g., buttons, patterns, sleeves, collar)"
}

Be concise but accurate. This description will be used for virtual try-on generation.`;

    const describeResponse = await fetch(gatewayUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${gatewayToken}`,
        'X-Cost-Optimization': 'describe-only' // Custom header for monitoring
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
          temperature: 0.2, // Lower temperature for consistent descriptions
          topK: 20,
          topP: 0.8,
          maxOutputTokens: 200 // Limit tokens for cost optimization
        }
      })
    });

    if (!describeResponse.ok) {
      const errorData = await describeResponse.json();
      console.error('[DESCRIBE] Error:', errorData);
      return new Response(
        JSON.stringify({ 
          error: 'Ошибка анализа одежды', 
          message: 'Не удалось описать одежду. Попробуйте другое изображение.',
          details: errorData 
        }), 
        { 
          status: describeResponse.status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const describeData = await describeResponse.json();
    
    // Extract outfit description
    let outfitDescription = null;
    try {
      if (describeData.candidates && describeData.candidates[0]?.content?.parts) {
        const textPart = describeData.candidates[0].content.parts.find((p) => p.text);
        if (textPart && textPart.text) {
          // Try to extract JSON
          const jsonMatch = textPart.text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            outfitDescription = JSON.parse(jsonMatch[0]);
            console.log('[DESCRIBE] Success:', outfitDescription);
          } else {
            console.warn('[DESCRIBE] No JSON found, using text as-is');
            // Fallback: create simple description
            outfitDescription = {
              garment_type: "clothing",
              color: "unknown",
              style: textPart.text.substring(0, 100),
              fit: "regular",
              details: "See style field"
            };
          }
        }
      }
    } catch (e) {
      console.warn('[DESCRIBE] Parse error:', e);
      // Fallback description
      outfitDescription = {
        garment_type: "clothing",
        color: "unknown",
        style: "casual",
        fit: "regular",
        details: "Unable to parse detailed description"
      };
    }

    // Return description with metadata
    return new Response(
      JSON.stringify({
        success: true,
        description: outfitDescription,
        metadata: {
          model: 'gemini-1.5-flash', // Cheap text model
          cost_tier: 'low',
          cached: false, // Will be true if cached by Gateway
          timestamp: new Date().toISOString()
        }
      }), 
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'X-Cost-Tier': 'low',
          'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
        }
      }
    );

  } catch (error) {
    console.error('[DESCRIBE] Error:', error);
    
    let userMessage = 'Произошла ошибка при анализе одежды. Попробуйте позже.';
    
    if (error.message?.includes('fetch')) {
      userMessage = 'Не удалось подключиться к сервису AI. Проверьте подключение.';
    } else if (error.message?.includes('timeout')) {
      userMessage = 'Превышено время ожидания. Попробуйте уменьшить размер изображения.';
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Ошибка анализа',
        message: userMessage,
        details: error.message
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
