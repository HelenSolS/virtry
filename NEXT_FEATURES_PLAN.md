# 🎯 ПЛАН: Дополнительные фичи (отдельные модули)

**Дата**: 2026-02-05  
**Статус**: Планирование  
**Принцип**: НЕ ТРОГАТЬ рабочий Try-On код!

---

## ✅ Что уже работает (НЕ ТРОГАЕМ!)

```
✅ Virtual Try-On (2-step подход)
   ├─ /api/describe (Gemini 1.5 Flash)
   └─ /api/generate (Gemini 2.5 Flash IMAGE)
   
✅ Frontend UI
   ├─ Hero section с видео
   ├─ Drag & Drop upload
   └─ Result preview
   
✅ Cost Optimization (37-44% экономия)
✅ Cloudflare Gateway (кэширование)
✅ Production Deploy (https://virtry.vercel.app)
```

---

## 🎯 Новые фичи (отдельные модули)

### **1. Post-Result Actions (после Try-On)**

После успешного Try-On показать пользователю кнопки:

```
┌─────────────────────────────────────┐
│  [✅ Результат Try-On отображен]    │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  🎯 Что делать дальше?              │
│                                      │
│  [💾 Скачать]  [📤 Поделиться]      │
│                                      │
│  [🎲 Создать 3D-модель] ($0.33)    │
└─────────────────────────────────────┘
```

---

### **2. Скачать результат (Download)**

#### Архитектура:
```javascript
// Новый файл: public/static/download-module.js

function downloadResult(imageBase64) {
  const link = document.createElement('a');
  link.href = imageBase64;
  link.download = `virtry-${Date.now()}.jpg`;
  link.click();
}
```

#### Изменения:
- ✅ **Новый файл**: `public/static/download-module.js`
- ✅ **Изменение в HTML**: Добавить `<script>` после результата
- ⚠️ **НЕ трогаем**: `app.js`, `api/*.js`

#### Стоимость:
- 💰 **$0** (клиентская операция)

---

### **3. Поделиться (Share)**

#### Архитектура:
```javascript
// Новый файл: public/static/share-module.js

async function shareResult(imageBase64) {
  // Вариант 1: Web Share API (если браузер поддерживает)
  if (navigator.share) {
    const blob = await fetch(imageBase64).then(r => r.blob());
    await navigator.share({
      title: 'Virtual Try-On',
      text: 'Посмотрите мою виртуальную примерку!',
      files: [new File([blob], 'tryon.jpg', { type: 'image/jpeg' })]
    });
  }
  
  // Вариант 2: Upload to temporary storage
  else {
    const uploadResponse = await uploadToTempStorage(imageBase64);
    const shareUrl = uploadResponse.url;
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl);
    alert('Ссылка скопирована!');
  }
}
```

#### Изменения:
- ✅ **Новый файл**: `public/static/share-module.js`
- ✅ **Новый API** (опционально): `api/upload-temp.js`
- ⚠️ **НЕ трогаем**: основной Try-On код

#### Стоимость:
- 💰 **$0** (Web Share API, бесплатно)
- 💰 **$0.001-0.01** (если используем временное хранилище)

#### Опции для временного хранилища:
1. **tmpfiles.org** - бесплатно, 1 час
2. **Cloudflare R2** - $0.015 за GB хранилища
3. **Vercel Blob** - $0.15 за GB

---

### **4. 3D Generator (платная фича)**

#### Архитектура (отдельный модуль!):
```
Frontend (3d-module.js)
    ↓
    POST /api/generate-3d
    ↓
    Fal.ai ByteDance Image-to-3D ($0.33)
    ↓
    Three.js Viewer
```

#### Изменения:
- ✅ **Новый файл**: `public/static/3d-module.js`
- ✅ **Новый API**: `api/generate-3d.js`
- ✅ **Новый UI компонент**: 3D viewer с Three.js
- ⚠️ **НЕ трогаем**: Try-On код (`api/describe.js`, `api/generate.js`)

#### Файлы:

**Новый API: `api/generate-3d.js`**
```javascript
// Vercel Edge Function для 3D генерации
export const config = {
  runtime: 'edge',
  maxDuration: 180, // 3 минуты для 3D генерации
};

export default async function handler(request) {
  // Получить изображение результата Try-On
  const formData = await request.formData();
  const image = formData.get('image');
  
  // Вызвать Fal.ai ByteDance Image-to-3D
  const falApiKey = process.env.FAL_API_KEY;
  const response = await fetch('https://fal.run/fal-ai/bytedance/seed3d', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${falApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      image_url: imageUrl,
      format: 'glb'
    })
  });
  
  const result = await response.json();
  
  return Response.json({
    success: true,
    model_url: result.model_url,
    preview_url: result.preview_url,
    cost: 0.33,
    metadata: {
      model: 'bytedance-seed3d',
      format: 'glb'
    }
  });
}
```

**Новый Frontend: `public/static/3d-module.js`**
```javascript
// 3D Generation Module (отдельный модуль!)

let scene, camera, renderer, model3D;

async function generate3D(tryonImageBase64) {
  // Показать прогресс
  show3DProgress();
  
  // Upload image to temporary storage
  const imageUrl = await uploadImageTemp(tryonImageBase64);
  
  // Call 3D API
  const formData = new FormData();
  formData.append('image_url', imageUrl);
  
  const response = await fetch('/api/generate-3d', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  
  if (result.success) {
    // Load 3D model with Three.js
    load3DModel(result.model_url);
    
    // Show download button
    show3DDownloadButton(result.model_url);
  }
}

function load3DModel(modelUrl) {
  // Initialize Three.js scene
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer();
  
  // Load GLB model
  const loader = new GLTFLoader();
  loader.load(modelUrl, (gltf) => {
    model3D = gltf.scene;
    scene.add(model3D);
    animate();
  });
}
```

