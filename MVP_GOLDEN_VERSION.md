# 🔒 ЭТАЛОННАЯ ВЕРСИЯ - МИНИМАЛЬНЫЙ РАБОЧИЙ ПРОДУКТ (MVP)

**Дата создания**: 2026-02-06  
**Git Tag**: `MVP-GOLDEN-v1.0`  
**Commit**: `0e84b7e`

---

## ⚠️ КРИТИЧЕСКИЕ ПРАВИЛА

### 🚫 **НЕ ТРОГАТЬ БАЗУ!**

Следующие файлы являются **ЯДРОМ** приложения и **НЕ ДОЛЖНЫ ИЗМЕНЯТЬСЯ**:

```
✅ ЗАЩИЩЕННЫЕ ФАЙЛЫ (НЕ ТРОГАТЬ):

api/
├── describe.js         ← Анализ одежды (gemini-2.5-flash)
└── generate.js         ← Генерация Try-On (gemini-2.5-flash-image)

public/static/
├── app.js              ← Frontend логика
└── style.css           ← Стили

.dev.vars               ← Переменные окружения
dev-server.mjs          ← Dev сервер
ecosystem.dev.config.cjs ← PM2 конфигурация
```

---

## ✅ ЧТО РАБОТАЕТ

### 1. **API Endpoints**
- ✅ `POST /api/describe` - Анализ одежды (дешевая модель)
- ✅ `POST /api/generate` - Генерация Try-On (дорогая модель)

### 2. **Google API Key**
```
AIzaSyDBG8S-gTd483KsGSahCOL6WegXSN2a2Hs
```
- ✅ ПРОВЕРЕН
- ✅ РАБОТАЕТ
- ✅ Модели: `gemini-2.5-flash` + `gemini-2.5-flash-image`

### 3. **Dev Server**
- ✅ PM2 запущен: `webapp-dev`
- ✅ Порт: 3000
- ✅ CORS настроен
- ✅ Multipart/form-data поддерживается

### 4. **Тестовая страница**
```
https://3000-itu1vmgm2d8hm7r2pkot1-0e616f0a.sandbox.novita.ai/test-key.html
```
- ✅ Проверка ключа без нагрузки
- ✅ Четкое сообщение: КЛЮЧ ПРИНЯТ / КЛЮЧ НЕ ПРИНЯТ

---

## 📂 Структура проекта

```
webapp/
├── api/                    ← 🔒 ЯДРО (НЕ ТРОГАТЬ)
│   ├── describe.js
│   └── generate.js
├── public/
│   ├── static/             ← 🔒 ЯДРО (НЕ ТРОГАТЬ)
│   │   ├── app.js
│   │   └── style.css
│   └── test-key.html       ← Тестовая страница
├── dist/                   ← Build output
├── .dev.vars               ← 🔒 ЯДРО (НЕ ТРОГАТЬ)
├── dev-server.mjs          ← 🔒 ЯДРО (НЕ ТРОГАТЬ)
├── ecosystem.dev.config.cjs ← 🔒 ЯДРО (НЕ ТРОГАТЬ)
└── package.json
```

---

## 🔄 Как восстановить эталонную версию

Если что-то сломалось, вернитесь к этой версии:

```bash
cd /home/user/webapp
git checkout MVP-GOLDEN-v1.0
pm2 delete webapp-dev
pm2 start ecosystem.dev.config.cjs
```

---

## 🚀 Правила расширения

### ✅ **МОЖНО добавлять новые модули**:

```
api/
├── describe.js         ← 🔒 НЕ ТРОГАТЬ
├── generate.js         ← 🔒 НЕ ТРОГАТЬ
└── download.js         ← ✅ НОВЫЙ МОДУЛЬ (можно добавить)
└── share.js            ← ✅ НОВЫЙ МОДУЛЬ (можно добавить)
└── generate-3d.js      ← ✅ НОВЫЙ МОДУЛЬ (можно добавить)

public/static/
├── app.js              ← 🔒 НЕ ТРОГАТЬ
├── style.css           ← 🔒 НЕ ТРОГАТЬ
├── download-module.js  ← ✅ НОВЫЙ МОДУЛЬ (можно добавить)
├── share-module.js     ← ✅ НОВЫЙ МОДУЛЬ (можно добавить)
└── 3d-module.js        ← ✅ НОВЫЙ МОДУЛЬ (можно добавить)
```

### ✅ **МОЖНО создавать новые страницы**:

```
public/
├── index.html          ← 🔒 НЕ ТРОГАТЬ (главная страница Try-On)
├── test-key.html       ← Тестовая страница
├── download.html       ← ✅ НОВАЯ СТРАНИЦА (можно добавить)
└── 3d-viewer.html      ← ✅ НОВАЯ СТРАНИЦА (можно добавить)
```

---

## 📋 Следующие шаги (МОДУЛЬНО)

### Вариант 1: Download Button (FREE)
```javascript
// api/download.js (НОВЫЙ ФАЙЛ)
export default async function handler(request) {
  // Логика скачивания
}
```

### Вариант 2: Share Button (FREE)
```javascript
// api/share.js (НОВЫЙ ФАЙЛ)
export default async function handler(request) {
  // Логика публичной ссылки
}
```

### Вариант 3: 3D Generator ($0.15 per model)
```javascript
// api/generate-3d.js (НОВЫЙ ФАЙЛ)
export default async function handler(request) {
  // Вызов Tripo3D через Fal.ai
}
```

---

## 🔐 Git Tags

```bash
# Текущий эталон
MVP-GOLDEN-v1.0  ← ТЕКУЩАЯ ЗАЩИЩЕННАЯ ВЕРСИЯ

# Будущие версии (МОДУЛИ)
MVP-v1.1-download  ← После добавления Download
MVP-v1.2-share     ← После добавления Share
MVP-v1.3-3d        ← После добавления 3D
```

---

## 📊 Коммиты эталонной версии

```
0e84b7e 🧪 Add simple API key test page (no app load)
5a24941 📋 Add API key verification report
aa55eee ✅ FIX: Use correct Gemini model names (gemini-2.5-flash & gemini-2.5-flash-image)
```

---

## ⚠️ ЗАПОМНИ:

1. **НЕ ТРОГАТЬ** `api/describe.js` и `api/generate.js`
2. **НЕ ТРОГАТЬ** `public/static/app.js` и `public/static/style.css`
3. **ТОЛЬКО ДОБАВЛЯТЬ** новые файлы (модули)
4. **ВСЕГДА МОЖНО ВЕРНУТЬСЯ** к `MVP-GOLDEN-v1.0`
5. **ТЕСТИРОВАТЬ** перед коммитом

---

**Эта версия работает. Это база. Это фундамент.** 🏗️

**Дальше только расширения. Не ломаем основу.** 🔒
