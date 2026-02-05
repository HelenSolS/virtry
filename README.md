# 🎨 Virtual Try-On - Виртуальная примерочная

> AI-powered виртуальная примерка одежды с использованием Gemini 2.5 Flash IMAGE через Cloudflare AI Gateway

---

## 🏗️ Архитектура проекта

```
┌──────────────────────────────────────┐
│ Sandbox (AI Developer)               │
│ ✓ Разработка                         │
│ ✓ Локальное тестирование             │
│ ✓ Любые эксперименты                 │
└─────────────┬────────────────────────┘
              │
              │ git push (все коммиты)
              ▼
┌──────────────────────────────────────┐
│ GitHub                               │
│ ✓ История изменений                  │
│ ✓ Code review                        │
│ ✓ Backup кода                        │
│ ✗ НЕ деплоит автоматически           │
└─────────────┬────────────────────────┘
              │
              │ vercel --prod (вручную)
              │ ТОЛЬКО финальные версии
              ▼
┌──────────────────────────────────────┐
│ Vercel Production                    │
│ ✓ https://virtry.vercel.app         │
│ ✓ Только утверждённые релизы        │
│ ✓ Полная управляемость              │
└──────────────────────────────────────┘
```

---

## 🎯 Философия разработки

### Три уровня:

1. **Разработка** (Sandbox) - здесь всё происходит
2. **Тестирование** (GitHub) - проверка и утверждение
3. **Production** (Vercel) - только готовые версии

### Полная управляемость:

- ✅ Вы контролируете каждый деплой
- ✅ Никакого автодеплоя
- ✅ `git push` ≠ production update
- ✅ Production обновляется ТОЛЬКО командой `vercel --prod`

---

## 📊 Текущее состояние

### ✅ Реализовано

**Backend (Vercel Edge Function)**:
- ✅ 2-step AI approach (описание одежды → генерация)
- ✅ Cloudflare AI Gateway integration
- ✅ Gemini 2.5 Flash IMAGE (Nano Banana)
- ✅ Comprehensive error handling
- ✅ Обнаружение идентичных изображений
- ✅ Safety filters
- ✅ Понятные сообщения пользователям

**Frontend**:
- ✅ Адаптивный UI с hero section
- ✅ Drag & Drop загрузка изображений
- ✅ Real-time preview
- ✅ Smooth animations
- ✅ Loading states
- ✅ Error handling UI

**Infrastructure**:
- ✅ Vercel Edge Functions для глобального edge deployment
- ✅ Cloudflare AI Gateway для security и caching
- ✅ Manual deploy workflow для полного контроля

### 🚧 Не реализовано

- ⏳ Hero video (placeholder требует замены)
- ⏳ История примерок (Cloudflare D1)
- ⏳ Скачивание результатов
- ⏳ Галерея примеров

---

## 🚀 Быстрый старт

### Для разработки (Sandbox):

```bash
# 1. Установите зависимости
npm install

# 2. Настройте локальные переменные
cp .dev.vars.example .dev.vars
nano .dev.vars
# Добавьте GATEWAY_URL и GATEWAY_TOKEN

# 3. Билд
npm run build

# 4. Запустите локально
pm2 start ecosystem.config.cjs

# 5. Проверьте
curl http://localhost:3000
```

### Для деплоя на Production (Vercel):

```bash
# 1. Установите Vercel CLI (один раз)
npm install -g vercel

# 2. Войдите в аккаунт
vercel login

# 3. Настройте env variables (один раз)
vercel env add GATEWAY_URL production
vercel env add GATEWAY_TOKEN production

# 4. Деплой на Production (когда готово)
vercel --prod
```

---

## 📁 Структура проекта

```
webapp/
├── api/
│   └── tryon.js              # Vercel Edge Function (API endpoint)
├── src/
│   ├── index.tsx             # Cloudflare Workers версия (Hono)
│   └── renderer.tsx          # SSR renderer
├── public/
│   └── static/
│       ├── app.js            # Frontend JavaScript
│       └── style.css         # CSS стили
├── dist/
│   ├── index.html            # Статическая страница для Vercel
│   ├── static/               # Скомпилированные статические файлы
│   └── _worker.js            # Cloudflare Workers build
├── vercel.json               # Конфигурация Vercel
├── wrangler.jsonc            # Конфигурация Cloudflare
├── ecosystem.config.cjs      # PM2 конфигурация для sandbox
└── package.json
```

---

## 🛠️ Технологии

### Backend
- **Vercel Edge Functions** - serverless API endpoints на edge
- **Cloudflare AI Gateway** - security, caching, monitoring
- **Multi-Model Architecture** 💰 - cost optimization:
  - **Gemini 1.5 Flash** (text) - дешёвый анализ одежды
  - **Gemini 2.5 Flash IMAGE** - дорогая генерация
