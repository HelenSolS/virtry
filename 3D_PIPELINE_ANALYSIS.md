# 🎨 3D Pipeline: Техническая спецификация и анализ реализуемости

## 📋 Краткое резюме

**Цель**: Интеграция 3D-пайплайна для создания 3D-моделей одежды из текстовых промптов  
**Текущий статус**: Virtual Try-On работает на Vercel Edge Functions + Cloudflare AI Gateway  
**Новая функция**: Text → 2D Image (Fal.ai) → 3D Model (Tripo3D via Fal.ai)

---

## 🎯 Что мы получим

### Пользовательский сценарий:
1. **Пользователь вводит**: "low-poly climbing block for a Roblox parkour game"
2. **Система генерирует**:
   - Оптимизированный промпт (Gemini)
   - 2D изображение модели (Fal.ai / Flux 4.0)
   - 3D модель в формате .glb (Tripo3D через Fal.ai)
   - Preview картинку 3D модели
3. **Пользователь получает**:
   - Интерактивный 3D-вьюер (вращение, масштабирование)
   - Кнопку скачать .glb для Roblox/Unity
   - URL для шеринга

---

## 🏗️ Архитектура интеграции

### Текущая архитектура (Virtual Try-On)
```
Client → /api/describe (Gemini 1.5 Flash) → JSON description
      → /api/generate (Gemini 2.5 Flash IMAGE) → Try-on result
```

### Новая 3D-архитектура (добавляется параллельно)
```
Client → /api/generate-3d-prompt (Gemini 1.5 Flash) → Optimized prompt
      → /api/generate-3d-image (Fal.ai Flux 4.0) → 2D image URL
      → /api/generate-3d-model (Fal.ai → Tripo3D) → .glb URL + preview
      → Client (Three.js viewer) → Interactive 3D view
```

### Полная схема
```
┌─────────────────────────────────────────────────────────────┐
│                      WEBAPP UI (Client)                      │
│  ┌─────────────────┐              ┌─────────────────┐       │
│  │  Virtual Try-On │              │   3D Generator  │       │
│  │   (существует)  │              │     (новое)     │       │
│  └─────────────────┘              └─────────────────┘       │
└─────────────────────────────────────────────────────────────┘
           │                                │
           ▼                                ▼
┌─────────────────────┐          ┌─────────────────────┐
│   /api/describe     │          │ /api/generate-3d    │
│   /api/generate     │          │   -prompt           │
│                     │          │   -image            │
│  (Cloudflare        │          │   -model            │
│   AI Gateway)       │          │                     │
│                     │          │  (Fal.ai API)       │
└─────────────────────┘          └─────────────────────┘
           │                                │
           ▼                                ▼
┌─────────────────────┐          ┌─────────────────────┐
│  Gemini 1.5 Flash   │          │   Fal.ai / Flux     │
│  Gemini 2.5 Flash   │          │   Fal.ai / Tripo3D  │
│       IMAGE         │          │                     │
└─────────────────────┘          └─────────────────────┘
```

---

## 🔧 Технические детали пайплайна

### Шаг 1: Оптимизация промпта (Optional, но рекомендуется)
**Эндпоинт**: `POST /api/generate-3d-prompt`  
**Модель**: Gemini 1.5 Flash (через Cloudflare Gateway)  
**Вход**:
```json
{
  "prompt": "low-poly climbing block for a Roblox parkour game"
}
```

**Промпт для Gemini**:
```
You are a 3D modeling prompt engineer. Optimize the following user input for 3D generation:

USER INPUT: {user_prompt}

Create a detailed, structured prompt that includes:
1. Object type and purpose
2. Style (low-poly, realistic, cartoon, etc.)
3. Materials and textures
4. Color palette
5. Key geometric features
6. Scale and proportions
7. Level of detail
8. Intended use case (Roblox, Unity, etc.)

Return ONLY the optimized prompt text, no explanations.
```

**Выход**:
```json
{
  "original_prompt": "low-poly climbing block...",
  "optimized_prompt": "Low-poly climbing block asset for Roblox parkour game: cubic base shape with rounded edges, bright blue and orange color scheme, simple geometric grip textures, approximately 2x2x2 meter scale, minimal triangle count (under 1000 polys), PBR-ready materials, game-ready topology, suitable for real-time rendering in Roblox engine",
  "cost": "$0.000105"
}
```

**Стоимость**: $0.000105 / запрос (как /api/describe)

---