#### Стоимость:
- 💰 **$0.33** за 3D модель (ByteDance via Fal.ai)
- 💰 **Альтернатива**: $0.15 (Tripo3D via Fal.ai) - дешевле!

#### Опции 3D генераторов:
| Модель | Стоимость | Качество | Скорость |
|--------|-----------|----------|----------|
| **ByteDance Seed3D** | $0.33 | ⭐⭐⭐⭐ | 1-2 мин |
| **Tripo3D** | $0.15 | ⭐⭐⭐⭐⭐ | 30-60 сек |
| **Hyper3D-Rodin** | $0.70 | ⭐⭐⭐⭐⭐ | 2-3 мин |

**Рекомендация**: Начать с **Tripo3D** ($0.15) — дешевле и быстрее!

---

### **5. История примерок (Optional)**

#### Архитектура:
```
Frontend
    ↓
    POST /api/save-history
    ↓
    Cloudflare D1 (SQLite)
```

#### Таблица:
```sql
CREATE TABLE tryon_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  photo_url TEXT,
  outfit_url TEXT,
  result_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Изменения:
- ✅ **Новый API**: `api/save-history.js`, `api/get-history.js`
- ✅ **Database**: Cloudflare D1 (бесплатно до 5GB)
- ⚠️ **НЕ трогаем**: Try-On код

#### Стоимость:
- 💰 **$0** (Cloudflare D1 бесплатен до 5GB)
- 💰 **$0.001** за 1000 чтений (после лимита)

---

## 📊 Приоритеты фич

### **MVP 1.1 (быстро, дешево)**:
1. ✅ **Скачать** — клиентская операция, $0
2. ✅ **Поделиться** — Web Share API, $0
3. ⏳ **3D кнопка** — показать UI, но не активировать

**Время**: 1-2 часа  
**Стоимость**: $0

---

### **MVP 1.2 (средне, платно)**:
4. ✅ **3D Generator** — Tripo3D ($0.15)
5. ✅ **3D Viewer** — Three.js
6. ✅ **Скачать 3D модель** — .glb файл

**Время**: 3-4 часа  
**Стоимость**: $0.15 за модель

---

### **MVP 2.0 (позже)**:
7. ⏳ **История примерок** — Cloudflare D1
8. ⏳ **Галерея примеров** — статические изображения
9. ⏳ **Монетизация** — Stripe интеграция

**Время**: 1-2 дня  
**Стоимость**: $0-10/мес

---

## 🏗️ Структура файлов (новые модули)

```
webapp/
├── api/
│   ├── describe.js          ✅ НЕ ТРОГАЕМ
│   ├── generate.js          ✅ НЕ ТРОГАЕМ
│   ├── tryon.js             ⚠️  Старый (не используется)
│   │
│   └── 🆕 НОВЫЕ МОДУЛИ:
│       ├── generate-3d.js   🎲 3D генерация
│       ├── upload-temp.js   📤 Временное хранилище
│       ├── save-history.js  💾 История примерок
│       └── get-history.js   📜 Получить историю
│
├── public/
│   ├── index.html           ✅ Можем добавить UI кнопки
│   └── static/
│       ├── app.js           ✅ НЕ ТРОГАЕМ (основной код)
│       ├── style.css        ✅ Можем добавить стили
│       │
│       └── 🆕 НОВЫЕ МОДУЛИ:
│           ├── download-module.js  💾 Скачать
│           ├── share-module.js     📤 Поделиться
│           ├── 3d-module.js        🎲 3D генератор
│           └── history-module.js   📜 История
│
└── .dev.vars
    └── 🆕 FAL_API_KEY=fal_xxxxx  (для 3D)
```

---

## 💰 Итоговая экономика

| Фича | Стоимость | Монетизация |
|------|-----------|-------------|
| **Try-On** | $0.002 | Бесплатно (привлечение) |
| **Скачать** | $0 | Бесплатно |
| **Поделиться** | $0 | Бесплатно |
| **3D Generator** | $0.15 | $1-2 (прибыль $0.85-1.85) |
| **История** | $0 | Бесплатно |

---

## 🎯 Что делаем СЕЙЧАС?

### **Шаг 1: MVP 1.1 (быстро)**
Добавить кнопки после Try-On результата:
- ✅ Скачать
- ✅ Поделиться
- ⏳ 3D (показать, но сказать "Coming Soon")

**Изменения**:
- `public/index.html` — добавить кнопки в result-area
- `public/static/download-module.js` — новый файл
- `public/static/share-module.js` — новый файл
- `public/static/style.css` — стили для кнопок

**Время**: 1-2 часа  
**Риск**: Минимальный (НЕ трогаем Try-On код)

---

### **Шаг 2: MVP 1.2 (средне)**
Активировать 3D генератор:
- ✅ Получить FAL_API_KEY
- ✅ Создать `api/generate-3d.js`
- ✅ Создать `public/static/3d-module.js`
- ✅ Интегрировать Three.js

**Время**: 3-4 часа  
**Стоимость**: $0.15 за тест

---

## 💬 Что выбираете?

**Вариант 1**: Сделать MVP 1.1 (Скачать + Поделиться) — быстро, бесплатно  
**Вариант 2**: Сделать MVP 1.2 (+ 3D Generator) — средне, нужен FAL_API_KEY  
**Вариант 3**: Только планирование — сохранить план и ничего не делать

**Скажите что хотите!** 😊