- **Hono** - легковесный web framework (для Cloudflare версии)

### AI
- **Cost-optimized 2-step approach** 💰:
  1. `/api/describe` → Gemini 1.5 Flash (cheap) → JSON description
  2. `/api/generate` → Gemini 2.5 Flash IMAGE (expensive) → final image
- **Экономия: 37-44%** на AI API затратах

### Frontend
- **Vanilla JavaScript** - без фреймворков
- **Modern CSS** - animations, gradients, responsive
- **Drag & Drop API**

---

## 💰 Cost Optimization

**Новая multi-model архитектура снижает затраты на 37-44%!**

### Как это работает:

```
Старая версия (дорого):
  Step 1: Gemini 2.5 Flash IMAGE - анализ
  Step 2: Gemini 2.5 Flash IMAGE - генерация
  Итого: 2 дорогих запроса

Новая версия (дёшево):
  Step 1: Gemini 1.5 Flash - анализ (4x дешевле!)
  Step 2: Gemini 2.5 Flash IMAGE - генерация
  Итого: 1 дешёвый + 1 дорогой = экономия 37%
```

**Подробнее**: См. [COST_OPTIMIZATION.md](./COST_OPTIMIZATION.md)

---

## 🔐 Безопасность

### Environment Variables (Production):

```bash
# Дешёвая модель для анализа
DESCRIBE_GATEWAY_URL=https://gateway.ai...gemini-1.5-flash:generateContent

# Дорогая модель для генерации
GENERATE_GATEWAY_URL=https://gateway.ai...gemini-2.5-flash-image:generateContent

# Общий токен
GATEWAY_TOKEN=cf_xxxxxxxxxxxxx
```

**Важно**:
- ✅ API ключи только на бэкенде
- ✅ Клиенты никогда не видят токены
- ✅ Все запросы через Cloudflare Gateway
- ✅ Rate limiting и мониторинг
- ✅ Разные лимиты для дешёвой и дорогой модели

---

## 💰 Стоимость (бесплатный тариф)

| Сервис | Лимиты | Стоимость |
|--------|--------|-----------|
| **Vercel** | 100GB bandwidth/мес | $0 |
| **Gemini 1.5 Flash** | 15 RPM, 1,500 RPD | $0 (cheap) |
| **Gemini 2.5 Flash IMAGE** | 15 RPM, 1,500 RPD | $0 (expensive) |
| **Cloudflare Gateway** | Unlimited | $0 |

**Новая архитектура**: Экономия 37-44% = больше пользователей за $0!

---

## 🎯 API Endpoints

### POST /api/describe 💰 (CHEAP)

Анализ одежды с дешёвой текстовой моделью.

**Request**:
```bash
curl -X POST https://virtry.vercel.app/api/describe \
  -F "outfit=@clothing.jpg"
```

**Response**:
```json
{
  "success": true,
  "description": {
    "garment_type": "dress",
    "color": "blue",
    "style": "elegant evening dress",
    "fit": "fitted",
    "details": "V-neck, sleeveless"
  },
  "metadata": {
    "model": "gemini-1.5-flash",
    "cost_tier": "low"
  }
}
```

---

### POST /api/generate 💸 (EXPENSIVE)

Генерация виртуальной примерки с дорогой визуальной моделью.

**Request**:
```bash
curl -X POST https://virtry.vercel.app/api/generate \
  -F "photo=@person.jpg" \
  -F "outfit=@clothing.jpg" \
  -F "description={\"garment_type\":\"dress\",...}"
```

**Response**:
```json
{
  "success": true,
  "image": "data:image/jpeg;base64,...",
  "metadata": {
    "model": "gemini-2.5-flash-image",
    "cost_tier": "high",
    "used_description": true
  }
}
```

---

## 🔄 Workflow разработки

### Ежедневная работа:

```bash
# 1. Разработка в Sandbox
# Редактируете код, тестируете локально

# 2. Коммитите в GitHub (любые изменения)
git add .
git commit -m "Optimize: Add multi-model architecture"
git push origin main
# → GitHub обновлён
# → Vercel НЕ деплоит (полный контроль!)

# 3. Продолжаете работу
# Ещё коммиты, тесты, исправления...

# 4. Когда готово к Production
git commit -m "Release v1.1.0: Cost optimization ready"
git push origin main

# 5. РУЧНОЙ деплой на Vercel
vercel --prod
# → Теперь Production обновлён с новой архитектурой!
```

---

## 🌐 Ссылки

- **GitHub**: https://github.com/HelenSolS/virtry
- **Production** (когда задеплоите): https://virtry.vercel.app
- **Sandbox**: http://localhost:3000