### Шаг 2: Генерация 2D изображения
**Эндпоинт**: `POST /api/generate-3d-image`  
**Сервис**: Fal.ai (Flux 4.0 или аналог)  
**Вход**:
```json
{
  "prompt": "Low-poly climbing block asset...",
  "image_size": "1024x1024",
  "num_images": 1
}
```

**API запрос к Fal.ai** (через Vercel Edge Function):
```javascript
// api/generate-3d-image.js
const response = await fetch('https://fal.run/fal-ai/flux/dev', {
  method: 'POST',
  headers: {
    'Authorization': `Key ${process.env.FAL_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: optimizedPrompt,
    image_size: 'square_hd',  // 1024x1024
    num_inference_steps: 28,
    guidance_scale: 3.5,
    num_images: 1,
    enable_safety_checker: true,
    output_format: 'jpeg'
  })
});

const data = await response.json();
// Fal.ai возвращает request_id для polling
```

**Polling для получения результата**:
```javascript
// Опрашиваем статус задачи каждые 2 секунды
let status = 'IN_QUEUE';
while (status !== 'COMPLETED') {
  const statusResponse = await fetch(`https://fal.run/fal-ai/flux/dev/requests/${request_id}/status`, {
    headers: { 'Authorization': `Key ${process.env.FAL_API_KEY}` }
  });
  const statusData = await statusResponse.json();
  status = statusData.status;
  
  if (status === 'COMPLETED') {
    return statusData.images[0].url;  // URL изображения
  }
  
  await new Promise(resolve => setTimeout(resolve, 2000));
}
```

**Выход**:
```json
{
  "image_url": "https://fal.media/files/lion/xyz123.jpg",
  "width": 1024,
  "height": 1024,
  "cost": "$0.025"
}
```

**Стоимость**: ~$0.025 / изображение (зависит от модели)

---

### Шаг 3: Генерация 3D модели
**Эндпоинт**: `POST /api/generate-3d-model`  
**Сервис**: Tripo3D через Fal.ai  
**Вход**:
```json
{
  "image_url": "https://fal.media/files/lion/xyz123.jpg"
}
```

**API запрос к Fal.ai (Tripo3D)**:
```javascript
// api/generate-3d-model.js
const response = await fetch('https://fal.run/fal-ai/tripo3d/image-to-3d', {
  method: 'POST',
  headers: {
    'Authorization': `Key ${process.env.FAL_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    image_url: imageUrl,
    model_format: 'glb',  // или 'obj', 'fbx', 'usd'
    face_limit: 10000,    // Количество треугольников (10k для low-poly)
    texture_resolution: 1024
  })
});

const data = await response.json();
// Polling аналогично шагу 2
```

**Выход**:
```json
{
  "model_url": "https://fal.media/files/3d-models/abc456.glb",
  "preview_url": "https://fal.media/files/previews/abc456.jpg",
  "face_count": 8542,
  "file_size_mb": 2.3,
  "cost": "$0.375"
}
```

**Стоимость**: ~$0.375 / 3D модель

---

## 💰 Расчет затрат

### Стоимость одного 3D-поколения

| Шаг | Сервис | Модель | Стоимость |
|-----|--------|--------|-----------|
| 1. Оптимизация промпта | Cloudflare → Gemini | Gemini 1.5 Flash | $0.000105 |
| 2. Генерация 2D изображения | Fal.ai | Flux 4.0 | $0.025 |
| 3. Генерация 3D модели | Fal.ai → Tripo3D | Tripo3D | $0.375 |
| **ИТОГО** | | | **$0.400** |

### Сравнение со стоимостью Virtual Try-On

| Функция | Стоимость 1 использования | Примечание |
|---------|---------------------------|------------|
| **Virtual Try-On** | $0.002 | Два вызова Gemini |
| **3D Generation** | $0.400 | Полный 3D пайплайн |
| **Разница** | **200x дороже** | 3D значительно дороже |

### Сценарии использования и затраты

#### Сценарий 1: MVP (10 3D-моделей/день)
```
Месячные затраты:
- Virtual Try-On: 100 пользователей/день × $0.002 = $6/мес
- 3D Generation: 10 моделей/день × $0.40 × 30 = $120/мес
- ИТОГО: $126/мес
```

#### Сценарий 2: Малый бизнес (50 3D-моделей/день)
```
Месячные затраты:
- Virtual Try-On: 500 пользователей/день × $0.002 × 30 = $30/мес
- 3D Generation: 50 моделей/день × $0.40 × 30 = $600/мес
- ИТОГО: $630/мес
```

#### Сценарий 3: Средний бизнес (200 3D-моделей/день)
```
Месячные затраты:
- Virtual Try-On: 2000 пользователей/день × $0.002 × 30 = $120/мес
- 3D Generation: 200 моделей/день × $0.40 × 30 = $2,400/мес
- ИТОГО: $2,520/мес
```

### 💡 Важные выводы по затратам

1. **3D-генерация в 200 раз дороже Virtual Try-On**
2. **Рекомендуется**: 
   - Добавить платную подписку для 3D-функции
   - Ограничить бесплатные 3D-генерации (например, 3/месяц)
   - Внедрить систему кредитов/токенов

---

## 🎮 Frontend: 3D-вьюер (Three.js)

### Добавление Three.js в проект

**В `public/index.html`** добавить:
```html
<!-- Three.js для 3D-вьюера -->
<script src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.160.0/examples/js/loaders/GLTFLoader.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.160.0/examples/js/controls/OrbitControls.js"></script>
```

### UI для 3D-генерации

**В `public/index.html`** добавить секцию:
```html
<!-- 3D Generator Section -->
<section class="section-3d-generator">
  <div class="container">
    <h2 class="section-title">
      <i class="fas fa-cube mr-2"></i>
      3D Model Generator
    </h2>
    <p class="section-description">
      Создайте 3D-модель одежды из текстового описания
    </p>

    <div class="prompt-container">
      <textarea 
        id="model-prompt" 
        placeholder="Опишите 3D-модель (например: low-poly climbing block for Roblox)"
        rows="4"
      ></textarea>
      <button id="generate-3d-btn" class="generate-btn">
        <i class="fas fa-magic mr-2"></i>
        Создать 3D-модель
      </button>
      <div class="cost-estimate">
        Стоимость: ~$0.40 за генерацию
      </div>
    </div>

    <div id="3d-progress" class="progress-container" style="display:none;">
      <div class="progress-step">
        <div class="spinner"></div>
        <span id="step-text">Оптимизация промпта...</span>
      </div>
    </div>

    <div id="3d-viewer-container" style="display:none;">
      <canvas id="3d-canvas"></canvas>
      <div class="viewer-controls">
        <button id="download-glb-btn">
          <i class="fas fa-download mr-2"></i>
          Скачать .glb
        </button>
        <button id="share-3d-btn">
          <i class="fas fa-share-alt mr-2"></i>
          Поделиться
        </button>
      </div>
    </div>
  </div>
</section>
```

### JavaScript для 3D-вьюера

**В `public/static/app.js`** добавить:
```javascript
// === 3D GENERATOR FUNCTIONALITY ===
let scene, camera, renderer, controls, currentModel;

function init3DViewer() {
  const canvas = document.getElementById('3d-canvas');
  const container = document.getElementById('3d-viewer-container');
  
  // Scene setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);
  
  // Camera setup
  camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, 1, 3);
  
  // Renderer setup
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  
  // Controls setup
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  
  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 7.5);
  directionalLight.castShadow = true;
  scene.add(directionalLight);
  
  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();
}

function load3DModel(modelUrl) {
  const loader = new THREE.GLTFLoader();
  
  loader.load(
    modelUrl,
    (gltf) => {
      // Remove previous model
      if (currentModel) {
        scene.remove(currentModel);
      }
      
      currentModel = gltf.scene;
      scene.add(currentModel);
      
      // Center and scale model
      const box = new THREE.Box3().setFromObject(currentModel);
      const center = box.getCenter(new THREE.Vector3());
      currentModel.position.sub(center);
      
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2 / maxDim;
      currentModel.scale.multiplyScalar(scale);
      
      console.log('3D model loaded successfully');
    },
    (progress) => {
      console.log(`Loading: ${(progress.loaded / progress.total * 100).toFixed(2)}%`);
    },
    (error) => {
      console.error('Error loading 3D model:', error);
      showError('Не удалось загрузить 3D-модель');
    }
  );
}

async function generate3DModel() {
  const promptInput = document.getElementById('model-prompt');
  const generateBtn = document.getElementById('generate-3d-btn');
  const progressContainer = document.getElementById('3d-progress');
  const stepText = document.getElementById('step-text');
  const viewerContainer = document.getElementById('3d-viewer-container');
  
  const prompt = promptInput.value.trim();
  
  if (!prompt) {
    showError('Введите описание 3D-модели');
    return;
  }
  
  try {
    generateBtn.disabled = true;
    progressContainer.style.display = 'block';
    viewerContainer.style.display = 'none';
    
    // Step 1: Optimize prompt
    stepText.textContent = 'Оптимизация промпта...';
    const promptResponse = await fetch('/api/generate-3d-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    
    if (!promptResponse.ok) throw new Error('Prompt optimization failed');
    const { optimized_prompt } = await promptResponse.json();
    console.log('Optimized prompt:', optimized_prompt);
    
    // Step 2: Generate 2D image
    stepText.textContent = 'Генерация изображения (30-60 сек)...';
    const imageResponse = await fetch('/api/generate-3d-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: optimized_prompt })
    });
    
    if (!imageResponse.ok) throw new Error('Image generation failed');
    const { image_url } = await imageResponse.json();
    console.log('Image generated:', image_url);
    
    // Step 3: Generate 3D model
    stepText.textContent = 'Создание 3D-модели (60-120 сек)...';
    const modelResponse = await fetch('/api/generate-3d-model', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url })
    });
    
    if (!modelResponse.ok) throw new Error('3D generation failed');
    const { model_url, preview_url } = await modelResponse.json();
    console.log('3D model generated:', model_url);
    
    // Display 3D model
    progressContainer.style.display = 'none';
    viewerContainer.style.display = 'block';
    
    if (!scene) {
      init3DViewer();
    }
    load3DModel(model_url);
    
    // Setup download button
    document.getElementById('download-glb-btn').onclick = () => {
      window.open(model_url, '_blank');
    };
    
  } catch (error) {
    console.error('3D generation error:', error);
    showError(`Ошибка генерации 3D: ${error.message}`);
  } finally {
    generateBtn.disabled = false;
    progressContainer.style.display = 'none';
  }
}

// Event listener
document.addEventListener('DOMContentLoaded', () => {
  const generate3DBtn = document.getElementById('generate-3d-btn');
  if (generate3DBtn) {
    generate3DBtn.addEventListener('click', generate3DModel);
  }
});
```

---

## 🚀 Реализация (пошаговый план)

### Фаза 1: API эндпоинты (Backend)

#### 1.1. Создать `/api/generate-3d-prompt.js`
```javascript
// Оптимизация промпта через Gemini 1.5 Flash
// Использует существующий DESCRIBE_GATEWAY_URL
// Стоимость: $0.000105
```

#### 1.2. Создать `/api/generate-3d-image.js`
```javascript
// Генерация изображения через Fal.ai
// Требует: FAL_API_KEY в env
// Polling до получения результата
// Стоимость: ~$0.025
```

#### 1.3. Создать `/api/generate-3d-model.js`
```javascript
// Генерация 3D через Fal.ai → Tripo3D
// Требует: FAL_API_KEY в env
// Polling до получения .glb
// Стоимость: ~$0.375
```

### Фаза 2: Frontend интеграция

#### 2.1. Добавить Three.js
```html
<!-- В public/index.html -->
<script src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.160.0/examples/js/loaders/GLTFLoader.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.160.0/examples/js/controls/OrbitControls.js"></script>
```

#### 2.2. Добавить UI секцию
- Текстовый input для промпта
- Кнопка "Создать 3D-модель"
- Progress indicator (3 шага)
- 3D-вьюер canvas
- Кнопки download/share

#### 2.3. Добавить CSS стили
```css
.section-3d-generator { /* ... */ }
.prompt-container { /* ... */ }
.progress-container { /* ... */ }
#3d-viewer-container { /* ... */ }
```

### Фаза 3: Environment variables

Добавить в `.dev.vars` и на Vercel:
```bash
FAL_API_KEY=fal_xxxxxxxxxxxxx
```

### Фаза 4: Тестирование

1. **Локально**: `npm run dev:sandbox`
2. **Тест промпта**: "low-poly chair"
3. **Проверка шагов**: prompt → image → 3D
4. **Проверка вьюера**: загрузка .glb, управление

### Фаза 5: Деплой на Vercel

```bash
vercel env add FAL_API_KEY production
vercel --prod
```

---

## ⚠️ Важные соображения

### 1. Стоимость и монетизация
- **Проблема**: 3D генерация в 200 раз дороже Virtual Try-On
- **Решение**: 
  - Freemium: 3 бесплатных 3D/месяц
  - Premium: $9.99/мес → 50 3D генераций
  - Pay-per-use: $0.50 за 3D (margin 20%)

### 2. Время обработки
- **Шаг 1 (Prompt)**: 2-5 секунд
- **Шаг 2 (Image)**: 30-60 секунд
- **Шаг 3 (3D)**: 60-120 секунд
- **Итого**: 2-3 минуты на полный цикл

**UX решение**:
- Показывать прогресс с реальным процентом
- Разрешить пользователю покинуть страницу
- Отправить email когда готово (опционально)

### 3. Ограничения Vercel Edge Functions
- **Max execution time**: 30 секунд (Edge), 5 минут (Serverless)
- **Решение**: Использовать **Vercel Serverless Functions** для 3D API
  ```javascript
  // api/generate-3d-model.js
  export const config = {
    runtime: 'nodejs',  // НЕ 'edge'
    maxDuration: 300    // 5 минут
  };
  ```

### 4. File size limits
- **.glb модели**: 2-10 MB типично
- **Vercel Response limit**: 4.5 MB для Edge, 50 MB для Serverless
- **Решение**: Всегда возвращать **URL**, не файл напрямую

### 5. CORS и безопасность
- Fal.ai возвращает URLs с CORS headers
- Three.js GLTFLoader поддерживает CORS
- Нет проблем с загрузкой .glb из браузера

---

## 📊 Сравнение: Vercel vs Cloudflare для 3D

| Критерий | Vercel Serverless | Cloudflare Workers |
|----------|-------------------|-------------------|
| Max execution time | 5 минут | 30 секунд (CPU time) |
| Max response size | 50 MB | 10 MB |
| Подходит для 3D? | ✅ Да | ❌ Нет (timeout) |
| Стоимость | $0 (Free tier) | $5/мес (Paid Workers) |

**Вывод**: Используем **Vercel Serverless Functions** для 3D API.

---

## 🎯 Рекомендации

### ✅ Рекомендую реализовать:
1. **MVP**: Только шаг 2 и 3 (без промпт-оптимизации)
2. **Freemium**: 3 бесплатных 3D/месяц
3. **Serverless**: Использовать Vercel Serverless для 3D API
4. **Three.js**: Простой вьюер (вращение + скачать)
5. **Мониторинг**: Логировать стоимость каждого шага

### ⚠️ Не рекомендую (для MVP):
1. Продвинутый вьюер (360°, AR)
2. Batch processing
3. Кастомизация параметров (face_limit, texture_resolution)
4. Email уведомления

### 💡 Можно добавить позже:
1. Галерея созданных 3D-моделей
2. Шеринг в социальных сетях
3. Интеграция с Roblox/Unity (прямой импорт)
4. A/B тестирование разных моделей

---

## 📝 Следующие шаги

1. ✅ **Создать техническую спецификацию** (этот документ)
2. ⏳ **Получить Fal.ai API key** → https://fal.ai/dashboard/keys
3. ⏳ **Реализовать API эндпоинты** (3 файла)
4. ⏳ **Добавить UI и Three.js** (1 файл HTML, 1 JS, 1 CSS)
5. ⏳ **Локальное тестирование**
6. ⏳ **Деплой на Vercel**
7. ⏳ **Production тестирование**
8. ⏳ **Обновить документацию**

---

## 📚 Полезные ссылки

### Документация
- **Fal.ai Docs**: https://fal.ai/docs
- **Fal.ai Models**: https://fal.ai/models
- **Tripo3D via Fal.ai**: https://fal.ai/models/fal-ai/tripo3d/image-to-3d
- **Three.js Docs**: https://threejs.org/docs/
- **GLTFLoader**: https://threejs.org/docs/#examples/en/loaders/GLTFLoader

### Инструменты
- **Fal.ai Dashboard**: https://fal.ai/dashboard
- **Tripo3D Web**: https://www.tripo3d.ai/
- **Tripo3D Tools**: https://www.tripo3d.ai/3d-tools
- **Vercel Dashboard**: https://vercel.com/dashboard

### Видео туториалы
- **n8n + Fal.ai + Tripo3D**: https://www.youtube.com/watch?v=lD9XW1h8aVc
- **Fal.ai Tutorial**: https://www.youtube.com/watch?v=FQV_wHFrVpQ

---

## ✅ Итоговое резюме

| Параметр | Значение |
|----------|----------|
| **Стоимость 1 генерации** | $0.40 |
| **Время генерации** | 2-3 минуты |
| **Технологии** | Vercel Serverless + Fal.ai + Three.js |
| **Сложность реализации** | Средняя |
| **Готовность к MVP** | ✅ Да |
| **Интеграция с текущей архитектурой** | ✅ Параллельная (не конфликтует) |
| **Масштабируемость** | ✅ Да (Vercel автомасштабирование) |

---

**Готов к реализации?** → Скажите "да" и я начну создавать API эндпоинты! 🚀
