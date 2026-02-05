# Virtual Try-On - Vercel Deployment

Vercel-версия виртуальной примерочной с использованием Cloudflare AI Gateway.

## 🚀 Деплой на Vercel

### 1. Создайте Gateway в Cloudflare Dashboard

1. Зайдите в [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Перейдите в **AI → AI Gateway**
3. Создайте новый Gateway:
   - Name: `virtry-gateway`
   - Rate Limiting: установите лимиты по желанию

### 2. Получите Gateway URL

После создания Gateway вы получите URL вида:
```
https://gateway.ai.cloudflare.com/v1/{account_id}/virtry-gateway/google-ai-studio/v1beta/models/gemini-2.5-flash-image:generateContent
```

### 3. Создайте API Token

1. В Cloudflare Dashboard → **AI → Manage**
2. Создайте новый API Token:
   - Permissions: **AI:Read** и **AI:Edit**
3. Скопируйте token (выглядит как `cf_xxxxxxxxxxxxx`)

### 4. Настройте переменные окружения в Vercel

1. Зайдите в ваш проект на [Vercel Dashboard](https://vercel.com/dashboard)
2. **Settings** → **Environment Variables**
3. Добавьте две переменные:

```bash
GATEWAY_URL=https://gateway.ai.cloudflare.com/v1/{account_id}/virtry-gateway/google-ai-studio/v1beta/models/gemini-2.5-flash-image:generateContent
GATEWAY_TOKEN=cf_xxxxxxxxxxxxx
```

### 5. Deploy

#### Через Vercel CLI:
```bash
npm install -g vercel
vercel login
cd /home/user/webapp
vercel --prod
```

#### Через GitHub:
1. Push код на GitHub
2. Импортируйте репозиторий в Vercel
3. Vercel автоматически задеплоит

### 6. Проверка

После деплоя откройте:
```
https://your-project.vercel.app
```

## 📁 Структура проекта

```
webapp/
├── api/
│   └── tryon.js          # Vercel Edge Function
├── dist/
│   ├── index.html        # Главная страница
│   └── static/
│       ├── app.js        # Frontend JavaScript
│       └── style.css     # Стили
├── vercel.json           # Конфигурация Vercel
└── package.json
```

## 🔧 Технологии

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Vercel Edge Functions
- **AI**: Gemini 2.5 Flash IMAGE (Nano Banana) через Cloudflare AI Gateway
- **Архитектура**: 
  - Step 1: AI описывает одежду (PHOTO B) → JSON
  - Step 2: AI применяет одежду на человека (PHOTO A) с описанием

## 🌟 Особенности

✅ 2-step AI подход (как в видео)
✅ Cloudflare AI Gateway для безопасности и кэширования
✅ Vercel Edge Functions для быстрого глобального доступа
✅ Comprehensive error handling
✅ Обработка идентичных изображений
✅ Понятные сообщения пользователям
✅ Красивый UI с анимациями

## 🔒 Безопасность

- API ключи хранятся только на сервере (Environment Variables)
- Клиенты никогда не видят токены
- Все запросы проходят через Cloudflare Gateway
- Rate limiting и мониторинг

## 📊 Лимиты

- **Gemini 2.5 Flash**: 15 RPM (бесплатно), 1,500 RPD
- **Vercel Free**: 100GB bandwidth, безлимитные запросы
- **Cloudflare Gateway**: Custom rate limits

## 💰 Стоимость

- **Vercel Free**: $0/мес (для начала)
- **Google Gemini**: Бесплатно в пределах лимита
- **Cloudflare Gateway**: Бесплатно

## 🐛 Troubleshooting

### Gateway errors
Проверьте:
- GATEWAY_URL корректный
- GATEWAY_TOKEN действителен
- API ключ Google настроен в Gateway

### Изображения не генерируются
Проверьте:
- Размер изображений (до 2MB)
- Формат изображений (JPG, PNG, WebP)
- Лимиты API не превышены

### 500 Internal Server Error
Проверьте логи в Vercel Dashboard:
- **Deployments** → выберите деплой → **Functions** → логи

## 📚 Документация

- [Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/)
- [Vercel Edge Functions](https://vercel.com/docs/functions/edge-functions)
- [Google Gemini API](https://ai.google.dev/gemini-api/docs)

## 🚀 Следующие шаги

После успешного деплоя:

1. **Тестирование**: Загрузите тестовые изображения
2. **Мониторинг**: Проверяйте логи в Vercel Dashboard
3. **Масштабирование**: 
   - Добавьте custom domain
   - Настройте analytics
   - Внедрите rate limiting
4. **Монетизация**:
   - Freemium модель
   - Pay-per-use
   - B2B subscriptions

---

🎉 **Готово!** Ваш Virtual Try-On теперь работает на Vercel!