---

## 📚 Документация

### Основные файлы:

| Файл | Описание |
|------|----------|
| **PRODUCTION_WORKFLOW.md** | ⭐ Главная инструкция: разработка → тестирование → production |
| **VERCEL_AUTO_DEPLOY.md** | Автодеплой (если нужен в будущем) |
| **ARCHITECTURE.md** | Архитектура проекта |
| **COMPLETE.md** | Полное резюме проекта |
| **GATEWAY_SETUP.md** | Настройка Cloudflare AI Gateway |
| **ERROR_HANDLING.md** | Обработка ошибок |
| **FAQ.md** | Часто задаваемые вопросы |
| **HOSTING_GUIDE.md** | Хостинг и монетизация |

### Для быстрого старта:

1. **PRODUCTION_WORKFLOW.md** - начните отсюда
2. **GATEWAY_SETUP.md** - настройте Gateway
3. Затем: `vercel --prod`

---

## 🔒 Безопасность

### Environment Variables (Production):

```bash
GATEWAY_URL=https://gateway.ai.cloudflare.com/v1/{account_id}/virtry-gateway/google-ai-studio/v1beta/models/gemini-2.5-flash-image:generateContent
GATEWAY_TOKEN=cf_xxxxxxxxxxxxx
```

**Важно**:
- ✅ API ключи только на бэкенде
- ✅ Клиенты никогда не видят токены
- ✅ Все запросы через Cloudflare Gateway
- ✅ Rate limiting и мониторинг

---

## 💰 Стоимость (бесплатный тариф)

| Сервис | Лимиты | Стоимость |
|--------|--------|-----------|
| **Vercel** | 100GB bandwidth/мес | $0 |
| **Gemini API** | 15 RPM, 1,500 RPD | $0 |
| **Cloudflare Gateway** | Unlimited | $0 |

**Итого**: $0/мес для ~100-200 пользователей/день

---

## 🎯 API Endpoints

### POST /api/tryon

Генерация виртуальной примерки.

**Request**:
```bash
curl -X POST https://virtry.vercel.app/api/tryon \
  -F "photo=@person.jpg" \
  -F "outfit=@clothing.jpg"
```

**Response**:
```json
{
  "success": true,
  "image": "data:image/jpeg;base64,...",
  "outfitDescription": "{\"garment_type\":\"dress\",...}"
}
```

**Errors**:
```json
{
  "error": "Ошибка",
  "message": "Понятное описание",
  "details": {...}
}
```

---

## 🐛 Troubleshooting

### Gateway errors

**Проблема**: `Gateway не настроен`  
**Решение**: Проверьте GATEWAY_URL и GATEWAY_TOKEN в Vercel Dashboard

### Build errors

**Проблема**: `vercel --prod` fails  
**Решение**: 
```bash
npm run build  # Проверьте локально
vercel logs    # Посмотрите логи
```

### Production не обновляется

**Проблема**: `git push` не обновляет Vercel  
**Решение**: Это правильно! Используйте `vercel --prod` для деплоя

---

## 🚀 Следующие шаги

### Immediate (сегодня):

- [ ] Настроить Cloudflare AI Gateway (см. GATEWAY_SETUP.md)
- [ ] Установить Vercel CLI: `npm install -g vercel`
- [ ] Первый деплой: `vercel --prod`
- [ ] Протестировать Production

### Short-term (1-2 недели):

- [ ] Заменить hero-video.mp4 на реальное видео
- [ ] Добавить analytics (Vercel Analytics)
- [ ] SEO optimization
- [ ] Custom domain

### Long-term (1+ месяц):

- [ ] История примерок (Cloudflare D1)
- [ ] Скачивание результатов
- [ ] Галерея примеров
- [ ] Монетизация (Freemium)

---

## 📞 Поддержка

- **GitHub Issues**: https://github.com/HelenSolS/virtry/issues
- **Документация**: См. файлы `*.md` в корне проекта

---

## 📄 Лицензия

MIT License

---

## ✅ Итог

### Что есть:

- ✅ Полностью рабочий Virtual Try-On
- ✅ 2-step AI approach (как в видео)
- ✅ Vercel Edge Functions
- ✅ Cloudflare AI Gateway
- ✅ Comprehensive error handling
- ✅ Beautiful UI
- ✅ **Полная управляемость деплоями**

### Workflow:

```
Разработка (здесь) → Тестирование (GitHub) → Production (Vercel вручную)
```

### Полный контроль:

- ✅ Вы решаете КОГДА деплоить
- ✅ Никакого автодеплоя
- ✅ `git push` ≠ production update
- ✅ Production = `vercel --prod`

---

🎉 **Начните с PRODUCTION_WORKFLOW.md!**
